const mongoose = require("mongoose");

const emailProviderSchema = new mongoose.Schema(
    {
        providerName: { type: String, required: true, unique: true },
        smtpHost: { type: String, required: true },
        smtpPort: { type: Number, required: true },
        secure: { type: Boolean, default: false },
        auth: {
            user: { type: String, required: true },
            pass: { type: String, required: true },
        },
        fromEmail: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EmailProvider", emailProviderSchema);
