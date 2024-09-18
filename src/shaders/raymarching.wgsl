const MAX_TRAVEL_DISTANCE = 30;
const MAX_STEPS = 50;

const EPSILON = 0.001;

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
};

struct Uniforms {
    screenWidth: f32,
    screenHeight: f32,
    mouseX: f32,
    mouseY: f32,
    time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(@location(0) position: vec4f) -> VertexOut {
    var out: VertexOut;
    out.position = position;
    out.uv = 0.5 * (position.xy + 1.0);

    return out;
}

// https://iquilezles.org/articles/smin/
fn smoothMin(a: f32, b: f32, z: f32) -> f32 {
    var k = z * 1.0;
    var r = exp2(-a / k) + exp2(-b / k);
    return -k * log2(r);
}

fn rotateX(theta: f32) -> mat3x3f {
    var c = cos(theta);
    var s = sin(theta);
    return mat3x3f(
        vec3f(1, 0, 0),
        vec3f(0, c, -s),
        vec3f(0, s, c)
    );
}

fn rotateY(theta: f32) -> mat3x3f {
    var c = cos(theta);
    var s = sin(theta);
    return mat3x3f(
        vec3f(c, 0, s),
        vec3f(0, 1, 0),
        vec3f(-s, 0, c)
    );
}

fn rotateZ(theta: f32) -> mat3x3f {
    var c = cos(theta);
    var s = sin(theta);
    return mat3x3f(
        vec3f(c, -s, 0),
        vec3f(s, c, 0),
        vec3f(0, 0, 1)
    );
}

fn calculate_normal(point: vec3f) -> vec3f {
    const differential = vec2f(EPSILON, 0.0);

    var normalVector = vec3f(
        map_scene(point + differential.xyy) - map_scene(point - differential.xyy),
        map_scene(point + differential.yxy) - map_scene(point - differential.yxy),
        map_scene(point + differential.yyx) - map_scene(point - differential.yyx)
    );

    return normalize(normalVector);
}

fn mandelbulb(pos: vec3f, power: f32, bailout: f32, iterations: i32) -> f32 {
    var mouseOffset = vec2f(uniforms.mouseX, uniforms.mouseY) / 10;
    var rotatedPos = rotateY(mouseOffset.x + uniforms.time * 0.2) * rotateX(0.3 + mouseOffset.y) * pos;

    var z = rotatedPos;
    var dr = 2.0;
    var r = 0.0;

    for (var i = 0; i < iterations; i++) {
        r = length(z);
        if r > bailout {
            break;
        }

        var theta = acos(z.z / r);
        var phi = atan2(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;

        var zr = pow(r, power);
        theta *= power;
        phi *= power;

        z = zr * vec3f(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += rotatedPos;
    }
    return 0.5 * log(r) * r / dr;
}

fn map_scene(position: vec3f) -> f32 {
    var power = 5.0 + abs(sin( uniforms.time / 10)) * 8.0;
    return mandelbulb(position, power, 3.0, 4);
}

fn ray_march(rayOrigin: vec3f, rayDirection: vec3f) -> f32 {
    var distanceTraveled = 0.0;

    for (var i = 0; i < MAX_STEPS; i++) {
        var newPosition = rayOrigin + distanceTraveled * rayDirection;
        var signedDistance = map_scene(newPosition);

        if signedDistance < EPSILON {
            break;
        }

        distanceTraveled += signedDistance;

        if distanceTraveled >= MAX_TRAVEL_DISTANCE {
            break;
        }
    }

    return distanceTraveled;
}

@fragment
fn fragmentMain(in: VertexOut) -> @location(0) vec4f {
    var aspect_ratio = uniforms.screenWidth / uniforms.screenHeight;
    var uv = in.uv * 2.0 - 1.0;
    uv.x *= aspect_ratio;

    var color = vec3f(0);

    var rayOrigin = vec3f(0, 0, -1.8);
    var rayDirection = normalize(vec3f(uv, 1));

    var rayMarchDist = ray_march(rayOrigin, rayDirection);
    if rayMarchDist < MAX_TRAVEL_DISTANCE {
        var point = rayOrigin + rayMarchDist * rayDirection;
        var normal = calculate_normal(point) / 4.0;

        color = point * normal * 25;
    }

    return vec4f(color, 1);
}
