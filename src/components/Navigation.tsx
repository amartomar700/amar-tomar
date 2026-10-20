import React from 'react';
import { FilePlus, History, Wrench, Building2, WifiOff, ShieldCheck } from 'lucide-react';

export type TabType = 'creator' | 'history' | 'ratecards' | 'profile';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  documentCount?: number;
}

export const TopHeader: React.FC<{ onNewDocClick?: () => void }> = ({ onNewDocClick }) => {
  return (
    <header className="no-print sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xs">
            <span className="font-black text-white text-base">TQ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm tracking-tight text-white leading-tight">
                TradeQuote
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Offline
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              Multi-Trade Quotation & Invoice Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>SQLite Offline Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export const BottomTabBar: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  documentCount = 0,
}) => {
  const tabs = [
    {
      id: 'creator' as TabType,
      label: 'Create',
      icon: FilePlus,
    },
    {
      id: 'history' as TabType,
      label: 'Archive',
      icon: History,
      badge: documentCount > 0 ? documentCount : undefined,
    },
    {
      id: 'ratecards' as TabType,
      label: 'Rate Card',
      icon: Wrench,
    },
    {
      id: 'profile' as TabType,
      label: 'Profile',
      icon: Building2,
    },
  ];

  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-bold bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-black' : 'font-semibold'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-1 rounded-full bg-blue-600"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
