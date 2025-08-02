# Fuzzy Matching + Auto-Correction in Pandas Using RapidFuzz

### Use case:

- Fix messy strings like `"Jon Smith"` vs `"John Smiht"` vs `"J. Smith"`
- Deduplicate entries with typos or different formats
- Automatically map messy entries to a clean master list

### Example Using `RapidFuzz`

```python
import pandas as pd
from rapidfuzz import process, fuzz

# Messy data
df = pd.DataFrame({
    'name': ['Jon Smith', 'John Smith', 'J. Smith', 'John Smiht', 'Smith, John', 'Jane Doe']
})

# Master list of known correct names
known_names = ['John Smith', 'Jane Doe']

# Function to find best fuzzy match
def fuzzy_match(name, choices, score_cutoff=80):
    match = process.extractOne(name, choices, scorer=fuzz.token_sort_ratio, score_cutoff=score_cutoff)
    return match[0] if match else name  # Return matched name or original

# Apply the fuzzy matching
df['corrected_name'] = df['name'].apply(lambda x: fuzzy_match(x, known_names))

print(df)

```

### 📊 Output:

| name | corrected_name |
| --- | --- |
| Jon Smith | John Smith |
| John Smith | John Smith |
| J. Smith | John Smith |
| John Smiht | John Smith |
| Smith, John | John Smith |
| Jane Doe | Jane Doe |

### Why This Hack Is Powerful:

- Handles **typos, abbreviations, and formatting issues**
- Uses `RapidFuzz`, which is **10–100x faster** than `fuzzywuzzy`
- Easy to integrate into cleaning pipelines before ML or database sync

### Cache Matches to Speed Up Repeated Processing

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_match(name):
    return fuzzy_match(name, tuple(known_names))  # tuple for hashability
```