const NOTIFICATION_TYPES = {
    // Creator related
    CREATOR_REQUEST: 'creator_request',
    CREATOR_APPROVED: 'creator_approved',
    CREATOR_REJECTED: 'creator_rejected',
    
    // Content related
    CONTENT_UPLOAD: 'content_upload',
    CONTENT_APPROVED: 'content_approved',
    CONTENT_REJECTED: 'content_rejected',
    
    // Profile related
    PROFILE_UPDATE: 'profile_update',
    PROFILE_VERIFICATION: 'profile_verification',
    
    // Blog related
    BLOG_CREATED: 'blog_created',
    BLOG_APPROVED: 'blog_approved',
    BLOG_REJECTED: 'blog_rejected',
    
    // Media related
    MEDIA_UPLOAD: 'media_upload',
    MEDIA_APPROVED: 'media_approved',
    MEDIA_REJECTED: 'media_rejected',
    
    // System related
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
    SYSTEM_ALERT: 'system_alert'
};

module.exports = NOTIFICATION_TYPES; 