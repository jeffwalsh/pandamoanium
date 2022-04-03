type Player = {
  address: string;
  pandaName: string;
  thumbnail: string;
  isHost?: boolean;
};

export class Game {
  players: Player[];
  roomCode: string;
  private started: boolean;

  constructor(roomCode: string, host: Player) {
    this.roomCode = roomCode;
    this.players = [host];
    this.started = false;
  }

  addPlayer = (player: Player) =>
    this.playerExists(player.address) ? false : this.createNewPlayer(player);

  isStarted = () => this.started;

  private playerExists = (address: string) =>
    // this.players.find((p) => (p.address = address));
    false;
  private createNewPlayer(player: Player) {
    this.players.push(player);
    return true;
  }
}
