# About Dataset

### 📱 Smartphone Specifications and Ratings Dataset (2025)

This dataset contains detailed specifications and performance attributes of **1,006 smartphones** from leading brands such as Apple, Samsung, OnePlus, Realme, Xiaomi, and others.

It has been **cleaned, standardized, and feature-engineered** for data analysis and machine learning applications.

The dataset includes **29 attributes** covering price, hardware, display, camera, battery, connectivity, and efficiency metrics — enabling comparative analysis, price prediction, and consumer insights.

## 📊 Dataset Summary

| Category | Description |
| --- | --- |
| **Total Records** | 1,006 smartphones |
| **Total Features** | 29 |
| **File Format** | CSV (`smartphone_specs.csv`) |
| **Last Updated** | October 2025 |
| **Source** | [https://www.kaggle.com/datasets/anikchand/smartphones-cleaned/data](https://www.kaggle.com/datasets/anikchand/smartphones-cleaned/data): Data compiled and feature-engineered from publicly available smartphone specifications  |

## Feature Description

| Feature Name | Type | Description |
| --- | --- | --- |
| `model` | *string* | Smartphone model name |
| `rating` | *float* | Average user rating (out of 5) |
| `os` | *string* | Operating system and version (e.g., Android v13, iOS v16) |
| `brand` | *string* | Manufacturer/brand name |
| `price_numeric` | *float* | Smartphone price in INR (Indian Rupees ₹) |
| `capacity` | *int* | Battery capacity (mAh) |
| `battery_watt` | *float* | Charging wattage (W) |
| `charging_type` | *string* | Charging type (Fast / Slow) |
| `RAM` | *int* | RAM size (in GB) |
| `ROM` | *int* | Storage capacity (in GB) |
| `Dual_Sim` | *int (0/1)* | Indicates whether dual SIM is supported |
| `5G` | *int (0/1)* | Indicates if the phone supports 5G connectivity |
| `NFC` | *int (0/1)* | NFC availability |
| `WiFi` | *int (0/1)* | WiFi support indicator |
| `IR_Blaster` | *int (0/1)* | IR blaster availability |
| `Processor_Name` | *string* | Name of the chipset (e.g., Snapdragon 8 Gen 2) |
| `Processor_GHz` | *float* | Processor base frequency (GHz) |
| `num_core` | *int* | Number of CPU cores |
| `Front_camera` | *float* | Front camera megapixels |
| `Rear_camera` | *list[int]* | List of rear camera megapixels (e.g., [50, 8, 2]) |
| `No_of_rear_cameras` | *int* | Total number of rear cameras |
| `display_size` | *float* | Screen size in inches |
| `display_frequency` | *float* | Display refresh rate (Hz) |
| `Resolution` | *list[int]* | Screen resolution [width, height] |
| `card_supported` | *int (0/1)* | Whether expandable storage is supported |
| `ppi` | *float* | Pixel density (pixels per inch) |
| `screen_area_in2` | *float* | Approximate screen area in square inches |
| `battery_per_gb_ram` | *float* | Battery capacity per GB of RAM — efficiency metric |
| `watt_per_mah` | *float* | Charging wattage per mAh — charging efficiency metric |

## 🧮 Feature Engineering Notes

The dataset has been thoroughly preprocessed and enhanced through multiple feature engineering steps to improve its analytical value and usability for data-driven insights:

### 🔧 Basic Transformations

- **`price_numerical`** — extracted from the original `price` column by removing currency symbols (₹) and converting to a numeric format.
- **`model`** → parsed to identify the **`brand_name`** (e.g., Samsung, Xiaomi, OnePlus) for brand-level analysis.

### 📱 SIM & Connectivity Features

Derived from the `sim` column:

- **`dual_sim`** — binary indicator (Yes/No) for dual SIM support.
- **`supports_5g`** — identifies if the device supports 5G connectivity.
- **`nfc_support`** — indicates presence of NFC functionality.
- **`wifi_support`** — detects WiFi capability.
- **`ir_blaster`** — denotes whether the phone includes an IR blaster feature.

### 💾 Memory Features

Extracted from the `ram` column:

- **`ram_gb`** — amount of RAM in GB.
- **`rom_gb`** — internal storage (ROM) in GB.

### 🔋 Battery Features

Parsed from the `battery` column:

- **`battery_capacity`** — total battery capacity (in mAh).
- **`battery_watt`** — charging wattage derived from charger specifications.
- **`charging_type`** — categorized as fast, normal, or super-fast based on wattage.

### 🖥️ Display Features

Engineered from the `display` column:

- **`disp_size`** — display size in inches.
- **`disp_frequency`** — screen refresh rate (Hz).
- **`resolution`** — extracted pixel resolution.
- **`ppi`** — computed pixel density for sharpness comparison.
- **`screen_area_in2`** — estimated physical screen area in square inches using diagonal size and aspect ratio.

### 📸 Camera Features

Derived from the `camera` column:

- **`rear_camera`** — megapixel count of the main rear camera.
- **`num_rear_cameras`** — total number of rear cameras.
- **`front_camera`** — megapixel count of the selfie camera.

### 💳 Storage Expandability

- **`card_supported`** — binary indicator of whether external memory cards are supported.

### ⚙️ Processor Features

Extracted from the `processor` column:

- **`processor_name`** — chipset or SoC model (e.g., Snapdragon 8 Gen 2, MediaTek Dimensity).
- **`processor_ghz`** — clock speed (in GHz).
- **`num_cores`** — number of CPU cores (e.g., octa-core, hexa-core).

### 📈 Additional Engineered Ratios

- **`battery_per_gb_ram`** — battery capacity per GB of RAM; useful for analyzing endurance efficiency.
- **`watt_per_mah`** — charging speed efficiency metric (charging power relative to battery size).

## 🔍 Potential Use Cases

This dataset is ideal for:

- 📈 **Data analysis** — Brand comparison, feature trends, price distribution
- 🤖 **Machine learning** — Predicting smartphone price or user rating
- 🔬 **Feature correlation** — Understanding relationships between specs and performance
- 💡 **Market segmentation** — Clustering phones into budget, midrange, and flagship categories
- 📊 **Visualization projects** — Building dashboards or exploratory analysis notebooks

## 💡 Example Questions You Can Explore

- Do higher refresh rates or higher PPI correlate with better user ratings?
- How do prices vary by brand and OS version?
- What are the most battery-efficient smartphones (by watt_per_mah)?
- Which features most influence smartphone prices?
- Are 5G phones consistently rated higher than 4G models?
