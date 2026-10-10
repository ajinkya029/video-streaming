const router = require("express").Router();
const User = require("../models/User");
const Video = require("../models/Video");
const { protect } = require("../middleware/auth.middleware");
const asyncHandler = require("../utils/asyncHandler");

router.get("/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("username avatarUrl subscribers createdAt");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user: { ...user.toJSON(), subscriberCount: user.subscribers.length } });
}));

router.get("/:id/videos", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("_id");
  if (!user) return res.status(404).json({ message: "User not found." });
  const videos = await Video.find({ owner: user._id, visibility: "public" })
    .select("-filename").populate("owner", "username avatarUrl").sort({ createdAt: -1 });
  res.json({ videos });
}));

router.post("/:id/subscribe", protect, asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) return res.status(400).json({ message: "You cannot subscribe to yourself." });
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found." });
  const already = target.subscribers.some(id => id.equals(req.user._id));
  if (already) {
    target.subscribers.pull(req.user._id);
    req.user.subscribedTo.pull(target._id);
  } else {
    target.subscribers.addToSet(req.user._id);
    req.user.subscribedTo.addToSet(target._id);
  }
  await Promise.all([target.save(), req.user.save()]);
  res.json({ subscribed: !already, subscriberCount: target.subscribers.length });
}));

module.exports = router;
