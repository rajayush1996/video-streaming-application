const mongoose = require('mongoose');
const auditPlugin = require('./plugins/audit.plugin');

const userInteractionSchema = new mongoose.Schema({
    userId: {
        type: String,
        ref: 'UserCredentials',
        required: true
    },
    type: {
        type: String,
        enum: [
            'follow',
            'unfollow',
            'like',
            'unlike',
            'comment',
            'reply',
            'share',
            'bookmark',
            'mention',
            'tag'
        ],
        required: true
    },
    targetType: {
        type: String,
        enum: ['user', 'media', 'blog', 'comment'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Apply audit plugin
userInteractionSchema.plugin(auditPlugin, { resourceType: 'USER_INTERACTION' });

// Indexes
userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ targetId: 1, targetType: 1 });
userInteractionSchema.index({ type: 1, createdAt: -1 });
userInteractionSchema.index({ isRead: 1, userId: 1 });

// Methods
userInteractionSchema.methods.markAsRead = async function() {
    this.isRead = true;
    return this.save();
};

userInteractionSchema.methods.archive = async function() {
    this.isArchived = true;
    return this.save();
};

// Static methods
userInteractionSchema.statics.getUnreadCount = async function(userId) {
    return this.countDocuments({
        userId,
        isRead: false,
        isArchived: false
    });
};

userInteractionSchema.statics.getRecentInteractions = async function(userId, options = {}) {
    const { limit = 20, skip = 0, type, targetType } = options;
    
    const query = {
        userId,
        isArchived: false
    };

    if (type) query.type = type;
    if (targetType) query.targetType = targetType;

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username displayName avatar')
        .lean();
};

userInteractionSchema.statics.getInteractionsByTarget = async function(targetId, targetType, options = {}) {
    const { limit = 20, skip = 0, type } = options;
    
    const query = {
        targetId,
        targetType
    };

    if (type) query.type = type;

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username displayName avatar')
        .lean();
};

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

module.exports = UserInteraction; 