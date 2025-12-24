import React from 'react';
import { Users, Rocket, BarChart3, TrendingUp } from 'lucide-react';

interface StatCardsProps {
  stats: {
    totalContacts: number;
    totalDownloads: number;
    activeCampaigns: number;
    avgConversionRate: number;
  };
}

export default function StatCards({ stats }: StatCardsProps) {
  const safeStats = {
    totalContacts: stats?.totalContacts ?? 0,
    totalDownloads: stats?.totalDownloads ?? 0,
    activeCampaigns: stats?.activeCampaigns ?? 0,
    avgConversionRate: stats?.avgConversionRate ?? 0,
  };

  const cards = [
    {
      label: 'Audience',
      value: safeStats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-100/50',
    },
    {
      label: 'Downloads',
      value: stats.totalDownloads.toLocaleString(),
      icon: Rocket,
      color: 'text-[#FF5500]',
      bgColor: 'bg-[#FF5500]/10',
      borderColor: 'border-[#FF5500]/10',
    },
    {
      label: 'Engagement',
      value: stats.activeCampaigns.toLocaleString(),
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-100/50',
    },
    {
      label: 'Conversion',
      value: `${stats.avgConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-100/50',
    },
  ];

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {cards.map((card) => (
        <div 
          key={card.label}
          className={`
            relative overflow-hidden flex flex-col gap-2 p-4 
            bg-white/60 backdrop-blur-xl border ${card.borderColor} 
            rounded-2xl transition-all duration-500 
            hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 group
          `}
        >
          {/* Decorative Gradient Backdrop */}
          <div className={`absolute -right-2 -top-2 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-1000 ${card.bgColor}`} />
          
          <div className={`w-8 h-8 flex shrink-0 items-center justify-center ${card.bgColor} rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400 font-bold mb-0.5">{card.label}</p>
            <h3 className="text-xl font-serif text-[#1c1c1c] tracking-tight">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
