import React, { useState } from 'react';
import FeatureTab from './components/FeatureTab';
import SettingsTab from './components/SettingsTab';
import './App.css';

type TabType = 'features' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('features');

  return (
    <div className="app">
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'features' && <FeatureTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default App;
