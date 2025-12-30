'use client';

import React from 'react';
import { LayoutDashboard, Rocket, Mail, Users, Shield } from 'lucide-react';

export type TabType = 'overview' | 'growth' | 'engagement' | 'audience' | 'admin';

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin?: boolean;
}

export default function DashboardTabs({ activeTab, onTabChange, isAdmin = false }: DashboardTabsProps) {
  const allTabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'growth' as const, label: 'Download Gates', icon: Rocket },
    { id: 'engagement' as const, label: 'Emails & Newsletters', icon: Mail },
    { id: 'audience' as const, label: 'Audience', icon: Users },
    { id: 'admin' as const, label: 'Admin', icon: Shield, adminOnly: true },
  ];

  // Filter tabs based on admin status
  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="flex p-1.5 bg-white/40 backdrop-blur-md border border-[#E8E6DF] rounded-2xl w-fit">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all duration-500 group
              ${isActive ? 'text-white' : 'text-gray-500 hover:text-[#1c1c1c] hover:bg-white/40'}
            `}
          >
            {isActive && (
              <div className="absolute inset-0 bg-[#1c1c1c] rounded-xl shadow-lg shadow-black/10 animate-in fade-in zoom-in-95 duration-300" />
            )}
            <div className="relative flex items-center gap-2.5">
              <tab.icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-bold tracking-tight">{tab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
