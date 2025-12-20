import React, { useState } from 'react';
import FeaturesTab from './components/FeaturesTab';
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
        {activeTab === 'features' && <FeaturesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default App;
