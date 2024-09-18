<script lang="ts">
  import { onMount } from 'svelte';

  import Renderer from '$lib/renderer';
  import shader from '../shaders/raymarching.wgsl';

  // Pre-baked coordinates to render plane for the raymarching
  // algorithm to use as canvas
  const PLANE_VERTICES = new Float32Array([-1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1]);

  let renderCanvas: HTMLCanvasElement;

  onMount(() => {
    const renderer = new Renderer(renderCanvas);

    renderer.initialize().then(async () => {
      renderer.createVertexBuffer(PLANE_VERTICES);

      const shaderModule = await renderer.createShaderModule(shader);
      console.log();

      renderer.createPipeline(shaderModule);
      requestAnimationFrame((time) => renderer.createRenderingPass(time));
    });
  });
</script>

<main class="flex flex-col justify-center items-center text-white h-screen bg-black">
  <section class="flex flex-col items-center gap-3 text-center">
    <h1 class="text-3xl">iggydev</h1>

    <ul class="flex gap-3.5">
      <li>
        <a href="/blog" class="link">blog (coming eventually)</a>
      </li>
      <li>
        <a href="https://x.com/iggydev" target="_blank" class="link">x dot com</a>
      </li>
      <li>
        <a href="https://github.com/IggyDeveloper" target="_blank" class="link">github</a>
      </li>
    </ul>

    <p class="px-2 sm:w-[40rem] sm:p-0">
      interests are high entropy and extremely temperamental but mostly remain within the realm of
      computer graphics, game dev, startups and at some point ML beyond hosting a llama model
    </p>
  </section>

  <canvas
    class="w-full min-w-[20rem] max-w-[30rem]"
    title="my scuffed implementation of a mandelbulb"
    width="800"
    height="800"
    bind:this={renderCanvas}
  ></canvas>

  <p class="text-neutral-300 text-center px-2 sm:p-0">
    this page has been brought to you as an orchestrated delusion by your mind (sorry I'm in my
    <a href="/wake-up" class="underline decoration-dotted decoration-red-500">solipsism</a> phase)
  </p>
</main>
