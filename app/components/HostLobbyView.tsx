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
      className="max-w-2xl mx-auto text-center mt-10 md:mt-20 px-4"
    >
      <div className="glass-card p-12">
        <p className="text-xl font-bold uppercase mb-2 text-slate-400">Mã phòng</p>
        <h2 className="text-6xl md:text-8xl font-black tracking-widest mb-8 text-blue-deep">{roomId}</h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <button
            onClick={() => {
              const baseUrl = window.location.origin + window.location.pathname;
              const joinUrl = `${baseUrl}?room=${roomId}`;
              navigator.clipboard.writeText(joinUrl);
              showNotification('Đã sao chép link tham gia!', 'success');
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm uppercase hover:bg-slate-100 transition-colors"
          >
            <Copy size={16} /> Sao chép Link
          </button>
          <div className="flex items-center gap-3 bg-blue-light/10 px-6 py-3 rounded-2xl border border-blue-light/20">
            <Users className="w-6 h-6 text-blue-mid" />
            <span className="text-2xl font-black text-blue-mid">{players.length} học viên</span>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={players.length === 0}
          className="w-full btn-primary text-2xl py-6 disabled:opacity-50"
        >
          Bắt đầu Game
        </button>
      </div>
    </motion.div>
  );
}
