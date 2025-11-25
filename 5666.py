"""
Automating the extraction, analysis, and storage of glyph images with detailed metadata.

🔱 GLYPH PROCESSOR
workflow for batch processing and cataloging glyph images.

- Load images and process them to generate renamed outputs and metadata
- Extract dominant and secondary colors using K-means clustering
- Compute quantitative visual metrics: edge density, entropy, texture complexity, contrast, shape metrics, edge orientation
- Evaluate color harmony and overall mood classification
- Metadata: Incremental updates stored in JSON and CSV
- Flexible storage options:
    1. Export locally as a ZIP archive
    2. Directly commit to a GitHub repository via API (images → glyphs/, data → data/)
- GitHub Integration:
    • Auto-creates repository and base folders if missing
    • Compatible with batch uploads for continuous library expansion
    • Generates CDN-ready URLs for each glyph
"""





