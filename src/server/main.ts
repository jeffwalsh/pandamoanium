import express from "express";
import http from "http";
import { addPlayerToGame, Game, Message, Player } from "./game/game";
import { Server } from "socket.io";
import { initializeApp } from "firebase/app";
import { choices } from "./choices/choices";
import cors from "cors";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getFirestore,
  getDocs,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLqrdtCQlUGVi7H714_W_RCS2VXNYa1lE",
  authDomain: "pandamoanium-c2593.firebaseapp.com",
  projectId: "pandamoanium-c2593",
  storageBucket: "pandamoanium-c2593.appspot.com",
  messagingSenderId: "524593972873",
  appId: "1:524593972873:web:d725243f157605d5cba858",
  measurementId: "G-N2BQPK9QQW",
};

const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp);

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const games: Map<string, Game> = new Map<string, Game>();

const timers: Map<string, { n: number; interval: NodeJS.Timeout }> = new Map<
  string,
  { n: number; interval: NodeJS.Timeout }
>();

app.get("/choices", (req, res) => {
  const shuffled = choices.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  res.send({ choices: selected });
});

app.get("/leaderboard", async (req, res) => {
  const querySnapshot = await getDocs(collection(db, "scores"));
  const resp: unknown[] = [];
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${doc.data()}`);
    resp.push(doc.data());
  });

  res.send({ data: resp });
});

app.get("/selectWord", (req, res) => {
  const word = req.query.word;
  const roomCode = req.query.roomCode;

  const game = games.get(roomCode as string);
  if (!game) return;

  game.currentWord = word as string;
  games.set(roomCode as string, game);

  io.emit("wordSelected", { roomCode: roomCode as string });
  const myTimer = setInterval(() => {
    const timer = timers.get(roomCode as string);
    const v = ((timer as { n: number; interval: NodeJS.Timeout }).n -
      1) as number;
    timers.set(roomCode as string, {
      n: v,
      interval: myTimer,
    });
    io.emit("countdown", {
      roomCode: roomCode as string,
      t: v,
    });
    if (v === 0) {
      clearInterval(myTimer);
      timers.delete(roomCode as string);
      io.emit("timeout", { roomCode: roomCode as string });
      game.playerOrder.shift();
      game.correctPlayersThisRound = [];
      io.emit("clearCanvas", {
        roomCode: game.roomCode,
        players: game.players,
      });
      if (game.playerOrder.length === 0) {
        game.finished = true;
        game.started = false;
        io.emit("gameOver", { roomCode: game.roomCode });
      } else {
        io.emit("nextRound", {
          nextChooser: game.playerOrder[0],
          roomCode: game.roomCode,
        });
      }

      games.set(game.roomCode, game);
    }
  }, 1000);

  timers.set(roomCode as string, { n: 69, interval: myTimer });

  res.send(word);
});

io.on("connection", (_socket) => {
  _socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  const socket = _socket;

  socket.on("createGame", (game: Game) => {
    games.set(game.roomCode, game);
  });

  socket.on("startGame", (roomCode: string) => {
    const game = games.get(roomCode);
    if (!game) return;

    if (game.started) return;

    game.started = true;
    const shuffled = [...game.players].sort(() => 0.5 - Math.random());
    game.playerOrder = shuffled;
    games.set(game.roomCode, game);

    io.emit("startedGame", { roomCode, playerOrder: game.playerOrder });
  });

  socket.on(
    "joinGame",
    (info: {
      roomCode: string;
      player: {
        address: string;
        pandaName: string;
        thumbnail: string;
        isHost: false;
        score: number;
      };
    }) => {
      const game = games.get(info.roomCode);
      if (!game) return;

      if (game.started) return;

      if (addPlayerToGame(game, info.player)) {
        games.set(game.roomCode, game);
        io.emit("updatePlayers", {
          player: info.player,
          roomCode: game.roomCode,
        });
        io.emit("joinedGame", { game });
      } else {
        console.log("player already exists:", info.player);
      }
    }
  );

  socket.on(
    "sendDraw",
    (info: {
      x: string | number;
      y: string | number;
      color: string;
      roomCode: string;
    }) => {
      const game = games.get(info.roomCode);
      if (!game) return;

      io.emit("receiveDraw", info);
    }
  );

  socket.on("restartGame", (roomCode: string) => {
    console.log("restart game room code", roomCode);
    const game = games.get(roomCode);
    if (!game) return;

    game.started = true;
    const shuffled = [...game.players].sort(() => 0.5 - Math.random());
    game.playerOrder = shuffled;
    console.log("set new playeOrder to be", shuffled);
    game.correctPlayersThisRound = [];
    game.finished = false;
    games.set(game.roomCode, game);

    io.emit("restartedGame", { roomCode, playerOrder: game.playerOrder });
  });

  socket.on(
    "chatMessage",
    async (info: { address: string; text: string; roomCode: string }) => {
      const game = games.get(info.roomCode);
      if (!game) return;

      if (!game.started) return;

      const player = game.players.find((p) => p.address === info.address);
      if (!player) return;

      const message: Message = {
        player: player,
        text: info.text,
        isCorrect: info.text.toLowerCase() === game.currentWord.toLowerCase(),
      };

      io.emit("message", { message: message, roomCode: info.roomCode });

      if (message.isCorrect) {
        if (
          !game.correctPlayersThisRound.find(
            (p) => p.pandaName === message.player.pandaName
          )
        ) {
          const p = game.players.find(
            (p) => p.pandaName === message.player.pandaName
          );

          const points = timers.get(info.roomCode)?.n;
          const score = (p as Player).score + (points as number);
          (p as Player).score = score;

          const panda = p as Player;

          const docSnap = await getDoc(doc(db, "scores", panda.pandaName));
          let existingScore = 0;
          if (docSnap.exists()) {
            console.log("Exists!", docSnap.data());
            existingScore = docSnap.data().score;
          }
          await setDoc(doc(collection(db, "scores"), panda.pandaName), {
            address: panda.address,
            pandaName: panda.pandaName,
            thumbnail: panda.thumbnail,
            score: existingScore + (points as number),
          });

          game.players = game.players.map((player) => {
            if (player.pandaName === message.player.pandaName) {
              return {
                address: player.address,
                thumbnail: player.thumbnail,
                score: score,
                isHost: player.isHost,
                pandaName: player.pandaName,
              } as Player;
            } else {
              return player;
            }
          });
          game.correctPlayersThisRound.push(p as Player);

          if (game.correctPlayersThisRound.length === game.players.length - 1) {
            const timer = timers.get(game.roomCode);
            clearInterval(
              (timer as { n: number; interval: NodeJS.Timeout }).interval
            );
            timers.delete(game.roomCode);
            game.playerOrder.shift();
            game.correctPlayersThisRound = [];
            io.emit("clearCanvas", {
              roomCode: game.roomCode,
              players: game.players,
            });
            if (game.playerOrder.length === 0) {
              game.finished = true;
              game.started = false;
              io.emit("gameOver", { roomCode: game.roomCode });
            } else {
              io.emit("nextRound", {
                nextChooser: game.playerOrder[0],
                roomCode: game.roomCode,
              });
            }
          }
          games.set(game.roomCode, game);
        }
      }
    }
  );
});

const host = "0.0.0.0";
const port = process.env.PORT || 3000;

server.listen(Number(port), host, () =>
  console.log("SERVER LISTENING ON", host, port)
);
