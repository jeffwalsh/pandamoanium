type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
};

type Game = {
  players: Player[];
  playerOrder: Player[];
  roomCode: string;
  finished: boolean;
  correctPlayersThisRound: Player[];
};

export type { Player, Game };
