const NotificationTemplate = require('../../models/notificationTemplate.model');
const logger = require('../../features/logger');

/**
 * Seed notification templates for various event types
 */
const seedNotificationTemplates = async () => {
    try {
        // Check if templates already exist
        const count = await NotificationTemplate.countDocuments();
        
        if (count > 0) {
            logger.info('Notification templates already seeded. Skipping.');
            return;
        }
        
        // Content approval template
        await NotificationTemplate.create({
            templateId: 'content-approved',
            eventType: 'content.approved',
            channels: {
                push: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'Content Approved',
                            body: 'Your content "{{contentTitle}}" has been approved!',
                            cta: {
                                text: 'View Content',
                                url: '/content/{{contentId}}'
                            }
                        }
                    }
                },
                email: {
                    enabled: true,
                    content: {
                        en: {
                            subject: 'Your Content Has Been Approved',
                            body: 'Hello {{userName}},\n\nGreat news! Your content "{{contentTitle}}" has been approved and is now live on the platform.\n\nThank you for contributing quality content to our community.\n\nBest regards,\nThe Team',
                            htmlTemplate: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                  <h2>Content Approved!</h2>
                                  <p>Hello {{userName}},</p>
                                  <p>Great news! Your content <strong>"{{contentTitle}}"</strong> has been approved and is now live on the platform.</p>
                                  <p>Thank you for contributing quality content to our community.</p>
                                  <p><a href="{{baseUrl}}/content/{{contentId}}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">View Your Content</a></p>
                                  <p>Best regards,<br>The Team</p>
                                </div>
                            `
                        }
                    }
                },
                inApp: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'Content Approved',
                            body: 'Your content "{{contentTitle}}" has been approved and is now live!',
                            cta: {
                                text: 'View Content',
                                url: '/content/{{contentId}}'
                            }
                        }
                    }
                }
            },
            metadata: {
                priority: 'high',
                category: 'content',
                ttl: 2592000 // 30 days in seconds
            },
            active: true
        });
        
        // Content rejection template
        await NotificationTemplate.create({
            templateId: 'content-rejected',
            eventType: 'content.rejected',
            channels: {
                push: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'Content Rejected',
                            body: 'Your content "{{contentTitle}}" has been rejected: {{rejectionReason}}',
                            cta: {
                                text: 'Learn More',
                                url: '/content/{{contentId}}'
                            }
                        }
                    }
                },
                email: {
                    enabled: true,
                    content: {
                        en: {
                            subject: 'Your Content Submission Update',
                            body: 'Hello {{userName}},\n\nWe regret to inform you that your content "{{contentTitle}}" has been rejected.\n\nReason: {{rejectionReason}}\n\nPlease review our content guidelines and feel free to submit again.\n\nBest regards,\nThe Team',
                            htmlTemplate: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                  <h2>Content Update</h2>
                                  <p>Hello {{userName}},</p>
                                  <p>We regret to inform you that your content <strong>"{{contentTitle}}"</strong> has been rejected.</p>
                                  <p><strong>Reason:</strong> {{rejectionReason}}</p>
                                  <p>Please review our content guidelines and feel free to submit again.</p>
                                  <p>Best regards,<br>The Team</p>
                                </div>
                            `
                        }
                    }
                },
                inApp: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'Content Rejected',
                            body: 'Your content "{{contentTitle}}" has been rejected: {{rejectionReason}}',
                            cta: {
                                text: 'Learn More',
                                url: '/content/{{contentId}}'
                            }
                        }
                    }
                }
            },
            metadata: {
                priority: 'high',
                category: 'content',
                ttl: 2592000 // 30 days in seconds
            },
            active: true
        });
        
        // New comment template
        await NotificationTemplate.create({
            templateId: 'new-comment',
            eventType: 'content.newComment',
            channels: {
                push: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'New Comment',
                            body: '{{senderName}} commented on your content: "{{commentText}}"',
                            cta: {
                                text: 'View Comment',
                                url: '/content/{{contentId}}?comment={{commentId}}'
                            }
                        }
                    }
                },
                email: {
                    enabled: true,
                    content: {
                        en: {
                            subject: 'New Comment on Your Content',
                            body: 'Hello {{userName}},\n\n{{senderName}} left a comment on your content "{{contentTitle}}":\n\n"{{commentText}}"\n\nClick here to respond: {{baseUrl}}/content/{{contentId}}?comment={{commentId}}\n\nBest regards,\nThe Team',
                            htmlTemplate: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                  <h2>New Comment</h2>
                                  <p>Hello {{userName}},</p>
                                  <p><strong>{{senderName}}</strong> left a comment on your content "{{contentTitle}}":</p>
                                  <div style="padding: 10px; background-color: #f5f5f5; border-left: 4px solid #ccc; margin: 15px 0;">
                                    <p style="font-style: italic;">"{{commentText}}"</p>
                                  </div>
                                  <p><a href="{{baseUrl}}/content/{{contentId}}?comment={{commentId}}" style="background-color: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Respond to Comment</a></p>
                                  <p>Best regards,<br>The Team</p>
                                </div>
                            `
                        }
                    }
                },
                inApp: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'New Comment',
                            body: '{{senderName}} commented on your content: "{{commentText}}"',
                            cta: {
                                text: 'View Comment',
                                url: '/content/{{contentId}}?comment={{commentId}}'
                            }
                        }
                    }
                }
            },
            metadata: {
                priority: 'medium',
                category: 'user',
                ttl: 1209600 // 14 days in seconds
            },
            active: true
        });
        
        // New follower template
        await NotificationTemplate.create({
            templateId: 'new-follower',
            eventType: 'user.newFollower',
            channels: {
                push: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'New Follower',
                            body: '{{senderName}} started following you',
                            cta: {
                                text: 'View Profile',
                                url: '/profile/{{senderId}}'
                            }
                        }
                    }
                },
                email: {
                    enabled: true,
                    content: {
                        en: {
                            subject: 'You Have a New Follower',
                            body: 'Hello {{userName}},\n\n{{senderName}} is now following you on our platform.\n\nCheck out their profile here: {{baseUrl}}/profile/{{senderId}}\n\nBest regards,\nThe Team',
                            htmlTemplate: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                  <h2>New Follower!</h2>
                                  <p>Hello {{userName}},</p>
                                  <p><strong>{{senderName}}</strong> is now following you on our platform.</p>
                                  <p><a href="{{baseUrl}}/profile/{{senderId}}" style="background-color: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">View Profile</a></p>
                                  <p>Best regards,<br>The Team</p>
                                </div>
                            `
                        }
                    }
                },
                inApp: {
                    enabled: true,
                    content: {
                        en: {
                            title: 'New Follower',
                            body: '{{senderName}} started following you',
                            cta: {
                                text: 'View Profile',
                                url: '/profile/{{senderId}}'
                            }
                        }
                    }
                }
            },
            metadata: {
                priority: 'medium',
                category: 'user',
                ttl: 1209600 // 14 days in seconds
            },
            active: true
        });
        
        // System announcement template
        await NotificationTemplate.create({
            templateId: 'system-announcement',
            eventType: 'system.announcement',
            channels: {
                push: {
                    enabled: true,
                    content: {
                        en: {
                            title: '{{announcementTitle}}',
                            body: '{{announcementBody}}',
                            cta: {
                                text: 'Learn More',
                                url: '{{announcementUrl}}'
                            }
                        }
                    }
                },
                email: {
                    enabled: true,
                    content: {
                        en: {
                            subject: '{{announcementTitle}}',
                            body: 'Hello {{userName}},\n\n{{announcementBody}}\n\nFor more information, visit: {{announcementUrl}}\n\nBest regards,\nThe Team',
                            htmlTemplate: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                  <h2>{{announcementTitle}}</h2>
                                  <p>Hello {{userName}},</p>
                                  <p>{{announcementBody}}</p>
                                  <p><a href="{{announcementUrl}}" style="background-color: #4285F4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Learn More</a></p>
                                  <p>Best regards,<br>The Team</p>
                                </div>
                            `
                        }
                    }
                },
                inApp: {
                    enabled: true,
                    content: {
                        en: {
                            title: '{{announcementTitle}}',
                            body: '{{announcementBody}}',
                            cta: {
                                text: 'Learn More',
                                url: '{{announcementUrl}}'
                            }
                        }
                    }
                }
            },
            metadata: {
                priority: 'medium',
                category: 'system',
                ttl: 2592000 // 30 days in seconds
            },
            active: true
        });
        
        logger.info('Notification templates seeded successfully');
    } catch (error) {
        logger.error('Error seeding notification templates:', error);
        throw error;
    }
};

module.exports = seedNotificationTemplates; 