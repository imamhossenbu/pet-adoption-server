const express = require('express');
const router = express.Router();
const { getCollections, ObjectId } = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const { getTransporter } = require('../utils/mailer');

// Public: Subscribe to newsletter
router.post('/newsletter/subscribe', async (req, res) => {
    try {
        const { newsletterCollection } = getCollections();
        const { email } = req.body;

        if (!email || !email.includes('@')) {
            return res.status(400).send({ message: 'A valid email address is required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await newsletterCollection.findOne({ email: normalizedEmail });

        if (existing) {
            if (existing.status === 'unsubscribed') {
                // Re-subscribe
                await newsletterCollection.updateOne(
                    { _id: existing._id },
                    { $set: { status: 'active', resubscribedAt: new Date().toISOString() } }
                );
                return res.send({ message: 'Welcome back! You have re-subscribed to our newsletter.', alreadySubscribed: false });
            }
            return res.send({ message: 'You are already subscribed to our newsletter!', alreadySubscribed: true });
        }

        const newSubscriber = {
            email: normalizedEmail,
            subscribedAt: new Date().toISOString(),
            status: 'active',
            source: 'website_footer'
        };

        const result = await newsletterCollection.insertOne(newSubscriber);
        res.send({ message: 'Thank you for subscribing to PeddyCare updates!', insertedId: result.insertedId });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Admin: Get all subscribers
router.get('/newsletter/subscribers', verifyToken, async (req, res) => {
    try {
        const { newsletterCollection } = getCollections();
        const subscribers = await newsletterCollection.find().sort({ subscribedAt: -1 }).toArray();
        const total = subscribers.length;
        const active = subscribers.filter(s => s.status === 'active').length;
        const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;

        res.send({
            subscribers,
            stats: { total, active, unsubscribed }
        });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Admin: Toggle status (active / unsubscribed)
router.patch('/newsletter/subscribers/status/:id', verifyToken, async (req, res) => {
    try {
        const { newsletterCollection } = getCollections();
        const id = req.params.id;
        const { status } = req.body;

        const result = await newsletterCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: status || 'unsubscribed', updatedAt: new Date().toISOString() } }
        );
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Admin: Delete subscriber
router.delete('/newsletter/subscribers/:id', verifyToken, async (req, res) => {
    try {
        const { newsletterCollection } = getCollections();
        const id = req.params.id;
        const result = await newsletterCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

// Admin: Broadcast newsletter email to all active subscribers
router.post('/newsletter/send', verifyToken, async (req, res) => {
    try {
        const { newsletterCollection } = getCollections();
        const { subject, heading, content } = req.body;

        if (!subject || !content) {
            return res.status(400).send({ message: 'Subject and Content are required.' });
        }

        const activeSubscribers = await newsletterCollection.find({ status: 'active' }).toArray();
        const recipientEmails = activeSubscribers.map(s => s.email);

        if (recipientEmails.length === 0) {
            return res.status(400).send({ message: 'No active subscribers found to broadcast to.' });
        }

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <div style="background: #141414; padding: 24px; text-align: center;">
                <h1 style="color: #FBAE02; margin: 0; font-size: 24px;">PeddyCare Newsletter</h1>
                <p style="color: #a3a3a3; font-size: 13px; margin: 4px 0 0 0;">Together, Saving Paws & Changing Lives</p>
            </div>
            <div style="padding: 28px;">
                <h2 style="color: #171717; font-size: 20px; margin-top: 0;">${heading || subject}</h2>
                <div style="color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-line;">
                    ${content}
                </div>
                <div style="margin-top: 30px; text-align: center;">
                    <a href="http://localhost:5173/pet-listing" style="display: inline-block; background: #FBAE02; color: #000; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 8px;">Explore Available Pets</a>
                </div>
            </div>
            <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0;">You received this because you are subscribed to PeddyCare updates.</p>
            </div>
        </div>
        `;

        const transporter = getTransporter();
        const sender = process.env.EMAIL_USER || 'newsletter@peddycare.org';

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            // Send in batches or Bcc to protect privacy
            await transporter.sendMail({
                from: `"PeddyCare Community" <${sender}>`,
                bcc: recipientEmails,
                subject: subject,
                html: html
            });
        } else {
            console.log(`[NEWSLETTER BROADCAST SIMULATION] Subject: "${subject}" to ${recipientEmails.length} subscribers:`, recipientEmails);
        }

        res.send({
            success: true,
            message: `Newsletter broadcast queued successfully to ${recipientEmails.length} active subscriber(s)!`,
            recipientCount: recipientEmails.length
        });
    } catch (err) {
        console.error("Newsletter send error:", err);
        res.status(500).send({ error: err.message });
    }
});

module.exports = router;
