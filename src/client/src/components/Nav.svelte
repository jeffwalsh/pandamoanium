<script>
const { default: Logo }=require("./Logo.svelte");

</script>

<div class="container">
    <div class="nav flex justify-between content-center">
      <div class="logo" on:click={async () => await push("/")}> <Logo/>  </div>
      <div class="leaderboard" on:click={async () => await leaderboard()}> Leaderboard </div>
    </div>
  </div>