"""
🔱 GLYPH PROCESSOR
- Upload images → Process → Generate renamed images + metadata
- Extract dominant color using K-means clustering
- Compute Edge Density + Entropy + Texture + Contrast + Shape + Color Harmony + Mood
- Incremental metadata updates (JSON + JS)
- Save options:
  1. Local ZIP
  2. Directly to GitHub via API (images → glyphs/, data → data/)
- Auto-creates GitHub repo/folders if it doesn't exist
"""

!pip install -q opencv-python-headless scikit-learn scikit-image PyGithub

import os, json, uuid, shutil, zipfile, csv
from pathlib import Path
from datetime import datetime, timezone
from getpass import getpass
from base64 import b64encode

import numpy as np
import cv2
from PIL import Image
from sklearn.cluster import KMeans
from skimage.measure import shannon_entropy
from skimage.feature import local_binary_pattern
from skimage.color import rgb2gray
from github import Github, Auth, GithubException, InputGitTreeElement
from google.colab import files
import colorsys

def load_asset(path: Path):
    pil = Image.open(path).convert("RGBA")
    arr = np.array(pil)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]
    mask = alpha > 10
    return pil, rgb, alpha, mask

def masked_pixels(rgb, mask):
    pts = rgb[mask]
    if len(pts) == 0:
        return np.zeros((1, 3), dtype=np.uint8)
    return pts

# ---------------------- COLOR DETECTION ----------------------

def compute_dominant_color(rgb, mask, k=3):
    pts = masked_pixels(rgb, mask)
    if len(pts) < k:
        return (200, 200, 200)
    kmeans = KMeans(n_clusters=k, n_init="auto").fit(pts)
    centers = kmeans.cluster_centers_
    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    return tuple(int(x) for x in centers[np.argmax(counts)])

def compute_secondary_color(rgb, mask, k=3):
    pts = masked_pixels(rgb, mask)
    if len(pts) < k:
        return (200, 200, 200)
    kmeans = KMeans(n_clusters=k, n_init="auto").fit(pts)
    centers = kmeans.cluster_centers_
    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    if len(counts) == 1:
        return tuple(int(x) for x in centers[0])
    order = np.argsort(counts)[::-1]
    return tuple(int(x) for x in centers[order[1]])

def rgb_to_hex(rgb):
    return "{:02x}{:02x}{:02x}".format(*rgb)

def rgb_to_lab(rgb):
    r, g, b = [x / 255 for x in rgb]
    r = ((r + 0.055)/1.055)**2.4 if r > 0.04045 else r/12.92
    g = ((g + 0.055)/1.055)**2.4 if g > 0.04045 else g/12.92
    b = ((b + 0.055)/1.055)**2.4 if b > 0.04045 else b/12.92
    x = r*0.4124 + g*0.3576 + b*0.1805
    y = r*0.2126 + g*0.7152 + b*0.0722
    z = r*0.0193 + g*0.1192 + b*0.9505
    x /= 0.95047
    z /= 1.08883
    f = lambda t: t**(1/3) if t > 0.008856 else 7.787*t + 16/116
    L = 116*f(y) - 16
    a = 500 * (f(x) - f(y))
    b = 200 * (f(y) - f(z))
    return (L, a, b)

def compute_color_group(rgb):
    r, g, b = rgb
    r_f, g_f, b_f = r/255, g/255, b/255
    h, s, v = colorsys.rgb_to_hsv(r_f, g_f, b_f)
    h *= 360
    brightness = 0.2126*r + 0.7152*g + 0.0722*b
    sat = s

    if brightness < 40:
        return "black"
    if brightness > 230 and sat < 0.20:
        return "white"
    if sat < 0.12 and 40 <= brightness <= 230:
        return "gray"
    if 35 < h < 65 and 120 < brightness < 220 and 0.20 < sat < 0.55:
        return "gold"
    if brightness > 180 and sat < 0.18:
        return "silver"
    if brightness < 140 and sat > 0.25 and 15 < h < 65:
        return "brown"
    if h <= 20 or h >= 345:
        return "red"
    if 20 < h <= 45:
        return "orange"
    if 45 < h <= 75:
        return "yellow"
    if 75 < h <= 165:
        return "green"
    if 165 < h <= 250:
        return "blue"
    if 250 < h <= 295:
        return "purple"
    if 295 < h <= 345:
        return "pink"
    return "gray"

# ---------------------- PROCESSING GLYPHS ----------------------

def compute_edge_density(rgb, mask):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 80, 160)
    return round(float(np.mean(edges[mask] > 0)), 4)

def compute_entropy(rgb, mask):
    gray = rgb2gray(rgb)
    return round(float(shannon_entropy(gray[mask])), 4)

