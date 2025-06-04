# 📦 BKS Packing Summary by Order

Tampermonkey userscript to summarize packing status and CBM per Order ID on [admin.bksmotors.com](https://admin.bksmotors.com/).

---

## ✨ Features

- 🔍 Adds a **"Summarize Orders (Multi-Page)"** button to the Packing Report page.
- 📄 Automatically scrapes **all paginated results** (200 rows per page).
- 📦 Groups data **by Order ID**, even if multiple orders are shown on the same page.
- 🧮 Displays per-order summary:
  - Total Ordered Quantity
  - Packed Quantity
  - Balance Quantity
  - Order Value
  - Packed Goods Value
  - ✅ **Total CBM (based on unique packing box barcodes)**

---

## 📐 CBM Calculation

- Extracts **box size** from the `.col-pack_box_items` column (e.g., `116x18x122` in cm).
- Extracts **box barcode** from `.col-packing_box_barcode` (e.g., `VHP0033`).
- Deduplicates based on **barcode**, ensuring CBM is calculated only once per unique box.
- Calculates CBM using the formula:


- Displays **total CBM** per Order ID.

---

## 🖥️ How to Use

1. **Install Tampermonkey** browser extension (if not already).
2. **Add this userscript** to Tampermonkey.
3. Go to the [Packing Report page](https://admin.bksmotors.com/) on the BKS admin panel.
4. Search for any Order ID or Name.
5. Click **"🔍 Summarize Orders (Multi-Page)"**.
6. See detailed summaries and total CBM at the top.

---

## 🛠 Debugging & Reliability

- Includes debug logging (`[BKS-Summary]` prefix in browser console).
- Handles pagination automatically via `.action-next`.
- Includes error handling for slow page loads or missing rows.

---

## 📸 Screenshot

> *(Add a screenshot of the UI summary here if possible)*

---


---

## 🤝 Contribute

Found a bug or want to add a feature? Open an issue or pull request. Contributions welcome!

