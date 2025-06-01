const mongoose = require("mongoose");
const { toJSON, paginate } = require('./plugins');
const utils = require('../utils');

const settingsSchema = new mongoose.Schema(
    {
        user: { 
            type: String, 
            ref: "UserCredentials", 
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
    { 
        timestamps: true,
        _id: false // Disable auto _id generation
    }
);

// Generate UUID with prefix before saving
settingsSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('s-');
    }
    next();
});

// Add plugin that converts mongoose to json
settingsSchema.plugin(toJSON);
settingsSchema.plugin(paginate);

// Indexes
settingsSchema.index({ user: 1 });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 