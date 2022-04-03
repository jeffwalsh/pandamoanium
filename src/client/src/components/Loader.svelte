<script lang="ts">
  import { LottiePlayer } from "@lottiefiles/svelte-lottie-player";

  export let height: number = 128;
  export let width: number = 128;
</script>

<div class="flex justify-center items-center">
  <LottiePlayer
    src="images/loader.json"
    autoplay={true}
    loop={true}
    controls={false}
    renderer="svg"
    background="transparent"
    {height}
    {width}
    controlsLayout={[]}
  />
</div>
