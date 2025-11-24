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

import os, json, uuid, shutil, zipfile
from pathlib import Path
from datetime import datetime, timezone
from getpass import getpass
from base64 import b64encode

import numpy as np
import cv2
from PIL import Image
from sklearn.cluster import KMeans
from skimage.measure import shannon_entropy, regionprops
from skimage.color import rgb2gray
from skimage.feature import local_binary_pattern
from github import Github, Auth, GithubException, InputGitTreeElement
from google.colab import files
import colorsys

class GlyphAsset:
    """Stores metadata and metrics for a single glyph."""
    def __init__(self, path: Path):
        self.path = path
        pil = Image.open(path).convert("RGBA")
        self.pil = pil
        self.rgb = pil.convert("RGB")
        self.rgb_np = np.array(self.rgb)
        self.bgr = cv2.cvtColor(self.rgb_np, cv2.COLOR_RGB2BGR)
        self.gray = cv2.cvtColor(self.bgr, cv2.COLOR_BGR2GRAY)

# ---------------------- COLOR DETECTION ----------------------

def get_dominant_color(asset: GlyphAsset, k=3):
    pil = asset.pil.resize((150,150))
    pixels = np.array(pil)
    mask = (pixels[:,:,3]>128) & ~((pixels[:,:,0]>240)&(pixels[:,:,1]>240)&(pixels[:,:,2]>240))
    points = pixels[mask][:,:3]
    if len(points)<5: return (200,200,200)
    kmeans = KMeans(n_clusters=k, n_init="auto").fit(points)
    centers = kmeans.cluster_centers_
    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    dom = centers[np.argmax(counts)]
    return tuple(int(x) for x in dom)

def get_secondary_color(asset: GlyphAsset, k=3):
    pil = asset.pil.resize((150,150))
    pixels = np.array(pil)
    mask = (pixels[:,:,3]>128) & ~((pixels[:,:,0]>240)&(pixels[:,:,1]>240)&(pixels[:,:,2]>240))
    points = pixels[mask][:,:3]
    if len(points)<5: return (200,200,200)
    kmeans = KMeans(n_clusters=k, n_init="auto").fit(points)
    centers = kmeans.cluster_centers_
    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    order = np.argsort(counts)[::-1]
    idx = order[1] if len(order)>1 else order[0]
    return tuple(int(x) for x in centers[idx])

def rgb_to_hex(rgb):
    return '{:02x}{:02x}{:02x}'.format(*rgb)

def rgb_to_lab(rgb):
    r,g,b = [x/255 for x in rgb]
    r = ((r+0.055)/1.055)**2.4 if r>0.04045 else r/12.92
    g = ((g+0.055)/1.055)**2.4 if g>0.04045 else g/12.92
    b = ((b+0.055)/1.055)**2.4 if b>0.04045 else b/12.92
    x = r*0.4124564 + g*0.3575761 + b*0.1804375
    y = r*0.2126729 + g*0.7151522 + b*0.0721750
    z = r*0.0193339 + g*0.1191920 + b*0.9503041
    x/=0.95047; z/=1.08883
    f = lambda t: t**(1/3) if t>0.008856 else 7.787*t+16/116
    L = 116*f(y)-16
    a = 500*(f(x)-f(y))
    b = 200*(f(y)-f(z))
    return (L,a,b)

def get_color_name(rgb):
    r,g,b = rgb
    h,s,v = colorsys.rgb_to_hsv(r/255,g/255,b/255)
    h*=360
    if s<0.1: return "white" if v>0.8 else "black" if v<0.2 else "gray"
    if h<15 or h>345: return "red"
    if h<45: return "orange"
    if h<75: return "yellow"
    if h<165: return "green"
    if h<255: return "blue"
    if h<290: return "purple"
    return "pink"

# ---------------------- PROCESSING GLYPHS ----------------------

def get_brightness(rgb): 
    r,g,b = rgb
    return 0.2126*r + 0.7152*g + 0.0722*b

def get_edge_density(asset: GlyphAsset):
    edges = cv2.Canny(asset.gray,80,160)
    return round(float(np.mean(edges>0)),4)

def get_entropy(asset: GlyphAsset):
    gray = rgb2gray(asset.rgb_np)
    return round(float(shannon_entropy(gray)),4)

def get_texture_complexity(asset: GlyphAsset):
    lbp = local_binary_pattern(asset.gray,8,1,"uniform")
    hist,_ = np.histogram(lbp.ravel(),bins=np.arange(0,11),density=True)
    entropy = -np.sum(hist*np.log2(hist+1e-12))
    return round(float(entropy),4)

def get_contrast(asset: GlyphAsset):
    g = asset.gray
    return round(float((g.max()-g.min())/(g.max()+g.min()+1e-5)),4)

