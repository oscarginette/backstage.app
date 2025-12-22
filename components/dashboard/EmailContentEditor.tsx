'use client';

import { useState, useEffect } from 'react';
import { EmailContent } from '../../types/dashboard';

interface EmailContentEditorProps {
  initialContent: EmailContent;
  onSave: (content: EmailContent) => Promise<void>;
  onSaveDraft: (content: EmailContent) => Promise<void>;
  onClose: () => void;
  saving?: boolean;
}

export default function EmailContentEditor({
  initialContent,
  onSave,
  onSaveDraft,
  onClose,
  saving = false
}: EmailContentEditorProps) {
  const [subject, setSubject] = useState(initialContent.subject);
  const [greeting, setGreeting] = useState(initialContent.greeting);
  const [message, setMessage] = useState(initialContent.message);
  const [signature, setSignature] = useState(initialContent.signature);
  const [coverImage, setCoverImage] = useState(initialContent.coverImage || '');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [subject, greeting, message, signature, coverImage]);

  const fetchPreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/test-email-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName: 'Preview',
          trackUrl: '#',
          coverImage: coverImage || '',
          customContent: {
            greeting,
            message,
            signature
          }
        })
      });

      const data = await res.json();
      setPreviewHtml(data.html || '');
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    await onSave({
      subject,
      greeting,
      message,
      signature,
      coverImage: coverImage || undefined
    });
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await onSaveDraft({
        subject,
        greeting,
        message,
        signature,
        coverImage: coverImage || undefined
      });
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Editor Panel and Preview */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Panel */}
        <div className="w-1/2 border-r border-[#E8E6DF] overflow-y-auto p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-[#1c1c1c] mb-4">Personalizar Contenido</h3>

          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto del Email
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all"
                placeholder="Asunto del email"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de Portada (URL)
                <span className="text-xs text-gray-500 ml-2">(Opcional)</span>
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all"
                placeholder="https://..."
              />
            </div>

            {/* Greeting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saludo
              </label>
              <input
                type="text"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all"
                placeholder="Hey mate,"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje Principal
                <span className="text-xs text-gray-500 ml-2">(Usa **texto** para negrita)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all resize-none"
                placeholder="This is my new track..."
              />
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Firma
              </label>
              <textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8E6DF] focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all resize-none"
                placeholder="Much love,\nGee Beat"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSubject(initialContent.subject);
                setGreeting(initialContent.greeting);
                setMessage(initialContent.message);
                setSignature(initialContent.signature);
                setCoverImage(initialContent.coverImage || '');
              }}
              className="w-full px-4 py-2 rounded-xl border border-[#E8E6DF] text-sm text-gray-600 hover:bg-white transition-colors"
            >
              Restaurar Original
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 overflow-y-auto p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-[#1c1c1c] mb-4">Vista Previa</h3>

          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-[#E8E6DF] border-t-[#FF5500] animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[#E8E6DF] bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Subject: <span className="font-medium text-gray-700">{subject}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving || savingDraft}
              className="px-6 py-2.5 rounded-xl border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#F5F3ED] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving || savingDraft}
              className="px-6 py-2.5 rounded-xl border border-[#E8E6DF] text-[#1c1c1c] hover:bg-[#F5F3ED] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingDraft ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar Borrador
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || savingDraft}
              className="px-6 py-2.5 rounded-xl bg-[#FF5500] text-white font-medium hover:bg-[#FF6600] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Email
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
  );
}
