const errorHandler = (error, req, res, next) => {
  console.error(error);

  // Cloudinary errors
  if (error.message.includes('Cloudinary')) {
    return res.status(500).json({
      message: 'Image upload failed',
      error: error.message
    });
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large. Maximum size is 5MB'
    });
  }

  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      message: 'Only image files are allowed'
    });
  }

  // Default error
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : error.message
  });
};

export default errorHandler;