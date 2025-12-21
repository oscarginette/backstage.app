import React from 'react';
import { ExecutionHistoryItem } from '../../types/dashboard';

interface ExecutionHistoryProps {
  history: ExecutionHistoryItem[];
}

export default function ExecutionHistory({ history }: ExecutionHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-12 bg-white border border-[#E8E6DF] rounded-[32px] p-8 md:p-12">
      <h2 className="font-serif text-3xl text-[#1c1c1c] mb-10">Historial reciente</h2>
      
      <div className="relative border-l border-[#E8E6DF] pl-8 space-y-12 ml-4">
        {history.map((item) => (
          <div key={item.trackId} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 border-white bg-[#E8E6DF] group-hover:bg-[#FF5500] transition-colors duration-300 shadow-sm"></div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6">
               <div className="flex-1">
                  <h3 className="font-serif text-xl text-[#1c1c1c] mb-2">{item.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>{new Date(item.executedAt).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    <span className="text-gray-300">•</span>
                    <span>{item.emailsSent} destinatarios</span>
                  </div>
               </div>
               
               <a 
                 href={item.url} 
                 target="_blank" 
                 rel="noreferrer"
                 className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-[#E8E6DF] text-sm font-medium text-[#1c1c1c] bg-white hover:bg-[#FDFCF8] hover:border-gray-300 transition-all"
               >
                 Ver Track
               </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
