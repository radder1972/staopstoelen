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

        // Upload create_user.php to /htdocs/wp/create_user.php
        console.log("Uploading create_user.php to /htdocs/wp/create_user.php...");
        const localScript = path.join(__dirname, "../create_user.php");
        await client.uploadFrom(localScript, "/htdocs/wp/create_user.php");
        console.log("create_user.php uploaded successfully!");

        console.log("\n=======================================================");
        console.log("USER CREATOR SCRIPT UPLOADED SUCCESSFULLY!");
        console.log("=======================================================\n");

    } catch(err) {
        console.error("FTP Upload Error:", err);
    }
    client.close();
}

main();
