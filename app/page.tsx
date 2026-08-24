'use client';

import { useMemo, useState } from 'react';

type Opportunity = { id:number; title:string; source:string; payout:number; hours:number; probability:number; competition:string; protection:string; stack:string; status:string };

const seed: Opportunity[] = [
 {id:1,title:'Repair Next.js checkout regression',source:'Escrow marketplace',payout:325,hours:2.2,probability:.86,competition:'Low',protection:'Escrow',stack:'Next.js',status:'Ready'},
 {id:2,title:'Add REST API integration to React dashboard',source:'Fixed-price contract',payout:480,hours:4.5,probability:.78,competition:'Low',protection:'Milestone funded',stack:'React / API',status:'Analyze'},
 {id:3,title:'Fix mobile layout + Safari bugs',source:'Client task',payout:190,hours:1.4,probability:.91,competition:'Very low',protection:'Escrow',stack:'CSS / React',status:'Ready'},
 {id:4,title:'Open-source async Web API bounty',source:'Bounty board',payout:1500,hours:18,probability:.42,competition:'None visible',protection:'Approval required',stack:'C / WASM',status:'Risky'},
];

const moneyScore=(o:Opportunity)=>Math.round((o.payout*o.probability)/o.hours);

export default function Home(){
 const [goal,setGoal]=useState(10000);
 const [selected,setSelected]=useState<Opportunity|null>(null);
 const ranked=useMemo(()=>[...seed].sort((a,b)=>moneyScore(b)-moneyScore(a)),[]);
 const available=seed.reduce((n,o)=>n+o.payout,0);
 return <main>
  <header><div><div className="eyebrow">GHOSTFORGE / COMMAND</div><h1>Revenue cockpit</h1></div><div className="live"><i/> SCANNER LIVE</div></header>
  <section className="hero">
   <div><span className="muted">MONTHLY TARGET</span><div className="target">${goal.toLocaleString()}</div><input aria-label="Monthly revenue target" type="range" min="1000" max="50000" step="1000" value={goal} onChange={e=>setGoal(+e.target.value)}/></div>
   <div className="heroRight"><span className="muted">OPPORTUNITY VALUE</span><strong>${available.toLocaleString()}</strong><small>4 qualified tasks in queue</small></div>
  </section>
  <section className="metrics">
   <article><span>Collected</span><b>$0</b><em>Start the first win</em></article>
   <article><span>In pipeline</span><b>$2,495</b><em>Ranked by expected return</em></article>
   <article><span>Best $ / hour</span><b>${moneyScore(ranked[0])}</b><em>probability adjusted</em></article>
   <article><span>Identity mode</span><b>Brand</b><em>No face required</em></article>
  </section>
  <div className="sectionHead"><div><span className="eyebrow">OPPORTUNITY SCANNER</span><h2>Build what pays.</h2></div><button>↻ Scan now</button></div>
  <section className="table">
   <div className="row labels"><span>Opportunity</span><span>Payout</span><span>Est.</span><span>Money score</span><span>Protection</span></div>
   {ranked.map((o,i)=><button className="row opportunity" key={o.id} onClick={()=>setSelected(o)}>
    <span><i className="rank">0{i+1}</i><span><b>{o.title}</b><small>{o.source} · {o.stack} · {o.competition} competition</small></span></span>
    <strong>${o.payout}</strong><span>{o.hours}h</span><span className="score">${moneyScore(o)}/h</span><span className={o.protection==='Escrow'?'safe':''}>{o.protection}</span>
   </button>)}
  </section>
  <section className="pipeline"><span>FOUND <b>12</b></span><i>→</i><span>QUALIFIED <b>4</b></span><i>→</i><span>BUILDING <b>0</b></span><i>→</i><span>SUBMITTED <b>0</b></span><i>→</i><span>PAID <b>$0</b></span></section>
  {selected&&<div className="modal" onClick={()=>setSelected(null)}><article onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="eyebrow">OPPORTUNITY ANALYSIS</span><h2>{selected.title}</h2><div className="bigScore">${moneyScore(selected)}<small> expected $ / hour</small></div><p>Potential payout <b>${selected.payout}</b> · estimated {selected.hours} hours · {Math.round(selected.probability*100)}% modeled acceptance probability.</p><div className="checks"><span>✓ {selected.protection}</span><span>✓ {selected.competition} competition</span><span>✓ {selected.stack}</span></div><button className="start">START JOB →</button><small className="warning">Final submission always requires your approval.</small></article></div>}
  <footer>GHOSTFORGE <span>Faceless execution. Measurable outcomes.</span></footer>
 </main>
}
