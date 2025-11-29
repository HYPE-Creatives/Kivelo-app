export const logRequests = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        apiClient: req.apiClient?.name || "public",
      })
    );
  });

  next();
};
