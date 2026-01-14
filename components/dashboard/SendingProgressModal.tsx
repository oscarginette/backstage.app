'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { env } from '@/lib/env';

/**
 * SendingProgressModal
 *
 * Shows real-time feedback when sending email campaigns.
 * Displays loading state, progress, and results.
 *
 * Features:
 * - Animated spinner during send
 * - Contact count display (with test mode awareness)
 * - Progress percentage
 * - Success/failure results
 * - Auto-close on success
 *
 * Usage:
 * <SendingProgressModal
 *   isOpen={isSending}
 *   totalContacts={5401}
 *   isTestMode={env.TEST_EMAIL_ONLY}
 *   result={sendResult}
 *   onClose={() => setSending(false)}
 * />
 */

interface SendingProgressModalProps {
  isOpen: boolean;
  totalContacts: number;
  isTestMode?: boolean;
  result?: SendResult | null;
  onClose: () => void;
}

interface SendResult {
  success: boolean;
  emailsSent: number;
  emailsFailed: number;
  totalContacts: number;
  duration: number;
  failures?: Array<{ email: string; error: string }>;
  error?: string;
}

export default function SendingProgressModal({
  isOpen,
  totalContacts,
  isTestMode = false,
  result,
  onClose
}: SendingProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  // Optimistic progress simulation while sending
  useEffect(() => {
    if (!isOpen || result) {
      setProgress(0);
      return;
    }

    // Calculate estimated time based on contact count
    // Estimate: ~50 contacts per second (conservative)
    const estimatedSeconds = Math.max(2, Math.min(20, totalContacts / 50));
    setEstimatedTime(estimatedSeconds);

    // Progress animation: smooth increment every 100ms
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90% to avoid completing before actual send
        if (prev >= 90) return Math.min(95, prev + 0.5);
        if (prev >= 70) return prev + 1;
        if (prev >= 50) return prev + 2;
        return prev + 3;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, result, totalContacts]);

  // Set progress to 100% when result arrives
  useEffect(() => {
    if (result?.success) {
      setProgress(100);
    }
  }, [result]);

  // Auto-close on success after 3 seconds
  useEffect(() => {
    if (result?.success) {
      const timeout = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [result, onClose]);

  if (!isOpen) return null;

  const isSending = !result;
  const hasError = result && !result.success;
  const hasSuccess = result?.success;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      customHeader={
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif text-foreground mb-1">
                {isSending && 'Enviando Campaña'}
                {hasSuccess && 'Campaña Enviada'}
                {hasError && 'Error al Enviar'}
              </h2>
              <p className="text-sm text-foreground/50">
                {isSending && 'Por favor espera mientras enviamos tus correos...'}
                {hasSuccess && 'Tus correos se han enviado correctamente'}
                {hasError && 'Ocurrió un error al enviar la campaña'}
              </p>
            </div>
            {!isSending && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="p-6">
        {/* Sending State */}
        {isSending && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            {/* Animated spinner */}
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />

            {/* Status text */}
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                Enviando correos...
              </p>
              <p className="text-sm text-foreground/50 mt-1">
                {totalContacts.toLocaleString()} contacto{totalContacts !== 1 ? 's' : ''} • {Math.round(progress)}% completado
              </p>
              {isTestMode && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Modo de Prueba Activo
                  </span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md space-y-2">
              <div className="relative w-full h-3 bg-border rounded-full overflow-hidden">
                {/* Animated gradient background */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-accent via-[#FF6B2C] to-accent bg-[length:200%_100%] animate-shimmer transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Time estimate */}
              <p className="text-xs text-foreground/40 text-center">
                {progress < 95
                  ? `Tiempo estimado: ${Math.max(1, Math.round(estimatedTime * (1 - progress / 100)))}s restantes`
                  : 'Finalizando...'}
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {hasSuccess && result && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success message */}
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                ¡Campaña enviada con éxito!
              </p>
              <div className="space-y-1">
                <p className="text-sm text-foreground/60">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-500">{result.emailsSent.toLocaleString()}</span> {result.emailsSent === 1 ? 'correo enviado' : 'correos enviados'}
                </p>
                {result.emailsFailed > 0 && (
                  <p className="text-sm text-foreground/60">
                    <span className="font-semibold text-red-600 dark:text-red-500">{result.emailsFailed.toLocaleString()}</span> {result.emailsFailed === 1 ? 'fallo' : 'fallos'}
                  </p>
                )}
                <p className="text-xs text-foreground/40 mt-2">
                  Completado en {(result.duration / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Show failures if any */}
            {result.failures && result.failures.length > 0 && result.failures.length <= 5 && (
              <div className="w-full max-w-md">
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                    Errores ({result.failures.length}):
                  </p>
                  <div className="space-y-1.5">
                    {result.failures.map((failure, idx) => (
                      <div key={idx} className="text-xs text-red-600 dark:text-red-400">
                        <span className="font-medium">{failure.email}</span>: {failure.error}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Auto-close notice */}
            <p className="text-xs text-foreground/40">
              Esta ventana se cerrará automáticamente...
            </p>
          </div>
        )}

        {/* Error State */}
        {hasError && result && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            {/* Error icon */}
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            {/* Error message */}
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Error al enviar campaña
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
                {result.error || 'Ocurrió un error inesperado. Por favor intenta nuevamente.'}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
