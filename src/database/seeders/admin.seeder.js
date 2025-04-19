const User = require('../../models/user.model');
const logger = require('../../features/logger');

const adminUser = {
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    email: 'admin@mailinator.com',
    password: 'Admin@123',
    role: 'ADMIN',
    isActive: true
};

async function seedAdminUser() {
    try {
        // Check if admin user already exists
        const existingAdmin = await User.findOne({ 
            $or: [
                { username: adminUser.username },
                { email: adminUser.email }
            ]
        });

        if (existingAdmin) {
            logger.info('Admin user already exists');
            return;
        }

        // Hash password
        

        // Create admin user
        const admin = new User({
            ...adminUser,
            password: adminUser.password
        });

        await admin.save();
        logger.info('Admin user created successfully');
    } catch (error) {
        logger.error('Error seeding admin user:', error);
        throw error;
    }
}

module.exports = {
    seedAdminUser
}; 