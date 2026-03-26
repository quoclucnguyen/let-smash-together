"use client";

import { motion } from 'motion/react';
import { Trophy, Play, LogIn } from 'lucide-react';

interface LandingViewProps {
  onHost: () => void;
  onJoin: () => void;
}

export function LandingView({ onHost, onJoin }: LandingViewProps) {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="max-w-4xl mx-auto mt-10 md:mt-20 px-4 text-center"
    >
      <div className="glass-card p-12 mb-12">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="inline-block mb-6"
        >
          <Trophy className="w-24 h-24 text-accent mx-auto" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-primary to-blue-mid bg-clip-text text-transparent">
          GHN Quiz
        </h1>
        <p className="text-slate-500 text-xl font-medium mb-12">Ai nhanh tay hơn? 🔥</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={onHost}
            className="btn-primary flex items-center justify-center gap-3 text-xl py-6"
          >
            <Play className="w-6 h-6" /> Tổ chức Game
          </button>
          <button
            onClick={onJoin}
            className="btn-blue flex items-center justify-center gap-3 text-xl py-6"
          >
            <LogIn className="w-6 h-6" /> Tham gia ngay
          </button>
        </div>
      </div>
    </motion.div>
  );
}
