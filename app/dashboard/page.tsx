'use client';

import { useEffect, useState } from 'react';

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers: number;
}

interface ExecutionHistoryItem {
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  executedAt: string;
  emailsSent: number;
  durationMs: number;
  coverImage: string | null;
  description: string | null;
}

interface SoundCloudTrack {
  trackId: string;
  title: string;
  url: string;
  publishedAt: string;
  coverImage: string | null;
  description: string | null;
  alreadySent: boolean;
}

export default function Dashboard() {
  const [lists, setLists] = useState<BrevoList[]>([]);
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [allTracks, setAllTracks] = useState<SoundCloudTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [sendingTrackId, setSendingTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar listas de Brevo
      const listsRes = await fetch('/api/brevo-lists');
      const listsData = await listsRes.json();

      if (listsData.error) {
        throw new Error(listsData.error);
      }

      setLists(listsData.lists || []);

      // Cargar configuración actual
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();

      if (!configData.error) {
        setSelectedLists(configData.listIds || []);
      }

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

  const handleToggleList = (listId: number) => {
    setSelectedLists((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listIds: selectedLists })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/check-soundcloud');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Email enviado: "${data.track}" a ${data.listsUsed} lista(s)`
        });
        // Recargar historial después de una ejecución exitosa
        loadData();
      } else {
        setMessage({
          type: 'success',
          text: data.message || 'No hay nuevos tracks'
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTesting(false);
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

  const handleSendTrack = async (track: SoundCloudTrack) => {
    if (selectedLists.length === 0) {
      setMessage({ type: 'error', text: 'Debes configurar y guardar al menos una lista primero' });
      return;
    }

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
          publishedAt: track.publishedAt
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessage({
        type: 'success',
        text: `✅ Email enviado: "${data.track}" a ${data.listsUsed} lista(s)`
      });

      // Recargar datos
      loadData();
      loadAllTracks();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSendingTrackId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#ff5500] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[#ff5500] rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-[#ff5500] rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff5500]/5 border border-[#ff5500]/10 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#ff5500] animate-pulse"></div>
            <span className="text-sm font-medium text-[#ff5500]">Sistema Activo</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            SoundCloud Automation
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Notificaciones automáticas de nuevos tracks
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-8 p-4 rounded-2xl border backdrop-blur-sm transition-all ${
              message.type === 'success'
                ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/5 text-red-700 dark:text-red-400 border-red-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Lists Selection */}
        <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-3xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">
            Listas de Distribución
          </h2>

          {lists.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No se encontraron listas de contactos
            </p>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <label
                  key={list.id}
                  className="group flex items-center p-4 border border-gray-200 dark:border-[#262626] rounded-2xl hover:border-[#ff5500]/30 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={() => handleToggleList(list.id)}
                    className="w-5 h-5 accent-[#ff5500] border-gray-300 dark:border-[#262626] rounded-md focus:ring-2 focus:ring-[#ff5500]/20 transition-all"
                  />
                  <div className="ml-4 flex-1">
                    <div className="font-medium">{list.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {list.totalSubscribers.toLocaleString()} suscriptores
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSave}
              disabled={saving || selectedLists.length === 0}
              className="px-6 py-3.5 rounded-xl font-medium bg-[#ff5500] text-white hover:bg-[#ff6b1a] disabled:bg-gray-200 dark:disabled:bg-[#262626] disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>

            <button
              onClick={handleTest}
              disabled={testing || selectedLists.length === 0}
              className="px-6 py-3.5 rounded-xl font-medium border border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:bg-gray-100 dark:disabled:bg-[#1a1a1a] disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {testing ? 'Probando...' : 'Probar Ahora'}
            </button>
          </div>

          {selectedLists.length === 0 && (
            <p className="mt-4 text-sm text-gray-400 text-center">
              Selecciona al menos una lista
            </p>
          )}
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-6 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-2xl">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Frecuencia</div>
            <div className="font-semibold">Diario 20:00 CET</div>
          </div>
          <div className="p-6 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-2xl">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Listas Activas</div>
            <div className="font-semibold">{selectedLists.length}</div>
          </div>
        </div>

        {/* Execution History */}
        {history.length > 0 && (
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#262626] rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">
              Historial de Ejecuciones
            </h2>

            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.trackId}
                  className="group border border-gray-200 dark:border-[#262626] rounded-2xl p-5 hover:border-[#ff5500]/30 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all"
                >
                  <div className="flex gap-5">
                    {/* Cover Image */}
                    {item.coverImage ? (
                      <div className="flex-shrink-0">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover border border-gray-200 dark:border-[#262626] shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gradient-to-br from-[#ff5500] to-[#ff8800] flex items-center justify-center border border-gray-200 dark:border-[#262626]">
                        <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                      </div>
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 truncate">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{item.emailsSent} emails enviados</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(item.executedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>

                      {/* Download Link */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff5500] text-white text-sm font-medium rounded-xl hover:bg-[#ff6b1a] transition-all group-hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Escuchar en SoundCloud
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
