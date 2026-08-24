'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

type RGB = [number, number, number];
type Cube = { x: number; y: number; z: number; c: RGB };
type Asset = { id: string; name: string; description: string; cubes: Cube[] };

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL || '';
const DEFAULT_THEME = 'enchanted forest adventure';

function hashText(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number) { return Math.max(0, Math.min(255, Math.round(v))); }
function mix(a: RGB, b: RGB, t: number): RGB { return [clamp(a[0] + (b[0] - a[0]) * t), clamp(a[1] + (b[1] - a[1]) * t), clamp(a[2] + (b[2] - a[2]) * t)]; }

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let p: [number, number, number] = [0, 0, 0];
  if (h < 60) p = [c, x, 0]; else if (h < 120) p = [x, c, 0]; else if (h < 180) p = [0, c, x]; else if (h < 240) p = [0, x, c]; else if (h < 300) p = [x, 0, c]; else p = [c, 0, x];
  return [clamp((p[0] + m) * 255), clamp((p[1] + m) * 255), clamp((p[2] + m) * 255)];
}

function themePalette(theme: string): RGB[] {
  const seed = hashText(theme || DEFAULT_THEME);
  const hue = seed % 360;
  return [hslToRgb(hue, .68, .52), hslToRgb((hue + 42) % 360, .72, .58), hslToRgb((hue + 184) % 360, .56, .42), hslToRgb((hue + 318) % 360, .62, .66), [111,78,55], [218,226,222]];
}

function add(cubes: Cube[], x: number, y: number, z: number, c: RGB) { cubes.push({ x, y, z, c }); }
function box(cubes: Cube[], x0: number, y0: number, z0: number, w: number, d: number, h: number, c: RGB) { for (let x=0;x<w;x++) for (let y=0;y<d;y++) for (let z=0;z<h;z++) add(cubes,x0+x,y0+y,z0+z,c); }
function sphere(cubes: Cube[], cx: number, cy: number, cz: number, radius: number, c: RGB, rand: () => number, rough=.2) { for(let x=-radius;x<=radius;x++) for(let y=-radius;y<=radius;y++) for(let z=-radius;z<=radius;z++) if(Math.sqrt(x*x+y*y+z*z)<=radius+(rand()-.5)*rough) add(cubes,cx+x,cy+y,cz+z,c); }

