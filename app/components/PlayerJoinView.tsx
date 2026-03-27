"use client";

import { motion } from 'motion/react';

interface PlayerJoinViewProps {
  roomId: string;
  setRoomId: (v: string) => void;
  playerName: string;
  setPlayerName: (v: string) => void;
  isJoiningRoom: boolean;
  onJoin: () => void;
}

export function PlayerJoinView({ roomId, setRoomId, playerName, setPlayerName, isJoiningRoom, onJoin }: PlayerJoinViewProps) {
  return (
    <motion.div
      key="player-join"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-6 md:mt-20 px-4"
    >
      <div className="glass-card p-6 md:p-10 text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 text-blue-deep">Vào phòng ngay! 🚀</h2>
        <div className="space-y-5 md:space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 text-left">Mã phòng</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="VD: ABCD"
              className="input-field text-center text-2xl md:text-3xl font-black tracking-widest"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 text-left">Biệt danh của bạn</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập tên cực ngầu..."
              className="input-field text-center text-lg md:text-xl font-bold"
            />
          </div>
          <button
            onClick={onJoin}
            disabled={isJoiningRoom}
            className="w-full btn-blue text-lg md:text-xl py-4 md:py-5"
          >
            {isJoiningRoom ? 'Đang tham gia...' : 'Tham gia'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
