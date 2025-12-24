'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface Genre {
  value: string;
  label: string;
  category: string;
}

const GENRES: Genre[] = [
  // ELECTRONIC / DANCE
  { value: 'afro-house', label: 'Afro House', category: 'ELECTRONIC / DANCE' },
  { value: 'bass', label: 'Bass', category: 'ELECTRONIC / DANCE' },
  { value: 'bass-house', label: 'Bass House', category: 'ELECTRONIC / DANCE' },
  { value: 'breaks', label: 'Breaks', category: 'ELECTRONIC / DANCE' },
  { value: 'chill-out', label: 'Chill Out', category: 'ELECTRONIC / DANCE' },
  { value: 'deep-house', label: 'Deep House', category: 'ELECTRONIC / DANCE' },
  { value: 'drum-bass', label: 'Drum & Bass', category: 'ELECTRONIC / DANCE' },
  { value: 'dubstep', label: 'Dubstep', category: 'ELECTRONIC / DANCE' },
  { value: 'electro-house', label: 'Electro House', category: 'ELECTRONIC / DANCE' },
  { value: 'electronica', label: 'Electronica', category: 'ELECTRONIC / DANCE' },
  { value: 'future-house', label: 'Future House', category: 'ELECTRONIC / DANCE' },
  { value: 'glitch-hop', label: 'Glitch Hop', category: 'ELECTRONIC / DANCE' },
  { value: 'hard-dance', label: 'Hard Dance', category: 'ELECTRONIC / DANCE' },
  { value: 'hardcore-techno', label: 'Hardcore / Hard Techno', category: 'ELECTRONIC / DANCE' },
  { value: 'house', label: 'House', category: 'ELECTRONIC / DANCE' },
  { value: 'indie-dance', label: 'Indie Dance / Nu Disco', category: 'ELECTRONIC / DANCE' },
  { value: 'progressive-house', label: 'Progressive House', category: 'ELECTRONIC / DANCE' },
  { value: 'psy-trance', label: 'Psy Trance', category: 'ELECTRONIC / DANCE' },
  { value: 'tech-house', label: 'Tech House', category: 'ELECTRONIC / DANCE' },
  { value: 'techno', label: 'Techno', category: 'ELECTRONIC / DANCE' },
  { value: 'trance', label: 'Trance', category: 'ELECTRONIC / DANCE' },
  { value: 'trap', label: 'Trap', category: 'ELECTRONIC / DANCE' },
  { value: 'trip-hop', label: 'Trip-Hop', category: 'ELECTRONIC / DANCE' },

  // HIP-HOP / R&B
  { value: 'rb', label: 'R&B', category: 'HIP-HOP / R&B' },
  { value: 'disco', label: 'Disco', category: 'HIP-HOP / R&B' },
  { value: 'funk', label: 'Funk', category: 'HIP-HOP / R&B' },
  { value: 'hip-hop', label: 'Hip-Hop', category: 'HIP-HOP / R&B' },
  { value: 'soul', label: 'Soul', category: 'HIP-HOP / R&B' },

  // POP / ROCK
  { value: 'acoustic', label: 'Acoustic', category: 'POP / ROCK' },
  { value: 'alternative', label: 'Alternative', category: 'POP / ROCK' },
  { value: 'pop', label: 'Pop', category: 'POP / ROCK' },
  { value: 'country', label: 'Country', category: 'POP / ROCK' },
  { value: 'folk', label: 'Folk', category: 'POP / ROCK' },
  { value: 'indie', label: 'Indie', category: 'POP / ROCK' },
  { value: 'kpop', label: 'K-Pop', category: 'POP / ROCK' },
  { value: 'metal', label: 'Metal', category: 'POP / ROCK' },
  { value: 'punk', label: 'Punk', category: 'POP / ROCK' },
  { value: 'rock', label: 'Rock', category: 'POP / ROCK' },
  { value: 'singer-songwriter', label: 'Singer Songwriter', category: 'POP / ROCK' },
  { value: 'world', label: 'World', category: 'POP / ROCK' },

  // OTHER
  { value: 'blues', label: 'Blues', category: 'OTHER' },
  { value: 'christian', label: 'Christian', category: 'OTHER' },
  { value: 'classical', label: 'Classical', category: 'OTHER' },
  { value: 'dancehall', label: 'Dancehall', category: 'OTHER' },
  { value: 'dub', label: 'Dub', category: 'OTHER' },
  { value: 'gospel', label: 'Gospel', category: 'OTHER' },
  { value: 'jazz', label: 'Jazz', category: 'OTHER' },
  { value: 'latin', label: 'Latin', category: 'OTHER' },
  { value: 'reggae', label: 'Reggae', category: 'OTHER' },
  { value: 'reggaeton', label: 'Reggaeton', category: 'OTHER' },
  { value: 'other', label: 'Other', category: 'OTHER' },
];

interface GenreSelectorProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export default function GenreSelector({ value, onChange }: GenreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedGenre = GENRES.find(g => g.value === value);

  const filteredGenres = useMemo(() => {
    if (!searchQuery) return GENRES;

    const query = searchQuery.toLowerCase();
    return GENRES.filter(
      genre =>
        genre.label.toLowerCase().includes(query) ||
        genre.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const groupedGenres = useMemo(() => {
    const groups: Record<string, Genre[]> = {};
    filteredGenres.forEach(genre => {
      if (!groups[genre.category]) {
        groups[genre.category] = [];
      }
      groups[genre.category].push(genre);
    });
    return groups;
  }, [filteredGenres]);

  const handleSelect = (genreValue: string) => {
    onChange(genreValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 rounded-xl border border-[#E8E6DF] bg-white/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5500]/10 focus:border-[#FF5500] transition-all text-sm text-left flex items-center justify-between"
      >
        <span className={selectedGenre ? 'text-gray-900' : 'text-gray-400'}>
          {selectedGenre ? selectedGenre.label : 'Select genre...'}
        </span>
        <Search className="w-4 h-4 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />

          {/* Dropdown Content */}
          <div className="absolute z-20 mt-2 w-full bg-white rounded-xl border border-[#E8E6DF] shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-[#E8E6DF] bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search genres..."
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Genre List */}
            <div className="max-h-80 overflow-y-auto">
              {Object.keys(groupedGenres).length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No genres found
                </div>
              ) : (
                Object.entries(groupedGenres).map(([category, genres]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="sticky top-0 px-4 py-2 bg-gray-100 border-b border-gray-200">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {category}
                      </span>
                    </div>

                    {/* Genre Items */}
                    {genres.map((genre) => (
                      <button
                        key={genre.value}
                        type="button"
                        onClick={() => handleSelect(genre.value)}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                          value === genre.value
                            ? 'bg-[#FF5500]/5 text-[#FF5500] font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {genre.label}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
