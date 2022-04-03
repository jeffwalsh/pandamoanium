type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
};

type Game = {
  players: Player[];
  roomCode: string;
};

export type { Player, Game };
