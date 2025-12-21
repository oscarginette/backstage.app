'use client';

import { useState, useEffect } from 'react';
import { SoundCloudTrack } from '../../types/dashboard';

interface EmailPreviewModalProps {
  track: SoundCloudTrack;
  onClose: () => void;
  onConfirm: () => void;
  sending: boolean;
  contactsCount: number;
}

export default function EmailPreviewModal({
  track,
  onClose,
  onConfirm,
  sending,
  contactsCount
}: EmailPreviewModalProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreview();
  }, [track]);

  const fetchPreview = async () => {
    try {
      const res = await fetch('/api/test-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName: track.title,
          trackUrl: track.url,
          coverImage: track.coverImage || ''
        })
      });

      const data = await res.json();
      setPreviewHtml(data.html || '');
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E6DF]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-serif text-[#1c1c1c] mb-1">
                {track.alreadySent ? 'Reenviar Campaña' : 'Vista Previa del Email'}
              </h2>
              <p className="text-sm text-gray-500">
                {track.title} • Se enviará a {contactsCount} contacto{contactsCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#F5F3ED] transition-colors"
              disabled={sending}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {track.alreadySent && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Esta campaña ya fue enviada</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Los contactos recibirán este email nuevamente. Asegúrate de que sea intencional.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[500px] border-0"
                title="Email Preview"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E8E6DF] bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Subject: <span className="font-medium text-gray-700">🎵 New track: {track.title}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={sending}
                className="px-6 py-2.5 rounded-xl border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#F5F3ED] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={sending}
                className="px-6 py-2.5 rounded-xl bg-[#FF5500] text-white font-medium hover:bg-[#FF6600] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    {track.alreadySent ? 'Reenviar Campaña' : 'Confirmar y Enviar'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
