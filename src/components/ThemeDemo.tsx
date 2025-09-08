import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeDemo: React.FC = () => {
  const { colorScheme, themeMode } = useTheme();

  return (
    <div className="space-y-6">
      <div className="p-6 bg-surface-elevated border border-border-color rounded-xl">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          Theme Demo - Current: {colorScheme} ({themeMode})
        </h2>
        
        {/* Buttons Demo */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Buttons
            </h3>
            <div className="flex space-x-3">
              <button className="btn-primary">
                Primary Button
              </button>
              <button className="btn-secondary">
                Secondary Button
              </button>
              <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                Dynamic Primary
              </button>
            </div>
          </div>

          {/* Cards Demo */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Cards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 border-l-4 border-primary-500 rounded-lg">
                <h4 className="font-semibold text-primary-700">Primary Card</h4>
                <p className="text-primary-600">This card uses dynamic primary colors</p>
              </div>
              <div className="p-4 bg-surface-hover border border-border-color rounded-lg">
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Surface Card
                </h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  This card uses surface colors
                </p>
              </div>
            </div>
          </div>

          {/* Badges Demo */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Badges
            </h3>
            <div className="flex space-x-3">
              <span className="badge-primary">
                Primary Badge
              </span>
              <span className="badge-success">
                Success
              </span>
              <span className="badge-warning">
                Warning
              </span>
              <span className="badge-error">
                Error
              </span>
            </div>
          </div>

          {/* Form Elements Demo */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Form Elements
            </h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Enter text here..."
                className="input-field w-full"
              />
              <select className="input-field w-full">
                <option>Select an option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </div>

          {/* Avatar Demo */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Avatars
            </h3>
            <div className="flex space-x-3">
              <div className="w-10 h-10 rounded-full user-initials-circle flex items-center justify-center text-white font-semibold">
                AB
              </div>
              <div className="w-10 h-10 rounded-full profile-avatar flex items-center justify-center text-white font-semibold">
                CD
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                EF
              </div>
            </div>
          </div>

          {/* Navigation Demo */}
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Navigation Items
            </h3>
            <div className="space-y-2">
              <div className="nav-item">
                <span>Regular Nav Item</span>
              </div>
              <div className="nav-item active">
                <span>Active Nav Item</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;