def get_edge_orientation(asset: GlyphAsset):
    sobelx = cv2.Sobel(asset.gray,cv2.CV_64F,1,0,3)
    sobely = cv2.Sobel(asset.gray,cv2.CV_64F,0,1,3)
    mag = np.sqrt(sobelx**2+sobely**2)
    angle = np.degrees(np.arctan2(sobely,sobelx))
    strong = mag>np.percentile(mag,70)
    return float(abs(np.median(angle[strong]))%180) if strong.sum()>0 else 0.0

def get_shape_metrics(asset: GlyphAsset):
    g = asset.gray
    th = cv2.adaptiveThreshold(g,255,cv2.ADAPTIVE_THRESH_MEAN_C,cv2.THRESH_BINARY,31,-10)
    labeled = cv2.connectedComponentsWithStats(th,8)[1]
    props = regionprops(labeled)
    if not props: return (0.5,1.0)
    r = max(props,key=lambda r:r.area)
    circ = (4*np.pi*r.area)/(r.perimeter**2+1e-5)
    minr,minc,maxr,maxc = r.bbox
    ar = (maxc-minc)/(maxr-minr+1e-5)
    return round(float(circ),3), round(float(ar),3)

def get_color_harmony(dom,sec):
    h1 = colorsys.rgb_to_hsv(*[x/255 for x in dom])[0]*360
    h2 = colorsys.rgb_to_hsv(*[x/255 for x in sec])[0]*360
    d = abs(h1-h2)%360
    if d<30: return "analogous"
    if abs(d-180)<30: return "complementary"
    return "none"

def get_mood(rgb,entropy,edge,texture,contrast,circ,ar,angle,harmony):
    r,g,b = rgb
    brightness = get_brightness(rgb)
    maxc,minc = max(rgb), min(rgb)
    sat = (maxc-minc)/maxc if maxc else 0
    hue = colorsys.rgb_to_hsv(r/255,g/255,b/255)[0]*360
    if entropy<4 and edge<0.05 and sat<0.3: return "minimalistic"
    if entropy<4 and edge<0.05 and sat>=0.3: return "serene"
    if entropy<6 and edge<0.1 and sat>=0.4 and brightness>130: return "calm"
    if entropy>6 and edge>0.15 and texture>1.0: return "chaotic"
    if brightness<90 and hue>180 and contrast>0.4: return "mysterious"
    if brightness>150 and hue>200 and sat<0.35: return "futuristic"
    if sat>0.45 and entropy<6 and edge<0.1: return "energetic"
    if contrast>0.5 and entropy<6 and edge<0.1 and circ<0.6: return "dramatic"
    if sat>0.5 and brightness>120 and edge<0.1 and harmony=="analogous": return "playful"
    return "serene"

def process_glyphs(input_folder, output_folder, github_user, github_repo, branch="main", verbose=False):
    os.makedirs(output_folder,exist_ok=True)
    pngs = list(Path(input_folder).glob("*.png"))
    glyphs=[]
    for path in pngs:
        asset = GlyphAsset(path)
        dom = get_dominant_color(asset)
        sec = get_secondary_color(asset)
        hex_color = rgb_to_hex(dom)
        name = get_color_name(dom)
        lab = rgb_to_lab(dom)
        edge = get_edge_density(asset)
        ent = get_entropy(asset)
        tex = get_texture_complexity(asset)
        con = get_contrast(asset)
        circ,ar = get_shape_metrics(asset)
        ang = get_edge_orientation(asset)
        harmony = get_color_harmony(dom,sec)
        mood = get_mood(dom,ent,edge,tex,con,circ,ar,ang,harmony)

        now = datetime.now(timezone.utc)
        uid = uuid.uuid4().hex[:8]
        created_at = now.isoformat()
        newname = f"{hex_color}_{now.strftime('%Y%m%d_%H%M%S')}_{uid}.png"
        out_path = Path(output_folder)/newname
        shutil.copy2(path,out_path)
        url = f"https://cdn.jsdelivr.net/gh/{github_user}/{github_repo}@{branch}/glyphs/{newname}"

        glyph_data = {
            "id": uid,
            "filename": newname,
            "glyph_url": url,
            "color":{"hex":hex_color,"name":name,"rgb":list(dom),"lab":[round(x,2) for x in lab]},
            "metrics":{"edge_density":edge,"entropy":ent,"texture":tex,"contrast":con,"circularity":circ,"aspect_ratio":ar,"edge_angle":ang},
            "color_harmony":harmony,"mood":mood,"created_at":created_at
        }
        glyphs.append(glyph_data)
        if verbose: print(f"☑️ Processed {path.name} → {newname}")
    return glyphs

