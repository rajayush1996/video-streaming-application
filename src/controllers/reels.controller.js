const reelsService = require('../services/reels.service');
const httpStatus = require('http-status');
const pick = require('../utils/pick');
const logger = require('../features/logger');

/**
 * @swagger
 * /api/v1/reels:
 *   get:
 *     summary: Get all reels with pagination
 *     tags: [Reels]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Reel title
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Reel category
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID who uploaded the reel
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Reel status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort by field (e.g., createdAt:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of reels
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       '200':
 *         description: List of reels with pagination
 */
exports.getAllReels = async (req, res, next) => {
    try {
        // Extract query parameters
        const filter = pick(req.query, ['title', 'category', 'userId', 'status']);
        const options = pick(req.query, ['sortBy', 'limit', 'page']);
        
        logger.info('Fetching reels with filters:', filter);
        
        const result = await reelsService.getAllReels(filter, options);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: 'Reels fetched successfully',
            data: result
        });
    } catch (error) {
        logger.error('Error fetching reels:', error);
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/reels/{id}:
 *   get:
 *     summary: Get a reel by ID
 *     tags: [Reels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel ID
 *     responses:
 *       '200':
 *         description: Reel details
 *       '404':
 *         description: Reel not found
 */
exports.getReelById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        logger.info(`Fetching reel with ID: ${id}`);
        
        const reel = await reelsService.getReelById(id);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: 'Reel fetched successfully',
            data: reel
        });
    } catch (error) {
        logger.error(`Error fetching reel with ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/reels/{id}:
 *   patch:
 *     summary: Update a reel
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       '200':
 *         description: Updated reel
 *       '404':
 *         description: Reel not found
 */
exports.updateReel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        logger.info(`Updating reel with ID: ${id}`);
        
        const updatedReel = await reelsService.updateReel(id, updateData);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: 'Reel updated successfully',
            data: updatedReel
        });
    } catch (error) {
        logger.error(`Error updating reel with ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/reels/{id}:
 *   delete:
 *     summary: Soft delete a reel
 *     tags: [Reels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel ID
 *     responses:
 *       '200':
 *         description: Reel deleted successfully
 *       '404':
 *         description: Reel not found
 */
exports.softDeleteReel = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        logger.info(`Soft deleting reel with ID: ${id}`);
        
        const result = await reelsService.softDeleteReel(id);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: 'Reel deleted successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Error deleting reel with ID ${req.params.id}:`, error);
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/reels/{id}/view:
 *   put:
 *     summary: Increment view count for a reel
 *     tags: [Reels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reel ID
 *     responses:
 *       '200':
 *         description: View count incremented
 *       '404':
 *         description: Reel not found
 */
exports.incrementViewCount = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        logger.info(`Incrementing view count for reel with ID: ${id}`);
        
        // Call the media metadata service for view increment
        const mediaMetaService = require('../services/mediaMeta.service');
        const result = await mediaMetaService.incrementViewCount(id);
        
        return res.status(httpStatus.OK).json({
            success: true,
            message: 'Reel view count incremented successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Error incrementing view count for reel with ID ${req.params.id}:`, error);
        next(error);
    }
}; 