export const apiKeyMiddleware = (req, res, next) => {
  const clientKey = req.header("x-api-key");
  if (!clientKey) return res.status(401).json({ error: "API key missing" });

  let apiKeys;
  try {
    apiKeys = JSON.parse(process.env.API_KEYS);
  } catch (err) {
    return res.status(500).json({ error: "API key parsing error" });
  }

  const client = Object.keys(apiKeys).find(
    key => apiKeys[key] === clientKey
  );

  if (!client) return res.status(403).json({ error: "Invalid API key" });

  // Add the client identity to the request
  req.clientId = client;

  next();
};
