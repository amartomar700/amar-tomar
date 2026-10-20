import React, { useState, useEffect } from 'react';
import { DocumentRecord } from './types';
import { getAllDocuments } from './utils/storage';
import { TopHeader, BottomTabBar, TabType } from './components/Navigation';
import { DocumentCreator } from './components/DocumentCreator';
import { HistoryScreen } from './components/HistoryScreen';
import { RateCardScreen } from './components/RateCardScreen';
import { ProfileSettingsScreen } from './components/ProfileSettingsScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('creator');
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [docCount, setDocCount] = useState<number>(() => getAllDocuments().length);

  // Sync document count
  const refreshDocCount = () => {
    setDocCount(getAllDocuments().length);
  };

  const handleLoadDocument = (doc: DocumentRecord) => {
    setEditingDoc(doc);
    setCurrentTab('creator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewDocument = () => {
    setEditingDoc(null);
    setCurrentTab('creator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSuccess = () => {
    refreshDocCount();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top App Header */}
      <TopHeader onNewDocClick={handleNewDocument} />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {currentTab === 'creator' && (
          <DocumentCreator
            key={editingDoc ? editingDoc.id : 'new-creator'}
            initialDocument={editingDoc}
            onSavedSuccess={handleSaveSuccess}
            onViewHistory={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryScreen
            onLoadDocument={handleLoadDocument}
            onNewDocument={handleNewDocument}
          />
        )}

        {currentTab === 'ratecards' && <RateCardScreen />}

        {currentTab === 'profile' && <ProfileSettingsScreen />}
      </main>

      {/* Bottom Tab Bar (shown on all screens except print) */}
      <BottomTabBar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'creator' && currentTab !== 'creator') {
            // Keep editingDoc if intentional
          }
          setCurrentTab(tab);
          refreshDocCount();
        }}
        documentCount={docCount}
      />
    </div>
  );
}
