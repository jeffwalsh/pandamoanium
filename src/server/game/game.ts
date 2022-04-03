type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
};

export class Game {
  players: Player[];
  roomCode: string;
  started: boolean;

  constructor(roomCode: string, host: Player) {
    this.roomCode = roomCode;
    this.players = [host];
    this.started = false;
  }
}

export const addPlayerToGame = (game: Game, player: Player) => {
  game.players.push(player);
  return true;
};
