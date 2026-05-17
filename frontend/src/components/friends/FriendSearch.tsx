import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../lib/axios';
import type { User } from '../../types/friend';

interface FriendSearchProps {
  onSearchResult?: (results: User[] | null) => void;
}

export const FriendSearch: React.FC<FriendSearchProps> = ({ onSearchResult }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['friend-search', debouncedTerm],
    queryFn: async (): Promise<User[]> => {
      if (!debouncedTerm.trim()) return [];
      const response = await axiosInstance.get(`/friends/search?q=${encodeURIComponent(debouncedTerm)}`);
      return (response as any).data?.data || [];
    },
    enabled: debouncedTerm.trim().length > 0,
  });

  useEffect(() => {
    if (onSearchResult) {
      onSearchResult(debouncedTerm.trim().length > 0 ? (searchResults ?? null) : null);
    }
  }, [searchResults, debouncedTerm, onSearchResult]);

  const handleClear = () => {
    setSearchTerm('');
    if (onSearchResult) onSearchResult(null);
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
        <Search className="w-4 h-4 text-slate-400" />
      </div>
      <input
        type="text"
        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-slate-400"
        placeholder="Tìm kiếm bạn bè..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {isFetching ? (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        ) : searchTerm ? (
          <button onClick={handleClear} className="text-slate-400 hover:text-slate-600">
            <X size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
};
