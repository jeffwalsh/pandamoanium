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
const choices_1 = require("./choices/choices");
const firestore_1 = require("firebase/firestore");
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
const db = firestore_1.getFirestore(firebaseApp);
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
app.get("/leaderboard", async (req, res) => {
    const querySnapshot = await firestore_1.getDocs(firestore_1.collection(db, "scores"));
    const resp = [];
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data()}`);
        resp.push(doc.data());
    });
    res.send({ data: resp });
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
            io.emit("clearCanvas", {
                roomCode: game.roomCode,
                players: game.players,
            });
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
    socket.on("createGame", (game) => {
        games.set(game.roomCode, game);
    });
    socket.on("startGame", (roomCode) => {
        const game = games.get(roomCode);
        if (!game)
            return;
        if (game.started)
            return;
        game.started = true;
        const shuffled = [...game.players].sort(() => 0.5 - Math.random());
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
        if (game_1.addPlayerToGame(game, info.player)) {
            games.set(game.roomCode, game);
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
        const game = games.get(info.roomCode);
        if (!game)
            return;
        io.emit("receiveDraw", info);
    });
    socket.on("restartGame", (roomCode) => {
        console.log("restart game room code", roomCode);
        const game = games.get(roomCode);
        if (!game)
            return;
        game.started = true;
        const shuffled = [...game.players].sort(() => 0.5 - Math.random());
        game.playerOrder = shuffled;
        console.log("set new playeOrder to be", shuffled);
        game.correctPlayersThisRound = [];
        game.finished = false;
        games.set(game.roomCode, game);
        io.emit("restartedGame", { roomCode, playerOrder: game.playerOrder });
    });
    socket.on("chatMessage", async (info) => {
        const game = games.get(info.roomCode);
        if (!game)
            return;
        if (!game.started)
            return;
        const player = game.players.find((p) => p.address === info.address);
        if (!player)
            return;
        const message = {
            player: player,
            text: info.text,
            isCorrect: info.text === game.currentWord,
        };
        io.emit("message", { message: message, roomCode: info.roomCode });
        if (message.isCorrect) {
            if (!game.correctPlayersThisRound.find((p) => p.pandaName === message.player.pandaName)) {
                const p = game.players.find((p) => p.pandaName === message.player.pandaName);
                const points = timers.get(info.roomCode)?.n;
                const score = p.score + points;
                p.score = score;
                const panda = p;
                const docSnap = await firestore_1.getDoc(firestore_1.doc(db, "scores", panda.pandaName));
                let existingScore = 0;
                if (docSnap.exists()) {
                    console.log("Exists!", docSnap.data());
                    existingScore = docSnap.data().score;
                }
                await firestore_1.setDoc(firestore_1.doc(firestore_1.collection(db, "scores"), panda.pandaName), {
                    address: panda.address,
                    pandaName: panda.pandaName,
                    thumbnail: panda.thumbnail,
                    score: existingScore + points,
                });
                game.players = game.players.map((player) => {
                    if (player.pandaName === message.player.pandaName) {
                        return {
                            address: player.address,
                            thumbnail: player.thumbnail,
                            score: score,
                            isHost: player.isHost,
                            pandaName: player.pandaName,
                        };
                    }
                    else {
                        return player;
                    }
                });
                game.correctPlayersThisRound.push(p);
                if (game.correctPlayersThisRound.length === game.players.length - 1) {
                    const timer = timers.get(game.roomCode);
                    clearInterval(timer.interval);
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
                    }
                    else {
                        io.emit("nextRound", {
                            nextChooser: game.playerOrder[0],
                            roomCode: game.roomCode,
                        });
                    }
                }
                games.set(game.roomCode, game);
            }
        }
    });
});
const host = "0.0.0.0";
const port = process.env.PORT || 3000;
server.listen(Number(port), host, () => console.log("SERVER LISTENING ON", host, port));
//# sourceMappingURL=main.js.map