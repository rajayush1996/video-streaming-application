const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app'); // Adjust the path to your Express app
const FeedService = require('../../services/feed.service');
const { ApiError } = require('../../features/error');
const { describe, it, expect, jest } = require('@jest/globals');

jest.mock('../../services/feed.service');

describe('FeedController', () => {
    describe('createFeed', () => {
        it('should create a feed successfully', async () => {
            const feedData = { content: 'New Feed' };
            const feedResponse = { id: 1, ...feedData };
            FeedService.createFeed.mockResolvedValue(feedResponse);

            await request(app)
                .post('/feed')
                .send(feedData)
                .expect(httpStatus.CREATED)
                .then(response => {
                    expect(response.body.data).toEqual(feedResponse);
                    expect(response.body.message).toEqual('Feed created successfully');
                });
        });

        it('should handle errors on feed creation', async () => {
            FeedService.createFeed.mockRejectedValue(new ApiError(httpStatus.BAD_REQUEST, 'Error creating feed'));

            await request(app)
                .post('/feed')
                .send({ content: 'New Feed' })
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('getFeedById', () => {
        it('should retrieve a feed by ID', async () => {
            const feed = { id: 1, content: 'Example Feed' };
            FeedService.getFeedById.mockResolvedValue(feed);

            await request(app)
                .get(`/feed/${feed.id}`)
                .expect(httpStatus.OK)
                .then(response => {
                    expect(response.body.data).toEqual(feed);
                    expect(response.body.message).toEqual('Feed by id fetched successfully');
                });
        });

        it('should return 400 if feed not found', async () => {
            FeedService.getFeedById.mockResolvedValue(null);

            await request(app)
                .get('/feed/999')
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('getFeedByUserId', () => {
        it('should retrieve feeds by user ID', async () => {
            const feeds = [{ id: 1, content: 'User Feed', authorId: 123 }];
            FeedService.getAllFeeds.mockResolvedValue(feeds);

            await request(app)
                .get('/feed/user/123')
                .expect(httpStatus.OK)
                .then(response => {
                    expect(response.body.data).toEqual(feeds);
                    expect(response.body.message).toEqual('Feed by id fetched successfully');
                });
        });

        it('should return 400 if no feeds found for the user', async () => {
            FeedService.getAllFeeds.mockResolvedValue([]);

            await request(app)
                .get('/feed/user/999')
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('updateFeed', () => {
        it('should update a feed successfully', async () => {
            const updatedFeed = { id: 1, content: 'Updated Feed' };
            FeedService.updateFeed.mockResolvedValue(updatedFeed);

            await request(app)
                .put('/feed/1')
                .send({ content: 'Updated Feed' })
                .expect(httpStatus.OK)
                .then(response => {
                    expect(response.body.data).toEqual(updatedFeed);
                    expect(response.body.message).toEqual('feed updated successfully!');
                });
        });

        it('should return 400 if the feed to update is not found', async () => {
            FeedService.updateFeed.mockResolvedValue(null);

            await request(app)
                .put('/feed/999')
                .send({ content: 'Updated Feed' })
                .expect(httpStatus.BAD_REQUEST);
        });
    });

    describe('deleteFeed', () => {
        it('should delete a feed successfully', async () => {
            const deletedFeed = { id: 1, content: 'Deleted Feed' };
            FeedService.deleteFeed.mockResolvedValue(deletedFeed);

            await request(app)
                .delete('/feed/1')
                .expect(httpStatus.OK)
                .then(response => {
                    expect(response.body.message).toEqual('Feed deleted successfully');
                    expect(response.body.data).toEqual(deletedFeed);
                });
        });

        it('should return 404 if the feed to delete is not found', async () => {
            FeedService.deleteFeed.mockResolvedValue(null);

            await request(app)
                .delete('/feed/999')
                .expect(404);
        });
    });

    describe('getAllFeeds', () => {
        it('should retrieve all feeds', async () => {
            const feeds = [{ id: 1, content: 'Feed One' }, { id: 2, content: 'Feed Two' }];
            FeedService.getAllFeeds.mockResolvedValue(feeds);

            await request(app)
                .get('/feed')
                .expect(httpStatus.OK)
                .then(response => {
                    expect(response.body.data).toEqual(feeds);
                    expect(response.body.message).toEqual('feeds details fetched succesfully !');
                });
        });

        it('should handle empty feeds list', async () => {
            FeedService.getAllFeeds.mockResolvedValue([]);

            await request(app)
                .get('/feed')
                .expect(httpStatus.OK)
                .then(response => {
                    expect(response.body.data).toEqual([]);
                });
        });
    });
});