def compute_texture_complexity(rgb, mask):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    lbp = local_binary_pattern(gray, 8, 1, "uniform")
    vals = lbp[mask].ravel()
    hist, _ = np.histogram(vals, bins=np.arange(0, 11), density=True)
    ent = -np.sum(hist * np.log2(hist + 1e-10))
    return round(float(ent), 4)

def compute_contrast(image_rgba):
    arr = np.array(image_rgba)
    alpha = arr[..., 3]
    mask = alpha > 10
    if mask.sum() == 0:
        return 0.0
    rgb = arr[..., :3][mask]
    lum = 0.2126 * rgb[:, 0] + 0.7152 * rgb[:, 1] + 0.0722 * rgb[:, 2]
    I_max = lum.max()
    I_min = lum.min()
    if I_max + I_min == 0:
        return 0.0
    return float(round((I_max - I_min) / (I_max + I_min), 4))

def compute_shape_metrics(alpha):
    mask = (alpha > 10).astype("uint8") * 255
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return 0.5, 1.0
    c = max(cnts, key=cv2.contourArea)
    area = cv2.contourArea(c)
    peri = cv2.arcLength(c, True)
    circularity = 4*np.pi*area / (peri*peri + 1e-6)
    x, y, w, h = cv2.boundingRect(c)
    aspect = w / (h + 1e-6)
    return round(float(circularity), 4), round(float(aspect), 4)

def compute_edge_angle(rgb, mask):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    sx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, 3)
    sy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, 3)
    mag = np.sqrt(sx*sx + sy*sy)
    ang = np.degrees(np.arctan2(sy, sx))
    strong = mag[mask] > np.percentile(mag[mask], 75)
    if strong.sum() == 0:
        return 0.0
    return round(float(abs(np.median(ang[mask][strong])) % 180), 4)

def compute_hue(rgb):
    r, g, b = rgb
    return colorsys.rgb_to_hsv(r/255, g/255, b/255)[0] * 360

def compute_color_harmony(c1, c2):
    h1 = compute_hue(c1)
    h2 = compute_hue(c2)
    d = abs(h1 - h2)
    if d < 30:
        return "analogous"
    if abs(d - 180) < 30:
        return "complementary"
    return "none"

def compute_mood(dom_rgb, entropy, edge, tex, contrast, circ, aspect, angle, harmony):
    brightness = 0.2126*dom_rgb[0] + 0.7152*dom_rgb[1] + 0.0722*dom_rgb[2]
    r, g, b = dom_rgb
    h = compute_hue(dom_rgb)
    sat = (max(dom_rgb) - min(dom_rgb)) / (max(dom_rgb) + 1e-6)

    if entropy < 4 and edge < 0.05 and sat < 0.25:
        return "minimalistic"
    if h > 200 and brightness > 170 and sat < 0.25:
        return "futuristic"
    if brightness < 80 and h > 180:
        return "mysterious"
    if sat > 0.5 and entropy < 6:
        return "energetic"
    if tex > 1.6 and entropy > 6:
        return "organic"
    return "serene"

def process_glyphs(input_folder, output_folder, github_user, github_repo, branch="main"):
    os.makedirs(output_folder, exist_ok=True)
    pngs = list(Path(input_folder).glob("*.png"))
    results = []

    for path in pngs:
        pil, rgb, alpha, mask = load_asset(path)

        dom = compute_dominant_color(rgb, mask)
        sec = compute_secondary_color(rgb, mask)
        hex_color = rgb_to_hex(dom)
        lab = rgb_to_lab(dom)
        group = compute_color_group(dom)

        edge = compute_edge_density(rgb, mask)
        ent = compute_entropy(rgb, mask)
        tex = compute_texture_complexity(rgb, mask)
        con = compute_contrast(pil)
        circ, ar = compute_shape_metrics(alpha)
        ang = compute_edge_angle(rgb, mask)
        harmony = compute_color_harmony(dom, sec)
        mood = compute_mood(dom, ent, edge, tex, con, circ, ar, ang, harmony)

        uid = uuid.uuid4().hex[:8]

        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y-%m-%d")
        time_str = now.strftime("%H:%M:%S")

        newname = f"{hex_color}_{now.strftime('%Y%m%d_%H%M%S')}_{uid}.png"
        out_path = Path(output_folder) / newname
        pil.save(out_path)

        url = f"https://cdn.jsdelivr.net/gh/{github_user}/{github_repo}@{branch}/glyphs/{newname}"

        results.append({
            "id": uid,
            "filename": newname,
            "glyph_url": url,

            "color": {
                "hex": hex_color,
                "group": group,
                "rgb": list(dom),
                "lab": [round(x, 2) for x in lab]
            },

            "metrics": {
                "edge_density": edge,
                "entropy": ent,
                "texture": tex,
                "contrast": con,
                "circularity": circ,
                "aspect_ratio": ar,
                "edge_angle": ang
            },

            "color_harmony": harmony,
            "mood": mood,

            "created_at": {
                "date": date_str,
                "time": time_str
            }
        })

    return results