function buildTree(p: RGB[], rand: () => number): Cube[] { const c:Cube[]=[]; box(c,-1,-1,0,2,2,5,p[4]); sphere(c,0,0,6,3,p[0],rand,1.3); sphere(c,-2,1,5,2,mix(p[0],p[1],.35),rand,1.1); sphere(c,2,-1,5,2,mix(p[0],p[2],.25),rand,1.1); return c; }
function buildRock(p: RGB[], rand: () => number): Cube[] { const c:Cube[]=[]; const stone=mix(p[2],[110,116,116],.62); for(let x=-3;x<=3;x++) for(let y=-2;y<=2;y++){ const r=2.8-Math.sqrt(x*x*.5+y*y*.7); const h=Math.max(0,Math.floor(r+rand()*2)); for(let z=0;z<h;z++) add(c,x,y,z,mix(stone,p[3],rand()*.14)); } return c; }
function buildCrystal(p: RGB[], rand: () => number): Cube[] { const c:Cube[]=[]; box(c,-2,-2,0,5,5,1,mix(p[2],[72,78,80],.55)); [[0,0,7],[-2,1,5],[2,0,4],[0,-2,4]].forEach(([x,y,h],i)=>{ const col=mix(p[i%4],[255,255,255],.12); for(let z=1;z<=h;z++){ add(c,x,y,z,col); if(z<h-2&&rand()>.35) add(c,x+1,y,z,mix(col,p[3],.2)); }}); return c; }
function buildChest(p: RGB[]): Cube[] { const c:Cube[]=[]; const wood=p[4], metal=mix(p[1],[236,188,72],.45); box(c,-3,-2,0,7,5,3,wood); box(c,-3,-2,3,7,5,1,mix(wood,p[0],.15)); for(let x=-3;x<=3;x+=3) box(c,x,-2,0,1,5,4,metal); box(c,0,-3,1,1,1,2,metal); return c; }
function buildSword(p: RGB[]): Cube[] { const c:Cube[]=[]; const blade=mix(p[5],p[1],.22); for(let y=-5;y<=4;y++) add(c,0,y,1,blade); add(c,0,-6,1,blade); add(c,-1,-5,1,blade); add(c,1,-5,1,blade); for(let x=-3;x<=3;x++) add(c,x,5,1,p[1]); for(let y=6;y<=9;y++) add(c,0,y,1,p[4]); add(c,-1,9,1,p[1]); add(c,1,9,1,p[1]); return c; }
function buildShield(p: RGB[]): Cube[] { const c:Cube[]=[]; for(let x=-3;x<=3;x++) for(let z=0;z<=7;z++){ const width=z<2?2:z>5?3:4; if(Math.abs(x)<=width) add(c,x,0,z,Math.abs(x)===width?p[1]:p[0]); } for(let z=2;z<=6;z++) add(c,0,-1,z,p[3]); for(let x=-2;x<=2;x++) add(c,x,-1,4,p[3]); return c; }
function buildPotion(p: RGB[]): Cube[] { const c:Cube[]=[]; for(let z=0;z<=4;z++){ const radius=z===0||z===4?1:2; for(let x=-radius;x<=radius;x++) for(let y=-radius;y<=radius;y++) if(Math.abs(x)+Math.abs(y)<=radius+1) add(c,x,y,z,mix(p[0],p[3],z/8)); } box(c,-1,-1,5,3,3,2,p[5]); box(c,0,0,7,1,1,2,p[4]); return c; }
function buildCrate(p: RGB[]): Cube[] { const c:Cube[]=[]; const wood=mix(p[4],p[1],.1), trim=mix(wood,[45,31,23],.42); box(c,-3,-3,0,7,7,6,wood); for(let z=0;z<=5;z+=5) box(c,-3,-4,z,7,1,1,trim); for(let x=-3;x<=3;x+=6) box(c,x,-4,0,1,1,6,trim); return c; }
function buildCoin(p: RGB[]): Cube[] { const c:Cube[]=[]; const gold=mix(p[1],[255,196,48],.62); for(let x=-3;x<=3;x++) for(let z=-3;z<=3;z++) if(x*x+z*z<=10){ add(c,x,0,z+3,gold); add(c,x,1,z+3,mix(gold,[255,255,255],.12)); } return c; }
function buildBanner(p: RGB[]): Cube[] { const c:Cube[]=[]; for(let z=0;z<=10;z++) add(c,-3,0,z,p[4]); for(let x=-3;x<=3;x++) add(c,x,0,10,p[4]); for(let x=-2;x<=3;x++) for(let z=4;z<=9;z++) add(c,x,0,z,p[0]); for(let z=5;z<=8;z++) add(c,0,-1,z,p[3]); for(let x=-1;x<=1;x++) add(c,x,-1,7,p[3]); return c; }
function buildMushroom(p: RGB[]): Cube[] { const c:Cube[]=[]; box(c,-1,-1,0,2,2,4,mix(p[5],[211,194,166],.4)); const cap=mix(p[0],p[1],.28); for(let x=-3;x<=3;x++) for(let y=-3;y<=3;y++) if(x*x+y*y<=10) add(c,x,y,4+(Math.abs(x)+Math.abs(y)<3?1:0),cap); add(c,-1,-2,6,p[5]); add(c,2,0,5,p[5]); add(c,0,2,6,p[5]); return c; }
function buildPortal(p: RGB[]): Cube[] { const c:Cube[]=[]; const frame=mix(p[2],[68,71,80],.5); for(let z=0;z<=9;z++){ add(c,-4,0,z,frame); add(c,4,0,z,frame); } for(let x=-4;x<=4;x++) add(c,x,0,9,frame); for(let x=-3;x<=3;x++) for(let z=1;z<=8;z++) if((x+z)%2===0) add(c,x,1,z,mix(p[0],p[3],z/12)); return c; }
function buildCharacter(p: RGB[]): Cube[] { const c:Cube[]=[]; const skin:RGB=[222,168,126]; box(c,-2,-1,0,2,2,4,p[2]); box(c,1,-1,0,2,2,4,p[2]); box(c,-2,-1,4,5,3,5,p[0]); box(c,-4,0,5,2,2,4,p[0]); box(c,3,0,5,2,2,4,p[0]); box(c,-2,-1,9,5,4,4,skin); for(let x=-2;x<=2;x++) add(c,x,-2,12,p[4]); add(c,-1,-2,10,[30,36,36]); add(c,1,-2,10,[30,36,36]); return c; }

