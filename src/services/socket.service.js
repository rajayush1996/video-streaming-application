const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const logger = require('../features/logger');
const { UserCredentials } = require('../models');
const ApiError = require('../features/error');

class SocketService {
    constructor() {
        this.io = null;
        this.adminNamespace = null;
        this.userNamespace = null;
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: config.corsOrigin,
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        
        // Create namespaces for admin and user
        this.adminNamespace = this.io.of('/admin');
        this.userNamespace = this.io.of('/user');

        // Middleware for JWT authentication
        const authenticateSocket = async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    throw new ApiError(401, 'Authentication token missing');
                }

                const decoded = jwt.verify(token, config.authentication.jwt_token_secret_key);
                const user = await UserCredentials.findById(decoded.sub);
                
                if (!user) {
                    throw new ApiError(401, 'User not found');
                }

                // Attach user info to socket
                socket.user = {
                    id: user.id,
                    role: user.role,
                    email: user.email
                };

                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        };

        // Apply authentication middleware to namespaces
        this.adminNamespace.use(authenticateSocket);
        this.userNamespace.use(authenticateSocket);

        // Admin namespace connection handling
        this.adminNamespace.on('connection', (socket) => {
            const { id, role } = socket.user;
            
            // Only allow admin role
            if (role !== 'admin') {
                socket.disconnect();
                return;
            }

            logger.info('Admin connected:', id);

            // Join admin room
            socket.join('admin-room');

            // Handle admin-specific events
            socket.on('admin:join', (data) => {
                // Join specific admin rooms if needed
                if (data.room) {
                    socket.join(`admin-${data.room}`);
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                logger.info('Admin disconnected:', id);
            });
        });

        // User namespace connection handling
        this.userNamespace.on('connection', (socket) => {
            const { id, role } = socket.user;
            logger.info('User connected:', id);

            // Join user-specific room
            socket.join(`user-${id}`);

            // Join role-specific room if creator
            if (role === 'creator') {
                socket.join('creators-room');
            }

            // Handle user-specific events
            socket.on('user:join', (data) => {
                // Join specific user rooms if needed
                if (data.room) {
                    socket.join(`user-${id}-${data.room}`);
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                logger.info('User disconnected:', id);
            });
        });
    }

    // Notify admins about new creator request
    notifyNewCreatorRequest(request) {
        this.adminNamespace.to('admin-room').emit('creator:new-request', {
            type: 'creator_request',
            data: request,
            timestamp: new Date()
        });
    }

    // Notify admins about new content that needs approval
    notifyNewContent(content) {
        this.adminNamespace.to('admin-room').emit('content:needs-approval', {
            type: 'content_approval',
            data: content,
            timestamp: new Date()
        });
    }

    // Notify user about their creator request status
    notifyCreatorRequestStatus(userId, status, request) {
        this.userNamespace.to(`user-${userId}`).emit('creator:request-status', {
            type: 'request_status',
            status,
            data: request,
            timestamp: new Date()
        });
    }

    // Notify user about their content approval status
    notifyContentStatus(userId, contentId, status, content) {
        this.userNamespace.to(`user-${userId}`).emit('content:status', {
            type: 'content_status',
            contentId,
            status,
            data: content,
            timestamp: new Date()
        });
    }

    // Notify all creators about new admin announcements
    notifyCreators(announcement) {
        this.userNamespace.to('creators-room').emit('admin:announcement', {
            type: 'announcement',
            data: announcement,
            timestamp: new Date()
        });
    }
}

module.exports = new SocketService(); 