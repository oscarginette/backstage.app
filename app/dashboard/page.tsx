'use client';

import { useEffect, useState } from 'react';

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers: number;
}

export default function Dashboard() {
  const [lists, setLists] = useState<BrevoList[]>([]);
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎵 SoundCloud → Brevo Automation
          </h1>
          <p className="text-gray-600">
            Configuración de listas de contactos para notificaciones automáticas
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Selecciona las listas de Brevo
          </h2>

          {lists.length === 0 ? (
            <p className="text-gray-600">
              No se encontraron listas de contactos en Brevo.
            </p>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={() => handleToggleList(list.id)}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">{list.name}</div>
                    <div className="text-sm text-gray-600">
                      {list.totalSubscribers} suscriptores
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || selectedLists.length === 0}
              className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>

            <button
              onClick={handleTest}
              disabled={testing || selectedLists.length === 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Probando...' : '🚀 Probar Ahora'}
            </button>
          </div>

          {selectedLists.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Selecciona al menos una lista para guardar la configuración
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Información del Sistema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Cron Job</div>
              <div className="font-medium text-gray-900">
                Diario a las 20:00 (España)
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Listas Configuradas</div>
              <div className="font-medium text-gray-900">
                {selectedLists.length} lista(s)
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">SoundCloud</div>
              <div className="font-medium text-gray-900">
                User ID: {process.env.NEXT_PUBLIC_SOUNDCLOUD_USER_ID || '1318247880'}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Estado</div>
              <div className="font-medium text-green-600">
                ✅ Activo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
