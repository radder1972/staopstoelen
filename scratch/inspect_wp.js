const ftp = require("basic-ftp");

async function main() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        console.log("Connecting to ftpupload.net...");
        await client.access({
            host: "ftpupload.net",
            user: "if0_42321955",
            password: "KOMoAe68vp1",
            secure: false
        });
        
        console.log("Connected! Listing htdocs directory...");
        const list = await client.list("htdocs");
        console.log("--- htdocs Directory Contents ---");
        for (const item of list) {
            console.log(`${item.type === 2 ? "[DIR]" : "[FILE]"} ${item.name} (${item.size} bytes)`);
        }
        console.log("--------------------------------");
        
    } catch(err) {
        console.error("FTP Error:", err);
    }
    client.close();
}

main();