function buildPack(theme: string, photoPalette: RGB[] | null): Asset[] {
  const p=photoPalette?.length?[...photoPalette,[111,78,55] as RGB,[218,226,222] as RGB]:themePalette(theme); while(p.length<6)p.push(themePalette(theme)[p.length]); const rand=rngFrom(hashText(theme||DEFAULT_THEME));
  return [
    {id:'character',name:'Hero Character',description:'Main character / avatar',cubes:buildCharacter(p)},
    {id:'tree',name:'Signature Tree',description:'Environment centerpiece',cubes:buildTree(p,rand)},
    {id:'rock',name:'Rock Formation',description:'Terrain prop',cubes:buildRock(p,rand)},
    {id:'crystal',name:'Crystal Cluster',description:'Rare resource prop',cubes:buildCrystal(p,rand)},
    {id:'chest',name:'Treasure Chest',description:'Loot container',cubes:buildChest(p)},
    {id:'sword',name:'Voxel Sword',description:'Weapon asset',cubes:buildSword(p)},
    {id:'shield',name:'Voxel Shield',description:'Equipment asset',cubes:buildShield(p)},
    {id:'potion',name:'Magic Potion',description:'Consumable item',cubes:buildPotion(p)},
    {id:'crate',name:'Supply Crate',description:'World prop',cubes:buildCrate(p)},
    {id:'coin',name:'Collectible Coin',description:'Currency / pickup',cubes:buildCoin(p)},
    {id:'banner',name:'Faction Banner',description:'Decorative prop',cubes:buildBanner(p)},
    {id:'portal',name:'Magic Portal',description:'Landmark asset',cubes:buildPortal(p)},
    {id:'mushroom',name:'Fantasy Mushroom',description:'Small environment prop',cubes:buildMushroom(p)}
  ];
}

function ply(asset: Asset) {
  const vertices:string[]=[], faces:string[]=[]; let base=0; const quads=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[4,0,3,7]];
  for(const cube of asset.cubes){ const {x,y,z,c}=cube; const pts=[[x,y,z],[x+1,y,z],[x+1,y+1,z],[x,y+1,z],[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]]; pts.forEach(v=>vertices.push(`${v[0]} ${v[1]} ${v[2]} ${c[0]} ${c[1]} ${c[2]}`)); quads.forEach(q=>faces.push(`4 ${q.map(i=>i+base).join(' ')}`)); base+=8; }
  return ['ply','format ascii 1.0',`comment ${asset.name} - Voxel Vault`,`element vertex ${vertices.length}`,'property float x','property float y','property float z','property uchar red','property uchar green','property uchar blue',`element face ${faces.length}`,'property list uchar int vertex_indices','end_header',...vertices,...faces,''].join('\n');
}

function crc32(bytes: Uint8Array) { let crc=0xffffffff; for(const byte of bytes){ crc^=byte; for(let k=0;k<8;k++) crc=(crc>>>1)^(0xedb88320&-(crc&1)); } return (crc^0xffffffff)>>>0; }
function zipStore(files:{name:string;data:Uint8Array}[]) {
  const encoder=new TextEncoder(), chunks:Uint8Array[]=[], central:Uint8Array[]=[]; let offset=0;
  const u16=(v:number)=>new Uint8Array([v&255,(v>>>8)&255]); const u32=(v:number)=>new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);
  const concat=(...parts:Uint8Array[])=>{ const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0)); let pos=0; parts.forEach(p=>{out.set(p,pos);pos+=p.length;}); return out; };
  for(const file of files){ const name=encoder.encode(file.name), crc=crc32(file.data); const local=concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(file.data.length),u32(file.data.length),u16(name.length),u16(0),name,file.data); chunks.push(local); central.push(concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(file.data.length),u32(file.data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name)); offset+=local.length; }
  const centralSize=central.reduce((n,p)=>n+p.length,0); return concat(...chunks,...central,concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralSize),u32(offset),u16(0)));
}
function downloadBlob(blob:Blob,name:string){ const url=URL.createObjectURL(blob),a=document.createElement('a'); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }

