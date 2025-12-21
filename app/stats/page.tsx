'use client';

import { useEffect, useState } from 'react';

interface EventSummary {
  event_type: string;
  total: number;
  unique_contacts: number;
  unique_tracks: number;
}

interface RecentEvent {
  event_type: string;
  created_at: string;
  email: string;
  name: string;
  track_title: string;
  event_data: any;
}

interface TrackStats {
  title: string;
  track_id: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unique_recipients: number;
}

interface EngagedContact {
  email: string;
  name: string;
  opens: number;
  clicks: number;
  last_interaction: string;
}

interface ConversionRates {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

interface Stats {
  summary: EventSummary[];
  recentEvents: RecentEvent[];
  trackStats: TrackStats[];
  topEngagedContacts: EngagedContact[];
  conversionRates: ConversionRates;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/email-stats');
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      opened: 'bg-purple-100 text-purple-800',
      clicked: 'bg-orange-100 text-orange-800',
      bounced: 'bg-red-100 text-red-800',
      delayed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Statistics</h1>
          <p className="text-gray-600">Track email performance and engagement</p>
        </div>

        {/* Conversion Rates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Delivery Rate</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.conversionRates.delivery_rate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.conversionRates.total_delivered} / {stats.conversionRates.total_sent}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Open Rate</div>
            <div className="text-3xl font-bold text-purple-600">
              {stats.conversionRates.open_rate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.conversionRates.total_opened} / {stats.conversionRates.total_delivered}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Click Rate</div>
            <div className="text-3xl font-bold text-orange-600">
              {stats.conversionRates.click_rate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.conversionRates.total_clicked} / {stats.conversionRates.total_opened}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Bounced</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.conversionRates.total_bounced}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Failed deliveries
            </div>
          </div>
        </div>

        {/* Events Summary */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Events Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.summary.map((event) => (
              <div key={event.event_type} className="border rounded-lg p-4">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getEventColor(event.event_type)}`}>
                  {event.event_type}
                </div>
                <div className="text-2xl font-bold">{event.total}</div>
                <div className="text-sm text-gray-600">
                  {event.unique_contacts} contacts · {event.unique_tracks} tracks
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track Stats */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Performance by Track</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Track</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicked</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bounced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.trackStats.map((track) => (
                  <tr key={track.track_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{track.title || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{track.unique_recipients}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{track.sent}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{track.delivered}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{track.opened}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{track.clicked}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{track.bounced}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Engaged Contacts */}
        {stats.topEngagedContacts.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Most Engaged Contacts</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opens</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Interaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.topEngagedContacts.map((contact) => (
                    <tr key={contact.email}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600 font-medium">{contact.opens}</td>
                      <td className="px-4 py-3 text-sm text-orange-600 font-medium">{contact.clicks}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(contact.last_interaction).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
          <div className="space-y-3">
            {stats.recentEvents.slice(0, 20).map((event, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event.event_type)}`}>
                    {event.event_type}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{event.name || event.email}</div>
                    <div className="text-xs text-gray-500">{event.track_title || 'Unknown track'}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
}
