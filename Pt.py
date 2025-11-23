from google.colab import files
from PIL import Image
import io
import os
import requests
import base64
from getpass import getpass   # 👈 Secure input

# ============================
# 1. Upload images
# ============================

output_folder = "resized_images"
os.makedirs(output_folder, exist_ok=True)

uploaded = files.upload()

TARGET_SIZE = (900, 900)  # Change if needed

for filename, filedata in uploaded.items():
    img = Image.open(io.BytesIO(filedata))
    img = img.convert("RGBA")
    img = img.resize(TARGET_SIZE, Image.LANCZOS)

    save_path = os.path.join(output_folder, filename)
    img.save(save_path, format="PNG", optimize=True)

print("🌀 All images resized.")


# ============================
# 2. GitHub upload
# ============================

print("\n--- GitHub Upload ---")
github_username = input("🧏‍♀️ GitHub username: ").strip()
repo_name = input("🗄 GitHub repository name: ").strip()
token = getpass("🗝 GitHub Personal Access Token (hidden): ")   # 👈 Secure, hidden


def upload_to_github(local_path, github_path):
    with open(local_path, "rb") as f:
        content = f.read()

    url = f"https://api.github.com/repos/{github_username}/{repo_name}/contents/{github_path}"

    data = {
        "message": f"Upload {github_path}",
        "content": base64.b64encode(content).decode("utf-8")
    }

    response = requests.put(url, json=data, headers={
        "Authorization": f"token {token}",
        "Content-Type": "application/json"
    })

    return response


print("\nUploading images…")

for filename in os.listdir(output_folder):
    local_path = os.path.join(output_folder, filename)
    github_path = f"{target_folder}/{filename}"

    response = upload_to_github(local_path, github_path)

    if response.status_code in [200, 201]:
        print(f"☑️ Uploaded: {filename}")
    else:
        print(f"✖️ Failed: {filename} — {response.status_code}")
        print(response.text)

print("\n🎊 ALL DONE! Uploaded to GitHub!")
