# Automatically Detect & Fix Common DataFrame Issues with One-Liner Profiling + Fixing

Data often comes in messy — mixed dtypes, empty columns, useless identifiers, etc. This hack gives you a **smart one-liner utility** to **profile**, **clean**, and **optimize** your `pandas` DataFrame instantly.

### Smart Cleaner Function

```python
import pandas as pd

def auto_clean(df):
    return (
        df
        .copy()
        .dropna(axis=1, how='all')  # drop completely empty columns
        .loc[:, df.nunique() > 1]   # drop constant columns
        .convert_dtypes()           # optimize dtypes automatically
        .apply(lambda col: pd.to_datetime(col, errors='ignore') if col.dtype == 'object' else col)
    )
```

### 💡 Example Usage:

```python
raw_df = pd.DataFrame({
    'id': [1, 2, 3],
    'name': ['Alice', 'Bob', 'Charlie'],
    'constant_col': [0, 0, 0],
    'empty_col': [None, None, None],
    'date': ['2023-01-01', '2023-02-01', 'not_a_date'],
})

clean_df = auto_clean(raw_df)
print(clean_df.dtypes)
print(clean_df)
```

### 🔍 What It Does:

| Operation | Purpose |
| --- | --- |
| `.dropna(axis=1, how='all')` | Removes empty columns |
| `df.nunique() > 1` | Removes constant (non-informative) cols |
| `.convert_dtypes()` | Switches to best memory-efficient types |
| `pd.to_datetime(...)` | Tries to auto-convert object → datetime |

### ⚡️ Bonus Upgrade: Add Logging

```python
def auto_clean_verbose(df):
    before_cols = df.shape[1]
    df_cleaned = auto_clean(df)
    after_cols = df_cleaned.shape[1]
    print(f"Dropped {before_cols - after_cols} non-informative columns.")
    return df_cleaned
```