const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const VideoViewSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoMetadata', unique: true, required: true },
  views: { type: Number, default: 0 },
});

VideoViewSchema.plugin(toJSON);

module.exports = mongoose.model('VideoView', VideoViewSchema);
