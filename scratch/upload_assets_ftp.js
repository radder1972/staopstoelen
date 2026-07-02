const ftp = require("basic-ftp");
const path = require("path");

async function main() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log("Connecting to ftpupload.net via FTP...");
        await client.access({
            host: "ftpupload.net",
            user: "if0_42321955",
            password: "KOMoAe68vp1",
            secure: false
        });
        
        console.log("Connected successfully!");

        // 1. Upload database.json to /htdocs/wp/database.json
        console.log("Uploading database.json to /htdocs/wp/database.json...");
        const localDb = path.join(__dirname, "../database.json");
        await client.uploadFrom(localDb, "/htdocs/wp/database.json");
        console.log("database.json uploaded successfully!");

        // 2. Upload import_all_data.php to /htdocs/wp/import_all_data.php
        console.log("Uploading import_all_data.php to /htdocs/wp/import_all_data.php...");
        const localImporter = path.join(__dirname, "../import_all_data.php");
        await client.uploadFrom(localImporter, "/htdocs/wp/import_all_data.php");
        console.log("import_all_data.php uploaded successfully!");

        // 3. Upload assets/ folder contents to /htdocs/wp/wp-content/uploads/temp_assets/
        console.log("Uploading assets/ folder to /htdocs/wp/wp-content/uploads/temp_assets/...");
        const localAssetsDir = path.join(__dirname, "../assets");
        await client.ensureDir("/htdocs/wp/wp-content/uploads/temp_assets");
        await client.clearWorkingDir();
        await client.uploadFromDir(localAssetsDir);
        console.log("Assets folder uploaded successfully!");

        console.log("\n=======================================================");
        console.log("ALL ASSETS & IMPORTER SCRIPTS UPLOADED SUCCESSFULLY!");
        console.log("=======================================================\n");

    } catch(err) {
        console.error("FTP Asset Upload Error:", err);
    }
    client.close();
}

main();
