from google.colab import files
from PIL import Image
import io
import os
import requests
import base64
from getpass import getpass

# ============================
# 1️⃣. Upload images
# ============================

output_folder = "resized_images"
os.makedirs(output_folder, exist_ok=True)

print("📤 Upload images to process:")
uploaded = files.upload()

TARGET_SIZE = (900, 900)  # Resize target size (change if needed)

for filename, filedata in uploaded.items():
    img = Image.open(io.BytesIO(filedata))
    img = img.convert("RGBA")
    img = img.resize(TARGET_SIZE, Image.LANCZOS)

    save_path = os.path.join(output_folder, filename)
    img.save(save_path, format="PNG", optimize=True)

print("🌀 All images resized.")


# ============================
# 2️⃣. GitHub Upload
# ============================

print("\n--- GITHUB UPLOAD ---")

github_username = input("🧏‍♀️ GitHub username: ").strip()
repo_name = input("🗄 GitHub repository name: ").strip()
token = getpass("🗝 GitHub Personal Access Token: ")

target_folder = "resized_images"  # Folder in GitHub repo


def upload_to_github(local_path, github_path):
    """Uploads a file to GitHub using API."""
    with open(local_path, "rb") as f:
        content = f.read()

    url = f"https://api.github.com/repos/{github_username}/{repo_name}/contents/{github_path}"

    data = {
        "message": f"Upload {github_path}",
        "content": base64.b64encode(content).decode("utf-8")
    }

    headers = {
        "Authorization": f"token {token}",
        "Content-Type": "application/json"
    }

    response = requests.put(url, json=data, headers=headers)
    return response


# ============================
# 3️⃣. Upload Each Image
# ============================

print("\n📡 Uploading images to GitHub...")

for filename in os.listdir(output_folder):
    local_path = os.path.join(output_folder, filename)
    github_path = f"{target_folder}/{filename}"

    response = upload_to_github(local_path, github_path)

    if response.status_code in (200, 201):
        print(f"☑️ Uploaded: {filename}")
    else:
        print(f"✖️ Failed: {filename} — Status: {response.status_code}")
        print(response.text)

print("\n🎊 ALL DONE! Uploaded to GitHub!")