# ---------------------- DATA PIPELINE ----------------------

def batch_upload_to_github(repo, output_dir, branch="main"):
    files_to_commit = list(output_dir.glob("*"))
    if not files_to_commit: return

    file_mode = '100644'

    try:
        sb = repo.get_branch(branch)
        base_tree = repo.get_git_tree(sb.commit.sha)
        elements = []
        for f in files_to_commit:
            if f.suffix.lower() == ".png":
                content_bytes = f.read_bytes()
                content_b64 = b64encode(content_bytes).decode("utf-8")
                blob = repo.create_git_blob(content_b64, "base64")
                elements.append(InputGitTreeElement(
                    path=f"glyphs/{f.name}",
                    mode=file_mode,
                    type="blob",
                    sha=blob.sha
                ))
            else:
                content = f.read_text("utf-8")
                elements.append(InputGitTreeElement(
                    path=f"data/{f.name}",
                    mode=file_mode,
                    type="blob",
                    content=content
                ))

        tree = repo.create_git_tree(elements, base_tree)
        parent = repo.get_git_commit(sb.commit.sha)
        commit = repo.create_git_commit(f"Batch upload {len(elements)} files", tree, [parent])
        ref = repo.get_git_ref(f"heads/{branch}")
        ref.edit(commit.sha)
        print(f"🌀 Batch commit successful: {len(elements)} files uploaded")
    except GithubException as e:
        print(f"🤷 Oops! Batch commit failed, try again: GitHub Error {e}")

print("\n🔱 Select images to process:\n")
uploaded = files.upload()

input_dir = Path("/content/input_glyphs"); input_dir.mkdir(exist_ok=True)
output_dir = Path("/content/output_glyphs"); output_dir.mkdir(exist_ok=True)

for fname, data in uploaded.items():
    (input_dir / fname).write_bytes(data)

github_user = input("👾 GitHub username: ").strip()
github_repo = input("🗃️ GitHub repo name: ").strip()
branch      = input("🌿 Branch name (default=main): ").strip() or "main"

json_path = output_dir / "glyphs.catalog.json"
existing = {"total": 0, "glyphs": []}

try:
    g = Github()
    repo = g.get_user(github_user).get_repo(github_repo)
    file_content = repo.get_contents("data/glyphs.catalog.json")
    existing = json.loads(file_content.decoded_content.decode())
except:
    if json_path.exists():
        existing = json.load(open(json_path))

# Process new glyphs
new_glyphs = process_glyphs(input_dir, output_dir, github_user, github_repo, branch)
all_glyphs = existing.get("glyphs", []) + new_glyphs

metadata = {"total": len(all_glyphs), "glyphs": all_glyphs}

with open(json_path, "w") as f:
    json.dump(metadata, f, indent=2)

csv_path = output_dir / "glyphs.catalog.csv"
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "id", "filename", "glyph_url",
        "color_hex", "color_group", "color_rgb", "color_lab",
        "edge_density", "entropy", "texture", "contrast",
        "circularity", "aspect_ratio", "edge_angle",
        "color_harmony", "mood",
        "created_date", "created_time"
    ])
    
    for g in all_glyphs:
        writer.writerow([
            g["id"],
            g["filename"],
            g["glyph_url"],
            g["color"]["hex"],
            g["color"]["group"],
            str(g["color"]["rgb"]),
            str(g["color"]["lab"]),
            g["metrics"]["edge_density"],
            g["metrics"]["entropy"],
            g["metrics"]["texture"],
            g["metrics"]["contrast"],
            g["metrics"]["circularity"],
            g["metrics"]["aspect_ratio"],
            g["metrics"]["edge_angle"],
            g["color_harmony"],
            g["mood"],
            g["created_at"]["date"],
            g["created_at"]["time"]
        ])

print("\n🗄️ Where to save results?")
print("1 - Local ZIP")
print("2 - Autoload directly to GitHub")
choice = input("🎚Choose 1 or 2: ").strip()

if choice == "1":
    zip_path = Path("/content/glyphs_processed.zip")
    with zipfile.ZipFile(zip_path, "w") as zipf:
        for f in output_dir.iterdir():
            zipf.write(f, f.name)
    files.download(str(zip_path))
else:
    token = getpass("🔑 GitHub Personal Access Token: ").strip()
    g = Github(auth=Auth.Token(token))
    user = g.get_user()
    try:
        repo = user.get_repo(github_repo)
    except:
        repo = user.create_repo(github_repo)
        repo.create_file("glyphs/.gitkeep", "init", "")
        repo.create_file("data/.gitkeep", "init", "")

    batch_upload_to_github(repo, output_dir, branch)

if existing.get("glyphs"):
    print(f"🎊 ALL DONE! Library successfully expanded to {len(all_glyphs)} glyphs in total.")
else:
    print("🎊 ALL DONE!")
