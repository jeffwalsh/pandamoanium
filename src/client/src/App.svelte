<script lang="ts">
  import Router from "svelte-spa-router";
  import { wrap } from "svelte-spa-router/wrap";
  import Nomination from "./Nomination.svelte";
  import Connect from "./pages/Connect.svelte";

  const routes = {
    "/": wrap({
      component: Connect,
    }),
    "/n": wrap({
      component: Nomination,
    }),
  };
</script>

<Router {routes} />

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  /* purgecss end ignore */
  @tailwind utilities;
</style>
