// js/charts.js
// Chart.js helpers. Creates/destroys chart instances cleanly.

const CHARTS = {}; // hold Chart instances by canvas id

/**
 * Aggregate expenses by category and render a pie chart.
 * txs: array of transactions (objects with category and amount)
 * canvasId: id of <canvas> element
 */
function renderExpenseChart(txs, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Aggregate amounts per category
  const agg = {};
  txs.forEach(t => {
    const cat = (t.category || 'Uncategorized').toString();
    const amt = Number(t.amount) || 0;
    if (!agg[cat]) agg[cat] = 0;
    agg[cat] += amt;
  });

  const labels = Object.keys(agg);
  const data = labels.map(l => agg[l]);

  // If no data, show placeholder single slice
  const finalLabels = labels.length ? labels : ["No expenses"];
  const finalData = data.length ? data : [1];

  // Destroy existing chart for this canvas
  if (CHARTS[canvasId]) {
    try { CHARTS[canvasId].destroy(); } catch (err) { /* ignore */ }
    CHARTS[canvasId] = null;
  }

  const ctx = canvas.getContext("2d");
  CHARTS[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: finalLabels,
      datasets: [{
        data: finalData,
        // Chart.js will pick default colors; do not hardcode per instructions
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: {
          label: function(context) {
            const val = context.parsed || 0;
            return `${context.label}: ${CONFIG.CURRENCY_SYMBOL}${Number(val).toLocaleString('en-IN')}`;
          }
        }}
      }
    }
  });
}

// Expose for index and page scripts
window.renderExpenseChart = renderExpenseChart;
