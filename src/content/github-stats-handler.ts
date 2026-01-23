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

// Extract GitHub username from the current page
function getGitHubUsername(): string | null {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(p => p);
  
  // Profile URL format: /username or /username/repositories etc
  if (pathParts.length >= 1) {
    return pathParts[0];
  }
  
  return null;
}

// Add stats viewer to the profile page
function addStatsViewer(prData: any[], retries = 10, delay = 500): void {
  // Find the yearly contributions component
  const yearlyContributions = document.querySelector('.js-yearly-contributions');
  
  if (!yearlyContributions) {
    if (retries > 0) {
      console.log(`Yearly contributions component not found, retrying... (${retries} attempts left)`);
      setTimeout(() => addStatsViewer(prData, retries - 1, delay), delay);
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
  
  // Process fetched data
  const totalPRs = prData.length;
  const totalLOCs = prData.reduce((sum, pr) => sum + pr.locs, 0);
  
  // Create data structure for the UI
  const data = {
    openedPRs: { current: totalPRs },
    linesOfCode: { current: totalLOCs }
  };
  
  let currentFilter: 'weekly' | 'monthly' = 'weekly';
  
  // Render function
  const render = () => {
    statsViewer.innerHTML = `
      <div class="sushi-stats-header">
        <h2 class="sushi-stats-title">Developer Metrics</h2>
        <div class="sushi-stats-filters">
          <button class="sushi-filter-btn active" data-filter="weekly">
            Weekly
          </button>
          <button class="sushi-filter-btn" data-filter="monthly" disabled>
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

  // Get the GitHub username from the current page
  const author = getGitHubUsername();
  if (!author) {
    console.error('Could not extract GitHub username from page');
    return;
  }

  // Fetch GitHub PRs
  const repo = 'Thinkei/employment-hero';
  
  const prData = await fetchGitHubStats(repo, author);
  addStatsViewer(prData);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
