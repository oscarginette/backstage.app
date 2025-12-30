'use client';

import { useState } from 'react';
import { DownloadGate } from '@/types/download-gates';
import { Eye, User, Download, PieChart, Repeat, Music, Copy, Share2, Check } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/context';

export default function GateOverview({ gate }: { gate: DownloadGate }) {
  const t = useTranslations('dashboard.gates.overview');
  const [copied, setCopied] = useState(false);

  const stats = [
    { label: t('totalViews'), value: gate.stats.views, icon: Eye, color: 'blue' },
    { label: t('submissions'), value: gate.stats.submissions, icon: User, color: 'purple' },
    { label: t('downloads'), value: gate.stats.downloads, icon: Download, color: 'emerald' },
    { label: t('convRate'), value: `${gate.stats.conversionRate.toFixed(1)}%`, icon: PieChart, color: 'orange' },
    { label: t('scReposts'), value: gate.stats.soundcloudReposts, icon: Repeat, color: 'orange' },
    { label: t('spotifyConn'), value: gate.stats.spotifyConnections, icon: Music, color: 'emerald' },
  ];

  // Fix: Don't show Views as 100% when it's 0
  const funnelSteps = [
    {
      name: t('views'),
      count: gate.stats.views,
      percent: gate.stats.views > 0 ? 100 : 0
    },
    {
      name: t('emailSubmitted'),
      count: gate.stats.submissions,
      percent: gate.stats.views > 0 ? (gate.stats.submissions / gate.stats.views * 100) : 0
    },
    {
      name: t('actionsCompleted'),
      count: gate.stats.downloads,
      percent: gate.stats.submissions > 0 ? (gate.stats.downloads / gate.stats.submissions * 100) : 0
    },
  ];

  const copyLink = () => {
    const url = `${window.location.origin}/gate/${gate.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/gate/${gate.slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: gate.title,
          text: t('shareText', { title: gate.title }),
          url: url,
        });
      } catch (err) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      copyLink();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-[#E8E6DF] shadow-xl hover:shadow-2xl transition-all group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${
              stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              stat.color === 'purple' ? 'bg-purple-50 text-purple-600' :
              stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
              'bg-orange-50 text-orange-600'
            }`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-serif text-[#1c1c1c]">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Public Link Card */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
          <h3 className="text-xl font-serif text-[#1c1c1c] mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#FF5500]" />
            {t('promotion')}
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">{t('publicLink')}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-5 py-3 rounded-xl bg-[#F5F3ED] border border-[#E8E6DF] text-sm font-mono text-[#1c1c1c] truncate">
                  {window.location.origin}/gate/{gate.slug}
                </div>
                <button
                  onClick={copyLink}
                  className={`group relative px-4 py-3 rounded-xl transition-all active:scale-95 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#1c1c1c] text-white hover:bg-black'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-500 text-white text-xs rounded-lg whitespace-nowrap">
                        {t('copied')}
                      </span>
                    </>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={shareLink}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF5500] text-white hover:bg-[#e64d00] transition-all text-sm font-medium active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>{t('share')}</span>
            </button>
          </div>
        </div>

        {/* Funnel Card */}
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
          <h3 className="text-xl font-serif text-[#1c1c1c] mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#FF5500]" />
            {t('conversionFunnel')}
          </h3>

          <div className="space-y-6">
            {funnelSteps.map((step, i) => (
              <div key={step.name} className="relative">
                <div className="flex justify-between items-end mb-2">
                   <div className="text-sm font-bold text-[#1c1c1c]">{step.name}</div>
                   <div className="text-sm font-mono text-gray-500">{step.count} ({step.percent.toFixed(1)}%)</div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-purple-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${step.percent}%` }}
                  />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 z-10">
                     <div className="w-0.5 h-4 bg-[#E8E6DF]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
