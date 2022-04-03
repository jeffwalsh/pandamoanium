<script lang="ts">
  import { onMount } from "svelte";
  import type { Player } from "../domain/game";
  import { currentGame } from "../stores/currentGame";
  import { socket } from "../stores/socket";

  onMount(async () => {});

  $socket.on("updatePlayers", (player: Player, roomCode: string) => {
    if (roomCode !== $currentGame.roomCode) return;
    $currentGame.players.push(player);
  });
</script>

<h2>Room Code {$currentGame?.roomCode}</h2>

<button class="btn btn-primary">Start Game</button>

{#each $currentGame.players as player}
  <img src={player.thumbnail} class="panda cursor-pointer" />
  <p>{player.pandaName}</p>
{/each}
