export function buildLeaderboard(
  scoreMap: Map<string, { id: string; name: string; score: number; correctCount: number }>,
  totalQuestions: number,
) {
  return Array.from(scoreMap.values())
    .map((p) => ({
      name: p.name,
      score: p.score,
      correctCount: p.correctCount,
      totalQuestions,
    }))
    .sort((a, b) => b.score - a.score);
}
