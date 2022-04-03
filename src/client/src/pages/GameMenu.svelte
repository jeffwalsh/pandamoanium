<script lang="ts">
  import type { PublicKey } from "@solana/web3.js";
  import { currentAddress } from "../stores/currentAddress";
  import { push } from "svelte-spa-router";
  import { currentGame } from "../stores/currentGame";
  import makeid from "../utils/makeRoomCode";
  import { currentPanda } from "../stores/currentPanda";
  import io from "socket.io-client";
  import type { Game, Player } from "../domain/game";

  const socket = io();

  let roomCode: string;

  async function createLobby() {
    const players: Record<string, Player> = {};
    players[($currentAddress as PublicKey).toString()] = {
      address: ($currentAddress as PublicKey).toString(),
      thumbnail: $currentPanda.image,
      pandaName: $currentPanda.name,
      isHost: true,
    };

    const game: Game = {
      roomCode: makeid(5),
      players: players,
    };

    socket.emit("createGame", game);
    currentGame.set(game);
    await push("/lobby");
  }

  async function joinLobby() {}
</script>

<img
  src={$currentPanda.image}
  class="panda cursor-pointer"
  on:click={async () => await createLobby()}
/>
<p>{$currentPanda.name}</p>

<button class="btn btn-primary" on:click={async () => await createLobby()}
  >Create a New Lobby</button
>
or

<input type="text" placeholder="Enter Room Code" bind:value={roomCode} />
<button class="btn btn-primary" on:click={async () => await joinLobby()}
  >Join Room
</button>

<style>
  .panda {
    height: 200px;
    width: 200px;
  }
</style>
