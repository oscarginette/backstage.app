
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Music, CheckCircle2, Instagram } from 'lucide-react';

interface SocialActionStepProps {
  title: string;
  description: string;
  buttonText: string;
  icon: 'soundcloud' | 'spotify' | 'instagram';
  onAction: () => Promise<void>;
  isCompleted?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode; // Allow additional content (e.g., opt-in checkbox)
}

export function SocialActionStep({
  title,
  description,
  buttonText,
  icon,
  onAction,
  isCompleted = false,
  isLoading = false,
  children
}: SocialActionStepProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleAction = async () => {
    setInternalLoading(true);
    try {
      await onAction();
    } finally {
      // Don't reset loading state here since OAuth redirect will happen
      // setInternalLoading(false);
    }
  };

  const loading = isLoading || internalLoading;

  const getIconBgColor = () => {
    if (icon === 'soundcloud') return 'bg-[#ff5500]/10 text-[#ff5500]';
    if (icon === 'spotify') return 'bg-[#1DB954]/10 text-[#1DB954]';
    if (icon === 'instagram') return 'bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white';
    return '';
  };

  const getButtonColor = () => {
    if (isCompleted) return 'bg-green-500/10 text-green-600';
    if (icon === 'soundcloud') return 'bg-[#ff5500] text-white hover:brightness-110 active:scale-95';
    if (icon === 'spotify') return 'bg-[#1DB954] text-white hover:brightness-110 active:scale-95';
    if (icon === 'instagram') return 'bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#833AB4] text-white hover:brightness-110 active:scale-95';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full text-center"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${getIconBgColor()}`}>
        {isCompleted ? (
          <CheckCircle2 className="w-10 h-10" />
        ) : icon === 'instagram' ? (
          <Instagram className="w-10 h-10" />
        ) : (
          <Music className="w-10 h-10" />
        )}
      </div>

      <h2 className="text-xl font-black uppercase mb-2 tracking-tight">{title}</h2>
      <p className="text-sm text-foreground/60 mb-8">{description}</p>

      {/* Additional content (e.g., opt-in checkbox) */}
      {children && (
        <div className="mb-6">
          {children}
        </div>
      )}

      <button
        onClick={handleAction}
        disabled={loading || isCompleted}
        className={`w-full py-3 rounded-lg font-black uppercase text-sm transition-all ${getButtonColor()} ${loading ? 'cursor-wait' : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Redirecting...</span>
          </div>
        ) : isCompleted ? (
          "Completed"
        ) : (
          buttonText
        )}
      </button>

      <p className="text-[10px] text-foreground/40 mt-8 leading-relaxed">
        This action helps the artist reach more listeners and supports their creative journey. Thank you for your support!
      </p>
    </motion.div>
  );
}
