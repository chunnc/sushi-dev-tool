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
];
