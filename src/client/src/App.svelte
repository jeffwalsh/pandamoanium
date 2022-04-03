<script lang="ts">
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import Nomination from "./Nomination.svelte";
  import Connect from "./pages/Connect.svelte";
  import GameMenu from "./pages/GameMenu.svelte";
  import Lobby from "./pages/Lobby.svelte";
  import SelectPanda from "./pages/SelectPanda.svelte";

  const routes = {
    "/": wrap({
      component: Connect,
    }),
    "/n": wrap({
      component: Nomination,
    }),
    "/selectPanda": wrap({
      component: SelectPanda,
    }),
    "/gameMenu": wrap({
      component: GameMenu,
    }),
    "/lobby": wrap({
      component: Lobby,
    }),
  };
</script>

<div class="center-screen">
  <Router {routes} />
</div>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  /* purgecss end ignore */
  @tailwind utilities;

  html,
  body {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0px;
    padding: 0px;
    background-color: rgba(0, 0, 0, 0.534);
  }

  .center-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
  }

  body {
    background-image: url("images/doingeverything.png");
    background-repeat: no-repeat;
    background-size: auto;
    /* padding: 8px; */
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;

    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: hidden;
  }

  .panda {
    height: 200px;
    width: 200px;
  }
</style>
