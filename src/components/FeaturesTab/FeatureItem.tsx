import React from 'react';
import type { Feature } from './FeatureTab';
import './FeatureItem.css';

interface FeatureItemProps {
  feature: Feature;
  onToggle: (id: string) => void;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ feature, onToggle }) => {
  return (
    <div className="feature-item">
      <div className="feature-info">
        <h3 className="feature-name">{feature.name}</h3>
        <p className="feature-description">{feature.description}</p>
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={feature.enabled}
          onChange={() => onToggle(feature.id)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default FeatureItem;
