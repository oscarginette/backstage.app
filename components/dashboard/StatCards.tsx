import React from 'react';

interface StatCardsProps {
  activeListsCount: number;
}

export default function StatCards({ activeListsCount }: StatCardsProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 p-5 bg-white border border-[#E8E6DF] rounded-[24px] transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 flex shrink-0 items-center justify-center bg-[#FDFCF8] rounded-full border border-[#F2F0E9]">
             <svg className="w-4 h-4 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div>
             <h3 className="font-serif text-lg text-[#1c1c1c] leading-none mb-1">Frecuencia</h3>
             <p className="text-xs text-gray-400 font-medium">Diario 20:00 CET</p>
           </div>
        </div>
      </div>

      <div className="flex-1 p-5 bg-white border border-[#E8E6DF] rounded-[24px] transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 flex shrink-0 items-center justify-center bg-[#FDFCF8] rounded-full border border-[#F2F0E9]">
              <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
           <div>
             <h3 className="font-serif text-lg text-[#1c1c1c] leading-none mb-1">Listas Activas</h3>
             <p className="text-xs text-gray-400 font-medium">{activeListsCount} {activeListsCount === 1 ? 'lista' : 'listas'}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
