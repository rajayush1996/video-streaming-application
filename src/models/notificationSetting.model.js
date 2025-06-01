const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const utils = require('../utils');

const notificationSettingSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            ref: 'UserCredentials',
            required: true,
            unique: true,
        },
        channels: {
            email: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                frequency: {
                    type: String,
                    enum: ['immediate', 'digest', 'off'],
                    default: 'immediate',
                },
            },
            push: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                frequency: {
                    type: String,
                    enum: ['immediate', 'digest', 'off'],
                    default: 'immediate',
                },
            },
            sms: {
                enabled: {
                    type: Boolean,
                    default: false,
                },
                frequency: {
                    type: String,
                    enum: ['immediate', 'digest', 'off'],
                    default: 'immediate',
                },
            },
            inApp: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
            },
        },
        preferences: {
            contentApproval: {
                type: Boolean,
                default: true,
            },
            contentRejection: {
                type: Boolean,
                default: true,
            },
            comments: {
                type: Boolean,
                default: true,
            },
            likes: {
                type: Boolean,
                default: true,
            },
            followers: {
                type: Boolean,
                default: true,
            },
            systemAnnouncements: {
                type: Boolean,
                default: true,
            },
            marketing: {
                type: Boolean,
                default: false,
            },
        },
        quietHours: {
            enabled: {
                type: Boolean,
                default: false,
            },
            start: {
                type: String,
                default: "22:00",
            },
            end: {
                type: String,
                default: "08:00",
            },
            timezone: {
                type: String,
                default: "UTC",
            },
        },
        digestSettings: {
            time: {
                type: String,
                default: "08:00",
            },
            frequency: {
                type: String,
                enum: ['daily', 'weekly'],
                default: 'daily',
            },
        },
    },
    {
        timestamps: true,
        _id: false // Disable auto _id generation
    }
);

// Generate UUID with prefix before saving
notificationSettingSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('ns-');
    }
    next();
});

// Add plugin that converts mongoose to json
notificationSettingSchema.plugin(toJSON);

// Indexes
notificationSettingSchema.index({ userId: 1 });

const NotificationSetting = mongoose.model('NotificationSetting', notificationSettingSchema);

module.exports = NotificationSetting; 