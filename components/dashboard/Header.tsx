import React from 'react';

export default function Header() {
  return (
    <div className="mb-8 relative">
      {/* Aurora Glow Effect behind header */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-aurora-light rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-start">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-border backdrop-blur-sm mb-4 transition-transform hover:scale-105">
          <div className="w-2 h-2 rounded-full bg-[#FF5500] animate-pulse"></div>
          <span className="text-sm font-medium text-foreground/80">System Active</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-serif tracking-tight mb-3 text-[#1c1c1c] leading-[0.9]">
          Backstage
        </h1>

        <p className="text-base md:text-lg text-gray-500 font-light max-w-lg leading-relaxed">
          The Artist's Command Center
        </p>
      </div>
    </div>
  );
}
