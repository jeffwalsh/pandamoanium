export type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
  score?: number;
};

export class Game {
  players: Player[];
  roomCode: string;
  started: boolean;
  currentWord: string;

  constructor(roomCode: string, host: Player) {
    this.roomCode = roomCode;
    this.players = [host];
    this.started = false;
    this.currentWord = "";
  }
}

export const addPlayerToGame = (game: Game, player: Player) => {
  player.score = 0;
  game.players.push(player);
  return true;
};
