const mongoose = require("mongoose");
const { toJSON, paginate } = require('./plugins')
const utils = require('../utils/utils');


const blogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        publishDate: { type: Date },
    },
    { timestamps: true, versionKey: false, } // Automatically adds createdAt & updatedAt
);

blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);


// Pre-save hook to hash password before saving user
blogSchema.pre('save', async function (next) {
    const user = this;

    // Generate UUID if _id is not present
    if (!user._id) {
        user._id = utils.uuid('bl-');
    }

    next();
});

/**
 * @typedef Blog
 */
module.exports = mongoose.model("Blog", blogSchema);
