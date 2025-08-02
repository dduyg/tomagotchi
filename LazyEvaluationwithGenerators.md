# Lazy Evaluation with Generators for Large Data Pipelines

When dealing with large datasets (like millions of rows from logs, IoT, or streaming sources), you **don’t want to load it all into memory** or apply all transformations at once.

Using **generators**, you can process the data **one row at a time**, apply **composable transformations**, and **reduce memory usage**.

### Example: Streaming CSV Processing with Generator Pipelines

```python
import csv

# Step 1: Create a lazy row generator
def read_large_csv(file_path):
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row  # yields one row at a time

# Step 2: Define composable transformation functions
def filter_invalid_age(rows):
    for row in rows:
        if row['age'] and int(row['age']) > 0:
            yield row

def normalize_salary(rows):
    for row in rows:
        row['salary'] = float(row['salary']) / 100000  # scale salary
        yield row

def encode_gender(rows):
    mapping = {'M': 0, 'F': 1}
    for row in rows:
        row['gender'] = mapping.get(row['gender'], -1)
        yield row

# Step 3: Chain transformations lazily
def process_pipeline(file_path):
    pipeline = read_large_csv(file_path)
    pipeline = filter_invalid_age(pipeline)
    pipeline = normalize_salary(pipeline)
    pipeline = encode_gender(pipeline)

    for row in pipeline:
        yield row

# Usage: process millions of rows with almost no memory overhead
for processed_row in process_pipeline('big_dataset.csv'):
    print(processed_row)
```

### ⚡️ Benefits:

- Processes arbitrarily large files without RAM overload
- Transformation steps are **modular and reusable**
- Lazy evaluation = blazing fast for streaming or incremental ML training

### 🧪 Bonus:

Combine this with:

- `itertools` (for slicing, batching)
- `toolz` or `funcy` (for functional-style pipelines)
- `yield from` (for cleaner composition)