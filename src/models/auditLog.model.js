const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const utils = require('../utils');

const auditLogSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: null // Will be set in pre-validate
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'LOGOUT',
            'CREATE',
            'UPDATE',
            'DELETE',
            'APPROVE',
            'REJECT',
            'UPLOAD',
            'DOWNLOAD',
            'SHARE',
            'LIKE',
            'COMMENT',
            'FOLLOW',
            'UNFOLLOW',
            'PASSWORD_CHANGE',
            'PROFILE_UPDATE',
            'ROLE_CHANGE',
            'STATUS_CHANGE'
        ]
    },
    resourceType: {
        type: String,
        required: true,
        enum: [
            'USER',
            'VIDEO',
            'BLOG',
            'COMMENT',
            'LIKE',
            'FOLLOW',
            'MEDIA',
            'PROFILE',
            'SETTINGS',
            'SYSTEM'
        ]
    },
    resourceId: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String
    }
}, {
    timestamps: true,
    _id: false
});

// Generate UUID with prefix before saving
// Ensures _id always starts with 'al-'
auditLogSchema.pre('validate', async function(next) {
    console.log("🚀 ~ auditLogSchema.pre ~ this._id:", this);
    if (!this._id || !this._id.startsWith('al-')) {
        this._id = utils.uuid('al-');
    }
    next();
});

// Add plugin that converts mongoose to json
auditLogSchema.plugin(toJSON);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog; 