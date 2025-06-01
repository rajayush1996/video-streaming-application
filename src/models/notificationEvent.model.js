const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const utils = require('../utils');

const notificationEventSchema = mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        publisher: {
            type: String,
            required: true,
        },
        priority: {
            type: String,
            enum: ['critical', 'high', 'medium', 'low'],
            default: 'medium',
            index: true,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        processingStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
            index: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        errorDetails: {
            type: String,
        },
        targetUsers: [{
            type: String,
            ref: 'UserCredentials',
        }],
        scheduledFor: {
            type: Date,
            default: Date.now,
            index: true,
        },
        processedAt: {
            type: Date,
        }
    },
    {
        timestamps: true,
        _id: false // Disable auto _id generation
    }
);

// Generate UUID with prefix before saving
notificationEventSchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('ne-');
    }
    next();
});

// Add plugin that converts mongoose to json
notificationEventSchema.plugin(toJSON);

// Indexes
notificationEventSchema.index({ eventType: 1, processingStatus: 1 });
notificationEventSchema.index({ scheduledFor: 1, processingStatus: 1 });
notificationEventSchema.index({ publisher: 1 });

const NotificationEvent = mongoose.model('NotificationEvent', notificationEventSchema);

module.exports = NotificationEvent; 