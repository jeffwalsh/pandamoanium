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

<div class="container">
  <div class="flex">
    <h2 class="grey6">Select a panda as avatar</h2>
  </div>

  <div
    class="grid grid-cols-4 auto-rows-max gap-x-5 gap-y-5 w-auto panda-container"
  >
    {#if pandas}
      {#each pandas as panda}
        <div class="panda-pp rounded-md">
          <img
            src={panda.image}
            class="panda cursor-pointer"
            on:click={async () => await selectPanda(panda)}
          />
          <p class="grey5">{panda.name}</p>
        </div>
      {/each}
    {:else}
      <Loader />
    {/if}
  </div>
</div>

<style>
</style>
