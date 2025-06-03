// ==UserScript==
// @name         BKS Packing Summary Debug
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Summarize packing status with debug steps
// @match        https://admin.bksmotors.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function log(...args) {
        console.log('[BKS-Summary]', ...args);
    }

    function waitForRows(maxWait = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                const rows = document.querySelectorAll("table tbody tr");
                if (rows.length > 0) return resolve(rows);
                if (Date.now() - start > maxWait) return reject("Timeout waiting for rows");
                requestAnimationFrame(check);
            }
            check();
        });
    }

    function parseNumber(text) {
        try {
            return parseFloat(text.replace(/[^\d.]/g, '')) || 0;
        } catch (e) {
            return 0;
        }
    }

    async function summarizeCurrentPage(rows) {
        let totalOrderQty = 0;
        let totalPackedQty = 0;
        let totalOrderValue = 0;
        let packedGoodsValue = 0;

        let rowCount = 0;

        for (const row of rows) {
            rowCount++;

            const qtyEl = row.querySelector(".col-qty_ordered");
            const packedEl = row.querySelector(".col-packed_qty");
            const priceEl = row.querySelector(".col-price");

            if (!qtyEl || !packedEl || !priceEl) {
                log(`⚠️ Skipping row ${rowCount}: Missing column(s)`);
                continue;
            }

            const qty = parseNumber(qtyEl.textContent);
            const packed = parseNumber(packedEl.textContent);
            const price = parseNumber(priceEl.textContent);

            const rowOrderValue = qty * price;
            const rowPackedValue = packed * price;

            log(`Row ${rowCount} -> Qty: ${qty}, Packed: ${packed}, Price: ${price}, RowValue: ${rowOrderValue}, PackedValue: ${rowPackedValue}`);

            totalOrderQty += qty;
            totalPackedQty += packed;
            totalOrderValue += rowOrderValue;
            packedGoodsValue += rowPackedValue;
        }

        const balanceQty = totalOrderQty - totalPackedQty;

        return {
            rowCount,
            totalOrderQty,
            totalPackedQty,
            balanceQty,
            totalOrderValue,
            packedGoodsValue
        };
    }

    function displaySummary(summary) {
        const { rowCount, totalOrderQty, totalPackedQty, balanceQty, totalOrderValue, packedGoodsValue } = summary;

        const container = document.createElement("div");
        container.style = "background: #f0f8ff; padding: 10px; border: 2px solid #0077cc; font-family: sans-serif; margin: 10px 0;";
        container.innerHTML = `
            <h3>📊 Packing Report Summary (Processed ${rowCount} rows)</h3>
            🔢 <b>Total Order Qty:</b> ${totalOrderQty}<br>
            📦 <b>Total Packed Qty:</b> ${totalPackedQty}<br>
            🧮 <b>Balance Qty:</b> ${balanceQty}<br>
            💰 <b>Total Order Value:</b> ₹${totalOrderValue.toFixed(2)}<br>
            📦 <b>Packed Goods Value:</b> ₹${packedGoodsValue.toFixed(2)}
        `;

        document.querySelector(".admin__data-grid-header")?.prepend(container);
    }

    function addSummaryButton() {
        const target = document.querySelector(".admin__data-grid-header");
        if (!target) return log("❌ Header not found");

        const btn = document.createElement("button");
        btn.textContent = "🔍 Summarize Order (Debug)";
        btn.style = "padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;";
        btn.onclick = async () => {
            log("🔄 Starting summary with debug...");
            try {
                const rows = await waitForRows();
                log(`✅ Found ${rows.length} rows`);
                const summary = await summarizeCurrentPage(rows);
                displaySummary(summary);
                log("✅ Summary complete");
            } catch (e) {
                log("❌ Error during summary:", e);
            }
        };

        target.prepend(btn);
        log("✅ Summary button injected.");
    }

    window.addEventListener("load", () => {
        log("Page loaded. Injecting summary button...");
        setTimeout(addSummaryButton, 2000);
    });
})();
