import React, { useState, useEffect } from 'react';
import './SettingsTab.css';

interface SettingInputProps {
  storageKey: string;
  label: string;
  description: string;
  placeholder: string;
  type?: string;
}

const SettingInput: React.FC<SettingInputProps> = ({
  storageKey,
  label,
  description,
  placeholder,
  type = 'password',
}) => {
  const [value, setValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const displayValue = value.length > 10 ? `${value.substring(0, 10)}...` : value;

  useEffect(() => {
    chrome.storage.local.get([storageKey], (result) => {
      if (result[storageKey]) {
        setValue(result[storageKey]);
        setOriginalValue(result[storageKey]);
      }
    });
  }, [storageKey]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    chrome.storage.local.set({ [storageKey]: value }, () => {
      setOriginalValue(value);
      setIsEditing(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  };

  const handleCancel = () => {
    setValue(originalValue);
    setIsEditing(false);
  };

  const handleClear = () => {
    setValue('');
    setOriginalValue('');
    chrome.storage.local.remove([storageKey]);
  };

  return (
    <div className="settings-section">
      <label className="settings-label" htmlFor={storageKey}>
        {label}
      </label>
      <p className="settings-description">{description}</p>

      <div className="settings-input-group">
        <input
          id={storageKey}
          type="text"
          className="settings-input"
          placeholder={placeholder}
          value={isEditing ? value : displayValue}
          disabled={!isEditing}
          onChange={(e) => setValue(e.target.value)}
        />

        <div className="settings-input-actions">
          {!isEditing ? (
            <>
              <button
                className="btn btn-icon btn-primary"
                onClick={handleEdit}
                title="Edit"
              >
                <svg data-testid="geist-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.2803 0.719661L11.75 0.189331L11.2197 0.719661L1.09835 10.841C0.395088 11.5442 0 12.4981 0 13.4926V15.25V16H0.75H2.50736C3.50192 16 4.45575 15.6049 5.15901 14.9016L15.2803 4.78032L15.8107 4.24999L15.2803 3.71966L12.2803 0.719661ZM9.81066 4.24999L11.75 2.31065L13.6893 4.24999L11.75 6.18933L9.81066 4.24999ZM8.75 5.31065L2.15901 11.9016C1.73705 12.3236 1.5 12.8959 1.5 13.4926V14.5H2.50736C3.1041 14.5 3.67639 14.2629 4.09835 13.841L10.6893 7.24999L8.75 5.31065Z" fill="currentColor"></path>
                </svg>
              </button>
              <button
                className="btn btn-icon btn-secondary"
                onClick={handleClear}
                disabled={!value}
                title="Clear"
              >
                <svg data-testid="geist-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z" fill="currentColor"></path>
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-icon btn-primary"
                onClick={handleSave}
                disabled={!value.trim()}
                title="Save"
              >
                <svg data-testid="geist-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.5607 2.31065L14.5 1.24999L6.53033 9.21966L2.03033 4.71966L0.96967 5.78032L6 10.8106L6.53033 11.341L7.06066 10.8106L15.5607 2.31065Z" fill="currentColor"></path>
                </svg>
              </button>
              <button
                className="btn btn-icon btn-secondary"
                onClick={handleCancel}
                title="Cancel"
              >
                <svg data-testid="geist-icon" height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" style={{ color: 'currentcolor' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z" fill="currentColor"></path>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {isSaved && (
        <div className="save-notification">
          ✓ {label} saved successfully
        </div>
      )}
    </div>
  );
};

export default SettingInput;
