const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['videos', 'blogs', 'reels'], required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: true });

categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

module.exports = mongoose.model('Category', categorySchema);
