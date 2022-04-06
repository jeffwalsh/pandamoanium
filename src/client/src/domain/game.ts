type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
  score: number;
};

type Game = {
  players: Player[];
  playerOrder: Player[];
  roomCode: string;
  finished: boolean;
  correctPlayersThisRound: Player[];
  currentWord: string;
};

export type { Player, Game };
