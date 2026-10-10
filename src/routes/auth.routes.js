const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth.middleware");

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

router.post("/register", asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: "username, email and password are required." });
  if (String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
  const user = await User.create({ username, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ user, token: signToken(user) });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password are required." });
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid email or password." });
  res.json({ user: user.toJSON(), token: signToken(user) });
}));

router.get("/me", protect, (req, res) => res.json({ user: req.user }));
module.exports = router;
