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
    
    // Fetch all PRs
    const prDataList: PullRequestData[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    for (const prId of prIds) {
      // Extract issue ID from the PR (format: "issue_123" -> "123")
      const issueId = prId.replace('issue_', '');
      
      // Fetch the PR
      const prData = await fetchPullRequest(repo, issueId);
      
      if (prData) {
        // Parse the date to check if it's in the current month
        const prDate = new Date(prData.date);
        
        // If date is invalid or not in current month, break the loop
        if (isNaN(prDate.getTime()) || 
            prDate.getMonth() !== currentMonth || 
            prDate.getFullYear() !== currentYear) {
          break;
        }
        
        prDataList.push(prData);
      }
    }
    
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
 * Extracts LOCs from a parsed PR document
 * @param doc - Parsed HTML document
 * @returns Total lines of code (additions + deletions)
 */
function extractLocsFromDocument(doc: Document): number {
  let totalLocs = 0;
  
  // Query for diffstat component
  let diffstatElement = doc.querySelector('.diffstat');
  
  if (!diffstatElement) {
    console.log('No diffstat element found, will retry...');
    // Note: In fetched HTML, dynamic content won't load
    // This is a limitation of using fetch() vs browser navigation
    return 0;
  }
  
  console.log('Found diffstat element');
  console.log('Diffstat HTML:', diffstatElement.outerHTML);
  console.log('Diffstat text:', diffstatElement.textContent);
  
  // Extract numbers from the diffstat text
  const text = diffstatElement.textContent?.trim() || '';
  const numbers = text.match(/\d+/g);
  
  if (numbers && numbers.length >= 2) {
    // Usually format is: "+123 -45" or "123 additions & 45 deletions"
    const additions = parseInt(numbers[0], 10);
    const deletions = parseInt(numbers[1], 10);
    totalLocs = additions + deletions;
    console.log(`LOCs: ${additions} additions + ${deletions} deletions = ${totalLocs}`);
  }
  
  return totalLocs;
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
    
    // Parse HTML to find relative-time tag
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const relativeTimes = doc.querySelectorAll('relative-time');
    
    let date = '';
    if (relativeTimes.length > 0) {
      date = relativeTimes[0].textContent?.trim() || '';
    } else {
      console.log('No relative-time tags found');
    }
    
    // Find diffstat to calculate LOCs
    const totalLocs = extractLocsFromDocument(doc);
    
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
