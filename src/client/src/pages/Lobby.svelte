<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
import Nav from "../components/Nav.svelte";
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

<Nav/>

<div class="container">
  <div class="flex flex-col game-lobby-head">
    <h2 class="grey6">Game Lobby</h2>
    <h3>
      Room Code: <span class="text-animation"> {$currentGame?.roomCode} </span>
    </h3>
  </div>

  <div class="flex start-game">
    {#if isHost}
      <button class="btn btn-primary" on:click={startGame}>Start Game</button>
    {/if}
  </div>

  <div
    class="grid grid-cols-4 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container"
  >
    {#each $currentGame.players as player}
      <div class="panda-pp rounded-md">
        <img alt="Panda Profile" src={player.thumbnail} class="panda" />
        <p class="grey5">{player.pandaName}</p>
      </div>
    {/each}
  </div>
</div>

<style>
  h3 {
    color: #9da2ad;
    margin: -28px 0px 8px 0px;
  }

  .start-game {
    margin: 10px 0px 29px 0px;
  }

  @media (max-width: 600px) {
    h3 {
      color: #9da2ad;
      margin: 0px;
    }
  }
</style>
