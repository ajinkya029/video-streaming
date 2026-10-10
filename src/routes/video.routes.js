const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const Video = require("../models/Video");
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth.middleware");
const { uploadVideo } = require("../middleware/upload.middleware");
const asyncHandler = require("../utils/asyncHandler");

const upload = (req, res, next) => uploadVideo(req, res, (err) => err ? next(err) : next());

router.get("/", asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const filter = { visibility: "public" };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  if (req.query.owner) filter.owner = req.query.owner;
  const [videos, total] = await Promise.all([
    Video.find(filter).select("-filename").populate("owner", "username avatarUrl")
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Video.countDocuments(filter)
  ]);
  res.json({ videos, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));

router.post("/", protect, upload, asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Attach a video file using the 'video' field." });
  const title = String(req.body.title || "").trim();
  if (!title) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: "Video title is required." });
  }
  let tags = [];
  try { tags = req.body.tags ? JSON.parse(req.body.tags) : []; } catch { tags = String(req.body.tags).split(","); }
  if (!Array.isArray(tags)) tags = [];
  const video = await Video.create({
    title,
    description: req.body.description || "",
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    thumbnailUrl: req.body.thumbnailUrl || "",
    tags: tags.map(String).map(s => s.trim()).filter(Boolean).slice(0, 20),
    visibility: req.body.visibility === "unlisted" ? "unlisted" : "public",
    owner: req.user._id
  });
  res.status(201).json({ video });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).select("-filename")
    .populate("owner", "username avatarUrl");
  if (!video || video.visibility !== "public") return res.status(404).json({ message: "Video not found." });
  res.json({ video });
}));

// Supports HTTP byte ranges so HTML5 video players can seek without downloading the whole file.
router.get("/:id/stream", asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video || video.visibility !== "public") return res.status(404).json({ message: "Video not found." });
  const filePath = path.resolve(process.env.UPLOAD_DIR || "uploads", video.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Video file is missing from storage." });
  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  res.setHeader("Content-Type", video.mimeType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");

  if (!range) {
    res.setHeader("Content-Length", stat.size);
    res.status(200);
    fs.createReadStream(filePath).pipe(res);
    Video.updateOne({ _id: video._id }, { $inc: { views: 1 } }).exec().catch(() => {});
    return;
  }

  const parts = range.replace(/bytes=/, "").split("-");
  const start = Number.parseInt(parts[0], 10);
  const end = parts[1] ? Number.parseInt(parts[1], 10) : stat.size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= stat.size) {
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    return res.status(416).end();
  }
  const safeEnd = Math.min(end, stat.size - 1);
  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${safeEnd}/${stat.size}`);
  res.setHeader("Content-Length", safeEnd - start + 1);
  fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
  Video.updateOne({ _id: video._id }, { $inc: { views: 1 } }).exec().catch(() => {});
}));

router.patch("/:id", protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: "Video not found." });
  if (!video.owner.equals(req.user._id)) return res.status(403).json({ message: "You can only edit your own videos." });
  for (const field of ["title", "description", "thumbnailUrl"]) {
    if (req.body[field] !== undefined) video[field] = req.body[field];
  }
  if (req.body.visibility && ["public", "unlisted"].includes(req.body.visibility)) video.visibility = req.body.visibility;
  if (req.body.tags !== undefined && Array.isArray(req.body.tags)) video.tags = req.body.tags.slice(0, 20);
  await video.save();
  res.json({ video });
}));

router.delete("/:id", protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: "Video not found." });
  if (!video.owner.equals(req.user._id)) return res.status(403).json({ message: "You can only delete your own videos." });
  const filePath = path.resolve(process.env.UPLOAD_DIR || "uploads", video.filename);
  await Promise.all([Comment.deleteMany({ video: video._id }), video.deleteOne()]);
  fs.unlink(filePath, () => {});
  res.json({ message: "Video deleted." });
}));

router.post("/:id/like", protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video || video.visibility !== "public") return res.status(404).json({ message: "Video not found." });
  const index = video.likes.findIndex(id => id.equals(req.user._id));
  if (index >= 0) video.likes.splice(index, 1); else video.likes.push(req.user._id);
  await video.save();
  res.json({ liked: index < 0, likesCount: video.likes.length });
}));

router.get("/:id/comments", asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).select("_id visibility");
  if (!video || video.visibility !== "public") return res.status(404).json({ message: "Video not found." });
  const comments = await Comment.find({ video: video._id }).populate("user", "username avatarUrl").sort({ createdAt: -1 }).limit(100);
  res.json({ comments });
}));

router.post("/:id/comments", protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video || video.visibility !== "public") return res.status(404).json({ message: "Video not found." });
  if (!String(req.body.text || "").trim()) return res.status(400).json({ message: "Comment text is required." });
  const comment = await Comment.create({ video: video._id, user: req.user._id, text: req.body.text });
  await comment.populate("user", "username avatarUrl");
  res.status(201).json({ comment });
}));

module.exports = router;
