const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const contentSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  cta: {
    text: String,
    url: String,
  },
});

const notificationTemplateSchema = mongoose.Schema(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    channels: {
      push: {
        enabled: {
          type: Boolean,
          default: true,
        },
        content: {
          en: contentSchema,
          es: contentSchema,
          fr: contentSchema,
          // Add more languages as needed
        },
      },
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        content: {
          en: {
            subject: String,
            body: String,
            htmlTemplate: String,
          },
          es: {
            subject: String,
            body: String,
            htmlTemplate: String,
          },
          fr: {
            subject: String,
            body: String,
            htmlTemplate: String,
          },
          // Add more languages as needed
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false,
        },
        content: {
          en: {
            body: String,
          },
          es: {
            body: String,
          },
          fr: {
            body: String,
          },
          // Add more languages as needed
        },
      },
      inApp: {
        enabled: {
          type: Boolean,
          default: true,
        },
        content: {
          en: contentSchema,
          es: contentSchema,
          fr: contentSchema,
          // Add more languages as needed
        },
      },
    },
    metadata: {
      priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium',
      },
      category: {
        type: String,
        enum: ['system', 'content', 'user', 'transaction', 'security'],
        default: 'system',
      },
      ttl: {
        type: Number, // Time to live in seconds, 0 means no expiration
        default: 0,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to json
notificationTemplateSchema.plugin(toJSON);

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

module.exports = NotificationTemplate; 