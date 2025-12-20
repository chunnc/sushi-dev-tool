import React, { useState } from 'react';
import FeatureItem from './FeatureItem';
import './FeatureTab.css';

export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const FeatureTab: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([
    {
      id: 'feature-1',
      name: 'Auto Reload',
      description: 'Automatically reload the page on changes',
      enabled: false,
    },
    {
      id: 'feature-2',
      name: 'Dark Mode',
      description: 'Enable dark mode theme',
      enabled: true,
    },
    {
      id: 'feature-3',
      name: 'Console Logger',
      description: 'Enhanced console logging',
      enabled: false,
    },
  ]);

  const handleToggle = (id: string) => {
    setFeatures((prevFeatures) =>
      prevFeatures.map((feature) =>
        feature.id === id
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
  };

  return (
    <div className="feature-tab">
      <div className="feature-list">
        {features.map((feature) => (
          <FeatureItem
            key={feature.id}
            feature={feature}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default FeatureTab;
