import { createServer } from "node:http";
import next from "next";
import { WebSocketServer } from "ws";
import { nanoid } from "nanoid";

const PORT = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== "production" && !process.argv.includes("--prod");

/** @type {Map<string, any>} */
const rooms = new Map();

function safeSend(ws, payload) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function buildLeaderboard(room) {
  return Array.from(room.players.values())
    .map((p) => ({
      name: p.name,
      score: p.score,
      correctCount: p.correctCount,
      totalQuestions: room.questions.length,
    }))
    .sort((a, b) => b.score - a.score);
}

function sendQuestion(room) {
  room.startTime = Date.now();
  room.submissions.clear();

  const question = room.questions[room.currentQuestionIndex];
  const questionData = {
    type: "QUESTION",
    questionType: question.type,
    question: question.text,
    options: question.options,
    pairs: question.pairs,
    scrambledWord: question.scrambledWord,
    imageUrl: question.imageUrl,
    timeLimit: question.timeLimit || 30,
    index: room.currentQuestionIndex,
    total: room.questions.length,
  };

  safeSend(room.hostWs, questionData);
  room.players.forEach((p) => safeSend(p.ws, questionData));
}

function handleNextStep(room) {
  const questionNum = room.currentQuestionIndex + 1;

  if (
    room.submissions.size > 0 &&
    questionNum % 3 === 0 &&
    questionNum < room.questions.length
  ) {
    const leaderboard = buildLeaderboard(room);
    const payload = { type: "INTERSTITIAL_LEADERBOARD", leaderboard };
    safeSend(room.hostWs, payload);
    room.players.forEach((p) => safeSend(p.ws, payload));
    room.submissions.clear();
    return;
  }

  room.currentQuestionIndex += 1;
  if (room.currentQuestionIndex < room.questions.length) {
    sendQuestion(room);
    return;
  }

  room.status = "finished";
  const leaderboard = buildLeaderboard(room);
  const payload = { type: "GAME_FINISHED", leaderboard };
  safeSend(room.hostWs, payload);
  room.players.forEach((p) => safeSend(p.ws, payload));
}

async function start() {
  const app = next({ dev, hostname: "0.0.0.0", port: PORT });
  await app.prepare();
  const handle = app.getRequestHandler();

  const server = createServer((req, res) => handle(req, res));
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    let currentRoomId = null;
    let playerId = null;

    ws.on("message", (message) => {
      let data;
      try {
        data = JSON.parse(message.toString());
      } catch {
        safeSend(ws, { type: "ERROR", message: "Dữ liệu không hợp lệ." });
        return;
      }

      switch (data.type) {
        case "HOST_CREATE": {
          try {
            const roomId = nanoid(6).toUpperCase();
            rooms.set(roomId, {
              id: roomId,
              hostWs: ws,
              players: new Map(),
              status: "waiting",
              currentQuestionIndex: 0,
              questions: data.questions || [],
              startTime: 0,
              submissions: new Set(),
            });
            currentRoomId = roomId;
            safeSend(ws, { type: "ROOM_CREATED", roomId });
          } catch {
            safeSend(ws, {
              type: "ERROR",
              message: "Không thể tạo phòng. Vui lòng thử lại.",
            });
          }
          break;
        }

        case "PLAYER_JOIN": {
          const room = rooms.get((data.roomId || "").toUpperCase());
          if (!room || room.status !== "waiting") {
            safeSend(ws, {
              type: "ERROR",
              message: "Phòng không tồn tại hoặc trò chơi đã bắt đầu.",
            });
            break;
          }

          playerId = nanoid(4);
          const newPlayer = {
            id: playerId,
            name: data.name,
            score: 0,
            correctCount: 0,
            ws,
          };

          room.players.set(playerId, newPlayer);
          currentRoomId = room.id;

          safeSend(ws, { type: "JOINED", playerId, roomId: room.id });
          safeSend(room.hostWs, {
            type: "PLAYER_LIST_UPDATE",
            players: Array.from(room.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
            })),
          });
          break;
        }

        case "START_GAME": {
          if (!currentRoomId) break;
          const room = rooms.get(currentRoomId);
          if (!room || room.hostWs !== ws) break;

          room.status = "playing";
          room.players.forEach((p) => safeSend(p.ws, { type: "GAME_STARTED" }));
          sendQuestion(room);
          break;
        }

        case "SUBMIT_ANSWER": {
          if (!currentRoomId || !playerId) break;
          const room = rooms.get(currentRoomId);
          if (!room || room.status !== "playing") break;

          const player = room.players.get(playerId);
          if (!player) break;

          const question = room.questions[room.currentQuestionIndex];
          const timeLimit = question.timeLimit || 30;
          const timeTaken = (Date.now() - room.startTime) / 1000;

          let isCorrect = false;
          let correctAnswer = null;

          switch (question.type) {
            case "multiple-choice":
            case "image":
              isCorrect = data.answer === question.correctIndex;
              correctAnswer = question.options?.[question.correctIndex];
              break;
            case "scramble":
            case "guess":
              isCorrect =
                data.answer?.toString().toLowerCase().trim() ===
                question.correctWord?.toLowerCase().trim();
              correctAnswer = question.correctWord;
              break;
            case "matching":
              isCorrect =
                JSON.stringify(data.answer) ===
                JSON.stringify(question.pairs.map((_, i) => i));
              correctAnswer = question.pairs
                .map((p) => `${p.left} - ${p.right}`)
                .join(", ");
              break;
          }

          let scoreGained = 0;
          if (isCorrect && timeTaken <= timeLimit) {
            player.correctCount += 1;
            scoreGained = Math.max(
              10,
              Math.floor(100 * (1 - timeTaken / timeLimit)),
            );
            player.score += scoreGained;
          }

          safeSend(ws, {
            type: "ANSWER_RESULT",
            isCorrect,
            correctAnswer,
            scoreGained,
            totalScore: player.score,
          });

          room.submissions.add(playerId);
          safeSend(room.hostWs, {
            type: "PLAYER_SUBMITTED",
            playerId,
            submissionsCount: room.submissions.size,
            totalPlayers: room.players.size,
          });

          if (room.submissions.size === room.players.size) {
            setTimeout(() => {
              if (rooms.has(currentRoomId)) {
                handleNextStep(room);
              }
            }, 2000);
          }
          break;
        }

        case "NEXT_QUESTION": {
          if (!currentRoomId) break;
          const room = rooms.get(currentRoomId);
          if (!room || room.hostWs !== ws) break;
          handleNextStep(room);
          break;
        }
      }
    });

    ws.on("close", () => {
      if (!currentRoomId) return;

      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.hostWs === ws) {
        room.players.forEach((p) => safeSend(p.ws, { type: "HOST_DISCONNECTED" }));
        rooms.delete(currentRoomId);
        return;
      }

      if (!playerId) return;

      room.players.delete(playerId);
      safeSend(room.hostWs, {
        type: "PLAYER_LIST_UPDATE",
        players: Array.from(room.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
        })),
      });
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
