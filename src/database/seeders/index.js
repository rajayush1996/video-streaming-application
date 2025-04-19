const { seedAdminUser } = require('./admin.seeder');
const logger = require('../../features/logger');

async function runSeeders() {
    try {
        logger.info('Starting database seeding...');
        
        // Run admin seeder
        await seedAdminUser();
        
        logger.info('Database seeding completed successfully');
    } catch (error) {
        logger.error('Error running seeders:', error);
        throw error;
    }
}

module.exports = {
    runSeeders
}; 