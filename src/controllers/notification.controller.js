const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const notificationService = require('../services/notification.service');

const getUserNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  res.status(httpStatus.OK).send(result);
});

const getUnreadCount = catchAsync(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.status(httpStatus.OK).send(result);
});

const markAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user.id);
  res.status(httpStatus.OK).send(result);
});

const deleteNotification = catchAsync(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user.id);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
}; 