# ---------------------- DATA PIPELINE ----------------------

def batch_upload_to_github(repo, output_dir, branch="main"):
    """
    Commits local files to a GitHub repository branch using the Git Tree API.
    """
    files_to_commit = list(output_dir.glob("*"))
    if not files_to_commit: return
    
    file_mode = '100644' # Standard file mode for files

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
                    type='blob',
                    sha=blob.sha
                ))
            else:
                content = f.read_text("utf-8")
                elements.append(InputGitTreeElement(
                    path=f"data/{f.name}",
                    mode=file_mode,
                    type='blob',
                    content=content
                ))
        
        tree = repo.create_git_tree(elements, base_tree)
        parent = repo.get_git_commit(sb.commit.sha)
        commit = repo.create_git_commit(f"📦 Batch upload {len(elements)} files", tree, [parent])
        ref = repo.get_git_ref(f"heads/{branch}")
        ref.edit(commit.sha)
        print(f"🌀 Batch commit successful: {len(elements)} files uploaded")
    except GithubException as e:
        print(f"✖ GitHub batch upload failed: {e}")

print("\n🔱 Select images to process:\n")
uploaded = files.upload()
if not uploaded:
    print("✖ No files uploaded.")
    raise SystemExit

input_dir = Path("/content/input_glyphs"); input_dir.mkdir(exist_ok=True)
output_dir = Path("/content/output_glyphs"); output_dir.mkdir(exist_ok=True)
for fname, data in uploaded.items(): (input_dir/fname).write_bytes(data)

print(f"⏳️ Processing {len(uploaded)} images…\n")
github_user = input("👾 GitHub username: ").strip() or "your-username"
github_repo = input("🗃️ GitHub repo name: ").strip() or "repo-library"
branch = input("🌿 Branch name (default=main): ").strip() or "main"

json_path = output_dir/"glyphs.catalog.json"
existing_metadata = {"total":0,"glyphs":[]}
try:
    g = Github()
    repo = g.get_user(github_user).get_repo(github_repo)
    file_content = repo.get_contents("data/glyphs.catalog.json")
    existing_metadata = json.loads(file_content.decoded_content.decode())
except:
    if json_path.exists():
        existing_metadata = json.load(open(json_path,"r",encoding="utf-8"))

new_glyphs = process_glyphs(input_dir, output_dir, github_user, github_repo, branch=branch, verbose=False)
all_glyphs = existing_metadata.get("glyphs",[]) + new_glyphs
metadata = {"total":len(all_glyphs),"glyphs":all_glyphs}

with open(json_path,'w',encoding='utf-8') as f: json.dump(metadata,f,indent=2)
js_path = output_dir/"glyphs.catalog.js"
js_code = "// Glyph Data\nconst GLYPH_DATA = [\n" + "".join(f"  {json.dumps(g)},\n" for g in all_glyphs) + "];\n"
js_path.write_text(js_code,"utf-8")

print(f"📡 {len(new_glyphs)} glyphs processed")

print("\n🗄️ Where to save results?")
print("1️⃣ Local ZIP")
print("2️⃣ Autoload directly to GitHub")
choice = input("CHOOSE 1 OR 2: ").strip()

if choice=="1":
    zip_path = Path("/content")/"glyphs_processed.zip"
    with zipfile.ZipFile(zip_path,"w") as zipf:
        for f in output_dir.glob("*"): zipf.write(f, f.name)
    save_folder = Path(input("Enter local folder path to save ZIP: ").strip()); save_folder.mkdir(parents=True,exist_ok=True)
    shutil.copy2(zip_path, save_folder/"glyphs_processed.zip")
    print(f"📦 ZIP saved locally to: {save_folder/'glyphs_processed.zip'}")

elif choice=="2":
    gh_token = getpass("🔑 GitHub Personal Access Token: ").strip()
    g = Github(auth=Auth.Token(gh_token))
    user = g.get_user()
    try:
        repo = user.get_repo(github_repo)
        print(f"✔ Repo found: {github_repo}")
    except GithubException:
        print(f"⚠ Repo '{github_repo}' not found — creating it now...")
        repo = user.create_repo(github_repo, private=False)
        repo.create_file("glyphs/.gitkeep","Init glyphs folder","",branch=branch)
        repo.create_file("data/.gitkeep","Init data folder","",branch=branch)
        print("🗂️ Base folders created ('glyphs/' and 'data/')")
    batch_upload_to_github(repo, output_dir, branch)
    if existing_metadata.get("glyphs"):
        print(f"🎊 ALL DONE! Library successfully expanded to {len(all_glyphs)} glyphs in total.")
    else:
        print("🎊 ALL DONE!")
else:
    print("✖ Invalid option. Files remain in /content/output_glyphs.")