function drawAsset(canvas:HTMLCanvasElement,asset:Asset){
  const ctx=canvas.getContext('2d'); if(!ctx)return; const dpr=Math.min(2,window.devicePixelRatio||1),w=canvas.clientWidth||700,h=canvas.clientHeight||520; canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const grad=ctx.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,w*.5);grad.addColorStop(0,'rgba(99,255,180,.12)');grad.addColorStop(1,'rgba(5,7,6,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  const cubes=[...asset.cubes].sort((a,b)=>(a.x+a.y+a.z)-(b.x+b.y+b.z)); const xs=cubes.map(c=>c.x),ys=cubes.map(c=>c.y); const span=Math.max(10,Math.max(...xs)-Math.min(...xs)+Math.max(...ys)-Math.min(...ys)); const s=Math.min(28,Math.max(10,w/(span*1.05))),ox=w/2,oy=h*.72;
  for(const cube of cubes){ const x=ox+(cube.x-cube.y)*s*.58,y=oy+(cube.x+cube.y)*s*.30-cube.z*s*.58,dx=s*.58,dy=s*.30,z=s*.58,[r,g,b]=cube.c; ctx.beginPath();ctx.moveTo(x,y-z);ctx.lineTo(x+dx,y-dy-z);ctx.lineTo(x,y-2*dy-z);ctx.lineTo(x-dx,y-dy-z);ctx.closePath();ctx.fillStyle=`rgb(${clamp(r*1.08)},${clamp(g*1.08)},${clamp(b*1.08)})`;ctx.fill(); ctx.beginPath();ctx.moveTo(x-dx,y-dy-z);ctx.lineTo(x,y-2*dy-z);ctx.lineTo(x,y-2*dy);ctx.lineTo(x-dx,y-dy);ctx.closePath();ctx.fillStyle=`rgb(${clamp(r*.70)},${clamp(g*.70)},${clamp(b*.70)})`;ctx.fill(); ctx.beginPath();ctx.moveTo(x+dx,y-dy-z);ctx.lineTo(x,y-2*dy-z);ctx.lineTo(x,y-2*dy);ctx.lineTo(x+dx,y-dy);ctx.closePath();ctx.fillStyle=`rgb(${clamp(r*.88)},${clamp(g*.88)},${clamp(b*.88)})`;ctx.fill(); }
}

