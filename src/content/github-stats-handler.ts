import './github-stats-handler.css';

// Check if the GitHub stats viewer feature is enabled
async function isFeatureEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['features/github-stats-viewer'], (result) => {
      const enabled = result['features/github-stats-viewer'] === 'true';
      resolve(enabled);
    });
  });
}

// Check if the current page is a GitHub profile page
function isProfilePage(): boolean {
  // Check URL pattern first (fast)
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(p => p);
  
  // Exclude known non-profile paths
  const excludePaths = ['settings', 'notifications', 'pulls', 'issues', 'marketplace', 'explore', 'topics', 'collections', 'events', 'sponsors'];
  if (pathParts.length === 1 && excludePaths.includes(pathParts[0])) {
    return false;
  }
  
  // Valid profile URL pattern
  const isValidPattern = pathParts.length === 1 || 
    (pathParts.length === 2 && ['repositories', 'projects', 'packages', 'stars'].includes(pathParts[1]));
  
  if (!isValidPattern) return false;
  
  // Confirm with DOM element (more reliable)
  return !!document.querySelector('.user-profile-nav') ||
         !!document.querySelector('meta[property="og:type"][content="profile"]');
}

// Add stats viewer to the profile page
function addStatsViewer(retries = 10, delay = 500): void {
  // Find the yearly contributions component
  const yearlyContributions = document.querySelector('.js-yearly-contributions');
  
  if (!yearlyContributions) {
    if (retries > 0) {
      console.log(`Yearly contributions component not found, retrying... (${retries} attempts left)`);
      setTimeout(() => addStatsViewer(retries - 1, delay), delay);
    } else {
      console.log('Yearly contributions component not found after all retries');
    }
    return;
  }
  
  if (!yearlyContributions.parentElement) {
    console.log('Yearly contributions component has no parent element');
    return;
  }
  
  // Check if already added
  if (document.querySelector('.sushi-stats-viewer')) {
    return;
  }
  
  // Create the stats viewer div
  const statsViewer = document.createElement('div');
  statsViewer.className = 'sushi-stats-viewer';
  
  // Mock data
  const mockData = {
    weekly: {
      openedPRs: { current: 12, trend: [8, 10, 15, 11, 9, 12] },
      linesOfCode: { current: 3420, trend: [2100, 2800, 4200, 3100, 2900, 3420] },
      commits: { current: 34, trend: [28, 32, 41, 30, 29, 34] },
      reviewedPRs: { current: 8, trend: [6, 9, 12, 7, 6, 8] }
    },
    monthly: {
      openedPRs: { current: 47, trend: [38, 42, 51, 45, 40, 47] },
      linesOfCode: { current: 15680, trend: [12400, 14200, 18900, 14800, 13600, 15680] },
      commits: { current: 142, trend: [118, 135, 156, 128, 124, 142] },
      reviewedPRs: { current: 29, trend: [22, 26, 34, 28, 24, 29] }
    }
  };
  
  let currentFilter: 'weekly' | 'monthly' = 'weekly';
  
  // Function to create multi-line chart
  const createLineChart = (datasets: Array<{label: string, data: number[], color: string}>): string => {
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find global min and max across all datasets
    const allValues = datasets.flatMap(d => d.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;
    
    const dataPoints = datasets[0].data.length;
    
    // Generate lines
    const lines = datasets.map(dataset => {
      const points = dataset.data.map((value, index) => {
        const x = padding.left + (index / (dataPoints - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
        return `${x},${y}`;
      }).join(' ');
      
      const circles = dataset.data.map((value, index) => {
        const x = padding.left + (index / (dataPoints - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
        return `<circle cx="${x}" cy="${y}" r="4" fill="${dataset.color}" class="sushi-chart-dot" data-value="${value}" data-label="${dataset.label}"/>`;
      }).join('');
      
      return { points, circles, color: dataset.color, label: dataset.label };
    });
    
    // Generate Y-axis labels
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({length: yAxisSteps}, (_, i) => {
      const value = minValue + (range / (yAxisSteps - 1)) * i;
      const y = padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
      return `
        <line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#30363d" stroke-width="1"/>
        <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#8b949e">${Math.round(value).toLocaleString()}</text>
      `;
    }).join('');
    
    // Generate X-axis labels
    const periodLabel = currentFilter === 'weekly' ? 'Week' : 'Month';
    const xAxisLabels = Array.from({length: dataPoints}, (_, i) => {
      const x = padding.left + (i / (dataPoints - 1)) * chartWidth;
      return `
        <line x1="${x}" y1="${padding.top + chartHeight}" x2="${x}" y2="${padding.top + chartHeight + 5}" stroke="#30363d" stroke-width="1"/>
        <text x="${x}" y="${padding.top + chartHeight + 20}" text-anchor="middle" font-size="11" fill="#8b949e">${periodLabel} ${i + 1}</text>
      `;
    }).join('');
    
    return `
      <svg class="sushi-line-chart" width="100%" height="${height}" viewBox="0 0 ${width} ${height}">
        <!-- Grid lines -->
        ${Array.from({length: yAxisSteps}, (_, i) => {
          const y = padding.top + chartHeight - (i / (yAxisSteps - 1)) * chartHeight;
          return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#21262d" stroke-width="1"/>`;
        }).join('')}
        
        <!-- Axes -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}" stroke="#30363d" stroke-width="2"/>
        <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}" stroke="#30363d" stroke-width="2"/>
        
        <!-- Y-axis labels -->
        ${yAxisLabels}
        
        <!-- X-axis labels -->
        ${xAxisLabels}
        
        <!-- Lines -->
        ${lines.map(line => `
          <polyline
            fill="none"
            stroke="${line.color}"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="${line.points}"
          />
        `).join('')}
        
        <!-- Dots -->
        ${lines.map(line => line.circles).join('')}
      </svg>
    `;
  };
  
  // Render function
  const render = () => {
    const data = mockData[currentFilter];
    const periodLabel = currentFilter === 'weekly' ? 'Last 6 Weeks' : 'Last 6 Months';
    
    const chartDatasets = [
      { label: 'Opened PRs', data: data.openedPRs.trend, color: '#3fb950' },
      { label: 'Lines of Code (÷100)', data: data.linesOfCode.trend.map(v => Math.round(v / 100)), color: '#58a6ff' },
      { label: 'Commits', data: data.commits.trend, color: '#a371f7' },
      { label: 'Reviewed PRs', data: data.reviewedPRs.trend, color: '#f778ba' }
    ];
    
    statsViewer.innerHTML = `
      <div class="sushi-stats-header">
        <h2 class="sushi-stats-title">Developer Metrics</h2>
        <div class="sushi-stats-filters">
          <button class="sushi-filter-btn ${currentFilter === 'weekly' ? 'active' : ''}" data-filter="weekly">
            Weekly
          </button>
          <button class="sushi-filter-btn ${currentFilter === 'monthly' ? 'active' : ''}" data-filter="monthly">
            Monthly
          </button>
        </div>
      </div>
      
      <div class="sushi-summary-cards">
        <div class="sushi-summary-card">
          <div class="sushi-summary-value">${data.openedPRs.current}</div>
          <div class="sushi-summary-label">Opened PRs</div>
        </div>
        <div class="sushi-summary-card">
          <div class="sushi-summary-value">${data.linesOfCode.current.toLocaleString()}</div>
          <div class="sushi-summary-label">Lines of Code</div>
        </div>
        <div class="sushi-summary-card">
          <div class="sushi-summary-value">${data.commits.current}</div>
          <div class="sushi-summary-label">Total Commits</div>
        </div>
        <div class="sushi-summary-card">
          <div class="sushi-summary-value">${data.reviewedPRs.current}</div>
          <div class="sushi-summary-label">Reviewed PRs</div>
        </div>
      </div>
      
      <div class="sushi-chart-container">
        <div class="sushi-chart-title">Trend - ${periodLabel}</div>
        <div class="sushi-chart-legend">
          ${chartDatasets.map(d => `
            <div class="sushi-legend-item">
              <span class="sushi-legend-color" style="background-color: ${d.color}"></span>
              <span class="sushi-legend-label">${d.label}</span>
            </div>
          `).join('')}
        </div>
        ${createLineChart(chartDatasets)}
      </div>
    `;
    
    // Add event listeners to filter buttons
    const filterButtons = statsViewer.querySelectorAll('.sushi-filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const filter = target.dataset.filter as 'weekly' | 'monthly';
        if (filter) {
          currentFilter = filter;
          render();
        }
      });
    });
  };
  
  render();
  
  // Insert after the yearly contributions component
  if (yearlyContributions.nextSibling) {
    yearlyContributions.parentElement.insertBefore(statsViewer, yearlyContributions.nextSibling);
  } else {
    yearlyContributions.parentElement.appendChild(statsViewer);
  }
  
  console.log('Stats viewer added successfully');
}

// Initialize the extension
async function init() {
  const enabled = await isFeatureEnabled();
  if (!enabled) {
    return;
  }

  if (!isProfilePage()) {
    return;
  }

  // Add the stats viewer to the profile page
  addStatsViewer();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
