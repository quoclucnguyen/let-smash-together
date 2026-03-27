"use client";

import { motion } from 'motion/react';
import { Users, Copy } from 'lucide-react';
import type { Player } from '../types';

interface HostLobbyViewProps {
  roomId: string;
  players: Player[];
  onStart: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export function HostLobbyView({ roomId, players, onStart, showNotification }: HostLobbyViewProps) {
  return (
    <motion.div
      key="host-lobby"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center mt-6 md:mt-20 px-3 md:px-4"
    >
      <div className="glass-card p-6 md:p-12">
        <p className="text-base md:text-xl font-bold uppercase mb-2 text-slate-400">Mã phòng</p>
        <h2 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-widest mb-6 md:mb-8 text-blue-deep">{roomId}</h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-8 md:mb-12">
          <button
            onClick={() => {
              const baseUrl = window.location.origin + window.location.pathname;
              const joinUrl = `${baseUrl}?room=${roomId}`;
              navigator.clipboard.writeText(joinUrl);
              showNotification('Đã sao chép link tham gia!', 'success');
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm uppercase hover:bg-slate-100 transition-colors w-full sm:w-auto justify-center"
          >
            <Copy size={16} /> Sao chép Link
          </button>
          <div className="flex items-center gap-2 md:gap-3 bg-blue-light/10 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border border-blue-light/20">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-mid" />
            <span className="text-xl md:text-2xl font-black text-blue-mid">{players.length} học viên</span>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={players.length === 0}
          className="w-full btn-primary text-xl md:text-2xl py-5 md:py-6 disabled:opacity-50"
        >
          Bắt đầu Game
        </button>
      </div>
    </motion.div>
  );
}
