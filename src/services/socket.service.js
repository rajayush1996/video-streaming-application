const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../features/logger');
const { UserCredentials } = require('../models');
const { EVENT_TYPES, registerEventHandlers } = require('./socket/socket.events');

class SocketService {
    constructor() {
        this.io = null;
        this.adminNamespace = null;
        this.userNamespace = null;
        this.anonymousSockets = new Map(); // Store anonymous sockets
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: ['http://localhost:3001', 'http://localhost:3000'],
                methods: ['GET', 'POST'],
                credentials: true,
                allowedHeaders: ['Content-Type', 'Authorization']
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        // Create namespaces for admin and user
        this.adminNamespace = this.io.of('/admin');
        this.userNamespace = this.io.of('/user');

        // Handle anonymous connections
        this.io.on(EVENT_TYPES.CONNECTION.CONNECT, (socket) => {
            logger.info('Anonymous socket connected:', socket.id);
            this.anonymousSockets.set(socket.id, socket);

            socket.on(EVENT_TYPES.CONNECTION.DISCONNECT, () => {
                logger.info('Anonymous socket disconnected:', socket.id);
                this.anonymousSockets.delete(socket.id);
            });
        });

        // Middleware for JWT authentication
        const authenticateSocket = async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                if (!token) {
                    logger.warn('Socket connection attempt without token');
                    return next(new Error('Authentication token missing'));
                }

                const decoded = jwt.verify(token, config.authentication.jwt_token_secret_key);
                const user = await UserCredentials.findById(decoded.sub);
                
                if (!user) {
                    logger.warn('Socket connection attempt with invalid user');
                    return next(new Error('User not found'));
                }

                // Attach user info to socket
                socket.user = {
                    id: user.id,
                    role: user.role,
                    email: user.email
                };

                // Check for existing anonymous socket
                const anonymousSocket = this.anonymousSockets.get(socket.id);
                if (anonymousSocket) {
                    // Transfer any pending events or data
                    this.transferSocketData(anonymousSocket, socket);
                    // Remove anonymous socket
                    this.anonymousSockets.delete(socket.id);
                }

                logger.info(`Socket authenticated for user: ${user.email}`);
                next();
            } catch (error) {
                logger.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        };

        // Apply authentication middleware to namespaces
        this.adminNamespace.use(authenticateSocket);
        this.userNamespace.use(authenticateSocket);

        // Admin namespace connection handling
        this.adminNamespace.on(EVENT_TYPES.CONNECTION.CONNECT, (socket) => {
            const { id, role } = socket.user;
            
            // Only allow admin role
            if (role !== 'admin') {
                logger.warn(`Non-admin user ${id} attempted to connect to admin namespace`);
                socket.disconnect();
                return;
            }

            logger.info('Admin connected:', id);

            // Join admin room
            socket.join('admin-room');

            // Register admin event handlers
            registerEventHandlers(socket);

            // Handle disconnection
            socket.on(EVENT_TYPES.CONNECTION.DISCONNECT, (reason) => {
                logger.info(`Admin disconnected: ${id}, reason: ${reason}`);
            });
        });

        // User namespace connection handling
        this.userNamespace.on(EVENT_TYPES.CONNECTION.CONNECT, (socket) => {
            const { id, role } = socket.user;
            logger.info('User connected:', id);

            // Join user-specific room
            socket.join(`user-${id}`);

            // Join role-specific room if creator
            if (role === 'creator') {
                socket.join('creators-room');
                logger.info(`Creator ${id} joined creators room`);
            }

            // Register user event handlers
            registerEventHandlers(socket);

            // Handle disconnection
            socket.on(EVENT_TYPES.CONNECTION.DISCONNECT, (reason) => {
                logger.info(`User disconnected: ${id}, reason: ${reason}`);
            });
        });

