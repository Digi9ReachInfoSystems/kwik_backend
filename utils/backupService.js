const { storage } = require("../config/firebase");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// const dumpPath = path.join(__dirname, "../dump");
// const archivePath = path.join(__dirname, "../mongo-backup.tar.gz");
const dbUri = process.env.MONGODB_URI; // Replace accordingly
const mongoToolsPath = "C:/mongodb-tools/bin/mongodump.exe";
const mongoDumpPath = "C:/mongodb-tools/bin/mongodump.exe"; // Update path to your mongodump tool
const mongoRestorePath = "C:/mongodb-tools/bin/mongorestore.exe"; // Update path to your mongorestore tool
const tmpDir = os.tmpdir();
const dumpDir = path.join(tmpDir, `dump-${Date.now()}`);
const archivePath = path.join(tmpDir, `mongo-backup-${Date.now()}.tar.gz`);

//local setup

// const backupBaseDir = "D:/mongoDataBackup";

// if (!fs.existsSync(backupBaseDir)) {
//     fs.mkdirSync(backupBaseDir, { recursive: true });
// }
// const dumpDir = `D:/mongoDataBackup/dump-${Date.now()}`;
// const archivePath = `D:/mongoDataBackup/mongo-backup-${Date.now()}.tar.gz`;


exports.backupAndUpload = async () => {
    // console.log("dbUri", `"${mongoDumpPath}" --uri=\"${dbUri}\" --out=${dumpPath}`);
    // // Step 1: Dump MongoDB
    // await new Promise((resolve, reject) => {
    //     // exec(`mongodump --uri="${dbUri}" --out=${dumpPath}`, (err, stdout, stderr) => {
    //     exec(`"${mongoDumpPath}" --uri=${dbUri} --out=\"${dumpPath}\"`, (err, stdout, stderr) => {
    //         if (err) return reject(new Error(stderr));
    //         resolve();
    //     });
    // });

    // // Step 2: Compress
    // await new Promise((resolve, reject) => {
    //     exec(`tar -czf "${archivePath}" -C "${dumpPath}" .`, async (err) => {

    //         if (err) return reject(new Error(err.message));

    //         // Step 3: Upload to Firebase
    //         await storage.upload(archivePath, {
    //             destination: "backups/mongo-backup.tar.gz",
    //             public: false,
    //         });

    //         resolve();
    //     });
    // });
    // Step 1: Dump MongoDB to temp folder
    await new Promise((resolve, reject) => {
        exec(`"${mongoDumpPath}" --uri=${dbUri} --out="${dumpDir}"`, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr));
            resolve();
        });
    });
    // Step 2: Compress to archive in temp
    await new Promise((resolve, reject) => {
        exec(`tar -czf "${archivePath}" -C "${dumpDir}" .`, async (err) => {
            if (err) return reject(new Error(err.message));
            resolve();
        });
    });

    // Step 3: Upload archive to Firebase
    await storage.upload(archivePath, {
        destination: "backups/mongo-backup.tar.gz",
        public: false,
    });
    // Step 4: Clean up temp files
    // fs.rmSync(dumpDir, { recursive: true, force: true });
    // fs.unlinkSync(archivePath);


    // // Step 4: Cleanup
    // fs.rmSync(dumpPath, { recursive: true, force: true });
    // fs.unlinkSync(archivePath);

    return "Backup and upload complete";
};

exports.downloadAndRestore = async () => {
    const dumpDir = path.join(os.tmpdir(), `dump-${Date.now()}`);
    const archivePath = path.join(os.tmpdir(), `mongo-backup-${Date.now()}.tar.gz`);
    const file = storage.file("backups/mongo-backup.tar.gz");
    await new Promise((resolve, reject) => {
        file.createReadStream()
            .pipe(fs.createWriteStream(archivePath))
            .on("finish", resolve)
            .on("error", reject);
    });

    await new Promise((resolve, reject) => {
        exec(`mkdir -p "${dumpDir}" && tar -xzf "${archivePath}" -C "${dumpDir}"`, (err) => {
            if (err) return reject(new Error("Extraction failed: " + err.message));
            resolve();
        });
    });

    await new Promise((resolve, reject) => {
        exec(`"${mongoRestorePath}" --uri="${dbUri}" "${dumpDir}"`, (err, stdout, stderr) => {
            if (err) return reject(new Error("Restore failed: " + stderr));
            resolve("Restore successful");
        });
    });

    fs.rmSync(dumpDir, { recursive: true, force: true });
    fs.unlinkSync(archivePath);


    return "Restore complete";
};
