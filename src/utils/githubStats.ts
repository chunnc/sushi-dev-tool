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
  return prData
    .filter((pr): pr is PullRequestData => {
      if (!pr) return false;
      return isCurrentMonth(pr.date);
    })
    .sort((a, b) => {
      // Sort by date descending (newest first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
}

/**
 * Fetches GitHub stats by getting PR list and the first PR details
 * @param repo - Repository in format "owner/repoName" (e.g., "Thinkei/employment-hero")
 * @param author - GitHub username of the PR author
 * @param page - Page number for pagination (default: 1)
 * @returns List of PullRequestData for all PRs
 */
export async function fetchGitHubStats(repo: string, author: string): Promise<PullRequestData[]> {
  try {
    // Check local storage for cached data
    const cacheKey = `github-stats-${repo}`;
    const cachedData = await getCacheData<PullRequestData[]>(cacheKey);
    
    // Fetch list of PR IDs from GitHub
    const prIds = await fetchGitHubPullRequests(repo, author);
    
    if (prIds.length === 0) {
      return [];
    }
    
    // Extract the first issue ID from the list
    const firstIssueId = prIds[0].replace('issue_', '');
    
    // Determine which PRs to fetch
    let prIdsToFetch: string[];
    let existingData: PullRequestData[] = [];
    
    if (cachedData && cachedData.length > 0 && cachedData[0].issueId === firstIssueId) {
      // No new PRs, return cached data
      console.log(`No new PRs found, using cached data for ${repo}`);
      return cachedData;
    } else if (cachedData && cachedData.length > 0) {
      // Find PRs with issue ID greater than the first cached issue ID
      const firstCachedIssueId = parseInt(cachedData[0].issueId, 10);
      prIdsToFetch = prIds.filter(prId => {
        const issueId = prId.replace('issue_', '');
        return parseInt(issueId, 10) > firstCachedIssueId;
      });
      existingData = cachedData;
      console.log(`Found ${prIdsToFetch.length} new PRs to fetch (issue ID > ${firstCachedIssueId})`);
    } else {
      // No cache data, fetch all PRs
      prIdsToFetch = prIds;
      console.log(`No cached data found, fetching all PRs for ${repo}`);
    }
    
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
 * @param repo - Repository in format "owner/repoName" (e.g., "Thinkei/employment-hero")
 * @param author - GitHub username of the PR author
 * @param page - Page number for pagination (default: 1)
 * @returns Array of div IDs that start with "issue_"
 */
export async function fetchGitHubPullRequests(repo: string, author: string, page: number = 1): Promise<string[]> {
  try {
    const url = `https://github.com/${repo}/pulls?q=is%3Apr+author%3A${author}+is%3Amerged&page=${page}`;
    
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
    
    // Extract and return the IDs
    const ids = Array.from(divs).map(div => div.id);
    
    return ids;
  } catch (error) {
    console.error('Error fetching GitHub pull requests:', error);
    return [];
  }
}

/**
 * Fetches diffstat data from GitHub PR partials API
 * @param repo - Repository in format "owner/repoName"
 * @param issueId - The issue/PR number
 * @returns Total lines of code (additions + deletions)
 */
async function fetchDiffstat(repo: string, issueId: string): Promise<number> {
  try {
    const url = `https://github.com/${repo}/pull/${issueId}/partials/tabs?tab=files`;
    
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
      const text = diffstatElement.textContent?.trim() || '';
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
 * @param repo - Repository in format "owner/repoName" (e.g., "Thinkei/employment-hero")
 * @param issueId - The issue/PR number
 * @returns PullRequestData object with PR information
 */
export async function fetchPullRequest(repo: string, issueId: string): Promise<PullRequestData | null> {
  try {
    const url = `https://github.com/${repo}/pull/${issueId}`;
    
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
