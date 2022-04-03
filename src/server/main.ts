import express from "express";
import path from "path";
import http from "http";
import type { Game } from "./game/game";
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
    console.log("creating game");
    games.set(game.roomCode, game);
  });

  socket.on("startGame", (roomCode: string, fromAddress: string) => {
    const game = games.get(roomCode);
    if (!game) return;

    if (game.isStarted()) return;

    let host: string;

    game.players;
  });

  // Create a new player, maybe?
  socket.on(
    "registerPlayer",
    (
      roomCode: string,
      player: {
        address: string;
        pandaName: string;
        thumbnail: string;
        isHost: false;
      }
    ) => {
      const game = games.get(roomCode);
      if (!game) return;

      if (game.isStarted()) return;

      console.log("found game", game);
      if (game.addPlayer(player)) {
        console.log("added player", player);
        io.emit("updatePlayers", game);
      } else {
        console.log("player already exists:", player);
      }
    }
  );
});

server.listen(3000, () => console.log("SERVER IS LISTENING!"));

export {};
