const UserCredentials = require('../../models/userCredentials.model');
const UserProfile = require('../../models/userProfile.model');
const logger = require('../../features/logger');

const adminUsers = [
    {
        credentials: {
            username: 'superadmin',
            email: 'superadmin@vsa.com',
            password: 'SuperAdmin@2024',
            role: 'admin',
            status: 'active',
            emailVerified: true,
            isEmailVerified: true
        },
        profile: {
            displayName: 'Super Administrator',
            bio: 'System Super Administrator',
            location: 'Headquarters',
            preferences: {
                emailNotifications: true,
                pushNotifications: true,
                theme: 'dark',
                language: 'en'
            }
        }
    },
    {
        credentials: {
            username: 'admin',
            email: 'admin@vsa.com',
            password: 'Admin@123',
            role: 'admin',
            status: 'active',
            emailVerified: true,
            isEmailVerified: true
        },
        profile: {
            displayName: 'System Administrator',
            bio: 'System Administrator',
            location: 'Headquarters',
            preferences: {
                emailNotifications: true,
                pushNotifications: true,
                theme: 'dark',
                language: 'en'
            }
        }
    }
];

async function seedAdminUsers() {
    try {
        // Check if admin users already exist
        const existingAdmins = await UserCredentials.countDocuments({ role: 'admin' });
        if (existingAdmins > 0) {
            logger.info('Admin users already exist, skipping seed');
            return;
        }

        logger.info('Starting to seed admin users...');

        for (const adminData of adminUsers) {
            // Create admin credentials
            const adminCredential = await UserCredentials.create(adminData.credentials);

            // Create admin profile with reference to credentials
            await UserProfile.create({
                ...adminData.profile,
                userId: adminCredential._id
            });

            logger.info(`Created admin user: ${adminData.credentials.username}`);
        }

        logger.info('Admin user seeding completed successfully');
    } catch (error) {
        logger.error('Error seeding admin users:', error);
        throw error;
    }
}

module.exports = {
    seedAdminUsers
}; 