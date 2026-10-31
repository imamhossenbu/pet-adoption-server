const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getCollections } = require('../config/db');
const { generateOtp, sendOtpEmail } = require('../utils/mailer');

// JWT generation
router.post('/jwt', async (req, res) => {
    try {
        const user = req.body;
        const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Send OTP to email for password recovery or verification
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).send({ error: 'Email is required' });
        }

        const { otpCollection, userCollection } = getCollections();

        // Optional: check if user exists
        const user = await userCollection.findOne({ email });
        // Generate 6-digit OTP
        const otp = generateOtp();

        // Save or update in MongoDB OTP collection (TTL index automatically cleans up after 5 min)
        await otpCollection.updateOne(
            { email },
            {
                $set: {
                    email,
                    otp,
                    createdAt: new Date(),
                    verified: false,
                }
            },
            { upsert: true }
        );

        // Send email via Nodemailer
        const mailResult = await sendOtpEmail(email, otp);

        res.send({
            success: true,
            message: 'OTP has been dispatched to your email.',
            fallback: mailResult.fallback || false,
        });
    } catch (err) {
        console.error('send-otp error:', err);
        res.status(500).send({ error: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).send({ error: 'Email and OTP are required' });
        }

        const { otpCollection } = getCollections();
        const record = await otpCollection.findOne({ email });

        if (!record) {
            return res.status(400).send({ error: 'OTP has expired or was not requested.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).send({ error: 'Invalid verification code.' });
        }

        // Mark as verified
        await otpCollection.updateOne({ email }, { $set: { verified: true } });

        // Generate a temporary reset token valid for 15 minutes
        const resetToken = jwt.sign({ email, purpose: 'password_reset' }, process.env.TOKEN_SECRET, { expiresIn: '15m' });

        res.send({
            success: true,
            message: 'OTP verified successfully.',
            resetToken,
        });
    } catch (err) {
        console.error('verify-otp error:', err);
        res.status(500).send({ error: err.message });
    }
});

// Complete Password Reset
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).send({ error: 'Reset token and new password are required' });
        }

        // Verify reset token
        jwt.verify(resetToken, process.env.TOKEN_SECRET, async (err, decoded) => {
            if (err || decoded.purpose !== 'password_reset') {
                return res.status(403).send({ error: 'Invalid or expired password reset session.' });
            }

            const { otpCollection, userCollection } = getCollections();
            const email = decoded.email;

            // In Firebase client apps, password update is typically completed on client with confirmPasswordReset,
            // or here we record the password reset completion in MongoDB users collection.
            await userCollection.updateOne(
                { email },
                { $set: { passwordUpdatedAt: new Date().toISOString() } }
            );

            // Clean up OTP record
            await otpCollection.deleteOne({ email });

            res.send({
                success: true,
                message: 'Password reset verified successfully.',
                email,
            });
        });
    } catch (err) {
        console.error('reset-password error:', err);
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
