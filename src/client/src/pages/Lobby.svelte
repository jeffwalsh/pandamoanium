<script lang="ts">
  import { onMount } from "svelte";
  import { currentGame } from "../stores/currentGame";

  onMount(async () => {});
</script>

<h2>Room Code {$currentGame?.roomCode}</h2>

<button class="btn btn-primary">Start Game</button>
