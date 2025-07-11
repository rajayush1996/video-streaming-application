/* eslint-disable no-useless-catch */
// Import the User model
const User = require('../models/user.model');
// const AuthService = require('../services/auth.service');
const utils = require('../utils/utils');
const httpStatus = require('http-status');
const { ApiError } = require('../features/error');
const logger = require('../features/logger');
const UserCredentials = require('../models/userCredentials.model');
const UserProfile = require('../models/userProfile.model');
const Media = require('../models/media.model');
const Blog = require('../models/blog.model');

class UserService {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>}
     */
    async createUser(userData) {
        try {
            // Create user credentials
            const userCredentials = new UserCredentials({
                username: userData.username,
                email: userData.email,
                password: userData.password,
                role: userData.role || 'user'
            });
            await userCredentials.save();

            // Create user profile with default values from schema
            const userProfile = new UserProfile({
                userId: userCredentials._id,
                displayName: userData.displayName || userData.username,
                bio: userData.bio || '',
                avatar: userData.avatar || '',
                coverImage: userData.coverImage || '',
                location: userData.location || '',
                socialLinks: userData.socialLinks || {},
                preferences: {
                    isPublic: userData.preferences?.isPublic ?? true,
                    showEmail: userData.preferences?.showEmail ?? false,
                    emailNotifications: userData.preferences?.emailNotifications ?? true,
                    pushNotifications: userData.preferences?.pushNotifications ?? true,
                    theme: userData.preferences?.theme || 'system',
                    language: userData.preferences?.language || 'en'
                },
                stats: {
                    followers: 0,
                    following: 0,
                    posts: 0,
                    likes: 0,
                    views: 0
                }
            });
            await userProfile.save();

            return {
                user: {
                    id: userCredentials._id,
                    username: userCredentials.username,
                    email: userCredentials.email,
                    isVerified: userCredentials.emailVerified,
                    role: userCredentials.role.toUpperCase(),
                    createdAt: userCredentials.createdAt,
                    updatedAt: userCredentials.updatedAt
                },
                profile: {
                    bio: userProfile.bio,
                    location: userProfile.location,
                    avatar: userProfile.avatar,
                    coverImage: userProfile.coverImage,
                    socialLinks: userProfile.socialLinks,
                    preferences: {
                        isPublic: userProfile.preferences.isPublic,
                        showEmail: userProfile.preferences.showEmail,
                        notifications: {
                            email: userProfile.preferences.emailNotifications,
                            push: userProfile.preferences.pushNotifications
                        }
                    }
                },
                stats: {
                    posts: userProfile.stats.posts,
                    followers: userProfile.stats.followers,
                    following: userProfile.stats.following
                }
            };
        } catch (error) {
            logger.error('Error creating user:', error);
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Username or email already exists');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error creating user');
        }
    }

    /**
     * Get user by username
     * @param {string} username - Username
     * @returns {Promise<Object>}
     */
    async getUserByUsername(username) {
        try {
            const userCredentials = await UserCredentials.findOne({ username })
                .select('-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires');
            
            if (!userCredentials) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            const userProfile = await UserProfile.findOne({ userId: userCredentials._id });

            return {
                id: userCredentials._id,
                username: userCredentials.username,
                email: userCredentials.email,
                role: userCredentials.role,
                isEmailVerified: userCredentials.emailVerified,
                isActive: userCredentials.isActive,
                profile: userProfile ? {
                    displayName: userProfile.displayName,
                    bio: userProfile.bio,
                    avatar: userProfile.avatar,
                    coverImage: userProfile.coverImage,
                    location: userProfile.location,
                    socialLinks: userProfile.socialLinks,
                    preferences: userProfile.preferences,
                    stats: userProfile.stats
                } : null
            };
        } catch (error) {
            logger.error('Error fetching user by username:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

    // Retrieve a user by ID
    async getUserById(userId) {
        try {
            // Get user credentials
            const userCredentials = await UserCredentials.findById(userId)
                .select('-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires');
            
            if (!userCredentials) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            // Get user profile
            const userProfile = await UserProfile.findOne({ userId });

            // Format response according to UI requirements
            const response = {
                user: {
                    id: userCredentials._id,
                    username: userCredentials.username,
                    email: userCredentials.email,
                    isVerified: userCredentials.emailVerified,
                    role: userCredentials.role.toUpperCase(),
                    createdAt: userCredentials.createdAt,
                    updatedAt: userCredentials.updatedAt
                },
                profile: userProfile ? {
                    username: userCredentials.username,
                    displayName: userProfile.displayName || userCredentials.username,
                    bio: userProfile.bio || '',
                    location: userProfile.location || '',
                    avatar: userProfile.avatar || '',
                    coverImage: userProfile.coverImage || '',
                    socialLinks: {
                        twitter: userProfile.socialLinks?.twitter || '',
                        instagram: userProfile.socialLinks?.instagram || '',
                        youtube: userProfile.socialLinks?.youtube || ''
                    },
                    preferences: {
                        isPublic: userProfile.preferences?.isPublic,
                        showEmail: userProfile.preferences?.showEmail,
                        notifications: {
                            email: userProfile.preferences?.emailNotifications,
                            push: userProfile.preferences?.pushNotifications
                        }
                    }
                } : {
                    username: userCredentials.username,
                    displayName: userCredentials.username,
                    bio: '',
                    location: '',
                    avatar: '',
                    coverImage: '',
                    socialLinks: {
                        twitter: '',
                        instagram: '',
                        youtube: ''
                    },
                    preferences: {
                        isPublic: true,
                        showEmail: false,
                        notifications: {
                            email: true,
                            push: true
                        }
                    }
                },
                stats: userProfile ? {
                    posts: userProfile.stats?.posts || 0,
                    followers: userProfile.stats?.followers || 0,
                    following: userProfile.stats?.following || 0
                } : {
                    posts: 0,
                    followers: 0,
                    following: 0
                }
            };

            return response;
        } catch (error) {
            logger.error('Error fetching user by ID:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

    async getUserByMobNumber(mobNumber, options = {}, projection = {}) {
        try {
            options.mobNumber = mobNumber;
            options.isActive = true;
            return await User.findOne(options).select(projection);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user by email
     * @param {string} email - Email
     * @returns {Promise<Object>}
     */
    async getUserByEmail(email) {
        try {
            const userCredentials = await UserCredentials.findOne({ email })
                .select('-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires');
            
            if (!userCredentials) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            const userProfile = await UserProfile.findOne({ userId: userCredentials._id });

            return {
                id: userCredentials._id,
                username: userCredentials.username,
                email: userCredentials.email,
                role: userCredentials.role,
                isEmailVerified: userCredentials.emailVerified,
                isActive: userCredentials.isActive,
                profile: userProfile ? {
                    displayName: userProfile.displayName,
                    bio: userProfile.bio,
                    avatar: userProfile.avatar,
                    coverImage: userProfile.coverImage,
                    location: userProfile.location,
                    socialLinks: userProfile.socialLinks,
                    preferences: userProfile.preferences,
                    stats: userProfile.stats
                } : null
            };
        } catch (error) {
            logger.error('Error fetching user by email:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

    /**
     * Update user by ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>}
     */
    async updateUser(userId, updateData) {
        try {
            // Separate credentials and profile data
            const { username, email, password, ...profileData } = updateData;

            // Update credentials if provided
            if (username || email || password) {
                const credentialsUpdate = {};
                if (username) credentialsUpdate.username = username;
                if (email) credentialsUpdate.email = email;
                if (password) credentialsUpdate.password = password;

                const userCredentials = await UserCredentials.findByIdAndUpdate(
                    userId,
                    { ...credentialsUpdate, updatedAt: Date.now() },
                    { new: true, runValidators: true }
                ).select('-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires');

                if (!userCredentials) {
                    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
                }
            }

            // Update profile if provided
            if (Object.keys(profileData).length > 0) {
                // Handle nested preferences update
                if (profileData.preferences) {
                    const { notifications, ...otherPreferences } = profileData.preferences;
                    if (notifications) {
                        profileData.preferences = {
                            ...otherPreferences,
                            emailNotifications: notifications.email,
                            pushNotifications: notifications.push
                        };
                    }
                }

                const userProfile = await UserProfile.findOneAndUpdate(
                    { userId },
                    { ...profileData, updatedAt: Date.now() },
                    { new: true, upsert: true }
                );

                if (!userProfile) {
                    throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
                }
            }

            // Get updated user data
            return await this.getUserById(userId);
        } catch (error) {
            logger.error('Error updating user:', error);
            if (error instanceof ApiError) throw error;
            if (error.code === 11000) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Username or email already exists');
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating user');
        }
    }

    async updateByMobNumber(mobNumber, userData) {
        try {
            // Check if the document with mobNumber exists in the database
            const existingUser = await User.findOne({ mobNumber });

            // If an existing document is found, use its _id
            if (existingUser) {
                userData._id = existingUser._id;
            } else {
                // If no existing document is found, generate a new _id
                userData._id = await utils.uuid('u-');
            }

            const options = { new: true, upsert: true };
            const filter = { mobNumber };
            const update = {
                $set: userData,
            };

            // Use findOneAndUpdate to get the updated document
            const updatedUser = await User.findOneAndUpdate(filter, update, options);

            if (updatedUser) {
                return updatedUser;
            }

            throw new Error('Failed to update or upsert user data');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete user by ID
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteUser(userId) {
        try {
            // Delete user profile
            await UserProfile.findOneAndDelete({ userId });

            // Delete user credentials
            const userCredentials = await UserCredentials.findByIdAndDelete(userId);
            if (!userCredentials) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }
        } catch (error) {
            logger.error('Error deleting user:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error deleting user');
        }
    }

    /**
     * Get all users with pagination
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getAllUsers(options) {
        try {
            const { page = 1, limit = 10, sortBy = '-createdAt' } = options;

            // Get paginated user credentials
            const userCredentials = await UserCredentials.paginate(
                {},
                {
                    page,
                    limit,
                    sort: sortBy,
                    select: '-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires'
                }
            );

            // Get profiles for all users
            const userIds = userCredentials.docs.map(user => user._id);
            const profiles = await UserProfile.find({ userId: { $in: userIds } });

            // Combine credentials and profiles
            const users = userCredentials.docs.map(user => {
                const profile = profiles.find(p => p.userId.toString() === user._id.toString());
                return {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isEmailVerified: user.emailVerified,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    profile: profile ? {
                        displayName: profile.displayName,
                        bio: profile.bio,
                        avatar: profile.avatar,
                        coverImage: profile.coverImage,
                        location: profile.location,
                        socialLinks: profile.socialLinks,
                        preferences: profile.preferences,
                        stats: profile.stats
                    } : null
                };
            });

            return {
                ...userCredentials,
                docs: users
            };
        } catch (error) {
            logger.error('Error fetching users:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching users');
        }
    }

    async getUserByVerificationToken(token) {
        return await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: new Date() } });
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile data
     * @returns {Promise<Object>}
     */
    async updateUserProfile(userId, profileData) {
        try {
            const userProfile = await UserProfile.findOneAndUpdate(
                { userId },
                { ...profileData, updatedAt: Date.now() },
                { new: true, upsert: true }
            );

            if (!userProfile) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Profile not found');
            }

            return {
                id: userId,
                profile: {
                    displayName: userProfile.displayName,
                    bio: userProfile.bio,
                    avatar: userProfile.avatar,
                    coverImage: userProfile.coverImage,
                    location: userProfile.location,
                    socialLinks: userProfile.socialLinks,
                    preferences: userProfile.preferences,
                    stats: userProfile.stats
                }
            };
        } catch (error) {
            logger.error('Error updating user profile:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error updating profile');
        }
    }

    /**
     * Get user by username or email
     * @param {string} identifier - Username or email
     * @returns {Promise<User>}
     */
    async getUserByIdentifier(identifier) {
        try {
            // Check if identifier is email (contains @)
            const isEmail = identifier.includes('@');
            
            if (isEmail) {
                return await User.findOne({ email: identifier });
            } else {
                return await User.findOne({ username: identifier });
            }
        } catch (error) {
            logger.error('Error fetching user by identifier:', error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user');
        }
    }

    /**
     * Get public user profile
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getPublicProfile(userId) {
        try {
            const userCredentials = await UserCredentials.findById(userId)
                .select('username email role isActive');
            
            if (!userCredentials) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            const userProfile = await UserProfile.findOne({ userId });

            return {
                id: userCredentials._id,
                username: userCredentials.username,
                name: userProfile?.displayName || userCredentials.username,
                displayName: userProfile?.displayName || userCredentials.username,
                profilePicture: userProfile?.avatar || '',
                bio: userProfile?.bio || '',
                isCreator: userCredentials.role === 'creator',
                stats: userProfile ? {
                    followers: userProfile.stats.followers || 0,
                    following: userProfile.stats.following || 0,
                    posts: userProfile.stats.posts || 0
                } : {
                    followers: 0,
                    following: 0,
                    posts: 0
                }
            };
        } catch (error) {
            logger.error('Error fetching public profile:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching public profile');
        }
    }

    /**
     * Follow a user
     * @param {string} followerId - Follower's user ID
     * @param {string} followingId - User ID to follow
     * @returns {Promise<Object>}
     */
    async followUser(followerId, followingId) {
        try {
            // Check if users exist
            const [follower, following] = await Promise.all([
                UserProfile.findOne({ userId: followerId }),
                UserProfile.findOne({ userId: followingId })
            ]);

            if (!follower || !following) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            // Check if already following
            const isFollowing = await UserProfile.findOne({
                userId: followerId,
                'following': followingId
            });

            if (isFollowing) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Already following this user');
            }

            // Update follower's following list and following's followers list
            await Promise.all([
                UserProfile.updateOne(
                    { userId: followerId },
                    { $addToSet: { following: followingId } }
                ),
                UserProfile.updateOne(
                    { userId: followingId },
                    { $addToSet: { followers: followerId } }
                )
            ]);

            // Update stats
            await Promise.all([
                UserProfile.updateOne(
                    { userId: followerId },
                    { $inc: { 'stats.following': 1 } }
                ),
                UserProfile.updateOne(
                    { userId: followingId },
                    { $inc: { 'stats.followers': 1 } }
                )
            ]);

            return {
                message: 'Successfully followed user',
                followersCount: following.stats.followers + 1
            };
        } catch (error) {
            logger.error('Error following user:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error following user');
        }
    }

    /**
     * Unfollow a user
     * @param {string} followerId - Follower's user ID
     * @param {string} followingId - User ID to unfollow
     * @returns {Promise<Object>}
     */
    async unfollowUser(followerId, followingId) {
        try {
            // Check if users exist
            const [follower, following] = await Promise.all([
                UserProfile.findOne({ userId: followerId }),
                UserProfile.findOne({ userId: followingId })
            ]);

            if (!follower || !following) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            // Check if following
            const isFollowing = await UserProfile.findOne({
                userId: followerId,
                'following': followingId
            });

            if (!isFollowing) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Not following this user');
            }

            // Update follower's following list and following's followers list
            await Promise.all([
                UserProfile.updateOne(
                    { userId: followerId },
                    { $pull: { following: followingId } }
                ),
                UserProfile.updateOne(
                    { userId: followingId },
                    { $pull: { followers: followerId } }
                )
            ]);

            // Update stats
            await Promise.all([
                UserProfile.updateOne(
                    { userId: followerId },
                    { $inc: { 'stats.following': -1 } }
                ),
                UserProfile.updateOne(
                    { userId: followingId },
                    { $inc: { 'stats.followers': -1 } }
                )
            ]);

            return {
                message: 'Successfully unfollowed user',
                followersCount: following.stats.followers - 1
            };
        } catch (error) {
            logger.error('Error unfollowing user:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error unfollowing user');
        }
    }

    /**
     * Get user's followers
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getFollowers(userId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            const followers = await UserProfile.find({ userId: { $in: userProfile.followers } })
                .select('userId displayName avatar')
                .skip(skip)
                .limit(limit);

            const total = userProfile.followers.length;

            // Get user credentials for each follower
            const followersWithDetails = await Promise.all(
                followers.map(async (follower) => {
                    const userCred = await UserCredentials.findById(follower.userId)
                        .select('username role');
                    return {
                        id: follower.userId,
                        name: follower.displayName || userCred.username,
                        profilePicture: follower.avatar || '',
                        isFollowing: userProfile.following.includes(follower.userId)
                    };
                })
            );

            return {
                items: followersWithDetails,
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error fetching followers:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching followers');
        }
    }

    /**
     * Get users that the user is following
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getFollowing(userId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            const following = await UserProfile.find({ userId: { $in: userProfile.following } })
                .select('userId displayName avatar')
                .skip(skip)
                .limit(limit);

            const total = userProfile.following.length;

            // Get user credentials for each following user
            const followingWithDetails = await Promise.all(
                following.map(async (followed) => {
                    const userCred = await UserCredentials.findById(followed.userId)
                        .select('username role');
                    return {
                        id: followed.userId,
                        name: followed.displayName || userCred.username,
                        profilePicture: followed.avatar || '',
                        isFollowing: true
                    };
                })
            );

            return {
                items: followingWithDetails,
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error fetching following users:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching following users');
        }
    }

    /**
     * Get user's feed
     * @param {string} userId - User ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>}
     */
    async getUserFeed(userId, options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const skip = (page - 1) * limit;

            const userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }

            // Get posts from followed users
            const followingIds = userProfile.following;
            followingIds.push(userId); // Include user's own posts

            // Get media posts
            const mediaPosts = await Media.find({
                creatorId: { $in: followingIds },
                status: 'published'
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('creatorId', 'username displayName avatar');

            // Get blog posts
            const blogPosts = await Blog.find({
                authorId: { $in: followingIds },
                status: 'published'
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('authorId', 'username displayName avatar');

            // Combine and sort posts
            const feed = [
                ...mediaPosts.map(post => ({
                    type: 'media',
                    content: {
                        id: post._id,
                        title: post.title,
                        description: post.description,
                        thumbnail: post.thumbnail,
                        views: post.views,
                        likes: post.likes,
                        comments: post.comments,
                        shares: post.shares,
                        duration: post.duration,
                        tags: post.tags,
                        category: post.category,
                        creator: {
                            id: post.creatorId._id,
                            name: post.creatorId.displayName || post.creatorId.username,
                            profilePicture: post.creatorId.avatar
                        },
                        createdAt: post.createdAt
                    }
                })),
                ...blogPosts.map(post => ({
                    type: 'blog',
                    content: {
                        id: post._id,
                        title: post.title,
                        content: post.content,
                        author: {
                            id: post.authorId._id,
                            name: post.authorId.displayName || post.authorId.username,
                            profilePicture: post.authorId.avatar
                        },
                        tags: post.tags,
                        likes: post.likes,
                        comments: post.comments,
                        shares: post.shares,
                        readTime: post.readTime,
                        status: post.status,
                        createdAt: post.createdAt
                    }
                }))
            ].sort((a, b) => b.content.createdAt - a.content.createdAt);

            const total = await Promise.all([
                Media.countDocuments({ creatorId: { $in: followingIds }, status: 'published' }),
                Blog.countDocuments({ authorId: { $in: followingIds }, status: 'published' })
            ]).then(([mediaCount, blogCount]) => mediaCount + blogCount);

            return {
                items: feed,
                total,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error fetching user feed:', error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error fetching user feed');
        }
    }

}

module.exports = new UserService();
