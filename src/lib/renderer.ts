/*
Quickly thrown together due to time constraints, purely for my personal site. 
The only geometric object the renderer will have to display is a plane for the raymarching 
shader to be displayed on.

Not intended to be used for anything besides the raymarching shader.
*/

// Allocates enough for this purpose
const GLOBAL_BUFFER_SIZE = 128;

// Magic value for now, won't change either way as the scene
// won't contain more geometric objects
const VERTEX_COUNT = 6;

export default class Renderer {
  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private format!: GPUTextureFormat;

  private uniformBindGroup?: GPUBindGroup;
  private uniformBuffer?: GPUBuffer;

  private vertexBuffers: GPUBuffer[] = [];
  private pipeline?: GPURenderPipeline;

  private mouseX = 0;
  private mouseY = 0;

  constructor(private canvas: HTMLCanvasElement) {}

  public async initialize() {
    const context = this.canvas.getContext('webgpu');

    if (!context) {
      throw new Error('WebGPU not supported');
    }

    this.context = context;

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
    });

    if (!adapter) {
      throw new Error('Failed to retrieve GPU adapter');
    }

    const device = await adapter.requestDevice();
    const format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device,
      format
    });

    this.device = device;
    this.format = format;

    this.registerMouseMovement();
  }

  // For camera movement and potential other shader interactions
  private registerMouseMovement() {
    document.addEventListener('mousemove', (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    });
  }

  public async createShaderModule(code: string) {
    return this.device.createShaderModule({ code });
  }

  public createPipeline(shaderModule: GPUShaderModule) {
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 8, // each vertex is represented using two float32s = 4 bytes * 2
            attributes: [
              {
                shaderLocation: 0,
                format: 'float32x2',
                offset: 0
              }
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: this.format }]
      }
    });

    this.createUniformBuffer();
  }

  // Responsible for passing through external variables to the shader
  // such as the mouse coordinates, screen resolution, etc.
  private createUniformBuffer() {
    this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' }
        }
      ]
    });

    this.uniformBuffer = this.device.createBuffer({
      size: GLOBAL_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.uniformBindGroup = this.device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer }
        }
      ]
    });
  }

  public createVertexBuffer(data: Float32Array) {
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    this.vertexBuffers.push(buffer);

    return buffer;
  }

  public createRenderingPass(time: number) {
    if (!this.pipeline || !this.uniformBuffer || !this.uniformBindGroup) {
      throw new Error('Pipeline missing, create a pipeline before attempting to render');
    }

    const commandEncoder = this.device.createCommandEncoder();

    const screenWidth = this.canvas.clientWidth;
    const screenHeight = this.canvas.clientHeight;

    const uniformParams = new Float32Array([
      screenWidth,
      screenHeight,
      this.mouseX / screenWidth,
      this.mouseY / screenHeight,
      time / 1000 // ms to seconds
    ]);

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      uniformParams.buffer,
      uniformParams.byteOffset,
      uniformParams.byteLength
    );

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store'
        }
      ]
    });

    passEncoder.setPipeline(this.pipeline);

    for (const [i, buffer] of this.vertexBuffers.entries()) {
      passEncoder.setVertexBuffer(i, buffer);
    }

    passEncoder.setBindGroup(0, this.uniformBindGroup);
    passEncoder.draw(VERTEX_COUNT);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame((frame) => this.createRenderingPass(frame));
  }
}
