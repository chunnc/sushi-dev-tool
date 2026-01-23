import { isCurrentMonth } from './dateUtils';

export interface PullRequestData {
  repo: string;
  issueId: string;
  date: string;
  locs: number;
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
    // Fetch list of PRs
    const prIds = await fetchGitHubPullRequests(repo, author);
    
    if (prIds.length === 0) {
      return [];
    }
    
    // Fetch all PRs asynchronously
    const prPromises = prIds.map(async (prId) => {
      const issueId = prId.replace('issue_', '');
      return await fetchPullRequest(repo, issueId);
    });
    
    const allPrData = await Promise.all(prPromises);
    
    // Filter out null values and PRs not in current month
    const prDataList: PullRequestData[] = allPrData
      .filter((prData): prData is PullRequestData => {
        if (!prData) return false;
        return isCurrentMonth(prData.date);
      })
      .sort((a, b) => {
        // Sort by date descending (newest first)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    
    console.log('Fetched GitHub stats:', prDataList);
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
