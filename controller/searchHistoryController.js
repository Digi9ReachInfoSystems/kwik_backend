const SearchHistory = require("../models/searchHistory_model");

// Get Search History by User ID
exports.getSearchHistoryByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const history = await SearchHistory.find({ user_id: userId }).sort({ timestamp: -1 });

    if (!history.length) {
      return res.status(404).json({ message: "No search history found for this user" });
    }

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching search history by user ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Search History
exports.getAllSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find().sort({ timestamp: -1 });

    if (!history.length) {
      return res.status(404).json({ message: "No search history records found" });
    }

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching all search history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Recent Search History for a Specific User (Latest 5 Searches)
exports.getRecentSearchHistoryByUserId = async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 5; // Default to 5 recent searches
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      const history = await SearchHistory.find({ user_id: userId })
        .sort({ timestamp: -1 }) // Sort by latest searches
        .limit(limit); // Limit the number of results
  
      if (!history.length) {
        return res.status(404).json({ message: "No recent search history found for this user" });
      }
  
      res.status(200).json(history);
    } catch (error) {
      console.error("Error fetching recent search history:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  // Get Global Recent Searches (Latest 10 Searches)
  exports.getGlobalRecentSearches = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10; // Default to 10 most recent searches
  
      const history = await SearchHistory.find()
        .sort({ timestamp: -1 }) // Latest searches first
        .limit(limit);
  
      if (!history.length) {
        return res.status(404).json({ message: "No recent search history found" });
      }
  
      res.status(200).json(history);
    } catch (error) {
      console.error("Error fetching global recent searches:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  


