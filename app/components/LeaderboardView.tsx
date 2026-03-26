"use client";

import { motion } from 'motion/react';
import { Trophy, FileUp } from 'lucide-react';
import type { LeaderboardEntry } from '../types';

interface InterstitialLeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  isHost: boolean;
  onNext: () => void;
}

export function InterstitialLeaderboardView({ leaderboard, isHost, onNext }: InterstitialLeaderboardViewProps) {
  return (
    <motion.div
      key="interstitial-leaderboard"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto mt-10 px-4"
    >
      <div className="glass-card p-12">
        <div className="flex items-center justify-center gap-4 mb-12">
          <Trophy className="w-12 h-12 text-accent" />
          <h2 className="text-4xl font-black text-blue-deep">Bảng Xếp Hạng Tạm Thời</h2>
        </div>
        <div className="space-y-4 mb-12">
          {leaderboard.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black ${idx < 3 ? 'text-primary' : 'text-slate-300'}`}>#{idx + 1}</span>
                <span className="text-xl font-bold">{entry.name}</span>
              </div>
              <span className="text-2xl font-black text-blue-mid">{entry.score}</span>
            </div>
          ))}
        </div>
        {isHost ? (
          <button onClick={onNext} className="w-full btn-primary text-2xl py-6">
            Tiếp tục Game
          </button>
        ) : (
          <div className="text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
            Đang đợi host tiếp tục...
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface FinalResultsViewProps {
  leaderboard: LeaderboardEntry[];
  onExportExcel: () => void;
  onGoHome: () => void;
}

export function FinalResultsView({ leaderboard, onExportExcel, onGoHome }: FinalResultsViewProps) {
  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto mt-10 px-4 pb-20"
    >
      <div className="glass-card p-12 text-center">
        <Trophy className="w-24 h-24 mx-auto text-accent mb-8" />
        <h2 className="text-5xl font-black text-blue-deep mb-12">Bảng Xếp Hạng Chung Cuộc</h2>
        <div className="space-y-4">
          {leaderboard.map((entry, idx) => (
            <div key={idx} className={`flex flex-col p-6 rounded-3xl border-2 transition-all ${idx === 0 ? 'bg-accent/10 border-accent shadow-lg scale-105' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-black ${idx === 0 ? 'text-accent' : idx < 3 ? 'text-primary' : 'text-slate-300'}`}>#{idx + 1}</span>
                  <span className="text-2xl font-bold text-slate-700">{entry.name}</span>
                </div>
                <span className="text-3xl font-black text-blue-mid">{entry.score}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold uppercase text-slate-400">
                <span>Đúng: {entry.correctCount} / {entry.totalQuestions}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(entry.correctCount / entry.totalQuestions) * 100}%` }}
                    />
                  </div>
                  <span>{Math.round((entry.correctCount / entry.totalQuestions) * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-12">
          <button onClick={onExportExcel} className="flex-1 btn-blue flex items-center justify-center gap-2 text-xl py-5">
            <FileUp className="w-6 h-6" /> Xuất Báo Cáo Excel
          </button>
          <button onClick={onGoHome} className="flex-1 btn-primary text-xl py-5">
            Về Trang Chủ
          </button>
        </div>
      </div>
    </motion.div>
  );
}
