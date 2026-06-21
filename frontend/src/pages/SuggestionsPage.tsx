import React from 'react';
import { SuggestionCard } from '../components/friends/SuggestionCard';
import { useFriendSuggestions } from '../hooks/useFriends';
import { Lightbulb, Sparkles } from 'lucide-react';

export const SuggestionsPage: React.FC = () => {
  const { data: suggestions, isLoading, error } = useFriendSuggestions();

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-slate-800">Gợi ý kết bạn</h2>
          <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
            <Sparkles size={11} />
            AI Powered
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Những người bạn có thể quen biết dựa trên bạn chung và kết nối của bạn.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Đang tìm gợi ý...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <p className="font-semibold text-slate-700">Không thể tải gợi ý</p>
          <p className="text-sm text-slate-400 mt-1">Kiểm tra kết nối và thử lại.</p>
        </div>
      ) : !suggestions || suggestions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Lightbulb size={28} className="text-amber-400" />
          </div>
          <p className="font-semibold text-slate-700">Không có gợi ý nào</p>
          <p className="text-sm text-slate-400 mt-1">Mời thêm bạn bè để nhận được gợi ý phù hợp hơn.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {suggestions.map((suggestion: any) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      )}
    </div>
  );
};
