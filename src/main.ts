import Renderer from "./renderer";
import "./style.css";
import shader from "./raymarch-shader.wgsl";

// Pre-baked coordinates to render plane for the raymarching
// algorithm to use as canvas
const PLANE_VERTICES = new Float32Array([
  -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1,
]);

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const renderer = new Renderer(canvas);

renderer.initialize().then(async () => {
  renderer.createVertexBuffer(PLANE_VERTICES);

  const shaderModule = await renderer.createShaderModule(shader);
  console.log();

  renderer.createPipeline(shaderModule);
  requestAnimationFrame((time) => renderer.createRenderingPass(time));
});
