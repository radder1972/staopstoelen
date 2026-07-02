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

        // 1. Upload setup_helper.php to /htdocs/wp/
        console.log("Uploading setup_helper.php to /htdocs/wp/setup_helper.php...");
        const localSetupHelper = path.join(__dirname, "../setup_helper.php");
        await client.uploadFrom(localSetupHelper, "/htdocs/wp/setup_helper.php");
        console.log("setup_helper.php uploaded successfully!");

        // 2. Upload custom theme folder
        console.log("Uploading custom theme 'staopstoelen-theme' to /htdocs/wp/wp-content/themes/staopstoelen-theme/...");
        const localThemeDir = path.join(__dirname, "../staopstoelen-theme");
        await client.ensureDir("/htdocs/wp/wp-content/themes/staopstoelen-theme");
        await client.clearWorkingDir();
        await client.uploadFromDir(localThemeDir);
        console.log("Custom theme uploaded successfully!");

        // 3. Upload custom helper plugin folder
        console.log("Uploading custom helper plugin 'staopstoelen-helper' to /htdocs/wp/wp-content/plugins/staopstoelen-helper/...");
        const localPluginDir = path.join(__dirname, "../staopstoelen-helper");
        await client.ensureDir("/htdocs/wp/wp-content/plugins/staopstoelen-helper");
        await client.clearWorkingDir();
        await client.uploadFromDir(localPluginDir);
        console.log("Custom helper plugin uploaded successfully!");

        console.log("\n=======================================================");
        console.log("ALL FILES UPLOADED SUCCESSFULLY!");
        console.log("=======================================================\n");

    } catch(err) {
        console.error("FTP Deployment Error:", err);
    }
    client.close();
}

main();
