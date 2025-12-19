import { useState, useEffect } from 'react';
import { ProjectSettings } from './components/ProjectSettings';
import { TemplateEditor } from './components/TemplateEditor';
import { CardSmith } from './components/CardSmith';
import { ToastProvider, useToast } from './context/ToastContext';
import clsx from 'clsx';
import { useStore } from './store/useStore';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'template' | 'cards'>('settings');
  const { showToast } = useToast();
  const { cards } = useStore();

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's')
      {
        e.preventDefault();
        // Zustand persist is auto, but we can trigger a visual feedback
        showToast("Project Saved!", "success");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-800 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-inner ring-1 ring-white/10" />
          <h1 className="font-bold text-gray-100 text-lg tracking-tight">Card Smith <span className="text-xs font-normal text-gray-400 ml-1">v0.0.1.00008</span></h1>
        </div>

        <nav className="flex bg-gray-900 p-1 rounded-lg ring-1 ring-white/10">
          <button
            onClick={() => setActiveTab('settings')}
            className={clsx(
              "px-4 py-1.5 text-sm rounded-md font-medium transition-all",
              activeTab === 'settings' ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
            )}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={clsx(
              "px-4 py-1.5 text-sm rounded-md font-medium transition-all",
              activeTab === 'template' ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
            )}
          >
            Template
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={clsx(
              "px-4 py-1.5 text-sm rounded-md font-medium transition-all flex items-center gap-2",
              activeTab === 'cards' ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-gray-200"
            )}
          >
            Cards <span className="bg-gray-800 text-xs px-1.5 py-0.5 rounded-full ring-1 ring-white/10">{cards.length}</span>
          </button>
        </nav>

        <div className="w-32 flex justify-end">
          {/* Placeholder for user profile or extra options */}
        </div>
      </header>

      {/* Main Content Area - Optimized with Conditional Rendering */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'settings' && <ProjectSettings />}
        {activeTab === 'template' && <TemplateEditor />}
        {activeTab === 'cards' && <CardSmith />}
      </main>
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
