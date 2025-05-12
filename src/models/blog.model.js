const mongoose = require("mongoose");
const { toJSON, paginate } = require('./plugins')
const utils = require('../utils/utils');


const blogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        content: { type: String, required: true },
        admin: { type: String, ref: "UserCredentials", required: true }, // Admin who created/approved the blog
        category: { 
            type: String, 
            required: true,
        },
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        publishDate: { type: Date },
        deletedAt: { type: Date, default: null },
        description: { type: String, required: true, trim: true, maxlength: 300 },
    },
    { timestamps: true, versionKey: false, } // Automatically adds createdAt & updatedAt
);

// Add query middleware to exclude soft-deleted blogs by default
blogSchema.pre(/^find/, function(next) {
    if (!this.getQuery().includeDeleted) {
        this.where({ deletedAt: null });
    }
    next();
});

blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);


// Pre-save hook to generate UUID and set admin
blogSchema.pre('save', async function (next) {
    const blog = this;

    // Generate UUID if _id is not present
    if (!blog._id) {
        blog._id = utils.uuid('bl-');
    }

    next();
});

/**
 * @typedef Blog
 */
module.exports = mongoose.model("Blog", blogSchema);
