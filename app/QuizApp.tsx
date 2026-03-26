"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { nanoid } from 'nanoid';
import type { AnswerResult, AppView, LeaderboardEntry, LiveQuestion, Player, PlayerAnswer, Question } from './types';
import { useAblyRoom } from './hooks/useAblyRoom';
import { useGameTimer } from './hooks/useGameTimer';
import { exportToExcel, downloadTemplate, parseImportedExcel } from './utils/excelHelpers';
import { Notification } from './components/Notification';
import { LandingView } from './components/LandingView';
import { HostSetupView } from './components/HostSetupView';
import { HostLobbyView } from './components/HostLobbyView';
import { PlayerJoinView } from './components/PlayerJoinView';
import { PlayerLobbyView } from './components/PlayerLobbyView';
import { GameView } from './components/GameView';
import { InterstitialLeaderboardView, FinalResultsView } from './components/LeaderboardView';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selfPlayerId, setSelfPlayerId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([
    { type: 'multiple-choice', text: "Thủ đô của Việt Nam là gì?", options: ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Huế"], correctIndex: 1, timeLimit: 30 },
    { type: 'scramble', text: "Sắp xếp các chữ cái sau thành tên một thành phố:", scrambledWord: "N G A N D A", correctWord: "ĐÀ NẴNG", timeLimit: 30 }
  ]);
  const [currentQuestion, setCurrentQuestion] = useState<LiveQuestion | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [matchingAnswers, setMatchingAnswers] = useState<number[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState('');
  const [revealCount, setRevealCount] = useState(0);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const {
    setupAblyRoom,
    publishState,
    sendQuestion,
    handleNextStep,
    scoreMapRef,
    currentQuestionIndexRef,
    submissionsRef,
    answersChannelRef,
    syncQuestions,
    syncPlayers,
    syncCurrentQuestion,
  } = useAblyRoom({
    setCurrentQuestion,
    setSubmitted,
    setLastResult,
    setTimeLeft,
    setMatchingAnswers,
    setScrambleAnswer,
    setRevealCount,
    setView,
    setPlayers,
    setTotalPlayers,
    setSubmissionsCount,
    setLeaderboard,
    setRoomId,
    setSelfPlayerId,
    showNotification,
  });

  useGameTimer(view, timeLeft, submitted, setTimeLeft);

  // Sync state to refs
  useEffect(() => { syncQuestions(questions); }, [questions, syncQuestions]);
  useEffect(() => { syncPlayers(players); }, [players, syncPlayers]);
  useEffect(() => { syncCurrentQuestion(currentQuestion); }, [currentQuestion, syncCurrentQuestion]);

  // Handle URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinRoom = params.get('room');
    const isJoinView = params.get('join') === 'true';

    if (joinRoom) {
      setRoomId(joinRoom.toUpperCase());
      setView('player-join');
    } else if (isJoinView) {
      setView('player-join');
    }
  }, []);

  const handleHostCreate = async () => {
    console.debug('[QuizApp] handleHostCreate:start', {
      questionCount: questions.length,
      currentView: view,
      isCreatingRoom,
    });

    if (questions.length === 0) {
      console.warn('[QuizApp] handleHostCreate:blocked-empty-questions');
      showNotification('Vui lòng thêm ít nhất một câu hỏi.', 'error');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const generatedRoomId = nanoid(6).toUpperCase();
      console.debug('[QuizApp] handleHostCreate:generated-room-id', { generatedRoomId });

      setIsHost(true);
      console.debug('[QuizApp] handleHostCreate:setup-ably-room:begin', {
        roomId: generatedRoomId,
        role: 'host',
      });

      await setupAblyRoom(generatedRoomId, 'host', 'Host', true);

      console.debug('[QuizApp] handleHostCreate:setup-ably-room:success');

      currentQuestionIndexRef.current = 0;
      submissionsRef.current.clear();
      scoreMapRef.current.clear();

      console.debug('[QuizApp] handleHostCreate:state-reset-complete', {
        currentQuestionIndex: currentQuestionIndexRef.current,
        submissionsSize: submissionsRef.current.size,
        scoreMapSize: scoreMapRef.current.size,
      });

      setView('host-lobby');
      console.debug('[QuizApp] handleHostCreate:view-updated', { nextView: 'host-lobby' });

      showNotification('Tạo phòng thành công!', 'success');
      console.debug('[QuizApp] handleHostCreate:completed-successfully');
    } catch (error) {
      console.error('[QuizApp] handleHostCreate:error', error);
      showNotification('Không thể tạo phòng. Vui lòng thử lại.', 'error');
    } finally {
      setIsCreatingRoom(false);
      console.debug('[QuizApp] handleHostCreate:finally', { isCreatingRoom: false });
    }
  };

  const handlePlayerJoin = async () => {
    const cleanRoomId = roomId.trim().toUpperCase();
    if (!playerName.trim() || !cleanRoomId) {
      showNotification('Vui lòng nhập đầy đủ thông tin.', 'error');
      return;
    }
    setIsJoiningRoom(true);
    try {
      setIsHost(false);
      await setupAblyRoom(cleanRoomId, 'player', playerName.trim(), false);
      setView('player-lobby');
      showNotification('Đã tham gia phòng!', 'success');
    } catch {
      showNotification('Không thể tham gia phòng. Vui lòng thử lại.', 'error');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const startGame = async () => {
    if (!isHost) return;

    scoreMapRef.current.clear();
    players.forEach((p) => {
      scoreMapRef.current.set(p.id, {
        id: p.id,
        name: p.name,
        score: 0,
        correctCount: 0,
      });
    });

    await publishState('GAME_STARTED');
    await sendQuestion(0);
  };

  const submitAnswer = async (answer: PlayerAnswer) => {
    if (submitted) return;
    setSubmitted(true);

    if (!answersChannelRef.current) return;
    await answersChannelRef.current.publish('answer', {
      playerId: selfPlayerId,
      playerName,
      answer,
      questionIndex: currentQuestion?.index,
      timeLeft,
    });
  };

  const nextQuestion = async () => {
    if (!isHost) return;
    await handleNextStep();
    setSubmissionsCount(0);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseImportedExcel(
      file,
      (imported) => {
        setQuestions(prev => [...prev, ...imported]);
        showNotification(`Đã nhập thành công ${imported.length} câu hỏi!`, 'success');
      },
      (msg) => showNotification(msg, 'error'),
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-sans text-[#141414] p-4 md:p-8">
      <Notification notification={notification} />

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <LandingView
            onHost={() => setView('host-setup')}
            onJoin={() => setView('player-join')}
          />
        )}

        {view === 'host-setup' && (
          <HostSetupView
            questions={questions}
            setQuestions={setQuestions}
            isCreatingRoom={isCreatingRoom}
            onCreateRoom={handleHostCreate}
            onDownloadTemplate={downloadTemplate}
            onImportExcel={handleImportExcel}
          />
        )}

        {view === 'host-lobby' && (
          <HostLobbyView
            roomId={roomId}
            players={players}
            onStart={startGame}
            showNotification={showNotification}
          />
        )}

        {view === 'player-join' && (
          <PlayerJoinView
            roomId={roomId}
            setRoomId={setRoomId}
            playerName={playerName}
            setPlayerName={setPlayerName}
            isJoiningRoom={isJoiningRoom}
            onJoin={handlePlayerJoin}
          />
        )}

        {view === 'player-lobby' && (
          <PlayerLobbyView playerName={playerName} />
        )}

        {view === 'interstitial-leaderboard' && (
          <InterstitialLeaderboardView
            leaderboard={leaderboard}
            isHost={isHost}
            onNext={nextQuestion}
          />
        )}

        {(view === 'host-game' || view === 'player-game') && currentQuestion && (
          <GameView
            view={view}
            currentQuestion={currentQuestion}
            timeLeft={timeLeft}
            submitted={submitted}
            submissionsCount={submissionsCount}
            totalPlayers={totalPlayers}
            matchingAnswers={matchingAnswers}
            setMatchingAnswers={setMatchingAnswers}
            scrambleAnswer={scrambleAnswer}
            setScrambleAnswer={setScrambleAnswer}
            revealCount={revealCount}
            setRevealCount={setRevealCount}
            lastResult={lastResult}
            onSubmitAnswer={submitAnswer}
            onNextQuestion={nextQuestion}
          />
        )}

        {(view === 'host-results' || view === 'player-results') && (
          <FinalResultsView
            leaderboard={leaderboard}
            onExportExcel={() => exportToExcel(leaderboard, questions, roomId)}
            onGoHome={() => window.location.reload()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
