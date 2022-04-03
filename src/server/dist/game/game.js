export class Game {
    players;
    roomCode;
    started;
    constructor(roomCode, host) {
        this.roomCode = roomCode;
        this.players = [host];
        this.started = false;
    }
}
export const createNewPlayer = (game, player) => {
    game.players.push(player);
    return true;
};
export const addPlayerToGame = (game, player) => {
    if (game.players.find((p) => p.address === player.address))
        return false;
    return createNewPlayer(game, player);
};
//# sourceMappingURL=game.js.map