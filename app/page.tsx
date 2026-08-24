'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Opportunity = {
  id:string; title:string; source:string; sourceUrl:string; payout:number; hours:number;
  probability:number; competition:string; protection:string; protectionVerified:boolean;
  updatedAt:string; moneyScore:number; ageDays:number; automationScore:number;
  riskFlags:string[]; recommendation:'VERIFY FIRST'|'REVIEW';
};
type ScanResult = {
  opportunities:Opportunity[]; scannedAt?:string; scanned?:number; qualified?:number;
  authenticated?:boolean; methodology?:string; error?:string;
};

export default function Home(){
 const [goal,setGoal]=useState(10000);
 const [items,setItems]=useState<Opportunity[]>([]);
 const [selected,setSelected]=useState<Opportunity|null>(null);
 const [scan,setScan]=useState<ScanResult|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');

 const scanNow=useCallback(async()=>{
  setLoading(true); setError('');
  try {
   const response=await fetch('/api/opportunities',{cache:'no-store'});
   const data:ScanResult=await response.json();
   if(!response.ok) throw new Error(data.error||'Scanner unavailable');
   setItems(data.opportunities); setScan(data);
  } catch (cause) {
   setItems([]); setError(cause instanceof Error?cause.message:'Scanner unavailable');
  } finally { setLoading(false); }
 },[]);

 useEffect(()=>{ void scanNow(); },[scanNow]);
 const available=useMemo(()=>items.reduce((sum,o)=>sum+o.payout,0),[items]);
 const best=items[0]?.moneyScore||0;

 return <main>
  <header><div><div className="eyebrow">GHOSTFORGE / PRIVATE COMMAND</div><h1>Revenue cockpit</h1></div><div className={error?'live offline':'live'}><i/> {error?'SCANNER BLOCKED':loading?'SCANNING':scan?.authenticated?'LIVE + AUTHENTICATED':'LIVE SOURCES'}</div></header>
  <section className="hero">
   <div><span className="muted">MONTHLY TARGET</span><div className="target">${goal.toLocaleString()}</div><input aria-label="Monthly revenue target" type="range" min="1000" max="50000" step="1000" value={goal} onChange={e=>setGoal(+e.target.value)}/></div>
   <div className="heroRight"><span className="muted">QUALIFIED OPEN VALUE</span><strong>${available.toLocaleString()}</strong><small>{items.length} protected, payout-explicit opportunities</small></div>
  </section>
  <section className="metrics">
   <article><span>Collected</span><b>$0</b><em>Only accepted payments count</em></article>
   <article><span>Qualified</span><b>{items.length}</b><em>from {scan?.scanned||0} live candidates</em></article>
   <article><span>Best expected $ / hour</span><b>${best}</b><em>payout × probability ÷ hours</em></article>
   <article><span>Identity mode</span><b>Faceless</b><em>Code, proof, delivery</em></article>
  </section>
  <div className="sectionHead"><div><span className="eyebrow">LIVE OPPORTUNITY SCANNER</span><h2>Build what pays.</h2></div><button onClick={scanNow} disabled={loading}>{loading?'Scanning…':'↻ Scan now'}</button></div>
  {error&&<section className="notice error"><b>Scan failed.</b> {error}. Add a valid <code>GITHUB_TOKEN</code> in Vercel for reliable API limits, then scan again.</section>}
  {!loading&&!error&&!items.length&&<section className="notice"><b>No protected jobs qualified right now.</b> That is an honest result—not an empty demo. GhostForge rejected listings without an explicit payout and payment-protection evidence.</section>}
  {!!items.length&&<section className="table">
   <div className="row labels"><span>Opportunity</span><span>Payout</span><span>Est.</span><span>Money score</span><span>Protection</span></div>
   {items.map((o,i)=><button className="row opportunity" key={o.id} onClick={()=>setSelected(o)}>
    <span><i className="rank">{String(i+1).padStart(2,'0')}</i><span><b>{o.title}</b>{i===0&&<em className="first">TOP PICK</em>}<small>{o.source} · {o.ageDays}d old · {o.competition} competition · automation {o.automationScore}/100</small></span></span>
    <strong>${o.payout.toLocaleString()}</strong><span>{o.hours}h*</span><span className="score">${o.moneyScore}/h</span><span className="safe">{o.protection}</span>
   </button>)}
  </section>}
  <section className="pipeline"><span>SCANNED <b>{scan?.scanned||0}</b></span><i>→</i><span>QUALIFIED <b>{items.length}</b></span><i>→</i><span>BUILDING <b>0</b></span><i>→</i><span>SUBMITTED <b>0</b></span><i>→</i><span>PAID <b>$0</b></span></section>
  <p className="method">* Hours and acceptance probability are conservative modeled estimates. Verify scope, eligibility, payout availability, and payment terms on the source before starting. {scan?.scannedAt&&`Last scan: ${new Date(scan.scannedAt).toLocaleString()}.`}</p>
  {selected&&<div className="modal" onClick={()=>setSelected(null)}><article onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)} aria-label="Close">×</button><span className="eyebrow">{selected.recommendation}</span><h2>{selected.title}</h2><div className="bigScore">${selected.moneyScore}<small> expected $ / hour</small></div><p>Listed payout <b>${selected.payout.toLocaleString()}</b> · modeled {selected.hours} hours · {Math.round(selected.probability*100)}% modeled acceptance probability · {selected.competition.toLowerCase()} competition · automation fit {selected.automationScore}/100.</p><div className="checks"><span>✓ Explicit payout</span><span>✓ {selected.protection}</span><span>✓ Open source</span></div>{selected.riskFlags.length>0&&<div className="risks">{selected.riskFlags.map(r=><span key={r}>! {r}</span>)}</div>}<a className="start" href={selected.sourceUrl} target="_blank" rel="noreferrer">VERIFY FUNDING & CLAIM →</a><small className="warning">Confirm funding, eligibility, claim rules, and acceptance criteria before work begins. Submission stays manual.</small></article></div>}
  <footer>GHOSTFORGE <span>Found ≠ income. Accepted + paid = income.</span></footer>
 </main>
}
