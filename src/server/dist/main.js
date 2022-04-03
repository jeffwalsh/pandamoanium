"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const game_1 = require("./game/game");
const socket_io_1 = require("socket.io");
const app_1 = require("firebase/app");
const database_1 = require("firebase/database");
const choices_1 = require("./choices/choices");
const firebaseConfig = {
    apiKey: "AIzaSyBLqrdtCQlUGVi7H714_W_RCS2VXNYa1lE",
    authDomain: "pandamoanium-c2593.firebaseapp.com",
    projectId: "pandamoanium-c2593",
    storageBucket: "pandamoanium-c2593.appspot.com",
    messagingSenderId: "524593972873",
    appId: "1:524593972873:web:d725243f157605d5cba858",
    measurementId: "G-N2BQPK9QQW",
};
const firebaseApp = app_1.initializeApp(firebaseConfig);
const database = database_1.getDatabase(firebaseApp);
const app = express_1.default();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
app.get("/choices", (req, res) => {
    const shuffled = choices_1.choices.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    res.send({ choices: selected });
});
app.get("/selectWord", (req, res) => {
    const word = req.query.word;
    const roomCode = req.query.roomCode;
    const game = games.get(roomCode);
    if (!game)
        return;
    game.currentWord = word;
    games.set(roomCode, game);
    io.emit("wordSelected");
    res.send(word);
});
const games = new Map();
io.on("connection", (_socket) => {
    _socket.on("disconnect", () => {
        console.log("a user disconnected");
    });
    const socket = _socket;
    console.log("a user connected");
    socket.on("createGame", (game) => {
        console.log("creating game", game);
        games.set(game.roomCode, game);
    });
    socket.on("startGame", (roomCode) => {
        console.log("start game room code", roomCode);
        const game = games.get(roomCode);
        if (!game)
            return;
        if (game.started)
            return;
        game.started = true;
        const shuffled = game.players.sort(() => 0.5 - Math.random());
        game.playerOrder = shuffled;
        games.set(game.roomCode, game);
        io.emit("startedGame", { roomCode, playerOrder: game.playerOrder });
    });
    socket.on("joinGame", (info) => {
        const game = games.get(info.roomCode);
        if (!game)
            return;
        if (game.started)
            return;
        console.log("found game", game);
        if (game_1.addPlayerToGame(game, info.player)) {
            games.set(game.roomCode, game);
            console.log("added player", info.player);
            io.emit("updatePlayers", {
                player: info.player,
                roomCode: game.roomCode,
            });
            io.emit("joinedGame", { game });
        }
        else {
            console.log("player already exists:", info.player);
        }
    });
    socket.on("chatMessage", (info) => {
        console.log("got chat message");
        const game = games.get(info.roomCode);
        if (!game)
            return;
        if (!game.started)
            return;
        console.log("finding player");
        const player = game.players.find((p) => p.address === info.address);
        if (!player)
            return;
        const message = {
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
    });
});
server.listen(3000, () => console.log("SERVER IS LISTENING!"));
//# sourceMappingURL=main.js.map