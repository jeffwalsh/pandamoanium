import express from "express";
import http from "http";
import { addPlayerToGame, Game } from "./game/game";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

  socket.on("startGame", (roomCode: string, fromAddress: string) => {
    const game = games.get(roomCode);
    if (!game) return;

    if (game.started) return;
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
});

server.listen(3000, () => console.log("SERVER IS LISTENING!"));

export {};
