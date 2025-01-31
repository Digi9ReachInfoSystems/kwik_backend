const express = require("express");
const { getAllSearchHistory, getSearchHistoryByUserId, getRecentSearchHistoryByUserId, getGlobalRecentSearches } = require("../controller/searchHistoryController");
const router = express.Router();


router.get("/allsearchhistory", getAllSearchHistory)
router.get("/:userId", getSearchHistoryByUserId)
router.get("/getRecentSearchHistory/:userId", getRecentSearchHistoryByUserId)
router.get("/getGlobalSearchHistory/:userId", getGlobalRecentSearches)

module.exports = router;