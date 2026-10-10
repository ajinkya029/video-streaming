const router = require("express").Router();
const Comment = require("../models/Comment");
const { protect } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

router.delete("/:id", protect, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: "Comment not found." });
  if (!comment.user.equals(req.user._id)) return res.status(403).json({ message: "You can only delete your own comments." });
  await comment.deleteOne();
  res.json({ message: "Comment deleted." });
}));

module.exports = router;
