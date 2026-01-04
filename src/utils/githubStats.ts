interface GitHubStats {
  openedPRs: { current: number; trend: number[] };
  linesOfCode: { current: number; trend: number[] };
  commits: { current: number; trend: number[] };
  reviewedPRs: { current: number; trend: number[] };
}

interface PeriodData {
  startDate: Date;
  endDate: Date;
}

// Get GitHub access token from storage
async function getGitHubToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['githubAccessToken'], (result) => {
      resolve(result.githubAccessToken || null);
    });
  });
}

// Get username from current page
function getCurrentUsername(): string | null {
  const path = window.location.pathname;
  const pathParts = path.split('/').filter(p => p);
  return pathParts.length > 0 ? pathParts[0] : null;
}

// Calculate date ranges for weekly/monthly periods
function getPeriodRanges(type: 'weekly' | 'monthly', periods: number = 6): PeriodData[] {
  const ranges: PeriodData[] = [];
  const now = new Date();
  
  for (let i = 0; i < periods; i++) {
    const endDate = new Date(now);
    const startDate = new Date(now);
    
    if (type === 'weekly') {
      endDate.setDate(endDate.getDate() - (i * 7));
      startDate.setDate(startDate.getDate() - ((i + 1) * 7));
    } else {
      endDate.setMonth(endDate.getMonth() - i);
      startDate.setMonth(startDate.getMonth() - (i + 1));
    }
    
    ranges.unshift({ startDate, endDate });
  }
  
  return ranges;
}

// Make GitHub API request
async function fetchGitHubAPI(url: string, token: string | null): Promise<any> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Fetch user's opened PRs in a date range
async function fetchOpenedPRs(username: string, startDate: Date, endDate: Date, token: string | null): Promise<number> {
  try {
    const query = `author:${username} type:pr created:${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}`;
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
    const data = await fetchGitHubAPI(url, token);
    return data.total_count || 0;
  } catch (error) {
    console.error('Error fetching opened PRs:', error);
    return 0;
  }
}

// Fetch user's commits in a date range
async function fetchCommits(username: string, startDate: Date, endDate: Date, token: string | null): Promise<number> {
  try {
    const query = `author:${username} type:commit committer-date:${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}`;
    const url = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=1`;
    const data = await fetchGitHubAPI(url, token);
    return data.total_count || 0;
  } catch (error) {
    console.error('Error fetching commits:', error);
    return 0;
  }
}

// Fetch user's reviewed PRs in a date range
async function fetchReviewedPRs(username: string, startDate: Date, endDate: Date, token: string | null): Promise<number> {
  try {
    const query = `reviewed-by:${username} type:pr created:${startDate.toISOString().split('T')[0]}..${endDate.toISOString().split('T')[0]}`;
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
    const data = await fetchGitHubAPI(url, token);
    return data.total_count || 0;
  } catch (error) {
    console.error('Error fetching reviewed PRs:', error);
    return 0;
  }
}

// Calculate lines of code (estimated based on commits)
// Note: This is an approximation as GitHub API doesn't provide direct LOC counts
async function estimateLinesOfCode(username: string, startDate: Date, endDate: Date, token: string | null): Promise<number> {
  try {
    // Get user's repositories
    const reposUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
    const repos = await fetchGitHubAPI(reposUrl, token);
    
    let totalAdditions = 0;
    
    // For each repo, get commits in the date range and sum additions
    for (const repo of repos.slice(0, 10)) { // Limit to 10 repos to avoid rate limits
      try {
        const since = startDate.toISOString();
        const until = endDate.toISOString();
        const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?author=${username}&since=${since}&until=${until}&per_page=100`;
        const commits = await fetchGitHubAPI(commitsUrl, token);
        
        // Get detailed stats for each commit
        for (const commit of commits.slice(0, 5)) { // Limit commits per repo
          try {
            const commitUrl = `https://api.github.com/repos/${repo.full_name}/commits/${commit.sha}`;
            const commitDetails = await fetchGitHubAPI(commitUrl, token);
            totalAdditions += commitDetails.stats?.additions || 0;
          } catch (error) {
            // Skip if we can't get commit details
            continue;
          }
        }
      } catch (error) {
        // Skip repo if we can't access it
        continue;
      }
    }
    
    return totalAdditions;
  } catch (error) {
    console.error('Error estimating lines of code:', error);
    return 0;
  }
}

// Fetch all stats for a specific period
async function fetchPeriodStats(username: string, period: PeriodData, token: string | null) {
  const [openedPRs, commits, reviewedPRs, linesOfCode] = await Promise.all([
    fetchOpenedPRs(username, period.startDate, period.endDate, token),
    fetchCommits(username, period.startDate, period.endDate, token),
    fetchReviewedPRs(username, period.startDate, period.endDate, token),
    estimateLinesOfCode(username, period.startDate, period.endDate, token)
  ]);
  
  return { openedPRs, commits, reviewedPRs, linesOfCode };
}

// Main function to fetch GitHub stats
export async function fetchGitHubStats(type: 'weekly' | 'monthly'): Promise<GitHubStats | null> {
  try {
    const username = getCurrentUsername();
    if (!username) {
      console.error('Could not determine username from current page');
      return null;
    }
    
    const token = await getGitHubToken();
    if (!token) {
      console.warn('No GitHub token found. API rate limits may apply.');
    }
    
    const periods = getPeriodRanges(type, 6);
    
    // Fetch stats for all periods
    const allStats = await Promise.all(
      periods.map(period => fetchPeriodStats(username, period, token))
    );
    
    // Build result with current period (last one) and trend
    const current = allStats[allStats.length - 1];
    
    return {
      openedPRs: {
        current: current.openedPRs,
        trend: allStats.map(s => s.openedPRs)
      },
      linesOfCode: {
        current: current.linesOfCode,
        trend: allStats.map(s => s.linesOfCode)
      },
      commits: {
        current: current.commits,
        trend: allStats.map(s => s.commits)
      },
      reviewedPRs: {
        current: current.reviewedPRs,
        trend: allStats.map(s => s.reviewedPRs)
      }
    };
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return null;
  }
}

// Cache configuration
const CACHE_KEY = 'github-stats-cache';

// Get current date as string (YYYY-MM-DD)
function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export async function getCachedGitHubStats(type: 'weekly' | 'monthly'): Promise<GitHubStats | null> {
  try {
    // Get cached data from Chrome storage
    const result = await chrome.storage.local.get(CACHE_KEY);
    const cache = result[CACHE_KEY] || {};
    
    const currentDate = getCurrentDate();
    
    // Check if cached data exists and is from today
    if (cache[type] && cache[type].lastRefreshDate === currentDate) {
      console.log(`Using cached ${type} stats from today (${currentDate})`);
      return cache[type].data;
    }
    
    // Fetch fresh data if cache is from a different date or doesn't exist
    if (cache[type]?.lastRefreshDate) {
      console.log(`Cache is from ${cache[type].lastRefreshDate}, fetching fresh ${type} stats for ${currentDate}...`);
    } else {
      console.log(`No cache found, fetching fresh ${type} stats...`);
    }
    
    const data = await fetchGitHubStats(type);
    
    // Store in cache with current date
    if (data) {
      cache[type] = { 
        data, 
        lastRefreshDate: currentDate,
        timestamp: Date.now() // Keep timestamp for additional info
      };
      await chrome.storage.local.set({ [CACHE_KEY]: cache });
      console.log(`${type} stats cached successfully for ${currentDate}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting cached GitHub stats:', error);
    return null;
  }
}
