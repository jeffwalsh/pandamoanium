import "vm";
export class Game {
    players = {};
    roomCode;
    started;
    constructor(roomCode, host) {
        this.roomCode = roomCode;
        this.players[host.address] = host;
        this.started = false;
    }
    addPlayer = (player) => this.playerExists(player.address) ? false : this.createNewPlayer(player);
    isStarted = () => this.started;
    playerExists = (address) => address in this.players;
    createNewPlayer(player) {
        this.players[player.address] = player;
        return true;
    }
}
//# sourceMappingURL=game.js.map