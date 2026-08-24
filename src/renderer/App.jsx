import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ProductTypeManager from './components/ProductTypeManager';
import ProductRegistry from './components/ProductRegistry';
import ProjectTracker from './components/ProjectTracker';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
            Product Types
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'registry' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            Product Registry
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
            <Dashboard />
          )}

          {activeTab === 'productTypes' && (
            <ProductTypeManager />
          )}

          {activeTab === 'registry' && (
            <ProductRegistry onRedirectToTracker={() => setActiveTab('tracker')} />
          )}

          {activeTab === 'tracker' && (
            <ProjectTracker onRedirectToRegistry={() => setActiveTab('registry')} />
          )}
        </div>
      </main>
    </div>
  );
}



