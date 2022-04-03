<script lang="ts">
  import * as anchor from "@project-serum/anchor";
  import type { PublicKey } from "@solana/web3.js";
  import { onMount } from "svelte";
  import Loader from "../components/Loader.svelte";
  import { currentAddress } from "../stores/currentAddress";
  import { currentPanda } from "../stores/currentPanda";
  import { getPandasForAddress } from "../utils/getPandasForAddress";
  import type { Panda } from "../utils/getPandasForAddress";
  import { push } from "svelte-spa-router";
  const connection = new anchor.web3.Connection(
    process.env.SOLANA_RPC_HOST as string
  );

  let pandas: Panda[];
  onMount(async () => {
    if (!$currentAddress) {
      await push("/");
    }
    pandas = await getPandasForAddress(
      connection,
      $currentAddress as PublicKey
    );
  });

  async function selectPanda(panda: Panda) {
    currentPanda.set(panda);
    await push("/gameMenu");
  }
</script>


        <div class="flex"> 
          <h2 class="grey6"> Select a panda as avatar </h2>
        </div>



  <div class="grid grid-cols-4 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container">

      {#if pandas}
      {#each pandas as panda}

       <div class ="panda-pp rounded-md">
          <img
            src={panda.image}
            class="panda cursor-pointer"
            on:click={async () => await selectPanda(panda)}
          />
            <p class="grey6"> {panda.name} </p>

        </div>

      {/each}
    {:else}
      <Loader />
    {/if}

  </div>

<style>
.panda-pp img.panda {
max-width: 13rem;
border-radius: 0.25rem
}

.panda-pp p {
  text-align: left;
  font-size: 1rem;
}

h2 {
  font-size: 2rem;
  margin: 35px 0px;

}


.gap-y-5 {
    row-gap: 1.25rem;
}
.gap-x-5 {
    -moz-column-gap: 1.25rem;
    column-gap: 1.25rem;
}
.grid-cols-4.panda-container {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 auto;
}

</style>
