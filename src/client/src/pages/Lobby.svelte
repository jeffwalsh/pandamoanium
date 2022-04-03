<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import type { Player } from "../domain/game";
  import { currentAddress } from "../stores/currentAddress";
  import { currentGame } from "../stores/currentGame";
  import { socket } from "../stores/socket";

  let isHost: boolean = false;
  onMount(() => {
    console.log($currentGame);
    if (
      $currentGame.players.find(
        (p) => p.address === $currentAddress?.toString() && p.isHost
      )
    ) {
      isHost = true;
    }

    $socket.on(
      "updatePlayers",
      (info: { player: Player; roomCode: string }) => {
        console.log(
          "update players",
          info.player,
          info.roomCode,
          $currentGame.roomCode
        );
        if (info.roomCode !== $currentGame.roomCode) return;
        const game = $currentGame;

        game.players.push(info.player);
        currentGame.set(game);
      }
    );

    $socket.on("startedGame", (info: { roomCode: string }) => {
      if (info.roomCode !== $currentGame.roomCode) return;

      push("/game");
    });
  });

  function startGame() {
    $socket.emit("startGame", $currentGame.roomCode);
  }
</script>

<h2>Room Code {$currentGame?.roomCode}</h2>

{#if isHost}
  <button class="btn btn-primary" on:click={startGame}>Start Game</button>
{/if}

{#each $currentGame.players as player}
  <img src={player.thumbnail} class="panda cursor-pointer" />
  <p>{player.pandaName}</p>
{/each}
