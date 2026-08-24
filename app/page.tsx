'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

type VoxelModel = {
  size: number;
  pixels: Uint8ClampedArray;
  name: string;
};

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL || '';
const GRID = 28;

function shade(v: number, amount: number) {
  return Math.max(0, Math.min(255, Math.round(v * amount)));
}

function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  depth: number,
  r: number,
  g: number,
  b: number,
) {
  const dx = s * 0.48;
  const dy = s * 0.28;
  const h = depth;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + dx, y - dy - h);
  ctx.lineTo(x, y - 2 * dy - h);
  ctx.lineTo(x - dx, y - dy - h);
  ctx.closePath();
  ctx.fillStyle = `rgb(${shade(r, 1.08)},${shade(g, 1.08)},${shade(b, 1.08)})`;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy - h);
  ctx.lineTo(x, y - 2 * dy - h);
  ctx.lineTo(x, y - 2 * dy);
  ctx.lineTo(x - dx, y - dy);
  ctx.closePath();
  ctx.fillStyle = `rgb(${shade(r, 0.72)},${shade(g, 0.72)},${shade(b, 0.72)})`;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + dx, y - dy - h);
  ctx.lineTo(x, y - 2 * dy - h);
  ctx.lineTo(x, y - 2 * dy);
  ctx.lineTo(x + dx, y - dy);
  ctx.closePath();
  ctx.fillStyle = `rgb(${shade(r, 0.88)},${shade(g, 0.88)},${shade(b, 0.88)})`;
  ctx.fill();
}

function renderModel(canvas: HTMLCanvasElement, model: VoxelModel) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = canvas.clientWidth || 720;
  const height = canvas.clientHeight || 620;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.43, 20, width * 0.5, height * 0.45, width * 0.52);
  gradient.addColorStop(0, 'rgba(125,255,193,.15)');
  gradient.addColorStop(1, 'rgba(5,8,7,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const n = model.size;
  const block = Math.min(width / (n * 0.95), height / (n * 0.55));
  const originX = width / 2;
  const originY = height * 0.76;

  for (let row = 0; row < n; row++) {
    for (let col = n - 1; col >= 0; col--) {
      const i = (row * n + col) * 4;
      const r = model.pixels[i];
      const g = model.pixels[i + 1];
      const b = model.pixels[i + 2];
      const a = model.pixels[i + 3];
      if (a < 28) continue;
      const brightness = (r + g + b) / 765;
      const depth = block * (0.7 + (1 - brightness) * 2.7);
      const x = originX + (col - row) * block * 0.48;
      const y = originY - (col + row) * block * 0.28;
      drawCube(ctx, x, y, block, depth, r, g, b);
    }
  }
}

function cubeMesh(model: VoxelModel) {
  const vertices: string[] = [];
  const faces: string[] = [];
  let vertexCount = 0;
  const n = model.size;

  const addCube = (x: number, y: number, z: number, h: number, r: number, g: number, b: number) => {
    const base = vertexCount;
    const pts = [
      [x, y, z], [x + 1, y, z], [x + 1, y + 1, z], [x, y + 1, z],
      [x, y, z + h], [x + 1, y, z + h], [x + 1, y + 1, z + h], [x, y + 1, z + h],
    ];
    for (const p of pts) vertices.push(`${p[0]} ${p[1]} ${p[2]} ${r} ${g} ${b}`);
    const quads = [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[4,0,3,7]];
    for (const q of quads) faces.push(`4 ${q.map(v => v + base).join(' ')}`);
    vertexCount += 8;
  };

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4;
      const r = model.pixels[i];
      const g = model.pixels[i + 1];
      const b = model.pixels[i + 2];
      const a = model.pixels[i + 3];
      if (a < 28) continue;
      const brightness = (r + g + b) / 765;
      addCube(x - n / 2, n / 2 - y, 0, 0.8 + (1 - brightness) * 2.7, r, g, b);
    }
  }

  const header = [
    'ply', 'format ascii 1.0',
    `element vertex ${vertices.length}`,
    'property float x', 'property float y', 'property float z',
    'property uchar red', 'property uchar green', 'property uchar blue',
    `element face ${faces.length}`,
    'property list uchar int vertex_indices', 'end_header',
  ].join('\n');
  return `${header}\n${vertices.join('\n')}\n${faces.join('\n')}\n`;
}

