const VideoView = require('../models/videoView.model');
const viewEventService = require('./viewEvent.service');

async function incrementViewCountInDb(videoId) {
  const doc = await VideoView.findOneAndUpdate(
    { videoId },
    { $inc: { views: 1 } },
    { new: true, upsert: true }
  ).lean();
  return { views: doc.views };
}

async function queueViewIncrement(videoId) {
  await viewEventService.publishViewIncrement(videoId);
  return { queued: true };
}

async function getViewCount(videoId) {
  const doc = await VideoView.findOne({ videoId }).lean();
  return doc ? doc.views : 0;
}

async function getViewCounts(videoIds) {
  const docs = await VideoView.find({ videoId: { $in: videoIds } }).lean();
  const map = {};
  docs.forEach((d) => {
    map[d.videoId.toString()] = d.views;
  });
  return map;
}

module.exports = {
  incrementViewCountInDb,
  queueViewIncrement,
  getViewCount,
  getViewCounts,
};
