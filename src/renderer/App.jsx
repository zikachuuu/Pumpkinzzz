import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ProductTypeManager from './components/ProductTypeManager';
import ProductRegistry from './components/ProductRegistry';
import ProjectTracker from './components/ProjectTracker';
import Settings from './components/Settings';
import { DATE_FORMATS, getStoredDateFormat, setStoredDateFormat } from './utils/date';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateFormat, setDateFormat] = useState(getStoredDateFormat);

  const handleDateFormatChange = (format) => {
    const nextFormat = Object.values(DATE_FORMATS).includes(format) ? format : DATE_FORMATS.iso;
    setStoredDateFormat(nextFormat);
    setDateFormat(nextFormat);
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
            onClick={() => setActiveTab('productTypes')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'productTypes' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Product Type Registry
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'registry' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Project Registry
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'tracker' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
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
        {/* Settings Icon */}
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
        <div className="p-4 border-t border-indigo-800 text-xs text-indigo-300 text-center">
          v1.0.0 (Local Workspace)
        </div>
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

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <Dashboard dateFormat={dateFormat} />
          )}

          {activeTab === 'productTypes' && (
            <ProductTypeManager />
          )}

          {activeTab === 'registry' && (
            <ProductRegistry onRedirectToTracker={() => setActiveTab('tracker')} dateFormat={dateFormat} />
          )}

          {activeTab === 'tracker' && (
            <ProjectTracker onRedirectToRegistry={() => setActiveTab('registry')} dateFormat={dateFormat} />
          )}

          {activeTab === 'settings' && (
            <Settings dateFormat={dateFormat} onDateFormatChange={handleDateFormatChange} />
          )}
        </div>
      </main>
    </div>
  );
}



