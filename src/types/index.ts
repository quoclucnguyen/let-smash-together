export type QuestionType = 'multiple-choice' | 'matching' | 'scramble' | 'guess' | 'image';
export type AppView = 'landing' | 'host-setup' | 'host-lobby' | 'host-game' | 'host-results' | 'player-join' | 'player-lobby' | 'player-game' | 'player-results' | 'interstitial-leaderboard';

export interface Question {
  type: QuestionType;
  text: string;
  timeLimit?: number;
  options?: string[];
  correctIndex?: number;
  pairs?: QuestionPair[];
  scrambledWord?: string;
  correctWord?: string;
  imageUrl?: string;
  revealParts?: number;
}

export interface QuestionPair {
  left: string;
  right: string;
}

export interface LiveQuestion {
  questionType: QuestionType;
  question: string;
  options?: string[];
  pairs?: QuestionPair[];
  scrambledWord?: string;
  imageUrl?: string;
  timeLimit: number;
  index: number;
  total: number;
}

export type PlayerAnswer = number | string | number[];

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string | null;
  scoreGained: number;
}

export interface PlayerScore {
  id: string;
  name: string;
  score: number;
  correctCount: number;
}

export interface PlayerSubmittedPayload {
  playerId: string;
  submissionsCount: number;
  totalPlayers: number;
}

export interface AnswerResultPayload extends AnswerResult {
  playerId: string;
  totalScore: number;
}

export type StatePayload =
  | ({ type: 'QUESTION' } & LiveQuestion)
  | ({ type: 'GAME_STARTED' })
  | ({ type: 'PLAYER_SUBMITTED' } & PlayerSubmittedPayload)
  | ({ type: 'ANSWER_RESULT' } & AnswerResultPayload)
  | ({ type: 'INTERSTITIAL_LEADERBOARD'; leaderboard: LeaderboardEntry[] })
  | ({ type: 'GAME_FINISHED'; leaderboard: LeaderboardEntry[] });

export interface Player {
  id: string;
  name: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
}
