import os
import ftplib
import glob

def ensure_remote_dir(ftp, path):
    try:
        ftp.cwd(path)
        print(f"Directory {path} already exists.")
    except Exception:
        parts = path.strip("/").split("/")
        current = ""
        for part in parts:
            current += "/" + part
            try:
                ftp.cwd(current)
            except Exception:
                print(f"Creating directory: {current}")
                ftp.mkd(current)
        ftp.cwd(path)

def main():
    host = "ftp.schippercompactwonen.nl"
    user = "matthias@schippercompactwonen.nl"
    password = "nGED2&B)h0UW}yy["
    
    base_remote_path = "/public_html/staopstoelen-test"
    
    print(f"Connecting to FTP server {host}...")
    ftp = ftplib.FTP(host)
    ftp.login(user, password)
    
    # 1. Create directory structure
    print("Setting up remote directories...")
    ensure_remote_dir(ftp, base_remote_path)
    ensure_remote_dir(ftp, f"{base_remote_path}/assets")
    ensure_remote_dir(ftp, f"{base_remote_path}/assets/stoelen")
    ensure_remote_dir(ftp, f"{base_remote_path}/api")
    
    # 2. Upload database.json
    print("Uploading database.json...")
    ftp.cwd(base_remote_path)
    if os.path.exists("database.json"):
        with open("database.json", "rb") as f:
            ftp.storbinary("STOR database.json", f)
            
    # 3. Upload HTML, JS, CSS files directly
    files_to_deploy = [
        'index.html',
        'staopstoelen.html',
        'seniorenstoelen.html',
        'keuzehulp.html',
        'revisie.html',
        'ervaringen.html',
        'faq.html',
        'info.html',
        'afspraak.html',
        'winkel.html',
        'beheer.html',
        'app.js',
        'style.css'
    ]
    
    for filename in files_to_deploy:
        if not os.path.exists(filename):
            print(f"Skipping {filename} (not found locally)")
            continue
            
        print(f"Uploading {filename}...")
        ftp.cwd(base_remote_path)
        with open(filename, "rb") as f_bin:
            ftp.storbinary(f"STOR {filename}", f_bin)
        
    # 4. Upload local assets folder contents (non-subdirectories)
    print("Uploading general assets...")
    ftp.cwd(f"{base_remote_path}/assets")
    local_assets = glob.glob("assets/*")
    for asset_path in local_assets:
        if os.path.isdir(asset_path):
            continue
        filename = os.path.basename(asset_path)
        print(f"  Uploading asset: {filename}...")
        with open(asset_path, "rb") as f_bin:
            ftp.storbinary(f"STOR {filename}", f_bin)
            
    # 5. Upload local assets/stoelen folder contents
    print("Uploading chair assets...")
    ftp.cwd(f"{base_remote_path}/assets/stoelen")
    local_stoelen_assets = glob.glob("assets/stoelen/*")
    for asset_path in local_stoelen_assets:
        if os.path.isdir(asset_path):
            continue
        filename = os.path.basename(asset_path)
        print(f"  Uploading chair asset: {filename}...")
        with open(asset_path, "rb") as f_bin:
            ftp.storbinary(f"STOR {filename}", f_bin)
            
    # 6. Upload local api folder contents
    print("Uploading PHP API scripts...")
    ftp.cwd(f"{base_remote_path}/api")
    local_api_files = glob.glob("api/*.php")
    for api_path in local_api_files:
        filename = os.path.basename(api_path)
        print(f"  Uploading API file: {filename}...")
        with open(api_path, "rb") as f_bin:
            ftp.storbinary(f"STOR {filename}", f_bin)

    ftp.quit()
    print("\nPHP SITE DEPLOYMENT TO TEST COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
