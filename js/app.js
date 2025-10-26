// js/app.js
// Main UI logic for index.html and utility functions used by personal/business pages.

/**
 * Utilities
 */
function formatCurrency(val) {
  const n = Number(val) || 0;
  return `${CONFIG.CURRENCY_SYMBOL}${n.toLocaleString('en-IN')}`;
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.innerText = txt;
}

/**
 * INDEX.HTML specific: handle add transaction form
 */
document.addEventListener("DOMContentLoaded", () => {
  // If transaction form exists on the page (index.html), wire it
  const txForm = document.getElementById("transactionForm");
  if (txForm) {
    txForm.addEventListener("submit", async (evt) => {
      evt.preventDefault();
      const payload = {
        type: document.getElementById("type").value || "Personal",
        entryType: document.getElementById("transactionType").value || "Expense",
        category: document.getElementById("category").value || "Uncategorized",
        mode: document.getElementById("mode").value || "Cash",
        amount: Number(document.getElementById("amount").value) || 0,
        description: document.getElementById("description").value || "",
        date: (new Date()).toISOString().slice(0,10),
        status: "Paid",
        relatedParty: "",
        addedBy: "Admin"
      };

      // Basic validation
      if (!payload.type || !payload.entryType || !payload.category || !payload.mode || !payload.amount) {
        alert("Please fill required fields.");
        return;
      }

      // Disable submit while sending
      const submitBtn = txForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerText = "Saving...";

      try {
        const res = await addTransaction(payload);
        if (res && res.success) {
          alert("Transaction saved.");
          txForm.reset();
          // reload summary & charts
          await refreshMainDashboard();
        } else {
          alert("Error: " + (res.message || "Unknown"));
          console.error(res);
        }
      } catch (err) {
        console.error(err);
        alert("Network or server error.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Add Transaction";
      }
    });

    // initial load
    refreshMainDashboard();
  }

  // If personal/business pages call fetchData on DOMContentLoaded externally,
  // they'll use window.fetchData that's defined below.
});

/**
 * Refresh main dashboard summary & charts (index.html)
 */
async function refreshMainDashboard() {
  // summary for all data
  const summaryRes = await getSummary(null);
  if (summaryRes && summaryRes.success) {
    const s = summaryRes.data;
    setText("cashBalance", `Cash: ${formatCurrency(s.cashBalance)}`);
    setText("bankBalance", `Bank: ${formatCurrency(s.bankBalance)}`);
    // creditBalance compute: total credit mode transactions with negative effect (simple)
    const creditVal = (s.totalIncome - s.totalExpense) - (s.cashBalance + s.bankBalance);
    setText("creditBalance", `Credit: ${formatCurrency(creditVal)}`);
    setText("totalExpense", `Total Expense: ${formatCurrency(s.totalExpense)}`);
    setText("totalIncome", `Total Income: ${formatCurrency(s.totalIncome)}`);
  } else {
    console.error("Failed to load summary", summaryRes);
  }

  // load transactions to build expense chart (all expense tx)
  const txRes = await getTransactions({}); // all
  if (txRes && txRes.success) {
    const txs = txRes.data || [];
    // render expense chart - use only expense entries
    const expenseTx = txs.filter(t => t.entryType === "Expense");
    window.renderExpenseChart(expenseTx, "expenseChart");
  } else {
    console.error("Failed to load transactions", txRes);
  }
}

/**
 * fetchData(type) used by personal.html and business.html
 * - type = "Personal" or "Business"
 */
async function fetchData(type) {
  // Summary for specific type
  const summaryRes = await getSummary(type);
  if (!summaryRes || !summaryRes.success) {
    alert("Failed to load summary.");
    console.error(summaryRes);
    return;
  }
  const s = summaryRes.data;

  // Update DOM id names differ per page; use safe setters
  const map = {
    Personal: {
      cash: "personalCash",
      bank: "personalBank",
      credit: "personalCredit",
      totalExpense: "personalTotalExpense",
      totalIncome: "personalTotalIncome",
      chartId: "personalChart",
      tableId: "personalTable"
    },
    Business: {
      cash: "businessCash",
      bank: "businessBank",
      credit: "businessCredit",
      totalExpense: "businessTotalExpense",
      totalIncome: "businessTotalIncome",
      chartId: "businessChart",
      tableId: "businessTable"
    }
  };

  const ids = map[type];
  if (!ids) return;

  setText(ids.cash, `Cash: ${formatCurrency(s.cashBalance)}`);
  setText(ids.bank, `Bank: ${formatCurrency(s.bankBalance)}`);
  // credit: compute simple
  const creditVal = (s.totalIncome - s.totalExpense) - (s.cashBalance + s.bankBalance);
  setText(ids.credit, `Credit: ${formatCurrency(creditVal)}`);
  setText(ids.totalExpense, `Total Expense: ${formatCurrency(s.totalExpense)}`);
  setText(ids.totalIncome, `Total Income: ${formatCurrency(s.totalIncome)}`);

  // Load transactions for listing and charts
  const txRes = await getTransactions({ type: type });
  if (txRes && txRes.success) {
    const txs = txRes.data || [];
    // render chart by category for expenses only
    const expenseTx = txs.filter(t => t.entryType === "Expense");
    window.renderExpenseChart(expenseTx, ids.chartId);

    // fill table
    const table = document.querySelector(`#${ids.tableId} tbody`);
    if (table) {
      table.innerHTML = "";
      const rows = txs.sort((a,b) => (a.date < b.date ? 1 : -1));
      rows.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.date}</td>
          <td>${r.category}</td>
          <td>${r.entryType}</td>
          <td>${r.mode}</td>
          <td>${formatCurrency(r.amount)}</td>
        `;
        table.appendChild(tr);
      });
    }
  } else {
    console.error("No transactions:", txRes);
  }
}

// expose fetchData globally so html pages can call it inline
window.fetchData = fetchData;
window.refreshMainDashboard = refreshMainDashboard;




// ========== DARK MODE TOGGLE ==========
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const body = document.body;

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    toggleBtn.textContent = "☀️ Light Mode";
  }

  toggleBtn.addEventListener("click", () => {
    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
      toggleBtn.textContent = "☀️ Light Mode";
      localStorage.setItem("theme", "dark");
    } else {
      toggleBtn.textContent = "🌙 Dark Mode";
      localStorage.setItem("theme", "light");
    }
  });
});
