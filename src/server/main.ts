import express from "express";
import http from "http";
import { addPlayerToGame, Game, Message } from "./game/game";
import { Server } from "socket.io";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { choices } from "./choices/choices";

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

const database = getDatabase(firebaseApp);

const app = express();

const server = http.createServer(app);
const io = new Server(server);

app.get("/choices", (req, res) => {
  const shuffled = choices.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  res.send({ choices: selected });
});

app.get("/selectWord", (req, res) => {
  const word = req.query.word;
  const roomCode = req.query.roomCode;

  const game = games.get(roomCode as string);
  if (!game) return;

  game.currentWord = word as string;
  games.set(roomCode as string, game);

  io.emit("wordSelected");
  res.send(word);
});

const games: Map<string, Game> = new Map<string, Game>();

io.on("connection", (_socket) => {
  _socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  const socket = _socket;
  console.log("a user connected");

  socket.on("createGame", (game: Game) => {
    console.log("creating game", game);
    games.set(game.roomCode, game);
  });

  socket.on("startGame", (roomCode: string) => {
    console.log("start game room code", roomCode);
    const game = games.get(roomCode);
    if (!game) return;

    if (game.started) return;

    game.started = true;
    const shuffled = game.players.sort(() => 0.5 - Math.random());
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
      };
    }) => {
      const game = games.get(info.roomCode);
      if (!game) return;

      if (game.started) return;

      console.log("found game", game);
      if (addPlayerToGame(game, info.player)) {
        games.set(game.roomCode, game);
        console.log("added player", info.player);
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
    "chatMessage",
    (info: { address: string; text: string; roomCode: string }) => {
      console.log("got chat message");
      const game = games.get(info.roomCode);
      if (!game) return;

      if (!game.started) return;

      console.log("finding player");
      const player = game.players.find((p) => p.address === info.address);
      if (!player) return;

      const message: Message = {
        player: player,
        text: info.text,
        isCorrect: info.text === game.currentWord,
      };
      console.log("message", message);
      io.emit("message", { message: message, roomCode: info.roomCode });

      if (message.isCorrect) {
        game.playerOrder.shift();
        games.set(game.roomCode, game);
        io.emit("nextRound");
      }
    }
  );
});

server.listen(3000, () => console.log("SERVER IS LISTENING!"));

export {};
