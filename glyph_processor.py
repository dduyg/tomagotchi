"""
🎛 GLYPH PROCESSOR
- Upload images → Process → Generate renamed images + metadata
- Shape detection via image analysis
- Color analysis
- Unique timestamp + UUID filenames
- Save options:
    1. Local ZIP
    2. Upload directly to GitHub via API (images → glyphs/, data → data/)
"""

import os
import json
import colorsys
import uuid
import math
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import shutil
import zipfile
from getpass import getpass

from PIL import Image
import cv2
import numpy as np

# ---------------------- SHAPE DETECTION ----------------------

def detect_shape_from_image(image_path):
    img = cv2.imread(str(image_path))
    if img is None:
        return "unknown"
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 128, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return "unknown"
    c = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(c)
    peri = cv2.arcLength(c, True)
    if peri == 0:
        return "unknown"
    approx = cv2.approxPolyDP(c, 0.04 * peri, True)
    circularity = 4 * math.pi * (area / (peri * peri))
    num_vertices = len(approx)
    if circularity > 0.8:
        return "circle"
    elif num_vertices == 4:
        x, y, w, h = cv2.boundingRect(approx)
        ar = w / float(h)
        return "square" if 0.9 <= ar <= 1.1 else "rectangle"
    elif num_vertices == 3:
        return "triangle"
    else:
        return "polygon"

# ---------------------- COLOR ANALYSIS ----------------------

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path).convert('RGBA').resize((100,100))
        pixels = list(img.getdata())
        solid = [(r,g,b) for (r,g,b,a) in pixels if a > 128 and not (r>240 and g>240 and b>240)]
        if not solid:
            return (200,200,200)
        return Counter(solid).most_common(1)[0][0]
    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return (200,200,200)

def rgb_to_hex(rgb):
    return '{:02x}{:02x}{:02x}'.format(*rgb)

def rgb_to_lab(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    r = ((r + 0.055) / 1.055)**2.4 if r > 0.04045 else r / 12.92
    g = ((g + 0.055) / 1.055)**2.4 if g > 0.04045 else g / 12.92
    b = ((b + 0.055) / 1.055)**2.4 if b > 0.04045 else b / 12.92
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    x, y, z = x / 0.95047, y / 1.0, z / 1.08883
    def f(t):
        return t ** (1/3) if t > 0.008856 else (7.787 * t + 16/116)
    L = 116 * f(y) - 16
    a = 500 * (f(x) - f(y))
    b = 200 * (f(y) - f(z))
    return (L, a, b)

def get_color_name(rgb):
    r, g, b = rgb
    h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    h = h * 360
    if s < 0.1:
        return "white" if v>0.8 else "black" if v<0.2 else "gray"
    if h < 15 or h > 345: return "red"
    if h < 45: return "orange"
    if h < 75: return "yellow"
    if h < 165: return "green"
    if h < 255: return "blue"
    if h < 290: return "purple"
    return "pink"

# ---------------------- PROCESSING GLYPHS ----------------------

def process_glyphs(input_folder, output_folder, github_user="your-username", github_repo="glyph-library"):
    os.makedirs(output_folder, exist_ok=True)
    png_files = list(Path(input_folder).glob('*.png'))
    glyphs = []

    for image_path in png_files:
        dominant_rgb = get_dominant_color(image_path)
        hex_color = rgb_to_hex(dominant_rgb)
        color_name = get_color_name(dominant_rgb)
        lab = rgb_to_lab(dominant_rgb)

        shape = detect_shape_from_image(image_path)
        now = datetime.now(timezone.utc)  # timezone-aware UTC
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M:%S")
        unique_id = uuid.uuid4().hex[:8]

        new_filename = f"{shape}_{hex_color}_{now.strftime('%Y%m%d_%H%M%S')}_{unique_id}.png"
        out_path = Path(output_folder) / new_filename
        shutil.copy2(image_path, out_path)

        glyph_data = {
            "id": f"{shape}_{hex_color}_{now.strftime('%Y%m%d_%H%M%S')}_{unique_id}",
            "filename": new_filename,
            "original_filename": image_path.name,
            "shape": shape,
            "color": {
                "hex": hex_color,
                "name": color_name,
                "rgb": list(dominant_rgb),
                "lab": [round(x,2) for x in lab]
            },
            "timestamp": {"date": date_str, "time": time_str}
        }
        glyphs.append(glyph_data)
        print(f"Processed {image_path.name} → {new_filename}")

    metadata = {"version": "3.0", "total": len(glyphs), "glyphs": glyphs}
    json_path = Path(output_folder) / "glyphs-metadata.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    js_code = "// Glyph Data\nconst GLYPH_DATA = [\n"
    for g in glyphs:
        js_code += (
            "  {"
            f"id:'{g['id']}',"
            f"url:'https://raw.githubusercontent.com/{github_user}/{github_repo}/main/glyphs/{g['filename']}',"
            f"filename:'{g['filename']}',"
            f"shape:'{g['shape']}',"
            f"hex:'#{g['color']['hex']}',"
            f"rgb:{g['color']['rgb']},"
            f"lab:{g['color']['lab']},"
            f"colorName:'{g['color']['name']}',"
            f"date:'{g['timestamp']['date']}',"
            f"time:'{g['timestamp']['time']}'"
            "},\n"
        )
    js_code += "];\n"
    js_path = Path(output_folder) / "glyph-data.js"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_code)

    return output_folder, glyphs, json_path, js_path

