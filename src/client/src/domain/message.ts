import type { Player } from "./game";

export type Message = {
  player: Player;
  text: string;
  isCorrect: boolean;
};
