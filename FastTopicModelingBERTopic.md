# Fast Topic Modeling on Large Text Data with BERTopic

- Uses **state-of-the-art transformer embeddings** (like BERT) for better semantic understanding
- Clusters documents into meaningful topics automatically
- Works well even on messy, short, or informal text (tweets, reviews)
- Easy to integrate with pandas and scalable for big datasets

### Quick Start Example

```python
# Install BERTopic first if you haven't:
# pip install bertopic

from bertopic import BERTopic
import pandas as pd

# Sample data
docs = [
    "I love machine learning and data science.",
    "Artificial intelligence and deep learning are fascinating.",
    "Python is great for data analysis.",
    "Football and sports events are fun to watch.",
    "The movie was thrilling and exciting.",
    "Basketball games keep me entertained.",
]

# Create BERTopic model
topic_model = BERTopic(verbose=True)

# Fit and transform documents
topics, probs = topic_model.fit_transform(docs)

# Show topics
print(topic_model.get_topic_info())

# Optional: Get topic keywords for topic 0
print(topic_model.get_topic(0))
```

### 🧠 What you get:

| Topic ID | Count | Name/Keywords |
| --- | --- | --- |
| -1 | 0 | Outliers (no topic) |
| 0 | 3 | learning, data, machine, python ... |
| 1 | 3 | sports, football, basketball, game |
| ... | ... | ... |

### ⚡ Pro Tips:

- Use with **big datasets** by passing documents in batches.
- Combine with **UMAP** or **HDBSCAN** for custom clustering parameters.
- Export results easily to pandas DataFrame for further analysis.

```python
import pandas as pd

df = pd.DataFrame({'doc': docs, 'topic': topics})
print(df)
```

# Fast Topic Modeling Pipeline with BERTopic

## Step 0: Install dependencies

```bash
pip install bertopic sentence-transformers umap-learn hdbscan pandas matplotlib
```

## Step 1: Full Python pipeline code

```python
import re
import pandas as pd
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
import matplotlib.pyplot as plt

# 1. Text cleaning function (simple and fast)
def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)      # Remove URLs
    text = re.sub(r"[^a-z\s]", "", text)                    # Remove non-letters
    text = re.sub(r"\s+", " ", text).strip()                # Remove extra spaces
    return text

# 2. Load & clean your large text data
def load_and_clean_data():
    # Example data (replace this with your big dataset load)
    docs = [
        "I love machine learning and data science.",
        "Artificial intelligence and deep learning are fascinating.",
        "Python is great for data analysis.",
        "Football and sports events are fun to watch.",
        "The movie was thrilling and exciting.",
        "Basketball games keep me entertained.",
        "Deep learning models achieve state-of-the-art results.",
        "Sports events bring communities together.",
        "Data scientists use Python and machine learning.",
        "I enjoy watching basketball and football.",
    ]
    cleaned_docs = [clean_text(doc) for doc in docs]
    return cleaned_docs, docs

# 3. Embed cleaned docs using a fast SentenceTransformer model
def embed_text(docs):
    model = SentenceTransformer('all-MiniLM-L6-v2')  # Small, fast, good accuracy
    embeddings = model.encode(docs, show_progress_bar=True)
    return embeddings

# 4. Train BERTopic model on embeddings
def train_bertopic(docs, embeddings):
    topic_model = BERTopic(
        umap_model=None,      # Use default UMAP (fast)
        hdbscan_model=None,   # Use default HDBSCAN
        verbose=True
    )
    topics, probs = topic_model.fit_transform(docs, embeddings)
    return topic_model, topics, probs

# 5. Visualize topics with interactive plots
def visualize(topic_model):
    topic_model.visualize_barchart(top_n_topics=10).show()
    topic_model.visualize_topics().show()
    topic_model.visualize_heatmap().show()
    topic_model.visualize_hierarchy().show()

def main():
    # Load and clean
    cleaned_docs, original_docs = load_and_clean_data()

    # Embed
    embeddings = embed_text(cleaned_docs)

    # Train model
    topic_model, topics, probs = train_bertopic(cleaned_docs, embeddings)

    # Create DataFrame with results
    df = pd.DataFrame({
        "document": original_docs,
        "cleaned": cleaned_docs,
        "topic": topics,
        "probability": probs
    })

    print("\nTopic assignments:")
    print(df)

    print("\nTopic info:")
    print(topic_model.get_topic_info())

    # Visualize
    visualize(topic_model)

if __name__ == "__main__":
    main()
```

## Notes on performance and scaling:

