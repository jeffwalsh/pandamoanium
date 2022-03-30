<script lang="ts">
  import { currentAddress } from "../stores/currentAddress";

  async function connect() {
    const res = await window.solana.connect();
    console.log(res.publicKey.toString());
    currentAddress.set(res.publicKey.toString());
  }
</script>

{#if $currentAddress}
  <span class="hidden"> Address: {$currentAddress}</span>
{:else}
  <button class="btn btn-primary" on:click={async () => await connect()}
    >Connect</button
  >
{/if}
