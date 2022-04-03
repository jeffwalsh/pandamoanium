import { runInNewContext } from "vm";

type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
};

export class Game {
  players: Record<string, Player> = {};
  roomCode: string;
  private started: boolean;

  constructor(roomCode: string, host: Player) {
    this.roomCode = roomCode;
    this.players[host.address] = host;
    this.started = false;
  }

  addPlayer = (player: Player) =>
    this.playerExists(player.address) ? false : this.createNewPlayer(player);

  isStarted = () => this.started;

  private playerExists = (address: string) => address in this.players;
  private createNewPlayer(player: Player) {
    this.players[player.address] = player;
    return true;
  }
}
