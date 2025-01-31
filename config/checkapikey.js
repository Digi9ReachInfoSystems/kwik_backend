require("dotenv").config();

const checkApiKey = (req, res, next) => {
  const apiKey = req.headers["api_key"];
  const apiSecret = req.headers["api_secret"];

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: "API key and secret are required" });
  }

  if (apiKey !== process.env.APIKEY || apiSecret !== process.env.APISECRET) {
    return res.status(403).json({ error: "Invalid API key or secret" });
  }

  next(); // Proceed to the next middleware or route handler
};

module.exports = checkApiKey;
