'use client';

import React, { useEffect, useState } from 'react';
import { ExecutionHistoryItem } from '../../types/dashboard';

interface ExecutionHistoryProps {
  history: ExecutionHistoryItem[];
}

interface CampaignStats {
  track_id: string;
  track_title: string;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

export default function ExecutionHistory({ history }: ExecutionHistoryProps) {
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchCampaignStats();
  }, [history]);

  const fetchCampaignStats = async () => {
    try {
      const res = await fetch('/api/campaign-stats');
      const data = await res.json();

      if (data.stats) {
        // Convertir array a objeto con track_id como key
        const statsMap: Record<string, CampaignStats> = {};
        data.stats.forEach((stat: CampaignStats) => {
          statsMap[stat.track_id] = stat;
        });
        setCampaignStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-[#E8E6DF]/50 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-serif text-[#1c1c1c]">Campaign History</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {history.length} executed
          </p>
        </div>
        <button
          onClick={fetchCampaignStats}
          className="p-1.5 rounded-lg border border-[#E8E6DF]/60 text-gray-400 hover:text-[#1c1c1c] hover:bg-white transition-all active:scale-95"
          title="Refresh stats"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center shadow-sm">
               <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h3 className="text-sm font-serif text-[#1c1c1c] mb-1">No campaigns yet</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Your sent history will appear here</p>
          </div>
        ) : (
          <div className="relative border-l border-[#E8E6DF] pl-6 space-y-4 ml-2 my-2">
            {history.map((item, index) => {
              const stats = campaignStats[item.trackId];

              return (
                <div key={`${item.trackId}-${item.executedAt}-${index}`} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full border-[3px] border-white bg-[#E8E6DF] group-hover:bg-[#FF5500] transition-colors duration-300 shadow-sm"></div>

                  {/* Content */}
                  <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-[#E8E6DF]/60 overflow-hidden hover:shadow-md transition-all">
                    {/* Header */}
                    <div className="p-4 border-b border-[#E8E6DF]/40">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-serif text-lg text-[#1c1c1c] mb-1">{item.title}</h3>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>{new Date(item.executedAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>Sent to {item.emailsSent} audience members</span>
                          </div>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#E8E6DF]/60 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/50 hover:bg-white hover:text-[#1c1c1c] transition-all active:scale-95"
                        >
                          Listen Track
                        </a>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    {loadingStats ? (
                      <div className="p-4 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full border-2 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
                      </div>
                    ) : stats ? (
                      <div className="p-4 bg-gray-50/30">
                        <div className="grid grid-cols-4 gap-3">
                          {/* Delivered */}
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[9px] text-[#1c1c1c] font-black uppercase tracking-wider">Delivered</div>
                            <div className="text-lg font-serif text-blue-600">{stats.delivered}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                              {stats.delivery_rate || 0}% rate
                            </div>
                          </div>

                          {/* Opens */}
                          <div className="flex flex-col gap-0.5 border-l border-[#E8E6DF]/40 pl-3">
                            <div className="text-[9px] text-[#1c1c1c] font-black uppercase tracking-wider">Opens</div>
                            <div className="text-lg font-serif text-emerald-600">{stats.opened}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                              {stats.open_rate || 0}% rate
                            </div>
                          </div>

                          {/* Clicks */}
                          <div className="flex flex-col gap-0.5 border-l border-[#E8E6DF]/40 pl-3">
                            <div className="text-[9px] text-[#1c1c1c] font-black uppercase tracking-wider">Clicks</div>
                            <div className="text-lg font-serif text-purple-600">{stats.clicked}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                              {stats.click_rate || 0}% rate
                            </div>
                          </div>

                          {/* Bounced */}
                          <div className="flex flex-col gap-0.5 border-l border-[#E8E6DF]/40 pl-3">
                            <div className="text-[9px] text-[#1c1c1c] font-black uppercase tracking-wider">Bounced</div>
                            <div className="text-lg font-serif text-red-600">{stats.bounced}</div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                              {stats.bounce_rate || 0}% rate
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 px-4 bg-gray-50/30">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                          Detailed statistics pending synchronization
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
