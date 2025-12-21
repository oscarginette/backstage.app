import React from 'react';

export default function Header() {
  return (
    <div className="mb-16 relative">
      {/* Aurora Glow Effect behind header */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-aurora-light rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-start">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm mb-6 transition-transform hover:scale-105">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF5500] animate-pulse"></div>
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">System Active</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-[#1c1c1c] leading-[1.1]">
          SoundCloud <br/>
          <span className="italic text-gray-400">Automation</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 font-light max-w-lg leading-relaxed">
          Gestión inteligente de notificaciones y distribución de tracks con un enfoque humano.
        </p>
      </div>
    </div>
  );
}
