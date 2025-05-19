const backupService = require("../utils/backupService");

exports.backupToFirebase = async (req, res) => {
  try {
    const result = await backupService.backupAndUpload();
    res.status(200).json({ success: true, message: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.restoreFromFirebase = async (req, res) => {
  try {
    const result = await backupService.downloadAndRestore();
    res.status(200).json({ success: true, message: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
