// ==UserScript==
// @name         BKS Packing Summary All Pages
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Summarize packing status across all pages
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

    function waitForPageChange(previousPage, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                const currentPage = document.querySelector("#orderitemGrid_page-current")?.value;
                if (currentPage !== previousPage) return resolve();
                if (Date.now() - start > timeout) return reject("Timeout waiting for page change");
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

            totalOrderQty += qty;
            totalPackedQty += packed;
            totalOrderValue += qty * price;
            packedGoodsValue += packed * price;
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

    function displaySummary(summary, pageCount = 1) {
        const { rowCount, totalOrderQty, totalPackedQty, balanceQty, totalOrderValue, packedGoodsValue } = summary;

        const container = document.createElement("div");
        container.style = "background: #f0f8ff; padding: 10px; border: 2px solid #0077cc; font-family: sans-serif; margin: 10px 0;";
        container.innerHTML = `
            <h3>📊 Packing Report Summary (Processed ${rowCount} rows from ${pageCount} page${pageCount > 1 ? 's' : ''})</h3>
            🔢 <b>Total Order Qty:</b> ${totalOrderQty}<br>
            📦 <b>Total Packed Qty:</b> ${totalPackedQty}<br>
            🧮 <b>Balance Qty:</b> ${balanceQty}<br>
            💰 <b>Total Order Value:</b> ₹${totalOrderValue.toFixed(2)}<br>
            📦 <b>Packed Goods Value:</b> ₹${packedGoodsValue.toFixed(2)}
        `;

        document.querySelector(".admin__data-grid-header")?.prepend(container);
    }

    async function processAllPages() {
        let combined = {
            rowCount: 0,
            totalOrderQty: 0,
            totalPackedQty: 0,
            balanceQty: 0,
            totalOrderValue: 0,
            packedGoodsValue: 0
        };
        let pageCount = 0;

        while (true) {
            pageCount++;
            log(`🔍 Summarizing page ${pageCount}...`);
            const rows = await waitForRows();
            const summary = await summarizeCurrentPage(rows);
            Object.keys(combined).forEach(k => combined[k] += summary[k]);

            const nextBtn = document.querySelector(".admin__data-grid-pager .action-next");
            const isNextEnabled = nextBtn && !nextBtn.classList.contains("disabled");

            if (isNextEnabled) {
                const prevPage = document.querySelector("#orderitemGrid_page-current")?.value;
                nextBtn.click();
                await waitForPageChange(prevPage);
                await new Promise(resolve => setTimeout(resolve, 500)); // small delay after page change
            } else {
                log("✅ All pages processed.");
                break;
            }
        }

        displaySummary(combined, pageCount);
    }

    function addSummaryButton() {
        const target = document.querySelector(".admin__data-grid-header");
        if (!target) return log("❌ Header not found");

        const btn = document.createElement("button");
        btn.textContent = "📄 Summarize All Pages";
        btn.style = "padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;";
        btn.onclick = async () => {
            log("🔄 Starting full summary...");
            try {
                await processAllPages();
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
