<script lang="ts">
  import { push } from "svelte-spa-router";

  import { currentAddress } from "../stores/currentAddress";

  async function connect() {
    const res = await window.solana.connect();
    console.log(res.publicKey.toString());
    currentAddress.set(res.publicKey);
    await push("/selectPanda");
  }
</script>

{#if $currentAddress}
  <span class="hidden"> Address: {$currentAddress}</span>
{:else}
  <div class="center-content">
  <button class="btn btn-primary" on:click={async () => await connect()}
    >Connect</button
  >
  </div>
{/if}
