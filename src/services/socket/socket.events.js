const logger = require('../../features/logger');

// Event Types
const EVENT_TYPES = {
    // Connection Events
    CONNECTION: {
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        ERROR: 'error',
        CONNECT_ERROR: 'connect_error'
    },

    // Admin Events
    ADMIN: {
        JOIN: 'admin:join',
        PENDING_COUNTS: 'admin:pending-counts',
        ANNOUNCEMENT: 'admin:announcement',
        PROFILE_UPDATE: 'profile:update',
        MEDIA_UPLOAD: 'media:new-upload',
        BLOG_CREATED: 'blog:new'
    },

    // User Events
    USER: {
        JOIN: 'user:join',
        PROFILE_UPDATE: 'user:profile-update',
        NOTIFICATION: 'user:notification',
        PROFILE_VERIFICATION: 'profile:verification',
        MEDIA_STATUS: 'media:status',
        BLOG_STATUS: 'blog:status'
    },

    // Creator Events
    CREATOR: {
        REQUEST: {
            NEW: 'creator:new-request',
            STATUS: 'creator:request-status',
            PENDING_COUNT: 'creator:pending-count'
        }
    },

    // Content Events
    CONTENT: {
        NEW: 'content:new',
        STATUS: 'content:status',
        APPROVED: 'content:approved',
        REJECTED: 'content:rejected',
        NEEDS_APPROVAL: 'content:needs-approval'
    },

    // Media Events
    MEDIA: {
        UPLOAD: 'media:new-upload',
        STATUS: 'media:status',
        APPROVED: 'media:approved',
        REJECTED: 'media:rejected'
    },

    // Blog Events
    BLOG: {
        CREATED: 'blog:new',
        STATUS: 'blog:status',
        APPROVED: 'blog:approved',
        REJECTED: 'blog:rejected'
    },

    // Profile Events
    PROFILE: {
        UPDATE: 'profile:update',
        VERIFICATION: 'profile:verification'
    }
};

// Event Handlers
const eventHandlers = {
    // Admin Event Handlers
    handleAdminJoin: (socket, data) => {
        try {
            if (data.room) {
                socket.join(`admin-${data.room}`);
                logger.info(`Admin ${socket.user.id} joined room: admin-${data.room}`);
            }
        } catch (error) {
            logger.error('Error in handleAdminJoin:', error);
        }
    },

    handleAdminPendingCounts: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.ADMIN.PENDING_COUNTS, {
                type: 'pending_counts',
                data: {
                    creatorRequests: data.creatorRequests || 0,
                    mediaApprovals: data.mediaApprovals || 0,
                    blogApprovals: data.blogApprovals || 0,
                    profileVerifications: data.profileVerifications || 0
                },
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleAdminPendingCounts:', error);
        }
    },

    // User Event Handlers
    handleUserJoin: (socket, data) => {
        try {
            if (data.room) {
                socket.join(`user-${socket.user.id}-${data.room}`);
                logger.info(`User ${socket.user.id} joined room: user-${socket.user.id}-${data.room}`);
            }
        } catch (error) {
            logger.error('Error in handleUserJoin:', error);
        }
    },

    // Creator Event Handlers
    handleCreatorRequest: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.CREATOR.REQUEST.NEW, {
                type: 'creator_request',
                data: {
                    id: data._id,
                    userId: data.userId,
                    status: data.status,
                    reason: data.reason,
                    portfolio: data.portfolio,
                    socialLinks: data.socialLinks,
                    createdAt: data.createdAt
                },
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleCreatorRequest:', error);
        }
    },

    handleCreatorRequestStatus: (socket, data) => {
        try {
            const message = data.status === 'approved' 
                ? 'Your creator request has been approved! You can now start creating content.'
                : `Your creator request has been rejected${data.rejectionReason ? `: ${data.rejectionReason}` : ''}`;

            socket.emit(EVENT_TYPES.CREATOR.REQUEST.STATUS, {
                type: 'request_status',
                status: data.status,
                data: {
                    id: data._id,
                    status: data.status,
                    reviewedBy: data.reviewedBy,
                    reviewedAt: data.reviewedAt,
                    rejectionReason: data.rejectionReason
                },
                message,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleCreatorRequestStatus:', error);
        }
    },

    // Content Event Handlers
    handleContentStatus: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.CONTENT.STATUS, {
                type: 'content_status',
                contentId: data.contentId,
                status: data.status,
                data: data.content,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleContentStatus:', error);
        }
    },

    handleContentNeedsApproval: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.CONTENT.NEEDS_APPROVAL, {
                type: 'content_approval',
                data: data,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleContentNeedsApproval:', error);
        }
    },

    // Media Event Handlers
    handleMediaUpload: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.MEDIA.UPLOAD, {
                type: 'media_upload',
                data: {
                    id: data._id,
                    userId: data.userId,
                    type: data.type,
                    title: data.title,
                    status: data.status,
                    createdAt: data.createdAt
                },
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleMediaUpload:', error);
        }
    },

    handleMediaStatus: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.MEDIA.STATUS, {
                type: 'media_status',
                mediaId: data.mediaId,
                status: data.status,
                data: {
                    ...data,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('Error in handleMediaStatus:', error);
        }
    },

    // Blog Event Handlers
    handleBlogCreated: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.BLOG.CREATED, {
                type: 'blog_created',
                data: {
                    id: data._id,
                    userId: data.userId,
                    title: data.title,
                    status: data.status,
                    createdAt: data.createdAt
                },
                timestamp: new Date()
            });
        } catch (error) {
            logger.error('Error in handleBlogCreated:', error);
        }
    },

    handleBlogStatus: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.BLOG.STATUS, {
                type: 'blog_status',
                blogId: data.blogId,
                status: data.status,
                data: {
                    ...data,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('Error in handleBlogStatus:', error);
        }
    },

    // Profile Event Handlers
    handleProfileUpdate: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.PROFILE.UPDATE, {
                type: 'profile_update',
                data: {
                    userId: data.userId,
                    ...data.profileData,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('Error in handleProfileUpdate:', error);
        }
    },

    handleProfileVerification: (socket, data) => {
        try {
            socket.emit(EVENT_TYPES.PROFILE.VERIFICATION, {
                type: 'profile_verification',
                status: data.status,
                data: {
                    ...data,
                    timestamp: new Date()
                }
            });
        } catch (error) {
            logger.error('Error in handleProfileVerification:', error);
        }
    }
};

