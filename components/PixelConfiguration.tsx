"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react";

interface PixelConfigurationProps {
  gateId: string;
  initialConfig?: any;
}

export default function PixelConfiguration({
  gateId,
  initialConfig,
}: PixelConfigurationProps) {
  // Form state
  const [config, setConfig] = useState({
    facebook: {
      enabled: initialConfig?.facebook?.enabled || false,
      pixelId: initialConfig?.facebook?.pixelId || "",
      accessToken: "", // Never pre-fill tokens for security
      testEventCode: initialConfig?.facebook?.testEventCode || "",
    },
    google: {
      enabled: initialConfig?.google?.enabled || false,
      tagId: initialConfig?.google?.tagId || "",
      conversionLabels: {
        view: initialConfig?.google?.conversionLabels?.view || "",
        submit: initialConfig?.google?.conversionLabels?.submit || "",
        download: initialConfig?.google?.conversionLabels?.download || "",
      },
    },
    tiktok: {
      enabled: initialConfig?.tiktok?.enabled || false,
      pixelId: initialConfig?.tiktok?.pixelId || "",
      accessToken: "", // Never pre-fill tokens for security
    },
  });

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    facebook: false,
    google: false,
    tiktok: false,
  });
  const [showHelp, setShowHelp] = useState({
    facebook: false,
    google: false,
    tiktok: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toggle section expansion
  const toggleSection = (platform: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  // Toggle help
  const toggleHelp = (platform: keyof typeof showHelp) => {
    setShowHelp((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Only send enabled platforms
      const pixelConfig: any = {};

      if (config.facebook.enabled && config.facebook.pixelId) {
        pixelConfig.facebook = {
          enabled: true,
          pixelId: config.facebook.pixelId,
          ...(config.facebook.accessToken && {
            accessToken: config.facebook.accessToken,
          }),
          ...(config.facebook.testEventCode && {
            testEventCode: config.facebook.testEventCode,
          }),
        };
      }

      if (config.google.enabled && config.google.tagId) {
        pixelConfig.google = {
          enabled: true,
          tagId: config.google.tagId,
          conversionLabels: config.google.conversionLabels,
        };
      }

      if (config.tiktok.enabled && config.tiktok.pixelId) {
        pixelConfig.tiktok = {
          enabled: true,
          pixelId: config.tiktok.pixelId,
          ...(config.tiktok.accessToken && {
            accessToken: config.tiktok.accessToken,
          }),
        };
      }

      const response = await fetch(
        `/api/download-gates/${gateId}/pixel-config`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pixelConfig }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save pixel configuration");
      }

      setSuccess("Pixel configuration saved successfully!");

      // Clear access token fields after successful save (security)
      setConfig((prev) => ({
        ...prev,
        facebook: { ...prev.facebook, accessToken: "" },
        tiktok: { ...prev.tiktok, accessToken: "" },
      }));

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving pixel config:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/40">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-serif">Marketing Pixels</h2>
            <p className="text-foreground/50 text-xs">
              Track conversions with Facebook, Google Ads, and TikTok
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-4">
        {/* Facebook Pixel Section */}
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("facebook")}
            className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                <span className="text-lg font-bold text-[#1877F2]">f</span>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold">Facebook Pixel</h3>
                <p className="text-xs text-foreground/50">
                  {config.facebook.enabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            {expandedSections.facebook ? (
              <ChevronUp className="w-5 h-5 text-foreground/40" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/40" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.facebook && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 border-t border-white/40 space-y-3">
                  {/* Enable toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.facebook.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          facebook: {
                            ...prev.facebook,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 rounded border-border/60"
                    />
                    <span className="text-xs font-medium">
                      Enable Facebook Pixel
                    </span>
                  </label>

                  {config.facebook.enabled && (
                    <>
                      {/* Pixel ID */}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Pixel ID (15 digits)
                        </label>
                        <input
                          type="text"
                          value={config.facebook.pixelId}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              facebook: {
                                ...prev.facebook,
                                pixelId: e.target.value,
                              },
                            }))
                          }
                          placeholder="123456789012345"
                          className="mt-1 w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all text-sm font-medium font-mono"
                        />
                      </div>

                      {/* Access Token */}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Access Token
                        </label>
                        <input
                          type="password"
                          value={config.facebook.accessToken}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              facebook: {
                                ...prev.facebook,
                                accessToken: e.target.value,
                              },
                            }))
                          }
                          placeholder="Enter access token"
                          className="mt-1 w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all text-sm font-medium font-mono"
                        />
                      </div>

                      {/* Test Event Code (optional) */}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Test Event Code (Optional)
                        </label>
                        <input
                          type="text"
                          value={config.facebook.testEventCode}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              facebook: {
                                ...prev.facebook,
                                testEventCode: e.target.value,
                              },
                            }))
                          }
                          placeholder="TEST12345"
                          className="mt-1 w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all text-sm font-medium"
                        />
                      </div>

                      {/* Help Section */}
                      <button
                        type="button"
                        onClick={() => toggleHelp("facebook")}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-[#1877F2] hover:text-[#1877F2]/80 transition-colors uppercase tracking-widest"
                      >
                        <Info className="w-3 h-3" />
                        How to get credentials
                        {showHelp.facebook ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {showHelp.facebook && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-br from-[#1877F2]/5 to-[#1877F2]/10 border border-[#1877F2]/20 rounded-xl p-4">
                              <h4 className="text-xs font-bold text-foreground mb-3">
                                Facebook Pixel Setup:
                              </h4>
                              <ol className="space-y-2 text-xs text-foreground/70">
                                <li className="flex gap-2">
                                  <span className="font-bold text-[#1877F2]">
                                    1.
                                  </span>
                                  <span>
                                    Go to{" "}
                                    <a
                                      href="https://business.facebook.com/events_manager"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#1877F2] hover:underline inline-flex items-center gap-1"
                                    >
                                      Facebook Events Manager
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-[#1877F2]">
                                    2.
                                  </span>
                                  <span>
                                    Select your Pixel, copy the 15-digit Pixel
                                    ID
                                  </span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-[#1877F2]">
                                    3.
                                  </span>
                                  <span>
                                    Go to Settings → Conversions API → Generate
                                    Access Token
                                  </span>
                                </li>
                              </ol>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Google Ads Section */}
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("google")}
            className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4285F4]/10 flex items-center justify-center">
                <span className="text-lg font-bold text-[#4285F4]">G</span>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold">Google Ads</h3>
                <p className="text-xs text-foreground/50">
                  {config.google.enabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            {expandedSections.google ? (
              <ChevronUp className="w-5 h-5 text-foreground/40" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/40" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.google && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 border-t border-white/40 space-y-3">
                  {/* Enable toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.google.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          google: {
                            ...prev.google,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 rounded border-border/60"
                    />
                    <span className="text-xs font-medium">
                      Enable Google Ads Tracking
                    </span>
                  </label>

                  {config.google.enabled && (
                    <>
                      {/* Tag ID */}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Google Ads Tag ID
                        </label>
                        <input
                          type="text"
                          value={config.google.tagId}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              google: { ...prev.google, tagId: e.target.value },
                            }))
                          }
                          placeholder="AW-XXXXXXXXX"
                          className="mt-1 w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4]/40 transition-all text-sm font-medium font-mono"
                        />
                      </div>

                      {/* Conversion Labels */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Conversion Labels (Optional)
                        </label>

                        <input
                          type="text"
                          value={config.google.conversionLabels.view}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              google: {
                                ...prev.google,
                                conversionLabels: {
                                  ...prev.google.conversionLabels,
                                  view: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="View label"
                          className="w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all text-xs"
                        />

                        <input
                          type="text"
                          value={config.google.conversionLabels.submit}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              google: {
                                ...prev.google,
                                conversionLabels: {
                                  ...prev.google.conversionLabels,
                                  submit: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="Lead label"
                          className="w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all text-xs"
                        />

                        <input
                          type="text"
                          value={config.google.conversionLabels.download}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              google: {
                                ...prev.google,
                                conversionLabels: {
                                  ...prev.google.conversionLabels,
                                  download: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="Download label"
                          className="w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 transition-all text-xs"
                        />
                      </div>

                      {/* Help Section */}
                      <button
                        type="button"
                        onClick={() => toggleHelp("google")}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-[#4285F4] hover:text-[#4285F4]/80 transition-colors uppercase tracking-widest"
                      >
                        <Info className="w-3 h-3" />
                        How to get Tag ID
                        {showHelp.google ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {showHelp.google && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-br from-[#4285F4]/5 to-[#4285F4]/10 border border-[#4285F4]/20 rounded-xl p-4">
                              <h4 className="text-xs font-bold text-foreground mb-3">
                                Google Ads Setup:
                              </h4>
                              <ol className="space-y-2 text-xs text-foreground/70">
                                <li className="flex gap-2">
                                  <span className="font-bold text-[#4285F4]">
                                    1.
                                  </span>
                                  <span>
                                    Go to{" "}
                                    <a
                                      href="https://ads.google.com"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#4285F4] hover:underline inline-flex items-center gap-1"
                                    >
                                      Google Ads
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-[#4285F4]">
                                    2.
                                  </span>
                                  <span>
                                    Go to Tools → Measurement → Conversions
                                  </span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-[#4285F4]">
                                    3.
                                  </span>
                                  <span>
                                    Copy the Tag ID (starts with "AW-") and
                                    conversion labels
                                  </span>
                                </li>
                              </ol>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TikTok Pixel Section */}
        <div className="border border-border/60 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("tiktok")}
            className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
                <span className="text-lg font-bold">TT</span>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold">TikTok Pixel</h3>
                <p className="text-xs text-foreground/50">
                  {config.tiktok.enabled ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            {expandedSections.tiktok ? (
              <ChevronUp className="w-5 h-5 text-foreground/40" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground/40" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.tiktok && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 border-t border-white/40 space-y-3">
                  {/* Enable toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.tiktok.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          tiktok: {
                            ...prev.tiktok,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 rounded border-border/60"
                    />
                    <span className="text-xs font-medium">
                      Enable TikTok Pixel
                    </span>
                  </label>

                  {config.tiktok.enabled && (
                    <>
                      {/* Pixel ID */}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Pixel ID
                        </label>
                        <input
                          type="text"
                          value={config.tiktok.pixelId}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              tiktok: {
                                ...prev.tiktok,
                                pixelId: e.target.value,
                              },
                            }))
                          }
                          placeholder="ABC123XYZ"
                          className="mt-1 w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/40 transition-all text-sm font-medium font-mono"
                        />
                      </div>

                      {/* Access Token */}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
                          Access Token
                        </label>
                        <input
                          type="password"
                          value={config.tiktok.accessToken}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              tiktok: {
                                ...prev.tiktok,
                                accessToken: e.target.value,
                              },
                            }))
                          }
                          placeholder="Enter access token"
                          className="mt-1 w-full h-10 px-4 rounded-xl border border-border/60 bg-white/50 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/40 transition-all text-sm font-medium font-mono"
                        />
                      </div>

                      {/* Help Section */}
                      <button
                        type="button"
                        onClick={() => toggleHelp("tiktok")}
                        className="inline-flex items-center gap-1 text-[9px] font-bold text-black hover:text-black/80 transition-colors uppercase tracking-widest"
                      >
                        <Info className="w-3 h-3" />
                        How to get credentials
                        {showHelp.tiktok ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {showHelp.tiktok && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-br from-black/5 to-black/10 border border-black/20 rounded-xl p-4">
                              <h4 className="text-xs font-bold text-foreground mb-3">
                                TikTok Pixel Setup:
                              </h4>
                              <ol className="space-y-2 text-xs text-foreground/70">
                                <li className="flex gap-2">
                                  <span className="font-bold text-black">
                                    1.
                                  </span>
                                  <span>
                                    Go to{" "}
                                    <a
                                      href="https://ads.tiktok.com/i18n/events_manager"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-black hover:underline inline-flex items-center gap-1"
                                    >
                                      TikTok Events Manager
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-black">
                                    2.
                                  </span>
                                  <span>Select your Pixel, copy the Pixel ID</span>
                                </li>
                                <li className="flex gap-2">
                                  <span className="font-bold text-black">
                                    3.
                                  </span>
                                  <span>
                                    Go to Settings → Generate Access Token for
                                    Events API
                                  </span>
                                </li>
                              </ol>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-10 px-4 rounded-xl bg-foreground text-background text-xs font-bold hover:bg-foreground/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Pixel Configuration
            </>
          )}
        </button>
      </div>
    </div>
  );
}
