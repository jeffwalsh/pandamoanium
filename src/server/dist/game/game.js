"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPlayerToGame = exports.Game = void 0;
class Game {
    players;
    roomCode;
    started;
    currentWord;
    playerOrder;
    constructor(roomCode, host) {
        this.roomCode = roomCode;
        this.players = [host];
        this.started = false;
        this.currentWord = "";
        this.playerOrder = [];
    }
}
exports.Game = Game;
const addPlayerToGame = (game, player) => {
    player.score = 0;
    game.players.push(player);
    return true;
};
exports.addPlayerToGame = addPlayerToGame;
//# sourceMappingURL=game.js.map