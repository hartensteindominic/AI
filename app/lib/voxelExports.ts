type RGB = [number, number, number];
type Cube = { x: number; y: number; z: number; c: RGB };
type VoxelAsset = { id: string; name: string; description: string; cubes: Cube[] };

const encoder = new TextEncoder();

function concatBytes(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function pad4(bytes: Uint8Array) {
  const padded = new Uint8Array((bytes.length + 3) & ~3);
  padded.set(bytes);
  return padded;
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function cubeMesh(asset: VoxelAsset) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const cubeVertices = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ];
  const triangles = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7,
  ];

  let base = 0;
  for (const cube of asset.cubes) {
    for (const [dx, dy, dz] of cubeVertices) {
      positions.push(cube.x + dx, cube.z + dz, -(cube.y + dy));
      colors.push(cube.c[0], cube.c[1], cube.c[2], 255);
    }
    for (const index of triangles) indices.push(base + index);
    base += 8;
  }
  return { positions, colors, indices };
}

export function assetToGltf(asset: VoxelAsset) {
  const { positions, colors, indices } = cubeMesh(asset);
  const positionBytes = new Uint8Array(new Float32Array(positions).buffer);
  const colorBytes = new Uint8Array(colors);
  const indexBytes = new Uint8Array(new Uint32Array(indices).buffer);
  const p0 = pad4(positionBytes);
  const p1 = pad4(colorBytes);
  const p2 = pad4(indexBytes);
  const binary = concatBytes([p0, p1, p2]);

  const xs = positions.filter((_, i) => i % 3 === 0);
  const ys = positions.filter((_, i) => i % 3 === 1);
  const zs = positions.filter((_, i) => i % 3 === 2);
  const min = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
  const max = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];

  const gltf = {
    asset: { version: '2.0', generator: 'Voxel Vault' },
    scene: 0,
    scenes: [{ name: asset.name, nodes: [0] }],
    nodes: [{ name: asset.name, mesh: 0 }],
    meshes: [{ name: asset.name, primitives: [{ attributes: { POSITION: 0, COLOR_0: 1 }, indices: 2, mode: 4, material: 0 }] }],
    materials: [{ name: 'Voxel Colors', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.82 } }],
    buffers: [{ byteLength: binary.length, uri: `data:application/octet-stream;base64,${toBase64(binary)}` }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
      { buffer: 0, byteOffset: p0.length, byteLength: colorBytes.length, target: 34962 },
      { buffer: 0, byteOffset: p0.length + p1.length, byteLength: indexBytes.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5121, normalized: true, count: colors.length / 4, type: 'VEC4' },
      { bufferView: 2, componentType: 5125, count: indices.length, type: 'SCALAR', min: [0], max: [positions.length / 3 - 1] },
    ],
  };

  return encoder.encode(JSON.stringify(gltf));
}

function u32(value: number) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value >>> 0, true);
  return out;
}

function chunk(id: string, content: Uint8Array, children = new Uint8Array()) {
  return concatBytes([encoder.encode(id), u32(content.length), u32(children.length), content, children]);
}

function nearestPaletteIndex(color: RGB, palette: RGB[]) {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const dr = color[0] - palette[i][0];
    const dg = color[1] - palette[i][1];
    const db = color[2] - palette[i][2];
    const distance = dr * dr + dg * dg + db * db;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best + 1;
}

export function assetToVox(asset: VoxelAsset) {
  const minX = Math.min(...asset.cubes.map(c => c.x));
  const minY = Math.min(...asset.cubes.map(c => c.y));
  const minZ = Math.min(...asset.cubes.map(c => c.z));
  const shifted = asset.cubes.map(c => ({ ...c, x: c.x - minX, y: c.y - minY, z: c.z - minZ }));
  const sizeX = Math.max(...shifted.map(c => c.x)) + 1;
  const sizeY = Math.max(...shifted.map(c => c.y)) + 1;
  const sizeZ = Math.max(...shifted.map(c => c.z)) + 1;
  if (sizeX > 256 || sizeY > 256 || sizeZ > 256) throw new Error('VOX asset exceeds 256 voxels on one axis.');

  const palette: RGB[] = [];
  for (const cube of shifted) {
    if (!palette.some(c => c[0] === cube.c[0] && c[1] === cube.c[1] && c[2] === cube.c[2])) {
      if (palette.length < 255) palette.push(cube.c);
    }
  }
  if (!palette.length) palette.push([255, 255, 255]);

  const sizeContent = concatBytes([u32(sizeX), u32(sizeY), u32(sizeZ)]);
  const voxels = new Uint8Array(4 + shifted.length * 4);
  new DataView(voxels.buffer).setUint32(0, shifted.length, true);
  shifted.forEach((cube, i) => {
    const offset = 4 + i * 4;
    voxels[offset] = cube.x;
    voxels[offset + 1] = cube.y;
    voxels[offset + 2] = cube.z;
    voxels[offset + 3] = nearestPaletteIndex(cube.c, palette);
  });

  const rgba = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const color = palette[Math.min(i, palette.length - 1)] || [255, 255, 255];
    rgba[i * 4] = color[0];
    rgba[i * 4 + 1] = color[1];
    rgba[i * 4 + 2] = color[2];
    rgba[i * 4 + 3] = 255;
  }

  const children = concatBytes([
    chunk('SIZE', sizeContent),
    chunk('XYZI', voxels),
    chunk('RGBA', rgba),
  ]);
  return concatBytes([encoder.encode('VOX '), u32(150), chunk('MAIN', new Uint8Array(), children)]);
}
