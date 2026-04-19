const nodemailer = require('nodemailer');
const Alert = require('../models/alert');
const { sendPnLUpdate } = require('../socket');

// Setup Gmail transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email connection on startup
transporter.verify((error) => {
    if (error) {
        console.error('❌ Email service error:', error.message);
    } else {
        console.log('✅ Email service ready');
    }
});

// Send email notification
const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html
        });
        console.log(`📧 Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Email send failed:', error.message);
        return false;
    }
};

// Send SMS via Twilio
const sendSMS = async ({ to, message }) => {
    try {
        // Only initialize Twilio if credentials exist
        if (!process.env.TWILIO_ACCOUNT_SID) {
            console.log('📱 SMS skipped — Twilio not configured');
            return false;
        }

        const twilio = require('twilio')(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        await twilio.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });

        console.log(`📱 SMS sent to ${to}`);
        return true;
    } catch (error) {
        console.error('SMS send failed:', error.message);
        return false;
    }
};

// Build HTML email template for price alert
const buildPriceAlertEmail = ({ name, symbol, condition, targetPrice, currentPrice, pnl }) => {
    const isProfit = pnl >= 0;
    const color = isProfit ? '#16a34a' : '#dc2626';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">🔔 Vestara Alert</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p>Your price alert for <strong>${symbol}</strong> has been triggered.</p>
        <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid ${color};">
          <p><strong>Symbol:</strong> ${symbol}</p>
          <p><strong>Condition:</strong> Price ${condition} ₹${targetPrice}</p>
          <p><strong>Current Price:</strong> ₹${currentPrice}</p>
          <p style="color: ${color}"><strong>Your P&L:</strong> ₹${pnl}</p>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          This alert has been deactivated. Create a new one on Vestara.
        </p>
      </div>
    </div>
  `;
};

// Build HTML email for volume spike alert
const buildVolumeAlertEmail = ({ name, symbol, currentVolume, avgVolume }) => {
    const multiplier = (currentVolume / avgVolume).toFixed(1);

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #d97706; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">📊 Volume Spike Detected</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
        <p>Hi ${name},</p>
        <p><strong>${symbol}</strong> is showing unusual trading activity.</p>
        <div style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #d97706;">
          <p><strong>Current Volume:</strong> ${currentVolume.toLocaleString()}</p>
          <p><strong>30-day Avg Volume:</strong> ${avgVolume.toLocaleString()}</p>
          <p><strong>Spike:</strong> ${multiplier}x normal volume</p>
        </div>
        <p>This could indicate significant news or institutional activity.</p>
      </div>
    </div>
  `;
};

// Main function — send alert through all channels
const sendAlertNotification = async ({
    userId,
    alertId,
    userEmail,
    userPhone,
    userName,
    symbol,
    title,
    message,
    emailHtml,
    notificationType
}) => {
    const channels = [];

    // 1. Send WebSocket notification (instant, in-app)
    sendPnLUpdate(userId, {
        type: 'alert_triggered',
        title,
        message,
        symbol,
        timestamp: new Date().toISOString()
    });
    channels.push('websocket');

    // 2. Send email
    const emailSent = await sendEmail({
        to: userEmail,
        subject: title,
        html: emailHtml
    });
    if (emailSent) channels.push('email');

    // 3. Send SMS if phone exists
    if (userPhone) {
        const smsSent = await sendSMS({
            to: userPhone,
            message: `${title}\n${message}`
        });
        if (smsSent) channels.push('sms');
    }

    // 4. Log notification to DB
    await Alert.logNotification({
        userId,
        alertId,
        title,
        message,
        type: notificationType,
        channels: channels.join(',')
    });

    console.log(`🔔 Alert sent via: ${channels.join(', ')}`);
};

module.exports = {
    sendAlertNotification,
    buildPriceAlertEmail,
    buildVolumeAlertEmail
};