export default function Home(){
  const [theme,setTheme]=useState(DEFAULT_THEME); const [photoPalette,setPhotoPalette]=useState<RGB[]|null>(null); const [pack,setPack]=useState<Asset[]>(()=>buildPack(DEFAULT_THEME,null)); const [selected,setSelected]=useState(0); const [paid,setPaid]=useState(false); const [status,setStatus]=useState('13 matching 3D assets ready.'); const canvasRef=useRef<HTMLCanvasElement|null>(null); const selectedAsset=pack[selected]||pack[0]; const encoder=useMemo(()=>new TextEncoder(),[]);
  useEffect(()=>{setPaid(new URLSearchParams(window.location.search).get('paid')==='1');},[]);
  useEffect(()=>{if(!canvasRef.current||!selectedAsset)return;drawAsset(canvasRef.current,selectedAsset);const redraw=()=>canvasRef.current&&drawAsset(canvasRef.current,selectedAsset);window.addEventListener('resize',redraw);return()=>window.removeEventListener('resize',redraw);},[selectedAsset]);
  const generate=()=>{const next=buildPack(theme.trim()||DEFAULT_THEME,photoPalette);setPack(next);setSelected(0);setStatus(`${next.length} matching 3D assets generated.`);};
  const loadPhoto=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=12;c.height=12;const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx)return;ctx.drawImage(img,0,0,12,12);const data=ctx.getImageData(0,0,12,12).data;const colors=[[3,3],[8,3],[3,8],[8,8]].map(([x,y])=>{const i=(y*12+x)*4;return[data[i],data[i+1],data[i+2]] as RGB;});setPhotoPalette(colors);setStatus('Reference colors captured. Press Generate Pack.');};img.src=String(reader.result);};reader.readAsDataURL(file);};
  const downloadPack=()=>{if(CHECKOUT_URL&&!paid){window.location.href=CHECKOUT_URL;return;}const slug=(theme||'voxel-pack').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'voxel-pack';const readme=`VOXEL VAULT ASSET PACK\nTheme: ${theme}\nAssets: ${pack.length}\nFormat: ASCII PLY with vertex colors\n\nFiles:\n${pack.map(a=>`- ${a.id}.ply - ${a.name}`).join('\n')}\n`;const files=pack.map(a=>({name:`${slug}/${a.id}.ply`,data:encoder.encode(ply(a))}));files.push({name:`${slug}/README.txt`,data:encoder.encode(readme)});downloadBlob(new Blob([zipStore(files)],{type:'application/zip'}),`${slug}-voxel-pack.zip`);};
  const downloadOne=()=>selectedAsset&&downloadBlob(new Blob([ply(selectedAsset)],{type:'application/octet-stream'}),`${selectedAsset.id}.ply`);
  return <main>
    <header className="topbar"><a className="logo" href="#top">VOXEL VAULT</a><span>13-ASSET 3D PACK GENERATOR</span><button className="navBuy" onClick={downloadPack}>Get pack - $9.99</button></header>
    <section className="hero" id="top"><div className="copy"><span className="kicker">ONE IDEA. A WHOLE VOXEL WORLD.</span><h1>Generate a matching <em>3D voxel asset pack.</em></h1><p>Type a theme, optionally add a reference image, and instantly build a coordinated pack of real downloadable 3D voxel models.</p><div className="priceLine"><strong>$9.99</strong><span>13 assets / ZIP download / real .PLY models</span></div><div className="generator"><label>Describe your pack</label><div className="promptRow"><input value={theme} onChange={(e:ChangeEvent<HTMLInputElement>)=>setTheme(e.target.value)} placeholder="enchanted forest, cyber city, cute pets..."/><button onClick={generate}>Generate pack</button></div><div className="referenceRow"><label className="upload"><input type="file" accept="image/*" onChange={loadPhoto}/>{photoPalette?'Reference added':'Add reference image'}</label><span>{status}</span></div></div><div className="trust"><span>No crypto</span><span>Works on iPhone</span><span>Blender-ready PLY</span><span>Instant ZIP</span></div></div>
      <div className="studio"><div className="studioTop"><span>LIVE 3D PACK PREVIEW</span><i>{selectedAsset?.name}</i></div><canvas ref={canvasRef} className="preview"/><div className="studioBottom"><div><b>{selectedAsset?.name}</b><span>{selectedAsset?.description} - {selectedAsset?.cubes.length} voxels</span></div><button onClick={downloadOne}>Download sample</button></div></div></section>
    <section className="packSection"><div className="sectionHead"><div><span className="kicker">YOUR PACK</span><h2>13 matching assets, one download.</h2></div><button className="packBuy" onClick={downloadPack}>{CHECKOUT_URL&&!paid?'Buy full pack - $9.99':'Download full ZIP'}</button></div><div className="assetGrid">{pack.map((asset,i)=><button key={asset.id} className={i===selected?'assetCard active':'assetCard'} onClick={()=>setSelected(i)}><span className="assetIcon">{String(i+1).padStart(2,'0')}</span><b>{asset.name}</b><small>{asset.description}</small></button>)}</div></section>
    <section className="proof"><article><b>01</b><h3>Describe</h3><p>Give the generator one theme. A reference image can guide the pack colors.</p></article><article><b>02</b><h3>Generate</h3><p>Get a character, environment pieces, loot, weapons, props, and landmarks in one style.</p></article><article><b>03</b><h3>Download</h3><p>Receive a ZIP containing separate colored .PLY files ready for 3D software.</p></article></section>
    <section className="included"><div><span className="kicker">IN EVERY $9.99 PACK</span><h2>Enough pieces to start a world.</h2></div><p>Hero character, tree, rock formation, crystal cluster, treasure chest, sword, shield, potion, supply crate, collectible coin, faction banner, magic portal, and fantasy mushroom.</p></section>
    <section className="bottomCta"><div><span className="kicker">MAKE YOUR PACK NOW</span><h2>One idea in. Thirteen 3D assets out.</h2></div><button onClick={downloadPack}>{CHECKOUT_URL&&!paid?'Get my pack - $9.99':'Download full pack'}</button></section><footer><b>VOXEL VAULT</b><span>Custom 3D voxel asset packs.</span></footer>
  </main>;
}
