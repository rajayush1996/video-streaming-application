const mongoose = require('mongoose');
const { Schema } = mongoose;
const { paginate, toJSON } = require('./plugins');
const utils = require('../utils');

const PinnedPostSchema = new Schema({
    userId: { type: String, required: true },
    postId: { type: String, ref: 'Feed', required: true },
    pinnedAt: { type: Date, default: Date.now },
    _id: {
        type: String,
        auto: true,
    }

},{
    timestamps: true,
    _id: false
});

PinnedPostSchema.plugin(toJSON);
PinnedPostSchema.plugin(paginate);

PinnedPostSchema.pre('save', async function (next) {
    const pinned = this;
    if (!pinned._id) {
        pinned._id = utils.uuid('pin-');
    }
    next();
});


module.exports = mongoose.model('PinnedPost', PinnedPostSchema);
