"use client";

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface PlayerLobbyViewProps {
  playerName: string;
}

export function PlayerLobbyView({ playerName }: PlayerLobbyViewProps) {
  return (
    <motion.div
      key="player-lobby"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center mt-10 md:mt-20 px-4"
    >
      <div className="glass-card p-12">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="inline-block mb-6"
        >
          <Sparkles className="w-16 h-16 text-primary mx-auto" />
        </motion.div>
        <h2 className="text-4xl font-black mb-4 text-blue-deep">Hế lô {playerName}! 👋</h2>
        <p className="text-xl text-slate-500 mb-8 font-medium">
          Chào mừng bạn đến với bài test cực cháy này! <br />
          Chủ đề hôm nay là: <span className="text-primary font-bold">Kiến thức tổng hợp</span>. <br />
          Đợi host bắt đầu một chút nhé, chuẩn bị tinh thần &quot;on top&quot; thôi nào! ✨
        </p>
        <div className="flex items-center justify-center gap-3 bg-slate-50 py-4 px-8 rounded-2xl border border-slate-100">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="font-bold text-slate-600">Đang đợi host bắt đầu...</span>
        </div>
      </div>
    </motion.div>
  );
}