        logger.info('Socket.io initialized successfully');
    }

    // Helper method to transfer data from anonymous socket to authenticated socket
    transferSocketData(anonymousSocket, authenticatedSocket) {
        try {
            // Transfer any pending events or data
            const pendingEvents = anonymousSocket._events || {};
            Object.keys(pendingEvents).forEach(event => {
                if (event !== 'disconnect') {
                    authenticatedSocket.on(event, pendingEvents[event]);
                }
            });

            // Transfer any pending acknowledgments
            if (anonymousSocket._pendingAcks) {
                authenticatedSocket._pendingAcks = anonymousSocket._pendingAcks;
            }

            logger.info(`Transferred data from anonymous socket ${anonymousSocket.id} to authenticated socket ${authenticatedSocket.id}`);
        } catch (error) {
            logger.error('Error transferring socket data:', error);
        }
    }

    // Method to handle post-login socket connection
    async handlePostLoginConnection(token, userId) {
        try {
            const user = await UserCredentials.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Create a new socket connection with the token
            const namespace = user.role === 'admin' ? '/admin' : '/user';
            const socket = this.io.of(namespace).connect({
                auth: { token },
                transports: ['websocket', 'polling']
            });

            // Handle connection events
            socket.on('connect', () => {
                logger.info(`Post-login socket connected for user: ${user.email}`);
            });

            socket.on('connect_error', (error) => {
                logger.error(`Post-login socket connection error for user ${user.email}:`, error);
            });

            return socket;
        } catch (error) {
            logger.error('Error in handlePostLoginConnection:', error);
            throw error;
        }
    }

    // Notify admins about new creator request
    notifyNewCreatorRequest(request) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.CREATOR.REQUEST.NEW, {
            type: 'creator_request',
            data: {
                id: request._id,
                userId: request.userId,
                status: request.status,
                reason: request.reason,
                portfolio: request.portfolio,
                socialLinks: request.socialLinks,
                createdAt: request.createdAt
            },
            timestamp: new Date()
        });
    }

    // Notify admins about new content that needs approval
    notifyNewContent(content) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.CONTENT.NEEDS_APPROVAL, {
            type: 'content_approval',
            data: content,
            timestamp: new Date()
        });
    }

    // Notify user about their creator request status
    notifyCreatorRequestStatus(userId, status, request) {
        const message = status === 'approved' 
            ? 'Your creator request has been approved! You can now start creating content.'
            : `Your creator request has been rejected${request.rejectionReason ? `: ${request.rejectionReason}` : ''}`;

        this.userNamespace.to(`user-${userId}`).emit(EVENT_TYPES.CREATOR.REQUEST.STATUS, {
            type: 'request_status',
            status,
            data: {
                id: request._id,
                status: request.status,
                reviewedBy: request.reviewedBy,
                reviewedAt: request.reviewedAt,
                rejectionReason: request.rejectionReason
            },
            message,
            timestamp: new Date()
        });
    }

    // Notify user about their content approval status
    notifyContentStatus(userId, contentId, status, content) {
        this.userNamespace.to(`user-${userId}`).emit(EVENT_TYPES.CONTENT.STATUS, {
            type: 'content_status',
            contentId,
            status,
            data: content,
            timestamp: new Date()
        });
    }

    // Notify all creators about new admin announcements
    notifyCreators(announcement) {
        this.userNamespace.to('creators-room').emit(EVENT_TYPES.ADMIN.ANNOUNCEMENT, {
            type: 'announcement',
            data: announcement,
            timestamp: new Date()
        });
    }

    // Emit event to a specific user
    emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(`user-${userId}`).emit(event, data);
        }
    }

    // Emit event to all connected clients
    emitToAll(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    // Notify about new content submission to admins
    notifyNewContentSubmission(content) {
        if (this.io) {
            this.io.to('role:admin').emit(EVENT_TYPES.CONTENT.NEW, {
                id: content._id,
                title: content.title,
                type: content.type,
                userId: content.userId,
                createdAt: content.createdAt
            });
        }
    }

    // Notify user about content status change
    notifyContentStatusChange(userId, contentId, status, contentData) {
        if (this.io) {
            this.emitToUser(userId, EVENT_TYPES.CONTENT.STATUS, {
                contentId,
                status,
                title: contentData.title,
                message: status === 'approved' 
                    ? 'Your content has been approved' 
                    : `Your content has been rejected${contentData.rejectionReason ? `: ${contentData.rejectionReason}` : ''}`
            });
        }
    }

    // Notify all admins about pending creator requests count
    notifyPendingCreatorRequestsCount(count) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.CREATOR.REQUEST.PENDING_COUNT, {
            type: 'pending_count',
            count,
            timestamp: new Date()
        });
    }

    // Notify admins about profile updates
    notifyProfileUpdate(userId, profileData) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.ADMIN.PROFILE_UPDATE, {
            type: 'profile_update',
            data: {
                userId,
                ...profileData,
                timestamp: new Date()
            }
        });
    }

    // Notify admins about new media upload
    notifyMediaUpload(mediaData) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.ADMIN.MEDIA_UPLOAD, {
            type: 'media_upload',
            data: {
                id: mediaData._id,
                userId: mediaData.userId,
                type: mediaData.type,
                title: mediaData.title,
                status: mediaData.status,
                createdAt: mediaData.createdAt
            },
            timestamp: new Date()
        });
    }

    // Notify admins about new blog post
    notifyBlogCreated(blogData) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.ADMIN.BLOG_CREATED, {
            type: 'blog_created',
            data: {
                id: blogData._id,
                userId: blogData.userId,
                title: blogData.title,
                status: blogData.status,
                createdAt: blogData.createdAt
            },
            timestamp: new Date()
        });
    }

    // Notify user about profile verification status
    notifyProfileVerification(userId, status, data) {
        this.userNamespace.to(`user-${userId}`).emit(EVENT_TYPES.USER.PROFILE_VERIFICATION, {
            type: 'profile_verification',
            status,
            data: {
                ...data,
                timestamp: new Date()
            }
        });
    }

    // Notify user about media status
    notifyMediaStatus(userId, mediaId, status, data) {
        this.userNamespace.to(`user-${userId}`).emit(EVENT_TYPES.USER.MEDIA_STATUS, {
            type: 'media_status',
            mediaId,
            status,
            data: {
                ...data,
                timestamp: new Date()
            }
        });
    }

    // Notify user about blog status
    notifyBlogStatus(userId, blogId, status, data) {
        this.userNamespace.to(`user-${userId}`).emit(EVENT_TYPES.USER.BLOG_STATUS, {
            type: 'blog_status',
            blogId,
            status,
            data: {
                ...data,
                timestamp: new Date()
            }
        });
    }

    // Notify admins about pending items count
    notifyPendingItemsCount(counts) {
        this.adminNamespace.to('admin-room').emit(EVENT_TYPES.ADMIN.PENDING_COUNTS, {
            type: 'pending_counts',
            data: {
                creatorRequests: counts.creatorRequests || 0,
                mediaApprovals: counts.mediaApprovals || 0,
                blogApprovals: counts.blogApprovals || 0,
                profileVerifications: counts.profileVerifications || 0
            },
            timestamp: new Date()
        });
    }

    // Get socket.io instance
    getIO() {
        return this.io;
    }
}

module.exports = new SocketService(); 