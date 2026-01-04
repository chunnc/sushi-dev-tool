import React from 'react';
import SettingInput from './SettingInput';
import './SettingsTab.css';

const SettingsTab: React.FC = () => {
  return (
    <div className="settings-tab">
      <SettingInput
        storageKey="openaiApiKey"
        label="OpenAI API Key"
        description="Enter your OpenAI API key to enable AI-powered features"
        placeholder="sk-..."
      />

      <SettingInput
        storageKey="githubAccessToken"
        label="GitHub Access Token"
        description="Enter your GitHub personal access token to access private repositories and increase API rate limits"
        placeholder="ghp_..."
      />
    </div>
  );
};

export default SettingsTab;
