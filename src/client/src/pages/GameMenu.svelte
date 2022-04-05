<script lang="ts">
  import type { PublicKey } from "@solana/web3.js";
  import { currentAddress } from "../stores/currentAddress";
  import { push } from "svelte-spa-router";
  import { currentGame } from "../stores/currentGame";
  import makeid from "../utils/makeRoomCode";
  import { currentPanda } from "../stores/currentPanda";
  import type { Game, Player } from "../domain/game";
  import { socket } from "../stores/socket";

  let roomCode: string;

  async function createLobby() {
    const players: Player[] = [
      {
        address: ($currentAddress as PublicKey).toString(),
        thumbnail: $currentPanda.image,
        pandaName: $currentPanda.name,
        isHost: true,
        score: 0,
      },
    ];

    const game: Game = {
      roomCode: makeid(5),
      players: players,
      playerOrder: [],
      finished: false,
      correctPlayersThisRound: [],
    };

    $socket.emit("createGame", game);
    currentGame.set(game);
    await push("/lobby");
  }

  async function joinLobby() {
    $socket.on("joinedGame", async (info: { game: Game }) => {
      console.log("joined game!", info.game);
      currentGame.set(info.game);
      await push("/lobby");
    });

    $socket.emit("joinGame", {
      roomCode: roomCode,
      player: {
        address: ($currentAddress as PublicKey).toString(),
        thumbnail: $currentPanda.image,
        pandaName: $currentPanda.name,
        isHost: false,
        score: 0,
      },
    });
  }
</script>

<div class="container">
  <div class="flex flex-col">
    <h2 class="grey6">Game Menu</h2>
  </div>
  <div
    class="grid grid-cols-4 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container"
  >
    <div class="panda-pp rounded-md">
      <img
        src={$currentPanda.image}
        class="panda cursor-pointer"
        on:click={async () => await createLobby()}
      />

      <p>{$currentPanda.name}</p>

      <p>{$currentPanda.name}</p>
    </div>
  </div>

  <div class="game-lobby my-10">
    <div class="game-lobby-inner">
      <button class="btn btn-primary" on:click={async () => await createLobby()}
        >Create a New Lobby</button
      >
    </div>

    <span class="or"> Or </span>

    <div class="game-lobby-inner">
      <input type="text" placeholder="Enter Room Code" bind:value={roomCode} />
      <button class="btn btn-yellow" on:click={async () => await joinLobby()}
        >Join Room
      </button>
    </div>
  </div>
</div>

<style>
  /* img.panda {
  max-width: 50%;
} */

  input[type="text"] {
    padding: 12px 22px;
    border-radius: 0.5rem;
    background: #000;
    border: 1px solid #f8f83b;
  }

  .btn.btn-yellow {
    background: #f8f83b;
    font-size: 14px;
    color: #000;
  }

  .btn.btn-yellow:hover {
    background: #ffff0c;
  }

  input[type="text"]:focus {
    border: 1px solid #ffff0c;
    outline: #ffff0c;
  }

  .game-lobby-inner {
    margin: 10px 0px;
  }

  .game-lobby-inner input {
    min-width: 280px;
    padding: 11px 22px 13px 22px;
  }

  .game-lobby-inner .btn.btn-yellow {
    margin-left: -115px;
  }

  span.or {
    display: block;
    text-align: center;
    max-width: 270px;
    font-weight: 700;
    font-size: 14px;
    color: #828282;
  }

  .my-10 {
    margin-top: 30px;
  }

  @media (max-width: 600px) {
    span.or {
      max-width: 470px;
    }
  }
</style>
