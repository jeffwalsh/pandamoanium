<script lang="ts">
  import axios from "axios";

  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import type { Player } from "../domain/game";
  let sorted: Player[];

  onMount(async () => {
    const resp = await axios.get<{ data: Player[] }>(
      process.env.SERVER_URL + "/leaderboard"
    );
    const players = resp.data;
    sorted = players.data.sort((a, b) => b.score - a.score);
  });
</script>

<button class="btn btn-primary" on:click={async () => await push("/")}
  >Back</button
>
{#if sorted}
  <div class="grid grid-rows-1 max-w-md bg-gray-200 p-2">
    {#each sorted as panda, i}
      <div class="row-span-full">
        <p class="black">{i}:</p>
        <img src={panda.thumbnail} class="panda-pic cursor-pointer" />
        <p class="black">{panda.pandaName}</p>
        <p class="red">Score: {panda.score}</p>
      </div>
    {/each}
  </div>
{/if}

<style>
  .panda-pic {
    height: 120px;
    width: 120px;
  }

  .black {
    color: black;
  }
  .red {
    color: red;
  }
</style>
