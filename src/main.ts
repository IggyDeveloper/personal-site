import Renderer from "./renderer";

// Pre-baked coordinates to render plane for the raymarching
// algorithm to use as canvas
const PLANE_VERTICES = new Float32Array([
  -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1,
]);

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const renderer = new Renderer(canvas);

renderer.initialize().then(async () => {
  renderer.createVertexBuffer(PLANE_VERTICES);

  const shaderModule = await renderer.loadShaderFromFile(
    "/src/raymarch-shader.wgsl"
  );

  renderer.createPipeline(shaderModule);
  requestAnimationFrame((time) => renderer.createRenderingPass(time));
});
