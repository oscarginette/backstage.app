'use client';

import { useState } from 'react';
import { DownloadGate } from '@/types/download-gates';
import { Power, RefreshCw, Plus, Music, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface GateSettingsFormProps {
  gate: DownloadGate;
  onUpdate: () => void;
}

export default function GateSettingsForm({ gate, onUpdate }: GateSettingsFormProps) {
  const [formData, setFormData] = useState({
    active: gate.active,
    title: gate.title,
    artistName: gate.artistName || '',
    soundcloudTrackUrl: gate.soundcloudTrackId ? `https://soundcloud.com/track/${gate.soundcloudTrackId}` : '',
    artworkUrl: gate.artworkUrl || '',
    fileUrl: gate.fileUrl || '',
    requireSoundcloudRepost: gate.requireSoundcloudRepost,
    requireSoundcloudFollow: gate.requireSoundcloudFollow,
    requireSpotifyConnect: gate.requireSpotifyConnect,
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleToggle = (field: keyof typeof formData) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const payload: Record<string, any> = {
        isActive: formData.active,
        title: formData.title,
        requireSoundcloudRepost: formData.requireSoundcloudRepost,
        requireSoundcloudFollow: formData.requireSoundcloudFollow,
        requireSpotifyConnect: formData.requireSpotifyConnect,
      };

      if (formData.artistName) {
        payload.artistName = formData.artistName;
      }

      if (formData.artworkUrl) {
        payload.artworkUrl = formData.artworkUrl;
      }

      if (formData.fileUrl) {
        payload.fileUrl = formData.fileUrl;
      }

      const response = await fetch(`/api/download-gates/${gate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar cambios');
      }

      setSaveStatus('success');
      setHasChanges(false);
      onUpdate();

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving gate settings:', error);
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      active: gate.active,
      title: gate.title,
      artistName: gate.artistName || '',
      soundcloudTrackUrl: gate.soundcloudTrackId ? `https://soundcloud.com/track/${gate.soundcloudTrackId}` : '',
      artworkUrl: gate.artworkUrl || '',
      fileUrl: gate.fileUrl || '',
      requireSoundcloudRepost: gate.requireSoundcloudRepost,
      requireSoundcloudFollow: gate.requireSoundcloudFollow,
      requireSpotifyConnect: gate.requireSpotifyConnect,
    });
    setHasChanges(false);
    setSaveStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Estado del Gate */}
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
        <h3 className="text-lg font-serif text-[#1c1c1c] mb-6 flex items-center gap-2">
          <Power className="w-5 h-5 text-[#FF5500]" />
          Estado del Gate
        </h3>

        <div
          onClick={() => handleToggle('active')}
          className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
            formData.active
              ? 'border-emerald-500/30 bg-emerald-50/30'
              : 'border-gray-300 bg-gray-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-sm font-bold ${
                formData.active ? 'text-emerald-700' : 'text-gray-600'
              }`}>
                {formData.active ? 'Activo' : 'Pausado'}
              </div>
              <div className="text-xs text-gray-400">
                {formData.active
                  ? '· Visible públicamente'
                  : '· Oculto para visitantes'
                }
              </div>
            </div>
            <div className={`relative inline-block w-11 h-6 rounded-full transition-colors ${
              formData.active ? 'bg-emerald-500' : 'bg-gray-300'
            }`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                formData.active ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Información Básica */}
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
        <h3 className="text-lg font-serif text-[#1c1c1c] mb-6">
          Información Básica
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Título del Track
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nombre de la canción..."
                className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5500]/10 focus:border-[#FF5500] transition-all text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Nombre del Artista
              </label>
              <input
                type="text"
                name="artistName"
                value={formData.artistName}
                onChange={handleChange}
                placeholder="Tu nombre de DJ..."
                className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5500]/10 focus:border-[#FF5500] transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              URL del Artwork
            </label>
            <input
              type="url"
              name="artworkUrl"
              value={formData.artworkUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5500]/10 focus:border-[#FF5500] transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              URL del Archivo de Descarga
            </label>
            <input
              type="url"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              placeholder="https://dropbox.com/... o https://drive.google.com/..."
              className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5500]/10 focus:border-[#FF5500] transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Requisitos Sociales */}
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-[#E8E6DF] shadow-xl">
        <h3 className="text-lg font-serif text-[#1c1c1c] mb-6">
          Requisitos Sociales
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {[
            {
              id: 'requireSoundcloudRepost' as const,
              label: 'SoundCloud Repost',
              icon: RefreshCw,
              description: 'Requiere repost del track en SoundCloud'
            },
            {
              id: 'requireSoundcloudFollow' as const,
              label: 'SoundCloud Follow',
              icon: Plus,
              description: 'Requiere seguir tu perfil de SoundCloud'
            },
            {
              id: 'requireSpotifyConnect' as const,
              label: 'Spotify Connect',
              icon: Music,
              description: 'Requiere conectar cuenta de Spotify'
            },
          ].map((req) => {
            const isChecked = formData[req.id];
            return (
              <div
                key={req.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                  isChecked
                    ? 'border-[#FF5500]/30 bg-[#FF5500]/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white/50'
                }`}
                onClick={() => handleToggle(req.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-[#FF5500] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <req.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1c1c1c]">{req.label}</div>
                      <div className="text-xs text-gray-500">{req.description}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="w-5 h-5 rounded text-[#FF5500] focus:ring-[#FF5500] border-gray-300 pointer-events-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Status Message */}
      {saveStatus !== 'idle' && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          saveStatus === 'success'
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">
                Cambios guardados correctamente
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                {errorMessage || 'Error al guardar cambios'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={handleCancel}
          disabled={!hasChanges || saving}
          className="px-6 py-3 rounded-xl border border-[#E8E6DF] bg-white text-[#1c1c1c] font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-3 rounded-xl bg-[#FF5500] text-white font-bold shadow-lg shadow-[#FF5500]/20 hover:bg-[#e64d00] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
