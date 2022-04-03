<script lang="ts">
  import * as anchor from "@project-serum/anchor";
  import type { PublicKey } from "@solana/web3.js";
  import { onMount } from "svelte";
  import Loader from "../components/Loader.svelte";
  import { currentAddress } from "../stores/currentAddress";
  import { SOLANA_RPC_HOST } from "../utils/constants";
  import { getPandasForAddress } from "../utils/getPandasForAddress";
  import type { Panda } from "../utils/getPandasForAddress";
  import { push } from "svelte-spa-router";
  const connection = new anchor.web3.Connection(SOLANA_RPC_HOST);

  let pandas: Panda[];
  onMount(async () => {
    if (!$currentAddress) {
      await push("/");
    }
    pandas = await getPandasForAddress(
      connection,
      $currentAddress as PublicKey
    );
    console.log(pandas);
  });

  function selectPanda() {}
</script>

{#if pandas}
  {#each pandas as panda}
    <img src={panda.image} class="panda" on:click={selectPanda} />
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
