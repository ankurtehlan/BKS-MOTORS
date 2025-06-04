// ==UserScript==
// @name         BKS Packing Summary by Order
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Summarize packing status by order ID across all pages with debug logs
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

    function waitForPageChange(prevPage, maxWait = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                const currPage = document.querySelector("#orderitemGrid_page-current")?.value;
                if (currPage && currPage !== prevPage) return resolve(true);
                if (Date.now() - start > maxWait) return reject("Timeout waiting for page change");
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
        const orderMap = {};
        let rowCount = 0;

        for (const row of rows) {
            rowCount++;

            const orderEl = row.querySelector(".col-increment_id a");
            const qtyEl = row.querySelector(".col-qty_ordered");
            const packedEl = row.querySelector(".col-packed_qty");
            const priceEl = row.querySelector(".col-price");

            if (!orderEl || !qtyEl || !packedEl || !priceEl) {
                log(`⚠️ Skipping row ${rowCount}: Missing column(s)`);
                continue;
            }

            const orderId = orderEl.textContent.trim();
            const qty = parseNumber(qtyEl.textContent);
            const packed = parseNumber(packedEl.textContent);
            const price = parseNumber(priceEl.textContent);

            const rowOrderValue = qty * price;
            const rowPackedValue = packed * price;

            log(`📦 [${orderId}] Row ${rowCount} -> Qty: ${qty}, Packed: ${packed}, Price: ${price}, RowValue: ${rowOrderValue}, PackedValue: ${rowPackedValue}`);

            if (!orderMap[orderId]) {
                orderMap[orderId] = {
                    rowCount: 0,
                    totalOrderQty: 0,
                    totalPackedQty: 0,
                    balanceQty: 0,
                    totalOrderValue: 0,
                    packedGoodsValue: 0
                };
            }

            const order = orderMap[orderId];
            order.rowCount++;
            order.totalOrderQty += qty;
            order.totalPackedQty += packed;
            order.totalOrderValue += rowOrderValue;
            order.packedGoodsValue += rowPackedValue;
        }

        for (const id in orderMap) {
            const o = orderMap[id];
            o.balanceQty = o.totalOrderQty - o.totalPackedQty;
        }

        return orderMap;
    }

    function displaySummary(summary, pageCount = 1, orderId = null) {
        const { rowCount, totalOrderQty, totalPackedQty, balanceQty, totalOrderValue, packedGoodsValue } = summary;

        const container = document.createElement("div");
        container.style = "background: #f0f8ff; padding: 10px; border: 2px solid #0077cc; font-family: sans-serif; margin: 10px 0;";
        container.innerHTML = `
            <h3>📦 Order ${orderId ? `<code>${orderId}</code>` : 'Summary'} (${rowCount} rows)</h3>
            🔢 <b>Total Order Qty:</b> ${totalOrderQty}<br>
            📦 <b>Total Packed Qty:</b> ${totalPackedQty}<br>
            🧮 <b>Balance Qty:</b> ${balanceQty}<br>
            💰 <b>Total Order Value:</b> ₹${totalOrderValue.toFixed(2)}<br>
            📦 <b>Packed Goods Value:</b> ₹${packedGoodsValue.toFixed(2)}
        `;

        document.querySelector(".admin__data-grid-header")?.prepend(container);
    }

    async function processAllPages() {
        const allOrders = {};
        let pageCount = 0;

        while (true) {
            pageCount++;
            log(`📄 Processing page ${pageCount}...`);

            const rows = await waitForRows();
            log(`✅ Found ${rows.length} rows on page ${pageCount}`);

            const pageOrders = await summarizeCurrentPage(rows);

            for (const orderId in pageOrders) {
                if (!allOrders[orderId]) {
                    allOrders[orderId] = { ...pageOrders[orderId] };
                } else {
                    const existing = allOrders[orderId];
                    const current = pageOrders[orderId];
                    existing.rowCount += current.rowCount;
                    existing.totalOrderQty += current.totalOrderQty;
                    existing.totalPackedQty += current.totalPackedQty;
                    existing.totalOrderValue += current.totalOrderValue;
                    existing.packedGoodsValue += current.packedGoodsValue;
                    existing.balanceQty = existing.totalOrderQty - existing.totalPackedQty;
                }
            }

            const nextBtn = document.querySelector(".admin__data-grid-pager .action-next");
            const isNextEnabled = nextBtn && !nextBtn.classList.contains("disabled");

            if (isNextEnabled) {
                const prevPage = document.querySelector("#orderitemGrid_page-current")?.value;
                nextBtn.click();
                await waitForPageChange(prevPage);
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                log("✅ No more pages. Finishing summary.");
                break;
            }
        }

        for (const orderId in allOrders) {
            displaySummary(allOrders[orderId], 1, orderId);
        }
    }

    function addSummaryButton() {
        const target = document.querySelector(".admin__data-grid-header");
        if (!target) return log("❌ Header not found");

        const btn = document.createElement("button");
        btn.textContent = "🔍 Summarize Orders (Multi-Page)";
        btn.style = "padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;";
        btn.onclick = async () => {
            log("🔄 Starting multi-page summary...");
            try {
                await processAllPages();
                log("✅ Summary complete");
            } catch (e) {
                log("❌ Error during summary:", e);
            }
        };

        target.prepend(btn);
        log("✅ Summary button injected.");
    }

    window.addEventListener("load", () => {
        log("📦 Page loaded. Injecting summary button...");
        setTimeout(addSummaryButton, 2000);
    });
})();
