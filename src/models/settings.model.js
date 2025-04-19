const mongoose = require("mongoose");
const { toJSON, paginate } = require('./plugins');

const settingsSchema = new mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true,
            unique: true 
        },
        profile: {
            username: { type: String, trim: true },
            firstName: { type: String, trim: true },
            lastName: { type: String, trim: true },
            displayName: { type: String, trim: true }
        },
        categories: [{
            type: String,
            enum: ["TECHNOLOGY", "BUSINESS", "LIFESTYLE", "EDUCATION", "ENTERTAINMENT", "HEALTH", "OTHER"]
        }],
        preferences: {
            emailNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
            theme: { type: String, enum: ["LIGHT", "DARK", "SYSTEM"], default: "SYSTEM" }
        }
    },
    { timestamps: true }
);

// Add plugin that converts mongoose to json
settingsSchema.plugin(toJSON);
settingsSchema.plugin(paginate);

/**
 * @typedef Settings
 */
module.exports = mongoose.model("Settings", settingsSchema); 