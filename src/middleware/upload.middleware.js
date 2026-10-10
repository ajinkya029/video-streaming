const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"
]);
const maxBytes = Number(process.env.MAX_VIDEO_SIZE_MB || 500) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  if (!allowedMimeTypes.has(file.mimetype)) return cb(new Error("Unsupported video format."));
  cb(null, true);
}

const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxBytes, files: 1 }
}).single("video");

module.exports = { uploadVideo };
