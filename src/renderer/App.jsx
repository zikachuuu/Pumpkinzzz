import React, { useEffect, useState } from 'react';
import Dashboard from './features/dashboard/Dashboard.jsx';
import ProductTypeManager from './features/product-type-manager/ProductTypeManager.jsx';
import ProjectRegistry from './features/project-registry/ProjectRegistry.jsx';
import ProjectTracker from './features/project-tracker/ProjectTracker.jsx';
import Settings from './features/setting/Settings.jsx';
import VersionUpdate from './features/setting/VersionUpdate.jsx';
import { DATE_FORMATS, getStoredDateFormat, setStoredDateFormat, syncSettingsFromJson } from './utils/date';

import Modal from './components/ui/Modal.jsx';
import { AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateFormat, setDateFormat] = useState(getStoredDateFormat);
  
  const [showBetaWarning, setShowBetaWarning] = useState(true);
  const [showVersionModal, setShowVersionModal] = useState(false);

  useEffect(() => {
    syncSettingsFromJson().then((settings) => {
      if (settings?.dateFormat) {
        setDateFormat(settings.dateFormat);
      }
      // Check if version update modal should open on startup
      if (settings?.showVersionUpdateOnLaunch) {
        setShowVersionModal(true);
      }
    });
  }, []);

  const handleDateFormatChange = (format) => {
    const nextFormat = Object.values(DATE_FORMATS).includes(format) ? format : DATE_FORMATS.iso;
    setStoredDateFormat(nextFormat);
    setDateFormat(nextFormat);
  };

  const handleDisableLaunchModal = async (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      try {
        const currentSettings = await window.electronAPI.readSettings();
        await window.electronAPI.writeSettings({ ...currentSettings, showVersionUpdateOnLaunch: false });
      } catch (err) {
        console.error('Failed to update launch settings preference:', err);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-indigo-800">
          <span className="text-xl font-bold tracking-wider">PUMPKINZZZ</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'dashboard' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('productTypeManager')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'productTypeManager' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Product Type Manager
          </button>
          <button
            onClick={() => setActiveTab('projectRegistry')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'projectRegistry' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Project Registry
          </button>
          <button
            onClick={() => setActiveTab('projectTracker')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'projectTracker' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Project Tracker
          </button>
        </nav>
        <button
          onClick={() => setActiveTab('settings')}
          className={`mx-4 mb-4 flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'settings' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-5 h-5 mr-3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>          
          Settings
        </button>
        <button
          onClick={() => setActiveTab('versionUpdate')}
          className={`p-4 border-t border-indigo-800 text-xs font-bold text-center w-full transition-colors ${
            activeTab === 'versionUpdate' ? 'bg-indigo-800 text-indigo-100' : 'text-indigo-300 hover:bg-indigo-800 hover:text-indigo-100'
          }`}
        >
          beta v1.0.0
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {activeTab.replace(/([A-Z])/g, ' $1')}
          </h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          {activeTab === 'dashboard' && (
            <Dashboard dateFormat={dateFormat} />
          )}

          {activeTab === 'productTypeManager' && (
            <ProductTypeManager />
          )}

          {activeTab === 'projectRegistry' && (
            <ProjectRegistry onRedirectToTracker={() => setActiveTab('projectTracker')} dateFormat={dateFormat} />
          )}

          {activeTab === 'projectTracker' && (
            <ProjectTracker onRedirectToRegistry={() => setActiveTab('projectRegistry')} dateFormat={dateFormat} />
          )}

          {activeTab === 'settings' && (
            <Settings dateFormat={dateFormat} onDateFormatChange={handleDateFormatChange} />
          )}

          {activeTab === 'versionUpdate' && (
            <VersionUpdate />
          )}
        </div>
      </main>

      {/* 1. BETA WARNING MODAL (Appears on every launch) */}
      <Modal 
        isOpen={showBetaWarning} 
        onClose={() => setShowBetaWarning(false)} 
        title={
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Beta Version</span>
          </div>
        } 
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-gray-800">
            Welcome to Pumpkinzzz Project Managemnt! Please note that this application is currently in beta mode:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
            <li>Data loss & corruption may occur, especially for batch export/import with spreadsheets features. Do not store any important project information!</li>
            <li>The Product Type and Component Dashboards are currently under construction.</li>
            <li>Best viewed on a laptop full screen. Pumpkinzzz currently does not adjust gracefully to narrow window sizes.</li>
          </ul>
          <p className="text-sm text-gray-600">
            Please report any bugs or feature suggestions to <a href="mailto:le0003hi@e.ntu.edu.sg" className="text-indigo-600 font-bold hover:underline">le0003hi@e.ntu.edu.sg</a>.
          </p>
          <p className="text-sm text-gray-600">
            Thank you for trying out Pumpkinzzz!
          </p>
          <div className="pt-4 flex justify-end">
            <button 
              onClick={() => setShowBetaWarning(false)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition"
            >
              Okay, I understand
            </button>
          </div>
        </div>
      </Modal>

      {/* 2. SKELETON VERSION UPDATE MODAL (Conditionally launched based on settings) */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title={
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-5 h-5" />
            <span>What's New in beta v1.0.0</span>
          </div>
        }
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900 font-medium">
            Beta app launched successfully! Explore the tracking tools and product type manager.
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input 
                type="checkbox" 
                onChange={handleDisableLaunchModal}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" 
              />
              Do not show this again
            </label>
            <button
              onClick={() => setShowVersionModal(false)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              Okay
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}