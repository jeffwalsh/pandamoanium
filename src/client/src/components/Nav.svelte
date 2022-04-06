<script>
  import { push } from "svelte-spa-router";

  const { default: Logo } = require("./Logo.svelte");
</script>

<div class="container">
  <div class="nav flex justify-between content-center">
    <div class="logo" on:click={async () => await push("/")}><Logo /></div>
    <div class="leaderboard" on:click={async () => await push("/leaderboard")}>
      Leaderboard
    </div>
  </div>
</div>
