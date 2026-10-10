const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 3, maxlength: 30, unique: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, required: true, select: false },
  avatarUrl: { type: String, default: "" },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  subscribedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

userSchema.set("toJSON", {
  transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; }
});

module.exports = mongoose.model("User", userSchema);
