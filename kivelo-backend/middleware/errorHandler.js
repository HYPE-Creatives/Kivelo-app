const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error handler caught:", err);

  // ========== 1. Handle unexpected undefined errors ==========
  if (!err) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
    });
  }

  // Normalize message and status
  const message = err.message || "Internal server error";
  const status = err.status || err.statusCode || 500;

  // ========== 2. Handle Cloudinary errors ==========
  if (message.includes("Cloudinary")) {
    return res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: process.env.NODE_ENV === "production" ? {} : message,
    });
  }

  // ========== 3. Handle Multer Upload errors ==========
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB",
    });
  }

  if (message === "Only image files are allowed!") {
    return res.status(400).json({
      success: false,
      message: "Only image files are allowed",
    });
  }

  // ========== 4. Handle invalid JSON body (bad request body) ==========
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body",
    });
  }

  // ========== 5. Default server error handler ==========
  return res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "production" ? {} : err.stack,
  });
};

export default errorHandler;
