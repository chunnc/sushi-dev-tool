import React, { useState, useEffect } from 'react';
import './SettingsTab.css';

const SettingsTab: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('openaiApiKey');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('openaiApiKey', apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('openaiApiKey');
  };

  return (
    <div className="settings-tab">
      
      <div className="settings-section">
        <label className="settings-label" htmlFor="api-key">
          OpenAI API Key
        </label>
        <p className="settings-description">
          Enter your OpenAI API key to enable AI-powered features
        </p>
        
        <input
          id="api-key"
          type="password"
          className="settings-input"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        
        <div className="settings-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!apiKey.trim()}
          >
            Save
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleClear}
            disabled={!apiKey}
          >
            Clear
          </button>
        </div>
        
        {isSaved && (
          <div className="save-notification">
            ✓ API Key saved successfully
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
