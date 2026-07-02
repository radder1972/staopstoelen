const ftp = require("basic-ftp");

async function main() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log("Connecting to ftpupload.net via FTP for cleanup...");
        await client.access({
            host: "ftpupload.net",
            user: "if0_42321955",
            password: "KOMoAe68vp1",
            secure: false
        });
        
        console.log("Connected! Deleting temporary installer files...");

        try {
            await client.remove("/htdocs/wp/setup_helper.php");
            console.log("Deleted: /htdocs/wp/setup_helper.php");
        } catch(e) {
            console.warn("Could not delete setup_helper.php (might already be deleted or missing)");
        }

        try {
            await client.remove("/htdocs/wp/import_all_data.php");
            console.log("Deleted: /htdocs/wp/import_all_data.php");
        } catch(e) {
            console.warn("Could not delete import_all_data.php (might already be deleted or missing)");
        }

        try {
            await client.remove("/htdocs/wp/database.json");
            console.log("Deleted: /htdocs/wp/database.json");
        } catch(e) {
            console.warn("Could not delete database.json (might already be deleted or missing)");
        }

        console.log("\n=======================================================");
        console.log("CLEANUP COMPLETED SUCCESSFULLY!");
        console.log("=======================================================\n");

    } catch(err) {
        console.error("FTP Cleanup Error:", err);
    }
    client.close();
}

main();
