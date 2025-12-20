import React, { useState, useEffect } from 'react';
import FeatureItem from './FeatureItem';
import { FEATURES } from '../../constants/features';
import './FeaturesTab.css';

export interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const FeaturesTab: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    chrome.storage.local.get(
      FEATURES.map(f => `features/${f.id}`),
      (result) => {
        const loadedFeatures = FEATURES.map((feature) => ({
          ...feature,
          enabled: result[`features/${feature.id}`] === 'true',
        }));
        setFeatures(loadedFeatures);
      }
    );
  }, []);

  const handleToggle = (id: string) => {
    setFeatures((prevFeatures) => {
      const updatedFeatures = prevFeatures.map((feature) =>
        feature.id === id
          ? { ...feature, enabled: !feature.enabled }
          : feature
      );
      
      const toggledFeature = updatedFeatures.find((f) => f.id === id);
      if (toggledFeature) {
        chrome.storage.local.set({ 
          [`features/${id}`]: String(toggledFeature.enabled) 
        });
      }
      
      return updatedFeatures;
    });
  };

  return (
    <div className="features-tab">
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

export default FeaturesTab;
