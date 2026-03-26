"use client";

import { useEffect, useRef, useCallback } from 'react';
import * as Ably from 'ably';
import { nanoid } from 'nanoid';
import type {
  AnswerResult,
  AppView,
  LeaderboardEntry,
  LiveQuestion,
  Player,
  PlayerAnswer,
  PlayerScore,
  Question,
  StatePayload,
} from '../types';
import { evaluateAnswer } from '../utils/evaluateAnswer';
import { buildLeaderboard } from '../utils/buildLeaderboard';

type PresenceMember = {
  clientId: string;
  data?: { role?: 'host' | 'player'; name?: string };
};

type ChannelMessage<T> = { data: T };

type RealtimeChannelLike = {
  attach: () => Promise<unknown>;
  publish: (name: string, data: unknown) => Promise<unknown>;
  subscribe: (name: string, listener: (msg: ChannelMessage<unknown>) => void) => void;
  presence: {
    get: () => Promise<{ items?: PresenceMember[] } | PresenceMember[]>;
    subscribe: (event: 'enter' | 'leave' | 'update', listener: () => void) => void;
    enter: (data?: unknown) => Promise<void>;
    leave: () => Promise<void>;
  };
};

interface AblyRoomCallbacks {
  setCurrentQuestion: (q: LiveQuestion | null) => void;
  setSubmitted: (v: boolean) => void;
  setLastResult: (v: AnswerResult | null) => void;
  setTimeLeft: (v: number) => void;
  setMatchingAnswers: (v: number[]) => void;
  setScrambleAnswer: (v: string) => void;
  setRevealCount: (v: number) => void;
  setView: (v: AppView) => void;
  setPlayers: (v: Player[]) => void;
  setTotalPlayers: (v: number) => void;
  setSubmissionsCount: (v: number) => void;
  setLeaderboard: (v: LeaderboardEntry[]) => void;
  setRoomId: (v: string) => void;
  setSelfPlayerId: (v: string) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export function useAblyRoom(callbacks: AblyRoomCallbacks) {
  const currentQuestionRef = useRef<LiveQuestion | null>(null);
  const currentQuestionIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const submissionsRef = useRef<Set<string>>(new Set());
  const scoreMapRef = useRef<Map<string, PlayerScore>>(new Map());
  const questionsRef = useRef<Question[]>([]);
  const playersRef = useRef<Player[]>([]);
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const stateChannelRef = useRef<RealtimeChannelLike | null>(null);
  const answersChannelRef = useRef<RealtimeChannelLike | null>(null);
  const presenceChannelRef = useRef<RealtimeChannelLike | null>(null);
  const isHostRef = useRef(false);

  const publishState = useCallback(async (type: StatePayload['type'], payload: Record<string, unknown> = {}) => {
    if (!stateChannelRef.current) return;
    await stateChannelRef.current.publish('state', { type, ...payload });
  }, []);

  const refreshPresencePlayers = useCallback(async (
    channel: RealtimeChannelLike,
    localIsHost: boolean,
  ) => {
    const membersPage = await channel.presence.get();
    const members = Array.isArray(membersPage) ? membersPage : (membersPage.items || []);

    const mappedPlayers = members
      .filter((m) => m.data?.role === 'player')
      .map((m) => ({
        id: m.clientId,
        name: m.data?.name || m.clientId,
      }));

    callbacks.setPlayers(mappedPlayers);
    callbacks.setTotalPlayers(mappedPlayers.length);

    if (!localIsHost) {
      const hasHost = members.some((m) => m.data?.role === 'host');
      if (!hasHost) {
        callbacks.showNotification('Host đã ngắt kết nối. Đang quay lại trang chủ...', 'error');
        setTimeout(() => window.location.reload(), 3000);
      }
    }
  }, [callbacks]);

  const sendQuestion = useCallback(async (index: number) => {
    const question = questionsRef.current[index];
    if (!question) return;

    currentQuestionIndexRef.current = index;
    submissionsRef.current.clear();
    startTimeRef.current = Date.now();

    await publishState('QUESTION', {
      questionType: question.type,
      question: question.text,
      options: question.options,
      pairs: question.pairs,
      scrambledWord: question.scrambledWord,
      imageUrl: question.imageUrl,
      timeLimit: question.timeLimit || 30,
      index,
      total: questionsRef.current.length,
    });
  }, [publishState]);

  const handleNextStep = useCallback(async () => {
    const nextQuestionNum = currentQuestionIndexRef.current + 1;

    if (
      submissionsRef.current.size > 0 &&
      nextQuestionNum % 3 === 0 &&
      nextQuestionNum < questionsRef.current.length
    ) {
      await publishState('INTERSTITIAL_LEADERBOARD', {
        leaderboard: buildLeaderboard(scoreMapRef.current, questionsRef.current.length),
      });
      submissionsRef.current.clear();
      return;
    }

    const nextIndex = currentQuestionIndexRef.current + 1;
    if (nextIndex < questionsRef.current.length) {
      await sendQuestion(nextIndex);
      return;
    }

    await publishState('GAME_FINISHED', { leaderboard: buildLeaderboard(scoreMapRef.current, questionsRef.current.length) });
  }, [publishState, sendQuestion]);

  const setupAblyRoom = useCallback(async (
    targetRoomId: string,
    role: 'host' | 'player',
    displayName: string,
    localIsHost: boolean,
  ) => {
    const cleanedRoom = targetRoomId.toUpperCase().trim();
    const clientId = `${role}-${nanoid(8)}`;
    const authUrl = `/api/ably/token?roomId=${encodeURIComponent(cleanedRoom)}&role=${role}&clientId=${encodeURIComponent(clientId)}`;
    const client = new Ably.Realtime({ authUrl, clientId });

    const state = client.channels.get(`quiz:${cleanedRoom}:state`, {
      params: { rewind: '1' },
    }) as unknown as RealtimeChannelLike;
    const answers = client.channels.get(`quiz:${cleanedRoom}:answers`) as unknown as RealtimeChannelLike;
    const presence = client.channels.get(`quiz:${cleanedRoom}:presence`) as unknown as RealtimeChannelLike;

    await Promise.all([state.attach(), answers.attach(), presence.attach()]);

    isHostRef.current = localIsHost;

    state.subscribe('state', (msg) => {
      const data = msg.data as StatePayload;
      switch (data.type) {
        case 'QUESTION':
          callbacks.setCurrentQuestion(data);
          callbacks.setSubmitted(false);
          callbacks.setLastResult(null);
          callbacks.setTimeLeft(data.timeLimit || 30);
          callbacks.setMatchingAnswers([]);
          callbacks.setScrambleAnswer('');
          callbacks.setRevealCount(0);
          if (isHostRef.current || role === 'host') callbacks.setView('host-game');
          else callbacks.setView('player-game');
          break;
        case 'GAME_STARTED':
          if (role === 'player') callbacks.setView('player-game');
          break;
        case 'PLAYER_SUBMITTED':
          callbacks.setSubmissionsCount(data.submissionsCount || 0);
          callbacks.setTotalPlayers(data.totalPlayers || 0);
          break;
        case 'ANSWER_RESULT':
          if (data.playerId === clientId) {
            callbacks.setLastResult({
              isCorrect: data.isCorrect,
              correctAnswer: data.correctAnswer,
              scoreGained: data.scoreGained,
            });
          }
          break;
        case 'INTERSTITIAL_LEADERBOARD':
          callbacks.setLeaderboard(data.leaderboard || []);
          callbacks.setView('interstitial-leaderboard');
          break;
        case 'GAME_FINISHED':
          callbacks.setLeaderboard(data.leaderboard || []);
          if (isHostRef.current || role === 'host') callbacks.setView('host-results');
          else callbacks.setView('player-results');
          break;
      }
    });

    const onPresenceChanged = async () => {
      await refreshPresencePlayers(presence, role === 'host');
    };

    presence.presence.subscribe('enter', onPresenceChanged);
    presence.presence.subscribe('leave', onPresenceChanged);
    presence.presence.subscribe('update', onPresenceChanged);

    if (role === 'host') {
      answers.subscribe('answer', async (msg) => {
        const data = msg.data as {
          playerId: string;
          playerName?: string;
          questionIndex: number;
          answer: PlayerAnswer;
        };
        const question = questionsRef.current[currentQuestionIndexRef.current];
        if (!question || data.questionIndex !== currentQuestionIndexRef.current) return;
        if (submissionsRef.current.has(data.playerId)) return;

        const playerScore =
          scoreMapRef.current.get(data.playerId) ||
          { id: data.playerId, name: data.playerName || data.playerId, score: 0, correctCount: 0 };

        const { isCorrect, correctAnswer } = evaluateAnswer(question, data.answer);
        const timeLimit = question.timeLimit || 30;
        const timeTaken = (Date.now() - startTimeRef.current) / 1000;

        let scoreGained = 0;
        if (isCorrect && timeTaken <= timeLimit) {
          playerScore.correctCount += 1;
          scoreGained = Math.max(10, Math.floor(100 * (1 - timeTaken / timeLimit)));
          playerScore.score += scoreGained;
        }

        scoreMapRef.current.set(data.playerId, playerScore);
        submissionsRef.current.add(data.playerId);

        await publishState('ANSWER_RESULT', {
          playerId: data.playerId,
          isCorrect,
          correctAnswer,
          scoreGained,
          totalScore: playerScore.score,
        });

        await publishState('PLAYER_SUBMITTED', {
          playerId: data.playerId,
          submissionsCount: submissionsRef.current.size,
          totalPlayers: playersRef.current.length,
        });

        if (
          submissionsRef.current.size >= playersRef.current.length &&
          playersRef.current.length > 0
        ) {
          setTimeout(() => {
            void handleNextStep();
          }, 2000);
        }
      });
    }

    await presence.presence.enter({ name: displayName, role });
    await refreshPresencePlayers(presence, role === 'host');

    ablyClientRef.current = client;
    stateChannelRef.current = state;
    answersChannelRef.current = answers;
    presenceChannelRef.current = presence;

    callbacks.setSelfPlayerId(clientId);
    callbacks.setRoomId(cleanedRoom);
  }, [callbacks, publishState, handleNextStep, refreshPresencePlayers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ablyClientRef.current) {
        void presenceChannelRef.current?.presence.leave();
        ablyClientRef.current.close();
      }
    };
  }, []);

  // Sync helpers
  const syncQuestions = useCallback((q: Question[]) => { questionsRef.current = q; }, []);
  const syncPlayers = useCallback((p: Player[]) => { playersRef.current = p; }, []);
  const syncCurrentQuestion = useCallback((q: LiveQuestion | null) => { currentQuestionRef.current = q; }, []);

  return {
    setupAblyRoom,
    publishState,
    sendQuestion,
    handleNextStep,
    scoreMapRef,
    questionsRef,
    playersRef,
    currentQuestionIndexRef,
    currentQuestionRef,
    submissionsRef,
    answersChannelRef,
    syncQuestions,
    syncPlayers,
    syncCurrentQuestion,
  };
}
