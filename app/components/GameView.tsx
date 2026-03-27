"use client";

import { motion } from 'motion/react';
import { Users, Send, Layers, CheckCircle2, XCircle } from 'lucide-react';
import type { AnswerResult, AppView, LiveQuestion, PlayerAnswer, QuestionPair } from '../types';

interface GameViewProps {
  view: AppView;
  currentQuestion: LiveQuestion;
  timeLeft: number;
  submitted: boolean;
  submissionsCount: number;
  totalPlayers: number;
  matchingAnswers: number[];
  setMatchingAnswers: React.Dispatch<React.SetStateAction<number[]>>;
  scrambleAnswer: string;
  setScrambleAnswer: React.Dispatch<React.SetStateAction<string>>;
  revealCount: number;
  setRevealCount: React.Dispatch<React.SetStateAction<number>>;
  lastResult: AnswerResult | null;
  onSubmitAnswer: (answer: PlayerAnswer) => void;
  onNextQuestion: () => void;
}

export function GameView({
  view,
  currentQuestion,
  timeLeft,
  submitted,
  submissionsCount,
  totalPlayers,
  matchingAnswers,
  setMatchingAnswers,
  scrambleAnswer,
  setScrambleAnswer,
  revealCount,
  setRevealCount,
  lastResult,
  onSubmitAnswer,
  onNextQuestion,
}: GameViewProps) {
  return (
    <motion.div
      key="game"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-4xl mx-auto px-3 md:px-4 pb-20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4 md:gap-6">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2 md:mb-3">
            <span className="bg-blue-light/10 text-blue-deep px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase border border-blue-light/20">
              Câu {currentQuestion.index + 1} / {currentQuestion.total}
            </span>
            <div className="flex items-center gap-2 md:gap-4">
              {view === 'host-game' && (
                <div className="flex items-center gap-1 md:gap-2 bg-slate-50 px-2 md:px-3 py-1 rounded-full border border-slate-200">
                  <Users size={12} className="text-slate-400 md:w-3.5 md:h-3.5" />
                  <span className="text-[10px] md:text-xs font-bold text-slate-600">{submissionsCount} / {totalPlayers}</span>
                </div>
              )}
              <span className={`text-xl md:text-2xl font-black ${timeLeft <= 5 ? 'text-primary animate-pulse' : 'text-blue-deep'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full mb-4 md:mb-6 overflow-hidden border border-slate-200">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / (currentQuestion.timeLimit || 30)) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-primary' : 'bg-blue-mid'}`}
            />
          </div>
          <h2 className="text-xl md:text-3xl lg:text-5xl font-black text-blue-deep leading-tight">{currentQuestion.question}</h2>
        </div>
        {view === 'host-game' && (
          <button onClick={onNextQuestion} className="btn-primary flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 justify-center">
            Tiếp theo <Send size={18} />
          </button>
        )}
      </div>

      <div className="glass-card p-4 md:p-6 lg:p-10">
        {currentQuestion.imageUrl && (
          <div className="relative mb-6 md:mb-8 rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-white shadow-xl">
            <img src={currentQuestion.imageUrl} alt="Câu hỏi hình ảnh" className="w-full h-48 md:h-64 lg:h-96 object-cover" referrerPolicy="no-referrer" />
            {view === 'host-game' && (
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`border border-white/10 transition-opacity duration-500 ${i < revealCount ? 'opacity-0' : 'bg-blue-deep'}`}
                  />
                ))}
              </div>
            )}
            {view === 'host-game' && (
              <button
                onClick={() => setRevealCount(prev => Math.min(prev + 1, 16))}
                className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-primary text-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-2xl hover:scale-110 transition-transform"
              >
                <Layers size={20} className="md:w-6 md:h-6" />
              </button>
            )}
          </div>
        )}

        {(currentQuestion.questionType === 'multiple-choice' || currentQuestion.questionType === 'image') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            {(currentQuestion.options ?? []).map((opt: string, idx: number) => (
              <button
                key={idx}
                disabled={view === 'host-game' || submitted}
                onClick={() => onSubmitAnswer(idx)}
                className={`group relative p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border-2 transition-all text-left ${
                  view === 'player-game' && !submitted && timeLeft > 0
                    ? 'border-slate-100 bg-white hover:border-primary hover:shadow-xl hover:-translate-y-1 active:scale-98'
                    : 'border-slate-100 bg-slate-50'
                } ${submitted ? 'opacity-50' : ''} ${timeLeft === 0 && !submitted ? 'opacity-30 grayscale' : ''}`}
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-deep text-white font-black text-sm flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-base md:text-xl lg:text-2xl font-bold text-slate-700">{opt}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {currentQuestion.questionType === 'matching' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
            <div className="space-y-3 md:space-y-4">
              {(currentQuestion.pairs || []).map((p: QuestionPair, i: number) => (
                <div key={i} className="p-3 md:p-5 bg-white rounded-xl md:rounded-2xl border border-slate-100 font-bold text-center text-slate-600 shadow-sm text-sm md:text-base">
                  {p.left}
                </div>
              ))}
            </div>
            <div className="space-y-3 md:space-y-4">
              {(currentQuestion.pairs || []).map((p: QuestionPair, i: number) => (
                <div key={i} className="flex gap-2">
                  <select
                    disabled={view === 'host-game' || submitted || timeLeft === 0}
                    onChange={(e) => {
                      const newAns = [...matchingAnswers];
                      newAns[i] = parseInt(e.target.value);
                      setMatchingAnswers(newAns);
                    }}
                    className="w-full p-3 md:p-5 bg-white rounded-xl md:rounded-2xl border border-slate-100 font-bold text-slate-600 focus:outline-none focus:border-primary appearance-none shadow-sm text-sm md:text-base"
                  >
                    <option value="">Chọn vế nối...</option>
                    {(currentQuestion.pairs || []).map((_: QuestionPair, idx: number) => (
                      <option key={idx} value={idx}>{(currentQuestion.pairs || [])[idx].right}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {view === 'player-game' && !submitted && timeLeft > 0 && (
              <button onClick={() => onSubmitAnswer(matchingAnswers)} className="md:col-span-2 btn-primary text-lg md:text-xl py-4 md:py-5">
                Gửi đáp án
              </button>
            )}
          </div>
        )}

        {(currentQuestion.questionType === 'scramble' || currentQuestion.questionType === 'guess') && (
          <div className="text-center space-y-6 md:space-y-8">
            {currentQuestion.questionType === 'scramble' && (
              <p className="text-2xl md:text-3xl lg:text-5xl font-black tracking-[0.2em] md:tracking-[0.3em] text-primary uppercase">{currentQuestion.scrambledWord}</p>
            )}
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={scrambleAnswer}
                disabled={view === 'host-game' || submitted || timeLeft === 0}
                onChange={(e) => setScrambleAnswer(e.target.value.toUpperCase())}
                className="w-full text-center text-2xl md:text-3xl lg:text-5xl font-black border-b-4 border-blue-deep p-3 md:p-4 focus:outline-none bg-transparent text-blue-deep placeholder:text-slate-200"
                placeholder={timeLeft === 0 ? "HẾT GIỜ!" : "NHẬP ĐÁP ÁN..."}
                autoFocus
              />
              {view === 'player-game' && !submitted && timeLeft > 0 && (
                <button onClick={() => onSubmitAnswer(scrambleAnswer)} className="w-full mt-6 md:mt-10 btn-primary text-lg md:text-xl py-4 md:py-5">
                  Gửi đáp án
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {view === 'player-game' && (submitted || timeLeft === 0) && (
        <div className="mt-8 md:mt-12 text-center">
          {lastResult ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-6 md:p-10 rounded-2xl md:rounded-3xl border-4 shadow-2xl ${
                lastResult.isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <div className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
                {lastResult.isCorrect ? <CheckCircle2 size={40} className="md:w-14 md:h-14" /> : <XCircle size={40} className="md:w-14 md:h-14" />}
                <h3 className="text-2xl md:text-4xl font-black uppercase">{lastResult.isCorrect ? 'Chính xác!' : 'Sai rồi!'}</h3>
              </div>
              <div className="space-y-2">
                <p className="text-lg md:text-2xl font-bold">Điểm nhận được: <span className="text-xl md:text-3xl font-black">+{lastResult.scoreGained}</span></p>
                {!lastResult.isCorrect && (
                  <p className="text-base md:text-xl">Đáp án đúng: <span className="font-black underline decoration-2 underline-offset-4">{lastResult.correctAnswer}</span></p>
                )}
              </div>
            </motion.div>
          ) : timeLeft === 0 ? (
            <div className="p-6 md:p-10 bg-slate-100 rounded-2xl md:rounded-3xl border-4 border-slate-200 text-slate-500">
              <h3 className="text-2xl md:text-4xl font-black uppercase mb-2">Hết thời gian! ⏰</h3>
              <p className="text-base md:text-xl font-bold">Bạn đã không kịp trả lời câu hỏi này.</p>
            </div>
          ) : (
            <div className="glass-card p-6 md:p-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 mx-auto text-green-500 mb-4" />
              </motion.div>
              <p className="text-lg md:text-2xl font-black text-blue-deep uppercase tracking-widest">Đã gửi câu trả lời! 🚀</p>
              <p className="text-slate-400 mt-2 font-medium text-sm md:text-base">Đợi kết quả từ host nhé...</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
