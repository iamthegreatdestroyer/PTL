/**
 * Settings Modal Component
 *
 * Editor and display settings.
 */

import { usePlaygroundStore, type EditorSettings } from '../store';

export function SettingsModal() {
  const { settings, updateSettings, toggleSettings } = usePlaygroundStore();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-ptl-surface rounded-lg shadow-xl border border-ptl-border w-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ptl-border">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-2 rounded hover:bg-ptl-bg transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings */}
        <div className="p-4 space-y-4">
          {/* Font Size */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full accent-ptl-accent"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="text-sm font-medium block mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as EditorSettings['theme'] })}
              className="w-full bg-ptl-bg border border-ptl-border rounded px-3 py-2 focus:outline-none focus:border-ptl-accent"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          {/* Line Numbers */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Line Numbers</label>
            <button
              onClick={() => updateSettings({ showLineNumbers: !settings.showLineNumbers })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.showLineNumbers ? 'bg-ptl-accent' : 'bg-ptl-border'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.showLineNumbers ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Show Minimap</label>
            <button
              onClick={() => updateSettings({ minimap: !settings.minimap })}
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.minimap ? 'bg-ptl-accent' : 'bg-ptl-border'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.minimap ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ptl-border">
          <button
            onClick={toggleSettings}
            className="w-full px-4 py-2 bg-ptl-accent text-white rounded hover:bg-ptl-accent/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
