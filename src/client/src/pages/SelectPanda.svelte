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

{#if pandas}
  {#each pandas as panda}
    <img
      src={panda.image}
      class="panda cursor-pointer"
      on:click={async () => await selectPanda(panda)}
    />
    <p>{panda.name}</p>
  {/each}
{:else}
  <Loader />
{/if}

<style>
  .panda {
    height: 200px;
    width: 200px;
  }
</style>
