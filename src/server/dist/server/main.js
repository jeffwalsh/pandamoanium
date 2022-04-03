import express from "express";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { Server } from "../../node_modules/socket.io/dist/index.js"; // "socket.io"
import "../shared/constants.js";
import { Game } from "./game/game.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticPath = path.join(__dirname, "..", "..");
app.use(express.static(staticPath));
const games = new Map();
io.on("connection", (_socket) => {
    _socket.on("disconnect", () => {
        console.log("a user disconnected");
    });
    const socket = _socket;
    console.log("a user connected");
    socket.on("createGame", (roomCode, host) => {
        const game = new Game(roomCode, host);
        games.set(roomCode, game);
    });
    // Create a new player, maybe?
    socket.on("registerPlayer", (roomCode, player) => {
        const game = games.get(roomCode);
        if (!game)
            return;
        if (game.isStarted())
            return;
        if (game.addPlayer(player)) {
            console.log("added player", player);
            io.emit("updatePlayers", game);
        }
        else {
            console.log("player already exists:", player);
        }
    });
});
server.listen(3000, () => console.log("SERVER IS LISTENING!"));
//# sourceMappingURL=main.js.map