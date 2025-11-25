import os
import json
import csv
import colorsys
from datetime import datetime
from pathlib import Path
from PIL import Image
import numpy as np
from skimage.filters import sobel
from sklearn.cluster import KMeans


# ============================================================
#   COLOR GROUP DETECTION (IMPROVED)
# ============================================================

def get_color_group(rgb):
    r, g, b = rgb
    r_f, g_f, b_f = r / 255, g / 255, b / 255

    h, s, v = colorsys.rgb_to_hsv(r_f, g_f, b_f)
    h *= 360
    brightness = 0.2126*r + 0.7152*g + 0.0722*b
    sat = s

    # BLACK / WHITE / GRAY
    if brightness < 40:
        return "black"
    if brightness > 230 and sat < 0.20:
        return "white"
    if sat < 0.12 and 40 <= brightness <= 230:
        return "gray"

    # GOLD
    if 35 < h < 65 and 120 < brightness < 220 and 0.20 < sat < 0.55:
        return "gold"

    # SILVER
    if brightness > 180 and sat < 0.18:
        return "silver"

    # BROWN
    if brightness < 140 and sat > 0.25 and 15 < h < 65:
        return "brown"

    # COLOR WHEEL
    if h <= 20 or h >= 345:
        return "red"
    if 20 < h <= 45:
        return "orange"
    if 45 < h <= 75:
        return "yellow"
    if 75 < h <= 165:
        return "green"
    if 165 < h <= 250:
        return "blue"
    if 250 < h <= 295:
        return "purple"
    if 295 < h <= 345:
        return "pink"

    return "gray"


# ============================================================
#   CONTRAST (CORRECT MICHELSON FORMULA)
# ============================================================

def compute_contrast(image_rgba):
    arr = np.array(image_rgba)
    alpha = arr[..., 3]
    mask = alpha > 10  # opaque pixels only

    if mask.sum() == 0:
        return 0.0

    rgb = arr[..., :3][mask]
    lum = 0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1] + 0.0722 * rgb[:, 2]

    I_max = lum.max()
    I_min = lum.min()

    if I_max + I_min == 0:
        return 0.0

    return float(round((I_max - I_min) / (I_max + I_min), 4))


# ============================================================
#   DOMINANT + SECONDARY COLOR
# ============================================================

def extract_colors(image_rgba, n=3):
    arr = np.array(image_rgba)
    alpha = arr[..., 3]
    mask = alpha > 10
    if mask.sum() == 0:
        return [(255, 255, 255)]

    pixels = arr[..., :3][mask]

    k = min(n, len(pixels))
    km = KMeans(n_clusters=k, n_init="auto")
    km.fit(pixels)

    centers = [tuple(map(int, c)) for c in km.cluster_centers_]
    return centers


def dominant_and_secondary_groups(image_rgba):
    cols = extract_colors(image_rgba, n=3)
    if not cols:
        return ("white", "gray")

    groups = [get_color_group(c) for c in cols]

    # Dominant = most saturated color cluster
    dom = groups[0]
    sec = groups[1] if len(groups) > 1 else groups[0]
    return dom, sec


# ============================================================
#   ENTROPY + EDGES
# ============================================================

def compute_entropy(image_rgba):
    arr = np.array(image_rgba.convert("L"))
    hist, _ = np.histogram(arr, bins=256, range=(0, 255))
    p = hist / hist.sum()
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())


def compute_edge_density(image_rgba):
    gray = np.array(image_rgba.convert("L"))
    edges = sobel(gray)
    return float(edges.mean())


# ============================================================
#   GEOMETRY
# ============================================================

def compute_geometry(image_rgba):
    arr = np.array(image_rgba)
    alpha = arr[..., 3]
    mask = alpha > 10
    ys, xs = np.where(mask)

    if len(xs) == 0:
        return {"aspect_ratio": 1.0, "circularity": 0.0, "pixel_count": 0}

    w = xs.max() - xs.min() + 1
    h = ys.max() - ys.min() + 1
    aspect = round(w / h, 4)

    perimeter = np.logical_xor(mask, np.pad(mask, 1)[1:-1, 1:-1])
    p = perimeter.sum()
    a = mask.sum()

    if p == 0:
        circ = 0.0
    else:
        circ = float(round(4 * np.pi * a / (p * p), 4))

    return {
        "aspect_ratio": aspect,
        "circularity": circ,
        "pixel_count": int(a)
    }


# ============================================================
#   GLYPH ANALYSIS
# ============================================================

def analyze_glyph(path):
    img = Image.open(path).convert("RGBA")

    dominant, secondary = dominant_and_secondary_groups(img)
    contrast = compute_contrast(img)
    entropy = compute_entropy(img)
    edges = compute_edge_density(img)
    geom = compute_geometry(img)

    now = datetime.utcnow()
    created_struct = {
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S")
    }

    return {
        "file": os.path.basename(path),
        "group": dominant,
        "secondary_group": secondary,
        "contrast": contrast,
        "entropy": round(entropy, 4),
        "edge_density": round(edges, 4),
        "aspect_ratio": geom["aspect_ratio"],
        "circularity": geom["circularity"],
        "pixel_count": geom["pixel_count"],
        "created_at": created_struct
    }


# ============================================================
#   PROCESS FOLDER
# ============================================================

def load_existing_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"total": 0, "glyphs": []}


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def save_csv(path, glyphs):
    keys = [
        "file", "group", "secondary_group", "contrast", "entropy",
        "edge_density", "aspect_ratio", "circularity", "pixel_count",
        "created_date", "created_time"
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(keys)
        for g in glyphs:
            w.writerow([
                g["file"],
                g["group"],
                g["secondary_group"],
                g["contrast"],
                g["entropy"],
                g["edge_density"],
                g["aspect_ratio"],
                g["circularity"],
                g["pixel_count"],
                g["created_at"]["date"],
                g["created_at"]["time"]
            ])


def process_glyph_folder(folder, json_out, csv_out):
    existing = load_existing_json(json_out)
    existing_files = {g["file"] for g in existing["glyphs"]}

    new_entries = []
    folder = Path(folder)

    for f in folder.glob("*.png"):
        if f.name in existing_files:
            continue
        print("Processing:", f.name)
        new_entries.append(analyze_glyph(str(f)))

    all_glyphs = existing["glyphs"] + new_entries

    out = {
        "total": len(all_glyphs),
        "glyphs": all_glyphs
    }

    # SAVE FILES
    save_json(json_out, out)
    save_csv(csv_out, all_glyphs)

    # FINAL MESSAGE
    if existing.get("glyphs"):
        print(f"🎊 ALL DONE! Library successfully expanded to {len(all_glyphs)} glyphs in total.")
    else:
        print("🎊 ALL DONE!")

    return out


# ============================================================
#   MAIN
# ============================================================

if __name__ == "__main__":
    process_glyph_folder(
        folder="glyphs",
        json_out="glyphs.json",
        csv_out="glyphs.csv"
)
