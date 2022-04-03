export class Game {
    players;
    roomCode;
    started;
    constructor(roomCode, host) {
        this.roomCode = roomCode;
        this.players = [host];
        this.started = false;
    }
    addPlayer = (player) => this.playerExists(player.address) ? false : this.createNewPlayer(player);
    isStarted = () => this.started;
    playerExists = (address) => 
    // this.players.find((p) => (p.address = address));
    false;
    createNewPlayer(player) {
        this.players.push(player);
        return true;
    }
}
//# sourceMappingURL=game.js.map