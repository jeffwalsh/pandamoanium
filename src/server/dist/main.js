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
const games = new Map();
const timers = new Map();
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
    io.emit("wordSelected", { roomCode: roomCode });
    const myTimer = setInterval(() => {
        const timer = timers.get(roomCode);
        const v = (timer.n -
            1);
        timers.set(roomCode, {
            n: v,
            interval: myTimer,
        });
        io.emit("countdown", {
            roomCode: roomCode,
            t: v,
        });
        if (v === 0) {
            clearInterval(myTimer);
            timers.delete(roomCode);
            io.emit("timeout", { roomCode: roomCode });
            game.playerOrder.shift();
            game.correctPlayersThisRound = [];
            io.emit("clearCanvas", { roomCode: game.roomCode });
            if (game.playerOrder.length === 0) {
                game.finished = true;
                game.started = false;
                io.emit("gameOver", { roomCode: game.roomCode });
            }
            else {
                io.emit("nextRound", {
                    nextChooser: game.playerOrder[0],
                    roomCode: game.roomCode,
                });
            }
            games.set(game.roomCode, game);
        }
    }, 1000);
    timers.set(roomCode, { n: 69, interval: myTimer });
    res.send(word);
});
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
    socket.on("sendDraw", (info) => {
        console.log("sendDraw", info);
        const game = games.get(info.roomCode);
        if (!game)
            return;
        console.log("emitting receiveDraw");
        io.emit("receiveDraw", info);
    });
    socket.on("restartGame", (roomCode) => {
        console.log("restart game room code", roomCode);
        const game = games.get(roomCode);
        if (!game)
            return;
        game.started = true;
        const shuffled = game.players.sort(() => 0.5 - Math.random());
        game.playerOrder = shuffled;
        console.log("set new playeOrder to be", shuffled);
        game.correctPlayersThisRound = [];
        game.finished = false;
        games.set(game.roomCode, game);
        io.emit("restartedGame", { roomCode, playerOrder: game.playerOrder });
    });
    socket.on("chatMessage", (info) => {
        console.log("got chat message");
        const game = games.get(info.roomCode);
        if (!game)
            return;
        if (!game.started)
            return;
        const player = game.players.find((p) => p.address === info.address);
        if (!player)
            return;
        console.log("chatMesage found player", player.pandaName);
        console.log("text", info.text, "currentWord", game.currentWord);
        const message = {
            player: player,
            text: info.text,
            isCorrect: info.text === game.currentWord,
        };
        console.log("message", message);
        io.emit("message", { message: message, roomCode: info.roomCode });
        if (message.isCorrect) {
            if (!game.correctPlayersThisRound.find((p) => p.pandaName === message.player.pandaName)) {
                game.correctPlayersThisRound.push(message.player);
            }
            console.log("correct players", game.correctPlayersThisRound.length);
            console.log("current players", game.players);
            if (game.correctPlayersThisRound.length === game.players.length - 1) {
                const timer = timers.get(game.roomCode);
                clearInterval(timer.interval);
                timers.delete(game.roomCode);
                console.log("round over!");
                game.playerOrder.shift();
                game.correctPlayersThisRound = [];
                console.log("game player order", game.playerOrder);
                io.emit("clearCanvas", { roomCode: game.roomCode });
                if (game.playerOrder.length === 0) {
                    console.log("game is finished!");
                    game.finished = true;
                    game.started = false;
                    io.emit("gameOver", { roomCode: game.roomCode });
                }
                else {
                    console.log("next round, player is", game.playerOrder[0]);
                    io.emit("nextRound", {
                        nextChooser: game.playerOrder[0],
                        roomCode: game.roomCode,
                    });
                }
            }
            games.set(game.roomCode, game);
        }
    });
});
server.listen(3000, () => console.log("SERVER IS LISTENING!"));
//# sourceMappingURL=main.js.map