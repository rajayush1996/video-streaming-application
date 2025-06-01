const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const auditPlugin = require("./plugins/audit.plugin");
const utils = require('../utils');

const notificationSchema = mongoose.Schema(
    {
        recipient: {
            type: String,
            ref: "UserCredentials",
            required: true,
        },
        sender: {
            type: String,
            ref: "UserCredentials",
        },
        type: {
            type: String,
            enum: [
                "content-approval",
                "content-rejection",
                "new-subscriber",
                "comment",
                "like",
                "system",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        relatedContent: {
            contentType: {
                type: String,
                enum: ["media", "comment", "user", "system"],
                required: true,
            },
            contentId: {
                type: String,
                required: true,
            },
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        _id: false // Disable auto _id generation
    }
);

// Generate UUID with prefix before saving
notificationSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('n-');
    }
    next();
});

// Add plugin that converts mongoose to json
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);
notificationSchema.plugin(auditPlugin, { resourceType: 'NOTIFICATION' });

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ 'relatedContent.contentType': 1, 'relatedContent.contentId': 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
