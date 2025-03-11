const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        author: { type: String, required: true },
        status: { type: String, enum: ["draft", "published"], default: "draft" },
        publishDate: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
