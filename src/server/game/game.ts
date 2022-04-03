export type Player = {
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

export const createNewPlayer = (game: Game, player: Player) => {
  game.players.push(player);
  return true;
};

export const addPlayerToGame = (game: Game, player: Player) => {
  if (game.players.find((p) => p.address === player.address)) return false;

  return createNewPlayer(game, player);
};
