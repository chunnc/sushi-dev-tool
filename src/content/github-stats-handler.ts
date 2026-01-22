import './github-stats-handler.css';
import { fetchGitHubStats } from '../utils/githubStats';

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
  
  // Render function
  const render = () => {
    const data = mockData[currentFilter];
    
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
  
  // Fetch GitHub PRs
  const repo = 'Thinkei/employment-hero';
  const author = 'trungeh';
  
  fetchGitHubStats(repo, author);
  addStatsViewer();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
