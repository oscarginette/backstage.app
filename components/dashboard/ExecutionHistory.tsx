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

  if (history.length === 0) return null;

  return (
    <div className="w-full bg-white/70 backdrop-blur-xl rounded-3xl border border-[#E8E6DF] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-[#E8E6DF]">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-serif text-[#1c1c1c]">Historial de Campañas</h2>
          <button
            onClick={fetchCampaignStats}
            className="p-2.5 rounded-xl hover:bg-[#F5F3ED] transition-colors"
            title="Refrescar estadísticas"
          >
            <svg className="w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-8">
        <div className="relative border-l border-[#E8E6DF] pl-8 space-y-8 ml-4">
          {history.map((item) => {
            const stats = campaignStats[item.trackId];

            return (
              <div key={item.trackId} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-[#E8E6DF] group-hover:bg-[#FF5500] transition-colors duration-300 shadow-sm"></div>

                {/* Content */}
                <div className="bg-white rounded-2xl border border-[#E8E6DF] overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="p-6 border-b border-[#E8E6DF] bg-gradient-to-br from-[#FDFCF8] to-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-serif text-xl text-[#1c1c1c] mb-2">{item.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>{new Date(item.executedAt).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#E8E6DF] text-sm font-medium text-[#1c1c1c] bg-white hover:bg-[#F5F3ED] transition-all"
                      >
                        Ver Track
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  {loadingStats ? (
                    <div className="p-6 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
                    </div>
                  ) : stats ? (
                    <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Delivered */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                          <div className="text-xs text-blue-700 font-medium mb-1 uppercase tracking-wide">Delivered</div>
                          <div className="text-2xl font-bold text-blue-900 mb-1">{stats.delivered}</div>
                          <div className="text-xs text-blue-600 font-semibold">
                            {stats.delivery_rate || 0}% delivery rate
                          </div>
                        </div>

                        {/* Opens */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
                          <div className="text-xs text-emerald-700 font-medium mb-1 uppercase tracking-wide">Opens</div>
                          <div className="text-2xl font-bold text-emerald-900 mb-1">{stats.opened}</div>
                          <div className="text-xs text-emerald-600 font-semibold">
                            {stats.open_rate || 0}% open rate
                          </div>
                        </div>

                        {/* Clicks */}
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                          <div className="text-xs text-purple-700 font-medium mb-1 uppercase tracking-wide">Clicks</div>
                          <div className="text-2xl font-bold text-purple-900 mb-1">{stats.clicked}</div>
                          <div className="text-xs text-purple-600 font-semibold">
                            {stats.click_rate || 0}% click rate
                          </div>
                        </div>

                        {/* Bounced */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200">
                          <div className="text-xs text-red-700 font-medium mb-1 uppercase tracking-wide">Bounced</div>
                          <div className="text-2xl font-bold text-red-900 mb-1">{stats.bounced}</div>
                          <div className="text-xs text-red-600 font-semibold">
                            {stats.bounce_rate || 0}% bounce rate
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="text-center text-sm text-gray-500">
                        <p>Enviado a {item.emailsSent} destinatarios</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Ejecuta la migración para ver estadísticas detalladas
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
