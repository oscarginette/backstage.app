import { useState, useEffect } from 'react';
import { ExecutionHistoryItem, SoundCloudTrack, EmailContent } from '../types/dashboard';

export function useDashboardData() {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [allTracks, setAllTracks] = useState<SoundCloudTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [sendingTrackId, setSendingTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);

  useEffect(() => {
    loadData();
    loadAllTracks(); // Cargar tracks automáticamente al inicio
  }, []);

  const loadData = async () => {
    try {
      // Cargar historial de ejecuciones
      const historyRes = await fetch('/api/execution-history');
      const historyData = await historyRes.json();

      if (!historyData.error) {
        setHistory(historyData.history || []);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAllTracks = async () => {
    setLoadingTracks(true);
    try {
      const res = await fetch('/api/soundcloud-tracks');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setAllTracks(data.tracks || []);
      setShowAllTracks(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleSendTrack = async (track: SoundCloudTrack, customContent?: { subject?: string; greeting?: string; message?: string; signature?: string }) => {
    setSendingTrackId(track.trackId);
    setMessage(null);

    try {
      const res = await fetch('/api/send-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.trackId,
          title: track.title,
          url: track.url,
          coverImage: track.coverImage,
          publishedAt: track.publishedAt,
          customContent
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `Email enviado: "${data.track}" a ${data.emailsSent} contacto(s)`
      });

      // Recargar datos
      loadData();
      if (showAllTracks) {
        loadAllTracks();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSendingTrackId(null);
    }
  };

  const handleSendCustomEmail = async (content: EmailContent) => {
    setSendingCustomEmail(true);
    setMessage(null);

    try {
      const res = await fetch('/api/send-custom-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          saveAsDraft: false
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `Email enviado a ${data.emailsSent} contacto(s)`
      });

      setShowEmailEditor(false);

      // Recargar datos
      loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSendingCustomEmail(false);
    }
  };

  const handleSaveDraft = async (content: EmailContent) => {
    setMessage(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...content,
          status: 'draft'
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: 'Borrador guardado correctamente'
      });

      setShowEmailEditor(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return {
    history,
    allTracks,
    loadingTracks,
    showAllTracks,
    sendingTrackId,
    loading,
    message,
    showEmailEditor,
    sendingCustomEmail,
    loadAllTracks,
    handleSendTrack,
    handleSendCustomEmail,
    handleSaveDraft,
    setMessage,
    setShowEmailEditor
  };
}
