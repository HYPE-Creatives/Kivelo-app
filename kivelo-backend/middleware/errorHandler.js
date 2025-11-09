const errorHandler = (error, req, res, next) => {
  console.error('Error handler caught:', error);

  // Handle cases where error is completely undefined
  if (!error) {
    return res.status(500).json({
      message: 'Unknown error occurred'
    });
  }

  const errorMessage = error.message || '';
  const errorCode = error.code;

  // Cloudinary errors
  if (typeof errorMessage === 'string' && errorMessage.includes('Cloudinary')) {
    return res.status(500).json({
      message: 'Image upload failed',
      error: errorMessage
    });
  }

  // Multer errors
  if (errorCode === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large. Maximum size is 5MB'
    });
  }

  if (errorMessage === 'Only image files are allowed!') {
    return res.status(400).json({
      message: 'Only image files are allowed'
    });
  }

  // Use the error's status code if provided, otherwise 500
  const statusCode = error.status || error.statusCode || 500;

  res.status(statusCode).json({
    message: errorMessage || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : errorMessage
  });
};

export default errorHandler;