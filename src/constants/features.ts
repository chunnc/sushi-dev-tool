export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
}

export const FEATURES: FeatureDefinition[] = [
  {
    id: 'github-comment-fix',
    name: 'GitHub Comment Spelling & Grammar Fix',
    description: 'Automatically fix spelling and grammar in GitHub comment boxes',
  },
  {
    id: 'github-stats-viewer',
    name: 'GitHub Stats Viewer',
    description: 'View comprehensive GitHub statistics including repos, commits, pull requests, and contributions',
  },
];