export default function Home() {
  const [model, setModel] = useState<VoxelModel | null>(null);
  const [status, setStatus] = useState('Upload one photo to start.');
  const [paid, setPaid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPaid(new URLSearchParams(window.location.search).get('paid') === '1');
  }, []);

  useEffect(() => {
    if (!model || !canvasRef.current) return;
    renderModel(canvasRef.current, model);
    const redraw = () => canvasRef.current && renderModel(canvasRef.current, model);
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [model]);

  const loadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Please choose an image file.');
      return;
    }
    setStatus('Building your voxel…');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const temp = document.createElement('canvas');
        temp.width = GRID;
        temp.height = GRID;
        const ctx = temp.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, GRID, GRID);
        const scale = Math.max(GRID / img.width, GRID / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (GRID - w) / 2, (GRID - h) / 2, w, h);
        const data = ctx.getImageData(0, 0, GRID, GRID);
        setModel({ size: GRID, pixels: data.data, name: file.name.replace(/\.[^.]+$/, '') || 'voxel' });
        setStatus('Voxel ready. Preview it, then download the 3D model.');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const download = () => {
    if (!model) return;
    if (!paid && CHECKOUT_URL) {
      window.location.href = CHECKOUT_URL;
      return;
    }
    const blob = new Blob([cubeMesh(model)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${model.name}-voxel.ply`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <header className="topbar">
        <a className="logo" href="#top">VOXEL VAULT</a>
        <span>ONE PHOTO → ONE VOXEL</span>
      </header>

      <section className="hero" id="top">
        <div className="copy">
          <span className="kicker">INSTANT CUSTOM 3D VOXEL</span>
          <h1>Turn your photo into a <em>downloadable voxel.</em></h1>
          <p>Upload one image. We turn it into a colorful block-built 3D model you can download and open in Blender or other 3D software.</p>
          <div className="priceLine"><strong>$9.99</strong><span>one model · one download · no subscription</span></div>
          <label className="upload primary">
            <input type="file" accept="image/*" onChange={loadPhoto} />
            {model ? 'Choose another photo' : 'Upload photo →'}
          </label>
          <div className="trust"><span>✓ No crypto</span><span>✓ No account</span><span>✓ Real .PLY 3D file</span></div>
        </div>

        <div className="studio">
          <div className="studioTop"><span>LIVE VOXEL PREVIEW</span><i>{model ? 'READY' : 'WAITING FOR PHOTO'}</i></div>
          {model ? <canvas ref={canvasRef} className="preview" /> : <div className="emptyPreview"><div className="demoCube"><b/><b/><b/><b/><b/><b/><b/><b/><b/></div><p>Your voxel appears here.</p></div>}
          <div className="studioBottom"><span>{status}</span><button disabled={!model} onClick={download}>{CHECKOUT_URL && !paid ? 'Buy & download — $9.99' : 'Download .PLY →'}</button></div>
        </div>
      </section>

      <section className="proof">
        <article><b>01</b><h2>Upload</h2><p>Pick a face, pet, product, character, logo, or object.</p></article>
        <article><b>02</b><h2>Voxelize</h2><p>The image is sampled into hundreds of colored 3D blocks with depth.</p></article>
        <article><b>03</b><h2>Download</h2><p>Save one real polygonal .PLY voxel model to your device.</p></article>
      </section>

      <section className="bottomCta">
        <div><span className="kicker">THAT'S THE WHOLE PRODUCT</span><h2>One amazing voxel. Nothing complicated.</h2></div>
        <label className="upload secondary"><input type="file" accept="image/*" onChange={loadPhoto} />Make my voxel — $9.99</label>
      </section>

      <footer><b>VOXEL VAULT</b><span>Instant custom voxel models.</span></footer>
    </main>
  );
}
