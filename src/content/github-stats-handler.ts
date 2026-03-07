import './github-stats-handler.css';
import { fetchGitHubStats, fetchGitHubStatsMultiRepo } from '../utils/githubStats';
import { isCurrentWeek } from '../utils/dateUtils';
import { REPOSITORIES } from '../constants/repositories';

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
async function addStatsViewer(author: string, retries = 10, delay = 500): Promise<void> {
  // Find the yearly contributions component
  const yearlyContributions = document.querySelector('.js-yearly-contributions');
  
  if (!yearlyContributions) {
    if (retries > 0) {
      setTimeout(() => addStatsViewer(author, retries - 1, delay), delay);
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
  
  let currentFilter: 'weekly' | 'monthly' = 'weekly';
  let selectedRepos: Set<string> = new Set(['all']);
  let prData: any[] = [];
  let isDropdownOpen = false;
  let isLoading = false;
  let customRepos: string[] = [];
  let customRepoInput = '';

  // Load custom repos from Chrome storage
  await new Promise<void>((resolve) => {
    chrome.storage.local.get(['custom-repos'], (result) => {
      if (Array.isArray(result['custom-repos'])) {
        customRepos = result['custom-repos'];
      }
      resolve();
    });
  });
  
  // Fetch stats for selected repositories
  const fetchStats = async () => {
    if (isLoading) return;
    isLoading = true;
    render();
    
    try {
      const allRepoIds = [...REPOSITORIES.map(r => r.id), ...customRepos];
      const reposToFetch = selectedRepos.has('all') 
        ? allRepoIds
        : Array.from(selectedRepos);
      
      // Use fetchGitHubStatsMultiRepo for all cases
      prData = await fetchGitHubStatsMultiRepo(reposToFetch, author);
    } catch (error) {
      console.error('Error fetching stats:', error);
      prData = [];
    } finally {
      isLoading = false;
      render();
    }
  };
  
  // Render function
  const render = () => {
    // Filter data based on selected filter
    let filteredData = prData;
    
    if (currentFilter === 'weekly') {
      filteredData = prData.filter(pr => isCurrentWeek(pr.date));
    }
    // For monthly, all prData is already filtered to current month by fetchGitHubStats
    
    // Calculate totals from filtered data
    const totalPRs = filteredData.length;
    const totalLOCs = filteredData.reduce((sum, pr) => sum + pr.locs, 0);
    
    // Build repository options
    const repoOptions = [
      { id: 'all', label: 'All Repositories', isCustom: false },
      ...REPOSITORIES.map(r => ({ id: r.id, label: r.id, isCustom: false })),
      ...customRepos.map(r => ({ id: r, label: r, isCustom: true }))
    ];
    
    const selectedCount = selectedRepos.has('all') 
      ? 'All Repositories' 
      : selectedRepos.size === 0 
      ? 'Select repositories'
      : `${selectedRepos.size} selected`;
    
    statsViewer.innerHTML = `
      <div class="sushi-stats-header">
        <h2 class="sushi-stats-title">Developer Metrics</h2>
        <div class="sushi-stats-controls">
          <div class="sushi-repo-selector">
            <button class="sushi-repo-dropdown-btn" type="button">
              <span>${selectedCount}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9L1 4h10z"/>
              </svg>
            </button>
            <div class="sushi-repo-dropdown-menu ${isDropdownOpen ? 'open' : ''}">
              <div class="sushi-repo-input-row">
                <input
                  type="text"
                  class="sushi-repo-input"
                  placeholder="Add repo name..."
                  value="${customRepoInput.replace(/"/g, '&quot;')}"
                />
                <button class="sushi-repo-add-btn" type="button" title="Add repository">+</button>
              </div>
              ${repoOptions.map(repo => `
                <label class="sushi-repo-option">
                  <input 
                    type="checkbox" 
                    value="${repo.id}" 
                    ${selectedRepos.has(repo.id) ? 'checked' : ''}
                  />
                  <span>${repo.label}</span>
                  ${repo.isCustom ? `<button class="sushi-repo-remove-btn" data-repo="${repo.id}" type="button" title="Remove repository">×</button>` : ''}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="sushi-stats-filters">
            <button class="sushi-filter-btn ${currentFilter === 'weekly' ? 'active' : ''}" data-filter="weekly">
              Weekly
            </button>
            <button class="sushi-filter-btn ${currentFilter === 'monthly' ? 'active' : ''}" data-filter="monthly">
              Monthly
            </button>
          </div>
        </div>
      </div>
      
      ${isLoading ? `
        <div class="sushi-loading">Loading stats...</div>
      ` : `
        <div class="sushi-summary-cards">
          <div class="sushi-summary-card">
            <div class="sushi-summary-value">${totalPRs}</div>
            <div class="sushi-summary-label">Merged PRs</div>
          </div>
          <div class="sushi-summary-card">
            <div class="sushi-summary-value">${totalLOCs.toLocaleString()}</div>
            <div class="sushi-summary-label">Lines of Code</div>
          </div>
        </div>
      `}
    `;
    
    // Add event listener for dropdown button
    const dropdownBtn = statsViewer.querySelector('.sushi-repo-dropdown-btn');
    dropdownBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      isDropdownOpen = !isDropdownOpen;
      render();
    });

    // Add event listeners for custom repo input
    const repoInput = statsViewer.querySelector('.sushi-repo-input') as HTMLInputElement | null;
    const addBtn = statsViewer.querySelector('.sushi-repo-add-btn');

    const handleAddRepo = async () => {
      const value = repoInput?.value.trim() ?? '';
      if (!value) return;
      const allIds = [...REPOSITORIES.map(r => r.id.toLowerCase()), ...customRepos.map(r => r.toLowerCase())];
      if (allIds.includes(value.toLowerCase())) {
        customRepoInput = '';
        render();
        return;
      }
      customRepos.push(value);
      customRepoInput = '';
      chrome.storage.local.set({ 'custom-repos': customRepos });
      render();
    };

    repoInput?.addEventListener('input', (e) => {
      customRepoInput = (e.target as HTMLInputElement).value;
    });

    repoInput?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        await handleAddRepo();
      }
    });

    addBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await handleAddRepo();
    });

    // Prevent dropdown close when interacting with input
    repoInput?.addEventListener('click', (e) => e.stopPropagation());

    // Add event listeners to remove buttons
    const removeBtns = statsViewer.querySelectorAll('.sushi-repo-remove-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const repoId = (btn as HTMLButtonElement).dataset.repo;
        if (repoId) {
          customRepos = customRepos.filter(r => r !== repoId);
          selectedRepos.delete(repoId);
          if (selectedRepos.size === 0) selectedRepos.add('all');
          chrome.storage.local.set({ 'custom-repos': customRepos });
          render();
        }
      });
    });
    
    // Add event listeners to checkboxes
    const checkboxes = statsViewer.querySelectorAll('.sushi-repo-option input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        const repoId = target.value;
        
        if (repoId === 'all') {
          if (target.checked) {
            selectedRepos.clear();
            selectedRepos.add('all');
          } else {
            selectedRepos.delete('all');
          }
        } else {
          if (target.checked) {
            selectedRepos.delete('all');
            selectedRepos.add(repoId);
          } else {
            selectedRepos.delete(repoId);
            // If no repos selected, default to all
            if (selectedRepos.size === 0) {
              selectedRepos.add('all');
            }
          }
        }
        
        await fetchStats();
      });
    });
    
    // Add event listeners to filter buttons
    const filterButtons = statsViewer.querySelectorAll('.sushi-filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const filter = target.dataset.filter as 'weekly' | 'monthly';
        if (filter && filter !== currentFilter) {
          currentFilter = filter;
          render();
        }
      });
    });
    
    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!statsViewer.contains(e.target as Node)) {
        if (isDropdownOpen) {
          isDropdownOpen = false;
          render();
        }
      }
    };
    
    if (isDropdownOpen) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
  };
  
  render();
  fetchStats();
  
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

  // Add stats viewer with repository selector
  addStatsViewer(author);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
