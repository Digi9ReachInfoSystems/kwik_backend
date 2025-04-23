const { storage } = require("../config/firebase");


exports.uploadFileToFirebase = async (buffer, originalName, mimetype) => {
    const timestamp = Date.now();
    const remotePath = `csv-uploads/${timestamp}_${originalName}`;
    const file = storage.file(remotePath);
    const result = await file.save(buffer, {
        metadata: { contentType: mimetype },
        public: true,
        validation: 'md5'
    });
    console.log("result", result);
    return `https://storage.googleapis.com/${storage.name}/${remotePath}`;
}