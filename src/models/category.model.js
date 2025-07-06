const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const auditPlugin = require('./plugins/audit.plugin');
const utils = require('../utils');

const categorySchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['videos', 'blogs', 'reels'], required: true },
    parentId: { type: String, ref: 'Category', default: null },
}, { 
    timestamps: true,
    _id: false // Disable auto _id generation
});

// Generate UUID with prefix before saving
categorySchema.pre('validate', async function(next) {
    if (!this._id) {
        this._id = utils.uuid('c-');
    }
    next();
});

categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);
categorySchema.plugin(auditPlugin, { resourceType: 'CATEGORY' });

// Indexes
categorySchema.index({ name: 1, type: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ type: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