// Event Registration
const registerEventHandlers = (socket) => {
    // Admin Events
    socket.on(EVENT_TYPES.ADMIN.JOIN, (data) => eventHandlers.handleAdminJoin(socket, data));
    socket.on(EVENT_TYPES.ADMIN.PENDING_COUNTS, (data) => eventHandlers.handleAdminPendingCounts(socket, data));

    // User Events
    socket.on(EVENT_TYPES.USER.JOIN, (data) => eventHandlers.handleUserJoin(socket, data));

    // Creator Events
    socket.on(EVENT_TYPES.CREATOR.REQUEST.NEW, (data) => eventHandlers.handleCreatorRequest(socket, data));
    socket.on(EVENT_TYPES.CREATOR.REQUEST.STATUS, (data) => eventHandlers.handleCreatorRequestStatus(socket, data));

    // Content Events
    socket.on(EVENT_TYPES.CONTENT.STATUS, (data) => eventHandlers.handleContentStatus(socket, data));
    socket.on(EVENT_TYPES.CONTENT.NEEDS_APPROVAL, (data) => eventHandlers.handleContentNeedsApproval(socket, data));

    // Media Events
    socket.on(EVENT_TYPES.MEDIA.UPLOAD, (data) => eventHandlers.handleMediaUpload(socket, data));
    socket.on(EVENT_TYPES.MEDIA.STATUS, (data) => eventHandlers.handleMediaStatus(socket, data));

    // Blog Events
    socket.on(EVENT_TYPES.BLOG.CREATED, (data) => eventHandlers.handleBlogCreated(socket, data));
    socket.on(EVENT_TYPES.BLOG.STATUS, (data) => eventHandlers.handleBlogStatus(socket, data));

    // Profile Events
    socket.on(EVENT_TYPES.PROFILE.UPDATE, (data) => eventHandlers.handleProfileUpdate(socket, data));
    socket.on(EVENT_TYPES.PROFILE.VERIFICATION, (data) => eventHandlers.handleProfileVerification(socket, data));
};

module.exports = {
    EVENT_TYPES,
    eventHandlers,
    registerEventHandlers
}; 