
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Music, CheckCircle2, Instagram } from 'lucide-react';

interface SocialActionStepProps {
  title: string;
  description: string;
  buttonText: string;
  icon: 'soundcloud' | 'spotify' | 'instagram';
  onAction: (commentText?: string) => Promise<void>;
  isCompleted?: boolean;
  isLoading?: boolean;
  enableCommentInput?: boolean;
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
  enableCommentInput = false,
  children
}: SocialActionStepProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleAction = async () => {
    // Validate comment if enabled
    if (enableCommentInput) {
      if (commentText.trim().length === 0) {
        setCommentError('Please write a comment before connecting');
        return;
      }
      if (commentText.length > 300) {
        setCommentError('Comment must be less than 300 characters');
        return;
      }
      setCommentError(null);
    }

    setInternalLoading(true);
    try {
      await onAction(enableCommentInput ? commentText : undefined);
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

      {/* Comment textarea */}
      {enableCommentInput && !isCompleted && (
        <div className="mb-6">
          <label className="block text-xs font-bold mb-2 uppercase tracking-tight text-left">
            Share a comment <span className="text-[#ff5500]">*</span>
          </label>
          <textarea
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              setCommentError(null);
            }}
            disabled={loading}
            placeholder="Write your comment here... (max 300 characters)"
            maxLength={300}
            rows={3}
            aria-label="Comment on SoundCloud track"
            className="w-full px-4 py-3 bg-background/50 border border-foreground/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500] disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
          />
          {/* Character counter and error */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-red-600 h-4">
              {commentError || ''}
            </span>
            <span className="text-xs text-foreground/40">{commentText.length}/300</span>
          </div>
        </div>
      )}

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
