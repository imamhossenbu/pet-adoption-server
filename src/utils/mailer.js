const nodemailer = require('nodemailer');

// Generate 6-digit numeric OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create transporter
const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass,
        },
    });
};

/**
 * Send OTP Email for Password Reset or Verification
 */
const sendOtpEmail = async (toEmail, otp) => {
    console.log(`\n========================================`);
    console.log(`🔑 [OTP CODE GENERATED for ${toEmail}]: ${otp}`);
    console.log(`⏰ [Validity]: 5 Minutes`);
    console.log(`========================================\n`);

    const transporter = createTransporter();

    if (!transporter) {
        console.warn(`⚠️ EMAIL_PASS not yet set in .env. Falling back to console OTP logging. Code: ${otp}`);
        return {
            success: true,
            fallback: true,
            message: "OTP logged to console. Provide EMAIL_PASS in .env to deliver via SMTP."
        };
    }

    const mailOptions = {
        from: `"PeddyCare Security" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Your PeddyCare Verification Code: ${otp}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #f0f0f0;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #171717; margin: 0; font-size: 26px;">Peddy<span style="color: #FBAE02;">Care</span></h1>
                <p style="color: #666; font-size: 13px; margin-top: 4px;">Account Security & Password Recovery</p>
            </div>
            
            <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <p style="color: #92400E; font-size: 13px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">Your One-Time Password (OTP)</p>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #171717; font-family: monospace;">${otp}</div>
                <p style="color: #B45309; font-size: 12px; margin: 10px 0 0 0;">Valid for 5 minutes. Do not share this code with anyone.</p>
            </div>
            
            <p style="color: #4b5563; font-size: 13px; line-height: 1.6;">
                We received a request to verify your identity or reset your password on PeddyCare. Enter the 6-digit code above on the verification screen to proceed.
            </p>
            
            <p style="color: #9ca3af; font-size: 11px; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 15px; text-align: center;">
                If you did not request this code, you can safely ignore this email.
            </p>
        </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${toEmail}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error("❌ Nodemailer send error:", err);
        // Return success with console fallback so user isn't blocked while setting credentials
        return { success: true, fallback: true, error: err.message };
    }
};

module.exports = {
    generateOtp,
    sendOtpEmail,
};