- `all-MiniLM-L6-v2` is a **fast, compact embedding model** great for large corpora.
- BERTopic’s defaults use **UMAP and HDBSCAN** tuned for speed and quality.
- For really huge datasets, consider:
    - **Batch embedding** (encode texts in chunks)
    - **Incremental topic modeling** or sampling
    - Tuning UMAP (`n_neighbors`, `min_dist`) and HDBSCAN (`min_cluster_size`) params for performance

## What this pipeline does:

| Stage | Description |
| --- | --- |
| Cleaning | Lowercase + remove URLs/non-alpha + trim |
| Embedding | SentenceTransformer embeddings for docs |
| Modeling | BERTopic clusters embeddings into topics |
| Mapping | Assign topics + probabilities to docs |
| Visualization | Interactive charts (bar, scatter, heatmap, hierarchy) |

# Scalable Batch Processing + Topic Modeling + Export

### Step 0: Install packages (if not done)

```bash
pip install bertopic sentence-transformers umap-learn hdbscan pandas matplotlib tqdm
```

### Step 1: Complete Python script

```python
import re
import pandas as pd
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
from tqdm.auto import tqdm

# 1. Cleaning function
def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

# 2. Load data (replace this with your own big dataset loading)
def load_data():
    # Example large dataset (you should load from file or DB)
    docs = [
        "I love machine learning and data science.",
        "Artificial intelligence and deep learning are fascinating.",
        "Python is great for data analysis.",
        "Football and sports events are fun to watch.",
        "The movie was thrilling and exciting.",
        "Basketball games keep me entertained.",
        "Deep learning models achieve state-of-the-art results.",
        "Sports events bring communities together.",
        "Data scientists use Python and machine learning.",
        "I enjoy watching basketball and football.",
    ] * 1000  # Simulate large dataset by repetition
    return docs

# 3. Batch embedding function
def batch_embed(docs, model, batch_size=64):
    embeddings = []
    for i in tqdm(range(0, len(docs), batch_size), desc="Embedding batches"):
        batch = docs[i:i+batch_size]
        emb = model.encode(batch, show_progress_bar=False)
        embeddings.extend(emb)
    return embeddings

def main():
    # Load and clean
    raw_docs = load_data()
    cleaned_docs = [clean_text(doc) for doc in raw_docs]

    # Load embedding model
    embedder = SentenceTransformer('all-MiniLM-L6-v2')

    # Embed in batches
    embeddings = batch_embed(cleaned_docs, embedder, batch_size=128)

    # Initialize and train BERTopic
    topic_model = BERTopic(verbose=True)
    topics, probs = topic_model.fit_transform(cleaned_docs, embeddings)

    # Create DataFrame for export
    df = pd.DataFrame({
        "document": raw_docs,
        "cleaned_document": cleaned_docs,
        "topic": topics,
        "probability": probs
    })

    print("\nSample of topic assignments:")
    print(df.head())

    # Export to CSV
    df.to_csv("topic_modeling_results.csv", index=False)
    print("\nResults saved to topic_modeling_results.csv")

    # Show topic info
    print("\nTopic Info:")
    print(topic_model.get_topic_info())

    # Visualize topics
    topic_model.visualize_barchart(top_n_topics=10).show()
    topic_model.visualize_topics().show()
    topic_model.visualize_heatmap().show()
    topic_model.visualize_hierarchy().show()

if __name__ == "__main__":
    main()
```

### Explanation:

| Part | Details |
| --- | --- |
| **Batch embedding** | Processes data in chunks with tqdm progress bar for large data |
| **Data export** | Saves the topic assignments + probabilities + original text |
| **Visualizations** | Interactive plots for deep topic analysis |
| **Scalability** | Handles thousands+ documents efficiently |

### How to scale further:

- Increase batch size if memory allows.
- If data is huge (millions of docs), consider chunking input files or streaming data.
- You can also save embeddings after batch encoding to reuse later.

# Interactive Topic Exploration Dashboard with Streamlit

## Step 0: Install Streamlit if you haven’t yet

```bash
pip install streamlit
```

## Step 1: Dashboard Python script

Save this as `topic_dashboard.py`:

```python
import streamlit as st
import pandas as pd
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
import re

# Text cleaning function
def clean_text(text):
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

@st.cache_data(show_spinner=False)
def load_and_prepare_data():
    # Replace with your own big data loading here
    docs = [
        "I love machine learning and data science.",
        "Artificial intelligence and deep learning are fascinating.",
        "Python is great for data analysis.",
        "Football and sports events are fun to watch.",
        "The movie was thrilling and exciting.",
        "Basketball games keep me entertained.",
        "Deep learning models achieve state-of-the-art results.",
        "Sports events bring communities together.",
        "Data scientists use Python and machine learning.",
        "I enjoy watching basketball and football.",
    ] * 100  # Simulate larger dataset

    cleaned_docs = [clean_text(doc) for doc in docs]

    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = embedder.encode(cleaned_docs, show_progress_bar=True)

    topic_model = BERTopic(verbose=False)
    topics, probs = topic_model.fit_transform(cleaned_docs, embeddings)

    df = pd.DataFrame({
        "Original Document": docs,
        "Cleaned Document": cleaned_docs,
        "Topic": topics,
        "Probability": probs
    })

    return topic_model, df

def main():
    st.title("📊 BERTopic Interactive Dashboard")

    topic_model, df = load_and_prepare_data()

    # Show topic info
    st.header("Topic Summary")
    st.dataframe(topic_model.get_topic_info())

    # Select topic to explore
    topic_list = topic_model.get_topic_info()
    topic_ids = topic_list.Topic.tolist()
    topic_ids.remove(-1)  # remove outliers

    selected_topic = st.selectbox("Select Topic to explore", topic_ids)

    if selected_topic is not None:
        st.subheader(f"Top keywords for Topic {selected_topic}")
        keywords = topic_model.get_topic(selected_topic)
        st.write(", ".join([kw[0] for kw in keywords]))

        st.subheader(f"Documents assigned to Topic {selected_topic}")
        docs_topic = df[df["Topic"] == selected_topic]
        st.write(docs_topic[["Original Document", "Probability"]])

    # Show interactive visualizations (optional)
    st.header("Visualizations")
    st.write("Bar chart of top keywords per topic:")
    fig_bar = topic_model.visualize_barchart()
    st.plotly_chart(fig_bar)

    st.write("2D UMAP projection of documents colored by topic:")
    fig_topics = topic_model.visualize_topics()
    st.plotly_chart(fig_topics)

if __name__ == "__main__":
    main()
```

## Step 2: Run the dashboard

In your terminal:

```bash
streamlit run topic_dashboard.py
```

## What you get:

- Topic summary table with number of docs per topic
- Dropdown to select a topic and see its **top keywords** + **documents assigned**
- Interactive **bar chart** and **UMAP 2D visualization** right in the dashboard
- Fast, smooth, and easy to extend

# 📦 Package & Deploy Streamlit Dashboard for BERTopic

## 1. Prepare your project folder

Organize your files like this:

```
/bertopic_dashboard/
│
├── topic_dashboard.py       # Your Streamlit app script
├── requirements.txt         # Python dependencies
└── README.md                # (Optional) project info
```

## 2. Create `requirements.txt`

Put all needed packages:

```
streamlit
bertopic
sentence-transformers
umap-learn
hdbscan
pandas
matplotlib
tqdm
```

If you want a specific version pinned for stability, you can do:

```bash
pip freeze > requirements.txt
```

to capture exact versions after installing everything.

## 3. (Optional) Create a `setup.sh` for easy setup (especially for Linux)

```bash
#!/bin/bash
pip install --upgrade pip
pip install -r requirements.txt
```

Make executable:

```bash
chmod +x setup.sh
```

## 4. Run your app locally

```bash
streamlit run topic_dashboard.py

```

Make sure it works fine locally before deployment.

## 5. Deploy options

### a) **Streamlit Community Cloud (Free & Easy)**

- Push your project folder to a **GitHub repo**.
- Sign up/login at [Streamlit Cloud](https://streamlit.io/cloud).
- Connect your repo and deploy directly.
- Streamlit Cloud will install from `requirements.txt` and run `streamlit run topic_dashboard.py`.
- Your app is live with zero infra management!

### b) **Deploy on Heroku**

- Create `Procfile` with:

```
web: streamlit run topic_dashboard.py --server.port=$PORT --server.enableCORS=false
```

- Use Heroku CLI to create app and push code.
- Make sure you have `requirements.txt` in your repo.
- Full Heroku tutorial: [https://devcenter.heroku.com/articles/getting-started-with-python](https://devcenter.heroku.com/articles/getting-started-with-python)

### c) **Docker container (for custom infra)**

Create `Dockerfile`:

```docker
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "topic_dashboard.py", "--server.port=8501", "--server.enableCORS=false"]
```

Build & run:

```bash
docker build -t bertopic_dashboard .
docker run -p 8501:8501 bertopic_dashboard
```

Deploy on any Docker-friendly platform (AWS, GCP, Azure, DigitalOcean).

## 6. Tips for production readiness

- Cache heavy computations in Streamlit (`@st.cache_data` or `@st.cache_resource`) to speed up reloads.
- Limit dataset size or implement pagination for huge corpora.
- Monitor logs for memory and CPU usage.
- Secure deployment if needed (authentication, HTTPS, etc).