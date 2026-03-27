import type { PlayerAnswer, Question } from '@/types';

export function evaluateAnswer(question: Question, answer: PlayerAnswer) {
  let isCorrect = false;
  let correctAnswer: string | null = null;

  switch (question.type) {
    case 'multiple-choice':
    case 'image':
      isCorrect = answer === question.correctIndex;
      correctAnswer = question.options?.[question.correctIndex || 0] ?? null;
      break;
    case 'scramble':
    case 'guess':
      isCorrect =
        answer?.toString().toLowerCase().trim() ===
        question.correctWord?.toLowerCase().trim();
      correctAnswer = question.correctWord ?? null;
      break;
    case 'matching':
      isCorrect =
        JSON.stringify(answer) ===
        JSON.stringify(question.pairs?.map((_, i) => i));
      correctAnswer = (question.pairs || [])
        .map((p) => `${p.left} - ${p.right}`)
        .join(', ');
      break;
  }

  return { isCorrect, correctAnswer };
}
