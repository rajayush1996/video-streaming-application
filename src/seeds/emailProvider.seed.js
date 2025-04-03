const EmailProvider = require('../models/emailProvider.model');
const { encrypt } = require('../utils/security.util');

const seedEmailProviders = async () => {
    try {
        const existingProviders = await EmailProvider.countDocuments();

        if (existingProviders === 0) {
            console.log("Seeding default email providers...");

            const emailProviders = [
                {
                    providerName: "Gmail",
                    smtpHost: "smtp.gmail.com",
                    smtpPort: 587,
                    secure: false,
                    auth: {
                        user: process.env.GMAIL_USER || "ayushraj8571@gmail.com",
                        pass:  process.env.GMAIL_PASS ? encrypt(process.env.GMAIL_PASS) : encrypt("gzondofebwlgdtwl")
                    },
                    fromEmail: process.env.GMAIL_USER || "ayushraj8571@gmail.com"
                },
                {
                    providerName: "Outlook",
                    smtpHost: "smtp.office365.com",
                    smtpPort: 587,
                    secure: false,
                    auth: {
                        user: process.env.OUTLOOK_USER || "your-email@outlook.com",
                        pass: process.env.OUTLOOK_PASS ? encrypt(process.env.OUTLOOK_PASS) : encrypt("your-email-password")
                    },
                    fromEmail: process.env.OUTLOOK_USER || "your-email@outlook.com"
                },
                {
                    providerName: "AWS SES",
                    smtpHost: "email-smtp.us-east-1.amazonaws.com",
                    smtpPort: 465,
                    secure: true,
                    auth: {
                        user: process.env.AWS_SES_USER || "your-aws-ses-user",
                        pass: process.env.AWS_SES_PASS ? encrypt(process.env.AWS_SES_PASS) : encrypt("your-aws-ses-password")
                    },
                    fromEmail: process.env.AWS_SES_EMAIL || "your-ses-email@example.com"
                }
            ];

            await EmailProvider.insertMany(emailProviders);
            console.log(" Default email providers seeded successfully.");
        } else {
            console.log(" Email providers already exist. Skipping seed.");
        }
    } catch (error) {
        console.error("Error seeding email providers:", error);
    }
};

module.exports = seedEmailProviders;
