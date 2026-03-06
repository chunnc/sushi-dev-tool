import { isCurrentMonth } from './dateUtils';
import { getCacheData, setCacheData } from './cacheUtils';

export interface PullRequestData {
  repo: string;
  issueId: string;
  date: string;
  locs: number;
}

/**
 * Processes PR data by filtering out null values, removing outdated data, and sorting
 * @param prData - Array of PR data (may contain null values)
 * @returns Filtered and sorted list of PullRequestData
 */
function processPRData(prData: (PullRequestData | null)[]): PullRequestData[] {
  const filtered = prData.filter((pr): pr is PullRequestData => {
    if (!pr) return false;
    return isCurrentMonth(pr.date);
  });

  // Deduplicate by issueId (first occurrence wins)
  const seen = new Map<string, PullRequestData>();
  for (const pr of filtered) {
    if (!seen.has(pr.issueId)) {
      seen.set(pr.issueId, pr);
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    // Sort by issue ID descending (highest first)
    return parseInt(b.issueId, 10) - parseInt(a.issueId, 10);
  });
}

/**
 * Fetches GitHub stats from multiple repositories
 * @param repos - Array of repository names (e.g., ["employment-hero", "frontend-core"])
 * @param author - GitHub username of the PR author
 * @returns Combined list of PullRequestData from all repositories
 */
export async function fetchGitHubStatsMultiRepo(repos: string[], author: string): Promise<PullRequestData[]> {
  try {
    // Fetch data from all repositories in parallel
    const allPrData = await Promise.all(
      repos.map(repo => fetchGitHubStats(repo, author))
    );
    
    // Combine all PR data
    const combinedData = allPrData.flat();
    
    // Sort by issue ID descending (highest first)
    combinedData.sort((a, b) => parseInt(b.issueId, 10) - parseInt(a.issueId, 10));
    
    console.log(`Fetched stats from ${repos.length} repositories:`, combinedData.length, 'PRs');
    return combinedData;
  } catch (error) {
    console.error('Error fetching multi-repo GitHub stats:', error);
    return [];
  }
}

/**
 * Fetches GitHub stats by getting PR list and the first PR details
 * @param repo - Repository name (e.g., "employment-hero") - will be prefixed with "Thinkei/"
 * @param author - GitHub username of the PR author
 * @param page - Page number for pagination (default: 1)
 * @returns List of PullRequestData for all PRs
 */
export async function fetchGitHubStats(repo: string, author: string): Promise<PullRequestData[]> {
  try {
    // Check local storage for cached data
    const cacheKey = `github-stats/${author}/${repo}`;
    const cachedData = await getCacheData<PullRequestData[]>(cacheKey);
    
    // Fetch list of PR IDs from GitHub
    const prIds = await fetchGitHubPullRequests(repo, author);
    
    if (prIds.length === 0) {
      return [];
    }
    
    // Determine which PRs are missing from cache
    const existingData: PullRequestData[] = cachedData ?? [];
    const cachedIssueIdSet = new Set(existingData.map(pr => pr.issueId));
    const prIdsToFetch = prIds.filter(prId => !cachedIssueIdSet.has(prId.replace('issue_', '')));
    console.log(`Found ${prIdsToFetch.length} missing PRs to fetch for ${repo}`);
    
    // Fetch the required PRs
    const prPromises = prIdsToFetch.map(async (prId) => {
      const issueId = prId.replace('issue_', '');
      return await fetchPullRequest(repo, issueId);
    });
    
    const fetchedPrData = await Promise.all(prPromises);
    
    // Combine fetched data with existing data and process
    const combinedData = [...fetchedPrData, ...existingData];
    const prDataList = processPRData(combinedData);
    
    // Update cache
    await setCacheData(cacheKey, prDataList);
    
    const newPrCount = fetchedPrData.filter(pr => pr !== null).length;
    console.log(`GitHub stats updated with ${newPrCount} new PRs:`, prDataList);
    return prDataList;
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    return [];
  }
}

/**
 * Fetches GitHub pull requests HTML page and extracts issue div IDs
 * @param repo - Repository name (e.g., "employment-hero") - will be prefixed with "Thinkei/"
 * @param author - GitHub username of the PR author
 * @param page - Page number for pagination (default: 1)
 * @returns Array of div IDs that start with "issue_"
 */
export async function fetchGitHubPullRequests(repo: string, author: string, page: number = 1): Promise<string[]> {
  try {
    const url = `https://github.com/Thinkei/${repo}/pulls?q=is%3Apr+author%3A${author}+is%3Amerged&page=${page}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse HTML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all divs with id starting with "issue_"
    const divs = doc.querySelectorAll('div[id^="issue_"]');
    
    // Filter divs by checking relative-time tag and current month
    const ids = Array.from(divs)
      .filter(div => {
        const relativeTime = div.querySelector('relative-time');
        if (!relativeTime) return false;
        
        const date = relativeTime.getAttribute('datetime') || relativeTime.textContent?.trim() || '';
        
        return isCurrentMonth(date);
      })
      .map(div => div.id);
    return ids;
  } catch (error) {
    console.error('Error fetching GitHub pull requests:', error);
    return [];
  }
}

/**
 * Fetches diffstat data from GitHub PR partials API
 * @param repo - Repository name (e.g., "employment-hero") - will be prefixed with "Thinkei/"
 * @param issueId - The issue/PR number
 * @returns Total lines of code (additions + deletions)
 */
async function fetchDiffstat(repo: string, issueId: string): Promise<number> {
  try {
    const url = `https://github.com/Thinkei/${repo}/pull/${issueId}/partials/tabs?tab=files`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract LOCs from diffstat
    let totalLocs = 0;
    const diffstatElement = doc.querySelector('.diffstat');
    
    if (diffstatElement) {
      const text = diffstatElement.textContent?.trim().replace(/,/g, '') || '';
      const numbers = text.match(/\d+/g);
      
      if (numbers && numbers.length >= 2) {
        const additions = parseInt(numbers[0], 10);
        const deletions = parseInt(numbers[1], 10);
        totalLocs = additions + deletions;
      }
    }
    
    return totalLocs;
  } catch (error) {
    console.error(`Error fetching diffstat for PR #${issueId}:`, error);
    return 0;
  }
}

/**
 * Fetches a specific GitHub pull request HTML page
 * @param repo - Repository name (e.g., "employment-hero") - will be prefixed with "Thinkei/"
 * @param issueId - The issue/PR number
 * @returns PullRequestData object with PR information
 */
export async function fetchPullRequest(repo: string, issueId: string): Promise<PullRequestData | null> {
  try {
    const url = `https://github.com/Thinkei/${repo}/pull/${issueId}`;
    
    const response = await fetch(url);
    
    // Wait 1 second before processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract date
    const relativeTimes = doc.querySelectorAll('relative-time');
    const date = relativeTimes.length > 0 ? relativeTimes[0].textContent?.trim() || '' : '';
    
    // Check if date is in current month
    if (!isCurrentMonth(date)) {
      const prData: PullRequestData = {
        repo,
        issueId,
        date,
        locs: 0
      };
      return prData;
    }
    
    // Fetch diffstat for PRs in current month
    const totalLocs = await fetchDiffstat(repo, issueId);
    
    // Create and return PullRequestData
    const prData: PullRequestData = {
      repo,
      issueId,
      date,
      locs: totalLocs
    };
    
    return prData;
  } catch (error) {
    console.error(`Error fetching PR #${issueId}:`, error);
    return null;
  }
}
