
'use client';

import { useState, useEffect, use } from 'react';
import { DownloadGateArtwork } from '@/components/download-gate/DownloadGateArtwork';
import { DownloadProgressTracker, Step } from '@/components/download-gate/DownloadProgressTracker';
import { EmailCaptureForm } from '@/components/download-gate/EmailCaptureForm';
import { SocialActionStep } from '@/components/download-gate/SocialActionStep';
import { DownloadUnlockStep } from '@/components/download-gate/DownloadUnlockStep';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Youtube } from 'lucide-react';
import { PATHS } from '@/lib/paths';

export default function DownloadGatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [gate, setGate] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<string>('email');
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [spotifyAutoSaveOptIn, setSpotifyAutoSaveOptIn] = useState(false);

  useEffect(() => {
    const fetchGate = async () => {
      try {
        const res = await fetch(`/api/gate/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setGate(data.gate);
        } else {
          setGate({
            title: 'El House (Edit x Alejandro Paz) [Backstage DL]',
            artistName: 'Gee Beat',
            artworkUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17',
            requireSoundcloudRepost: true,
            requireSoundcloudFollow: true,
            requireSpotifyConnect: true,
          });
        }
      } catch (e) {
         setGate({
            title: 'El House (Edit x Alejandro Paz) [Backstage DL]',
            artistName: 'Gee Beat',
            artworkUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17',
            requireSoundcloudRepost: true,
            requireSoundcloudFollow: true,
            requireSpotifyConnect: true,
          });
      } finally {
        setLoading(false);
      }
    };
    fetchGate();

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');
    const oauthProvider = urlParams.get('provider');

    if (oauthStatus === 'success' && oauthProvider) {
      // OAuth successful - refresh submission from localStorage or API
      const saved = localStorage.getItem(`gate_submission_${slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Update submission with OAuth verification
        if (oauthProvider === 'soundcloud') {
          parsed.soundcloudRepostVerified = true;
          parsed.soundcloudFollowVerified = true;
        } else if (oauthProvider === 'spotify') {
          parsed.spotifyConnected = true;
        }

        setSubmission(parsed);
        localStorage.setItem(`gate_submission_${slug}`, JSON.stringify(parsed));
      }

      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthStatus === 'error') {
      const errorMsg = urlParams.get('message') || 'OAuth verification failed';
      setOauthError(errorMsg);

      // Clear error after 5 seconds
      setTimeout(() => setOauthError(null), 5000);

      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      // Normal flow - load from localStorage
      const saved = localStorage.getItem(`gate_submission_${slug}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSubmission(parsed);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (gate && submission) {
      if (submission.downloadCompleted) {
        setCurrentStep('download');
      } else if (gate.requireSpotifyConnect && !submission.spotifyConnected && (submission.soundcloudRepostVerified || (!gate.requireSoundcloudFollow && !gate.requireSoundcloudRepost))) {
        setCurrentStep('spotify');
      } else if ((gate.requireSoundcloudFollow || gate.requireSoundcloudRepost) && !submission.soundcloudRepostVerified) {
        setCurrentStep('soundcloud');
      } else {
        setCurrentStep('download');
      }
    }
  }, [gate, submission]);

  const steps: Step[] = [
    { id: 'email', label: 'Email', completed: !!submission, current: currentStep === 'email' },
    { id: 'soundcloud', label: 'Support', completed: submission?.soundcloudRepostVerified, current: currentStep === 'soundcloud' },
    { id: 'spotify', label: 'Spotify', completed: submission?.spotifyConnected, current: currentStep === 'spotify' },
    { id: 'download', label: 'Download', completed: submission?.downloadCompleted, current: currentStep === 'download' },
  ].filter(s => {
    if (s.id === 'soundcloud') return gate?.requireSoundcloudRepost || gate?.requireSoundcloudFollow;
    if (s.id === 'spotify') return gate?.requireSpotifyConnect;
    return true;
  });

  const handleEmailSubmit = async (data: any) => {
    try {
      // Call the real API to submit email
      const response = await fetch(`/api/gate/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          consentMarketing: data.consentMarketing,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newSubmission = {
          ...result.submission,
          soundcloudRepostVerified: false,
          spotifyConnected: false,
          downloadCompleted: false,
        };
        setSubmission(newSubmission);
        localStorage.setItem(`gate_submission_${slug}`, JSON.stringify(newSubmission));
      } else {
        console.error('Failed to submit email');
      }
    } catch (error) {
      console.error('Error submitting email:', error);
    }
  };

  const handleSoundcloudActions = async () => {
    if (!submission?.id || !gate?.id) return;

    setOauthLoading(true);
    // Redirect to SoundCloud OAuth flow
    // The OAuth callback will handle verification and redirect back to this page
    const redirectUrl = `/api/gate/oauth/soundcloud?submissionId=${submission.id}&gateId=${gate.id}`;
    window.location.href = redirectUrl;
  };

  const handleSpotify = async () => {
    if (!submission?.id || !gate?.id) return;

    setOauthLoading(true);

    // Redirect to Spotify OAuth flow with auto-save opt-in preference
    const redirectUrl = `/api/auth/spotify?submissionId=${submission.id}&gateId=${gate.id}&autoSaveOptIn=${spotifyAutoSaveOptIn}`;
    window.location.href = redirectUrl;
  };

  const handleDownload = async () => {
    if (!submission?.id) return;

    try {
      // Generate download token
      const tokenResponse = await fetch(`/api/gate/${slug}/download-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id }),
      });

      if (tokenResponse.ok) {
        const { token } = await tokenResponse.json();

        // Redirect to download
        window.location.href = `/api/download/${token}`;

        // Update submission as downloaded
        const updated = { ...submission, downloadCompleted: true };
        setSubmission(updated);
        localStorage.setItem(`gate_submission_${slug}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error generating download token:', error);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black">
      <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  if (!gate) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FDFCF8] px-4 text-center">
      <h1 className="text-4xl font-black uppercase mb-4 tracking-tighter">Gate Not Found</h1>
      <a href={PATHS.HOME} className="px-8 py-4 bg-foreground text-background rounded-lg font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all">Back to Home</a>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden relative selection:bg-accent selection:text-white flex flex-col md:flex-row">
      {/* Background Layer: Blurred Artwork */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {gate.artworkUrl && (
          <div 
            className="absolute inset-x-0 top-0 h-full w-full bg-cover bg-center scale-110 blur-[60px] opacity-40 transition-all duration-1000"
            style={{ backgroundImage: `url(${gate.artworkUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/80 z-10" />
      </div>

      {/* Top Left Brand Logo (Global) */}
      <div className="absolute top-8 left-8 z-40">
        <a
          href={PATHS.HOME}
          target="_blank"
          className="font-serif italic text-3xl text-white hover:text-accent transition-colors duration-300 tracking-tight"
        >
          The Backstage
        </a>
      </div>

      {/* Content Layer */}
      <main className="relative z-20 h-full w-full flex flex-col md:flex-row">
        {/* Left Side: Artwork (60% width on large screens) */}
        <section className="flex-[1.5] h-1/2 md:h-full flex items-center justify-center p-6 md:p-12 lg:p-20 overflow-hidden">
          <DownloadGateArtwork title={gate.title} artworkUrl={gate.artworkUrl} />
        </section>

        {/* Right Side: Form (40% width on large screens) */}
        <section className="flex-1 h-1/2 md:h-full bg-black/40 backdrop-blur-xl md:backdrop-blur-none md:bg-black/60 flex flex-col border-l border-white/10 overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-16 max-w-[550px] mx-auto w-full pt-20">
            {/* Header info */}
            <header className="mb-8 md:mb-12">
              <motion.h1 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl lg:text-3xl font-black text-white mb-2 leading-tight tracking-tight"
              >
                {gate.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-white/50 font-medium"
              >
                {gate.artistName}
              </motion.p>
            </header>

            {/* Form Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 25 }}
              className="bg-white rounded-2xl p-8 lg:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col min-h-0"
            >
              <DownloadProgressTracker steps={steps} />

              {oauthError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {oauthError}
                </div>
              )}

              <div className="overflow-y-auto no-scrollbar flex-1">
                <AnimatePresence mode="wait">
                  {currentStep === 'email' && (
                    <EmailCaptureForm key="email" onSubmit={handleEmailSubmit} />
                  )}

                  {currentStep === 'soundcloud' && (
                  <SocialActionStep
                    key="soundcloud"
                    title="Comment & Support"
                    description="Drop a comment on the track to unlock. This will also Follow, Like and Repost to support the artist."
                    buttonText="Comment & Unlock"
                    icon="soundcloud"
                    onAction={handleSoundcloudActions}
                    isCompleted={submission?.soundcloudRepostVerified}
                    isLoading={oauthLoading}
                  />
                )}

                  {currentStep === 'spotify' && (
                    <SocialActionStep
                      key="spotify"
                      title="Spotify Connect"
                      description="Connect your Spotify account to support the artist."
                      buttonText="Connect Spotify"
                      icon="spotify"
                      onAction={handleSpotify}
                      isCompleted={submission?.spotifyConnected}
                      isLoading={oauthLoading}
                    >
                      {/* Auto-save opt-in checkbox */}
                      {!submission?.spotifyConnected && (
                        <label className="flex items-start gap-3 text-left cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={spotifyAutoSaveOptIn}
                            onChange={(e) => setSpotifyAutoSaveOptIn(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-foreground/20 bg-background/50 text-[#1DB954] focus:ring-[#1DB954] focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="text-xs text-foreground/70 group-hover:text-foreground/90 transition-colors">
                            Automatically save all future releases from this artist to my Spotify library
                          </span>
                        </label>
                      )}
                    </SocialActionStep>
                  )}

                  {currentStep === 'download' && (
                    <DownloadUnlockStep
                      key="download"
                      onDownload={handleDownload}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Social & Footer */}
            <div className="mt-auto pt-10 flex flex-col items-center">
              <nav className="flex items-center gap-8 mb-8 text-white/30">
                <Instagram className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                <Youtube className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
              </nav>

              <footer className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-white/20 border-t border-white/5 pt-8 mb-4">
                <a href="#" className="hover:text-white transition-colors">Help</a>
                <span>|</span>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <span>|</span>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <span>|</span>
                <a href="#" className="hover:text-white transition-colors">DMCA Policy</a>
                <span>|</span>
                <a href={PATHS.HOME} target="_blank" className="text-white/40 hover:text-white transition-colors font-black">TheBackstage.app</a>
              </footer>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