# ---------------------- INTERACTION LAYER ----------------------

print("🎛 𝙶𝙻𝚈𝙿𝙷 𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙾𝚁 (𝘷𝘪𝘴𝘶𝘢𝘭 𝘴𝘩𝘢𝘱𝘦 + 𝘤𝘰𝘭𝘰𝘳 𝘥𝘦𝘵𝘦𝘤𝘵𝘪𝘰𝘯)")

!pip install -q opencv-python-headless PyGithub

from google.colab import files
from github import Github

# Upload images
uploaded = files.upload()
if not uploaded:
    print("✖️ No files uploaded.")
    raise SystemExit

input_dir = Path("/content/input_glyphs")
output_dir = Path("/content/output_glyphs")
input_dir.mkdir(exist_ok=True)
output_dir.mkdir(exist_ok=True)

for fname, content in uploaded.items():
    with open(input_dir / fname, 'wb') as f:
        f.write(content)

print(f"☑️ Uploaded {len(uploaded)} images")

# ---------------------- PROCESS ----------------------

github_user = input("GitHub username (for metadata URLs, optional): ").strip() or "your-username"
github_repo = input("GitHub repo name (for metadata URLs, optional): ").strip() or "glyph-library"

print("Processing images …")
result_dir, glyphs, json_path, js_path = process_glyphs(input_dir, output_dir, github_user, github_repo)

# ---------------------- SAVE OPTION ----------------------

print("\n🗂️ Where would you like to save the processed files?")
print("1 = Local ZIP")
print("2 = Upload directly to GitHub via API")
choice = input("Choose 1 or 2: ").strip()

zip_name = "glyphs_processed.zip"

if choice == "1":
    zip_path = Path(f"/content/{zip_name}")
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for root, dirs, files_list in os.walk(output_dir):
            for f in files_list:
                full = os.path.join(root, f)
                arc = os.path.relpath(full, output_dir)
                zipf.write(full, arc)
    save_path = input("Enter local folder path to save ZIP: ").strip()
    save_folder = Path(save_path)
    save_folder.mkdir(parents=True, exist_ok=True)
    shutil.copy2(zip_path, save_folder / zip_name)
    print(f"📦 ZIP saved locally to: {save_folder / zip_name}")

elif choice == "2":
    gh_token = getpass("GitHub Personal Access Token (with repo permissions): ").strip()
    branch = input("Branch name (default: main): ").strip() or "main"

    g = Github(gh_token)
    repo = g.get_user().get_repo(github_repo)

    def upload_or_update(repo, file_path, repo_path, branch):
        """Upload file or update if it exists"""
        with open(file_path, "rb") as f:
            content = f.read()
        try:
            existing_file = repo.get_contents(repo_path, ref=branch)
            repo.update_file(existing_file.path, f"Update {file_path.name}", content, existing_file.sha, branch=branch)
            print(f"♻️ Updated {repo_path}")
        except Exception:
            repo.create_file(repo_path, f"Add {file_path.name}", content, branch=branch)
            print(f"✅ Uploaded {repo_path}")

    # Upload images
    for f in Path(output_dir).glob("*.png"):
        upload_or_update(repo, f, f"glyphs/{f.name}", branch)

    # Upload metadata files
    for f in [json_path, js_path]:
        upload_or_update(repo, f, f"data/{f.name}", branch)

else:
    print("Invalid option. Files remain in /content/output_glyphs.")

print("🎊 All done!")
