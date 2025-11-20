"""
Glyph Processor  
- Upload images → Process → Download renamed images + metadata  
- Unique timestamp + UUID filenames  
- Shape detection via image analysis  
- Save ZIP to Google Drive folder
"""

import os
import json
import colorsys
import zipfile
import uuid
import math
from pathlib import Path
from collections import Counter
from datetime import datetime

from PIL import Image
from google.colab import files, drive

import cv2
import numpy as np
import shutil

# ---------------------- SHAPE DETECTION FUNCTIONS ----------------------

def detect_shape_from_image(image_path):
    """
    Detect a basic shape category (circle, square, rectangle, triangle, polygon) from the image.
    Uses contour analysis with OpenCV.
    """
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

# ---------------------- COLOR FUNCTIONS ----------------------

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

# ---------------------- PROCESSING FUNCTION ----------------------

def process_glyphs(input_folder, output_folder, github_user="your-username", github_repo="glyph-library"):
    os.makedirs(output_folder, exist_ok=True)
    png_files = list(Path(input_folder).glob('*.png'))
    glyphs = []

    for image_path in png_files:
        dominant_rgb = get_dominant_color(image_path)
        hex_color = rgb_to_hex(dominant_rgb)
        color_name = get_color_name(dominant_rgb)
        lab = rgb_to_lab(dominant_rgb)

        with Image.open(image_path) as img:
            width, height = img.size

        shape = detect_shape_from_image(image_path)
        now = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]

        new_filename = f"{shape}_{hex_color}_{now}_{unique_id}.png"
        out_path = Path(output_folder) / new_filename
        shutil.copy2(image_path, out_path)

        glyph_data = {
            "id": f"{shape}_{hex_color}_{now}_{unique_id}",
            "filename": new_filename,
            "original_filename": image_path.name,
            "shape": shape,
            "color": {
                "hex": hex_color,
                "name": color_name,
                "rgb": list(dominant_rgb),
                "lab": [round(x,2) for x in lab]
            },
            "dimensions": {"width": width, "height": height}
        }
        glyphs.append(glyph_data)
        print(f"Processed {image_path.name} → {new_filename}")

    metadata = {"version": "1.0", "total": len(glyphs), "glyphs": glyphs}
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
            f"width:{g['dimensions']['width']},"
            f"height:{g['dimensions']['height']}"
            "},\n"
        )
    js_code += "];\n"
    js_path = Path(output_folder) / "glyph-data.js"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_code)

    return output_folder, glyphs

# ---------------------- SCRIPT INTERFACE ----------------------

print("🎛 GLYPH PROCESSOR (visual shape + color detection)")

# Install OpenCV if not already
!pip install opencv-python-headless

uploaded = files.upload()
if not uploaded:
    print("✖️ No files uploaded.")
    raise SystemExit

input_dir = "/content/input_glyphs"
output_dir = "/content/output_glyphs"
os.makedirs(input_dir, exist_ok=True)

for fname, content in uploaded.items():
    with open(f"{input_dir}/{fname}", 'wb') as f:
        f.write(content)

print(f"☑️ Uploaded {len(uploaded)} images")

github_user = input("GitHub username: ").strip() or "your-username"
github_repo = input("GitHub repo name: ").strip() or "glyph-library"

print("Processing images …")
result_dir, glyphs = process_glyphs(input_dir, output_dir, github_user, github_repo)

print("\n📦 Where to save the ZIP in Google Drive?")
drive_folder = input("Enter Drive folder name (e.g. 3d-glyph-library): ").strip() or "3d-glyph-library"
if not os.path.exists("/content/drive"):
    drive.mount("/content/drive")

save_folder = Path(f"/content/drive/MyDrive/{drive_folder}")
save_folder.mkdir(parents=True, exist_ok=True)
zip_path = save_folder / "glyphs_processed.zip"

with zipfile.ZipFile(zip_path, 'w') as zipf:
    for root, dirs, files_list in os.walk(output_dir):
        for f in files_list:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, output_dir)
            zipf.write(full, arc)

print(f"🔘 ZIP saved to: {zip_path}")

print("\nCopy this JS for your HTML:")
with open(Path(output_dir) / "glyph-data.js", 'r') as f:
    print(f.read())

print("🎊 All done!")
