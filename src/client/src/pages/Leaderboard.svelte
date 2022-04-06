<script lang="ts">
  import axios from "axios";

  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
import Nav from "../components/Nav.svelte";
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

<Nav/>

<div class="container">

  <div class="flex flex-col game-lobby-head">
    <!-- <button class="btn btn-primary" on:click={async () => await push("/")}
      >Back</button> -->
      <h2 class="grey6">Leaderboard</h2>
  </div>

{#if sorted}
<div
class="grid grid-cols-6 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container"
>
    {#each sorted as panda, i}
       <div class="panda-pp rounded-md">
        <p class="rank">#{i}</p>
        <img src={panda.thumbnail} class="panda" />
        <p class="panda-title">{panda.pandaName}</p>
        <p class="score">Score: {panda.score}</p>
      </div>
    {/each}
  </div>
{/if}

</div>

<style>

.panda  {
  max-width: 90%;
}

  .grid.grid-cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  p.score {
    font-size: 1rem;
    font-weight: 600;
    line-height: 20px;
  }

  p.panda-title {
    font-size: 0.83rem;
    font-weight: 500;
    margin: 8px 0px 0px 0px;
  }

  .panda-pp {
    position: relative;
}

  p.rank {
    font-size: 1rem;
    font-weight: 900;
    background: #F8F83B;
    color: #000;
    border-radius: 2px;
    padding: 2px 6px;
    position: absolute;
}

@media (max-width: 600px) {
  .grid.grid-cols-6 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

}

</style>
