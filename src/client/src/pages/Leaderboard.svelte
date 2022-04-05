<script lang="ts">
  import axios from "axios";

  import { onMount } from "svelte";
  import { Player } from "../domain/game";
  let sorted: Player[];

  onMount(async () => {
    const resp = await axios.get<{ data: Player[] }>(
      process.env.SERVER_URL + "/leaderboard"
    );
    const players = resp.data;
    sorted = players.data.sort((a, b) => a.score > b.score);
  });
</script>

{#if sorted}
  <div class="grid grid-rows-1 grid-flow-col max-w-md bg-gray-200 p-2">
    {#each sorted as panda, i}
      <div class="panda-pp rounded-md row-span-full">
        <img src={panda.thumbnail} class="panda-pic cursor-pointer" />
        <p class="grey5">{panda.pandaName}</p>
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
</style>
