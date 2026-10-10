const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 5000 },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  thumbnailUrl: { type: String, default: "" },
  tags: [{ type: String, trim: true, lowercase: true }],
  visibility: { type: String, enum: ["public", "unlisted"], default: "public" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

videoSchema.index({ title: "text", description: "text", tags: "text" });
module.exports = mongoose.model("Video", videoSchema);
