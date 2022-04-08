<script lang="ts">
  import { push } from "svelte-spa-router";
  import Logo from "../components/Logo.svelte";
  import Nav from "../components/Nav.svelte";

  import { currentAddress } from "../stores/currentAddress";

  async function connect() {
    const res = await window.solana.connect();
    currentAddress.set(res.publicKey);
    await push("/selectPanda");
  }
</script>

{#if $currentAddress}
  <span class="hidden"> Address: {$currentAddress}</span>
{:else}
  <Nav />

  <div class="container">
    <div class="center-content flex-col">
      <h1 class="text-animation">pandaMOANium</h1>
      <p>
        Play the stupid ass game that the stupid ass devs made for the stupid
        ass community
      </p>
      <button class="btn btn-primary" on:click={async () => await connect()}
        >Connect</button
      >
    </div>
  </div>
{/if}

<!-- <div class="audio">
  <audio controls autoplay>
    <source src="images/cgod.mp3" type="audio/mpeg" />
  </audio>
</div> -->

<style>
  h1 {
    font-size: 7vw;
    font-weight: 800;
    line-height: 9.5vw;
  }

  .text-animation {
    text-align: center;
    background: linear-gradient(
      to right,
      #fff 20%,
      #ff0 40%,
      #ff0 60%,
      #fff 80%
    );
    background-size: 200% auto;
    color: #000;
    background-clip: text;
    text-fill-color: transparent;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 1s linear infinite;
  }
  @keyframes shine {
    to {
      background-position: 200% center;
    }
  }

  p {
    font-size: 18px;
    text-align: center;
    max-width: 50%;
    margin: -10px 0px 35px 0px;
  }

  .center-content.flex-col {
    margin-top: -60px;
  }

  @media (max-width: 600px) {
    p {
      max-width: 100%;
      margin-top: 4px;
    }
  }

  .audio {
    position: absolute;
    right: 40px;
    bottom: 40px;
    opacity: 30%;
  }
</style>
