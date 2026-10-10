function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed.", details: Object.values(err.errors).map(e => e.message) });
  }
  if (err.code === 11000) return res.status(409).json({ message: "That username or email is already in use." });
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ message: "Invalid JSON body." });
  if (err.name === "MulterError") {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Video exceeds the configured upload limit." : err.message });
  }
  if (err.message === "Unsupported video format.") return res.status(415).json({ message: err.message });
  res.status(err.status || 500).json({ message: err.message || "Internal server error." });
}

module.exports = { notFound, errorHandler };
