async function loadReports() {
  const summary = await window.electronAPI.reports.getSummary();

  const eduSec = summary.today.educational || 0;
  const neutralSec = summary.today.neutral || 0;
  const blockedSec = summary.today.blocked || 0;
  const totalStudy = eduSec;

  const hours = Math.floor(totalStudy / 3600);
  const mins = Math.floor((totalStudy % 3600) / 60);
  document.getElementById('stat-study-time').textContent = `${hours}h ${mins}m`;
  document.getElementById('stat-focus-sessions').textContent = summary.focusSessions;
  document.getElementById('stat-blocked').textContent = summary.blockedAttempts;

  renderPieChart(eduSec, neutralSec, blockedSec);
  renderBarChart(summary.weekly);
  renderTopSites(summary.topSites);
}

function renderPieChart(edu, neutral, blocked) {
  const total = edu + neutral + blocked;
  if (total === 0) {
    edu = 1; neutral = 1; blocked = 1;
  }

  const ctx = document.getElementById('pie-chart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Educational', 'Neutral', 'Blocked'],
      datasets: [{
        data: [edu, neutral, blocked],
        backgroundColor: ['#30d158', '#0A84FF', '#ff6b6b'],
        borderColor: '#0f1229',
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#8b8fa3',
            padding: 16,
            font: { size: 12, family: '-apple-system, system-ui, sans-serif' },
            usePointStyle: true,
            pointStyleWidth: 8
          }
        }
      }
    }
  });
}

function renderBarChart(weekly) {
  const labels = weekly.map(d => d.label);
  const data = weekly.map(d => Math.round(d.studySeconds / 60));

  const ctx = document.getElementById('bar-chart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(10, 132, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(94, 92, 230, 0.4)');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Study (min)',
        data,
        backgroundColor: gradient,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7089', font: { size: 12 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#6b7089', font: { size: 11 } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderTopSites(sites) {
  const tbody = document.getElementById('sites-tbody');
  if (!sites || sites.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#6b7089;">No activity data yet</td></tr>';
    return;
  }

  tbody.innerHTML = sites.map(site => {
    const mins = Math.floor(site.duration / 60);
    const secs = site.duration % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return `<tr>
      <td>${site.domain}</td>
      <td><span class="cat-badge cat-${site.category}">${site.category}</span></td>
      <td>${timeStr}</td>
    </tr>`;
  }).join('');
}

loadReports();
