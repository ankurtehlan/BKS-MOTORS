# 📦 BKS Packing Summary (Multi-Page + Per Order)

This Tampermonkey script automates and summarizes the **packing status** of orders from [admin.bksmotors.com](https://admin.bksmotors.com), supporting **multi-page extraction** and **grouped summaries by order ID**.

---

## ✅ Features

- 🔄 Loops through **all available pages** in the data grid
- 🧾 Groups and summarizes data **per order ID** (e.g., `1000007030`)
- 📊 Shows total ordered quantity, packed quantity, balance, and values
- 💰 Calculates and displays **total & packed value** in ₹ (INR)
- 🧮 Summary boxes injected directly into the admin panel UI
- 🪵 Includes **debug logs** for troubleshooting and transparency

---

## 📸 Example Output

If three orders exist (e.g., `1000007030`, `1000007031`, `1000007032`), the script displays:

![Screenshot 2025-06-03 172450](https://github.com/user-attachments/assets/b6f7de34-0de6-4fc4-80d8-aa006d79c1ee)



---

## 🚀 How to Use

1. **Install Tampermonkey**:  
   [Download Tampermonkey](https://www.tampermonkey.net/) for Chrome, Firefox, Edge, etc.

2. **Create New Script**:  
   Open the Tampermonkey dashboard and click **“Create a new script”**.

3. **Paste the Code**:  
   Use the full script from this repo or your local file.

4. **Save and Refresh**:  
   Save the script, then visit [admin.bksmotors.com](https://admin.bksmotors.com) and go to the relevant page.

5. **Click Button**:  
   Click the green button that appears at the top:  
   `🔍 Summarize Orders (Multi-Page)`

---

## 🛠 Technical Details

- Script waits for rows to load on each page
- It automatically clicks “Next Page” if available
- Collects data for each order across all pages
- Injects summary containers above the grid
- Uses CSS classes:
  - `.col-increment_id` → Order ID
  - `.col-qty_ordered` → Ordered Quantity
  - `.col-packed_qty` → Packed Quantity
  - `.col-price` → Price per unit

---

## 📄 License

This script is intended for internal use within BKS Motors admin tooling.  
Feel free to extend or adapt it with appropriate credit.

---
