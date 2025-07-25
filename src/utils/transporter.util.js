const nodemailer = require('nodemailer');
const EmailProvider = require('../models/emailProvider.model');
const { decrypt } = require('./security.util');

const getEmailProvider = async (providerName = "Gmail") => {
    const provider = await EmailProvider.findOne({ providerName });

    if (provider && provider?.auth && provider?.auth?.pass) {
        // Decrypt password before returning
        provider.auth.pass = decrypt(provider.auth.pass);
    }

    return provider;
};

const sendEmail = async (to, subject, message, providerName = "Gmail") => {
    try {
        const provider = await getEmailProvider(providerName);

        if (!provider) {
            throw new Error("Email provider not found.");
        }

        const transporter = nodemailer.createTransport({
            host: provider.smtpHost,
            port: provider.smtpPort,
            secure: provider.secure,
            auth: {
                user: provider.auth.user,
                pass: provider.auth.pass,
            },
        });

        const mailOptions = {
            from: provider.fromEmail,
            to,
            subject,
            text: message,
        };

        await transporter.sendMail(mailOptions);
        // console.log(`Email sent successfully to ${to}`);
        return ;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

module.exports = { sendEmail };
