<script lang="ts">
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import Nomination from "./Nomination.svelte";
  import Connect from "./pages/Connect.svelte";
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
  };
</script>

<Router {routes} />

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
</style>
