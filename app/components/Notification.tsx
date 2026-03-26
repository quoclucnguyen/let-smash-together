"use client";

import { motion, AnimatePresence } from 'motion/react';

interface NotificationProps {
  notification: { message: string; type: 'success' | 'error' } | null;
}

export function Notification({ notification }: NotificationProps) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 border-2 border-[#141414] font-bold uppercase shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] ${
            notification.type === 'success' ? 'bg-[#00FF00]' : 'bg-[#FF4444] text-white'
          }`}
        >
          {notification.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
