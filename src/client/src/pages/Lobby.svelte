<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import type { Player } from "../domain/game";
  import { currentAddress } from "../stores/currentAddress";
  import { currentGame } from "../stores/currentGame";
  import { currentPanda } from "../stores/currentPanda";
  import { socket } from "../stores/socket";

  let isHost: boolean = false;
  onMount(async () => {
    if (!$currentPanda || !$currentGame) {
      await push("/");
    }

    if (
      $currentGame.players.find(
        (p) => p.pandaName === $currentPanda.name && p.isHost
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

    $socket.on(
      "startedGame",
      (info: { roomCode: string; playerOrder: Player[] }) => {
        if (info.roomCode !== $currentGame.roomCode) return;
        const game = $currentGame;
        game.playerOrder = info.playerOrder;
        currentGame.set(game);

        push("/game");
      }
    );
  });

  function startGame() {
    $socket.emit("startGame", $currentGame.roomCode);
  }
</script>

<h2>Room Code {$currentGame?.roomCode}</h2>

{#if isHost}
  <button class="btn btn-primary" on:click={startGame}>Start Game</button>
{/if}

<div
  class="grid grid-cols-4 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container"
>
  {#each $currentGame.players as player}
    <div class="panda-pp rounded-md">
      <img src={player.thumbnail} class="panda" />
      <p class="grey5">{player.pandaName}</p>
    </div>
  {/each}
</div>
