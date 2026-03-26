"use client";

import { useEffect } from 'react';

export function useGameTimer(
  view: string,
  timeLeft: number,
  submitted: boolean,
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>,
) {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if ((view === 'host-game' || view === 'player-game') && timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, submitted, setTimeLeft]);
}
