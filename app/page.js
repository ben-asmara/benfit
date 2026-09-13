"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "../lib/supabase-browser";

const plan = {
  Monday:["Work 9:00 AM–6:00 PM","Push • 7:00–8:15 PM"],
  Tuesday:["School 10:00 AM–12:00 PM","Work 1:00–5:00 PM","Class 6:00–8:45 PM","Pull • 8:00–9:00 AM"],
  Wednesday:["Work 12:00–6:00 PM","Recovery walk + mobility"],
  Thursday:["School 10:00 AM–12:00 PM","Club 2:30–4:30 PM","Legs • 5:00–6:20 PM"],
  Friday:["School 9:00 AM–2:45 PM","Upper • 4:00–5:15 PM"],
  Saturday:["Lower + Core • late morning","Meal prep • 60–90 min"],
  Sunday:["Rest + steps","Weekly weigh-in review"]
};
const workout = {
  Monday:["Bench 4×6–8","Incline DB press 3×8–10","Shoulder press 3×8–10","Lateral raise 4×12–20","Triceps 6 sets"],
  Tuesday:["Lat pulldown 4×8–12","Chest-supported row 4×8–10","Cable row 3×10–12","Rear delts 3×15–20","Curls 6 sets"],
  Thursday:["Squat/Hack squat 4×6–10","RDL 3×8–10","Leg press 3×10–12","Leg curl 3×10–15","Calves 4×12–20"],
  Friday:["Incline bench 3×6–10","Lat pulldown 3×8–12","DB bench 3×8–12","Chest-supported row 3×8–12","Arms + lateral raises"],
  Saturday:["Leg press/Squat 3×8–12","RDL 3×8–12","Bulgarian split squat 3×8–12","Leg curl 3×10–15","Core"]
};

function todayISO(){return new Date().toISOString().slice(0,10)}

export default function Home(){
  const sb = useMemo(()=>supabaseBrowser(),[]);
  const [session,setSession]=useState(null), [loading,setLoading]=useState(true), [tab,setTab]=useState("dashboard");
  const [foods,setFoods]=useState([]),[weights,setWeights]=useState([]),[profile,setProfile]=useState({calorie_goal:2500,protein_goal:200,goal_weight:95});
  const [manual,setManual]=useState({name:"",calories:"",protein:""}), [barcode,setBarcode]=useState(""), [scanMsg,setScanMsg]=useState("");
  const [photo,setPhoto]=useState(null),[photoResult,setPhotoResult]=useState(null),[photoBusy,setPhotoBusy]=useState(false);
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[authMsg,setAuthMsg]=useState("");
  const videoRef=useRef(null), streamRef=useRef(null);

  useEffect(()=>{
    sb.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});
    const {data:{subscription}}=sb.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[sb]);

  useEffect(()=>{ if(session) refresh(); },[session]);

  async function refresh(){
    const uid=session.user.id;
    const [f,w,p]=await Promise.all([
      sb.from("food_logs").select("*").eq("user_id",uid).eq("eaten_on",todayISO()).order("created_at",{ascending:false}),
      sb.from("weights").select("*").eq("user_id",uid).order("logged_on",{ascending:true}),
      sb.from("profiles").select("*").eq("id",uid).maybeSingle()
    ]);
    if(!f.error)setFoods(f.data||[]);
    if(!w.error)setWeights(w.data||[]);
    if(p.data)setProfile(p.data);
  }

  async function signUp(){
    setAuthMsg("Creating account...");
    const {error}=await sb.auth.signUp({email,password});
    setAuthMsg(error?error.message:"Account created. Check your email if confirmation is enabled.");
  }
  async function signIn(){
    setAuthMsg("Signing in...");
    const {error}=await sb.auth.signInWithPassword({email,password});
    setAuthMsg(error?error.message:"");
  }
  async function signOut(){ await sb.auth.signOut(); location.reload(); }

  async function addFood(item){
    const row={user_id:session.user.id,eaten_on:todayISO(),name:item.name,calories:+item.calories||0,protein_g:+item.protein||0,source:item.source||"manual",barcode:item.barcode||null,image_url:item.image_url||null};
    const {error}=await sb.from("food_logs").insert(row);
    if(error) alert(error.message); else {setManual({name:"",calories:"",protein:""});refresh();}
  }
  async function deleteFood(id){await sb.from("food_logs").delete().eq("id",id);refresh()}

  async function lookupBarcode(code){
    setScanMsg("Looking up product...");
    try{
      const r=await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const j=await r.json();
      if(!j.product){setScanMsg("Product not found. You can enter it manually.");return}
      const p=j.product,n=p.nutriments||{};
      setManual({
        name:p.product_name || p.generic_name || "Scanned product",
        calories:Math.round(n["energy-kcal_serving"] || n["energy-kcal_100g"] || 0),
        protein:Math.round((n.proteins_serving || n.proteins_100g || 0)*10)/10
      });
      setBarcode(code);setScanMsg("Product found. Confirm serving calories/protein, then add.");
      setTab("food");
    }catch(e){setScanMsg("Could not reach the food database.");}
  }

  async function startScanner(){
    setScanMsg("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      streamRef.current=stream; videoRef.current.srcObject=stream; await videoRef.current.play();
      if("BarcodeDetector" in window){
        const detector=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e","code_128"]});
        const loop=async()=>{
          if(!streamRef.current)return;
          try{
            const codes=await detector.detect(videoRef.current);
            if(codes[0]){stopScanner();lookupBarcode(codes[0].rawValue);return}
          }catch{}
          requestAnimationFrame(loop);
        }; loop();
      }else setScanMsg("Automatic scanning is not supported in this browser. Enter the barcode below.");
    }catch(e){setScanMsg("Camera permission was denied or unavailable.");}
  }
  function stopScanner(){if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}}

  async function analyzePhoto(file){
    setPhoto(file); setPhotoResult(null); setPhotoBusy(true);
    try{
      const fd=new FormData();fd.append("image",file);
      const r=await fetch("/api/analyze-food",{method:"POST",body:fd});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||"Analysis failed");
      setPhotoResult(j);
    }catch(e){setPhotoResult({error:e.message});}
    setPhotoBusy(false);
  }

  async function addWeight(e){
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const {error}=await sb.from("weights").insert({user_id:session.user.id,logged_on:fd.get("date"),weight_kg:+fd.get("weight")});
    if(error)alert(error.message);else{e.currentTarget.reset();refresh();}
  }
  async function saveProfile(){
    const row={id:session.user.id,calorie_goal:+profile.calorie_goal,protein_goal:+profile.protein_goal,goal_weight:+profile.goal_weight};
    const {error}=await sb.from("profiles").upsert(row);
    if(error)alert(error.message);else alert("Targets saved.");
  }

  const totals=foods.reduce((a,f)=>({cal:a.cal+(f.calories||0),pro:a.pro+(f.protein_g||0)}),{cal:0,pro:0});
  if(loading)return <main className="shell"><div className="card">Loading BenFit...</div></main>;
  if(!session)return <main className="shell auth"><div className="card"><h1>BenFit Journey</h1><p className="muted">Sign in to sync your journey across phones, tablets and computers.</p><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div><div style={{display:"flex",gap:8}}><button className="btn" onClick={signIn}>Sign in</button><button className="btn secondary" onClick={signUp}>Create account</button></div><p className="muted small">{authMsg}</p></div></main>;

  return <main className="shell">
    <div className="top"><div><div className="brand">BenFit Journey</div><div className="muted">Cloud-synced cut + muscle-building companion</div></div><button className="btn secondary" onClick={signOut}>Sign out</button></div>
    <div className="tabs">{["dashboard","food","scanner","progress","schedule","workouts","calendar","settings"].map(x=><button key={x} onClick={()=>{stopScanner();setTab(x)}} className={"tab "+(tab===x?"active":"")}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>

    <section className={"section "+(tab==="dashboard"?"active":"")}>
      <div className="grid g4">
        <div className="card"><div className="muted">Calories</div><div className="metric">{totals.cal}</div><div className="small muted">of {profile.calorie_goal} kcal</div><div className="progress"><div className="bar" style={{width:`${Math.min(100,totals.cal/profile.calorie_goal*100)}%`}}/></div></div>
        <div className="card"><div className="muted">Protein</div><div className="metric">{Math.round(totals.pro)} g</div><div className="small muted">of {profile.protein_goal} g</div><div className="progress"><div className="bar" style={{width:`${Math.min(100,totals.pro/profile.protein_goal*100)}%`}}/></div></div>
        <div className="card"><div className="muted">Current weight</div><div className="metric">{weights.length?weights.at(-1).weight_kg:"—"} kg</div><div className="small muted">Goal {profile.goal_weight} kg</div></div>
        <div className="card"><div className="muted">Today's focus</div><div className="metric" style={{fontSize:20}}>{new Date().toLocaleDateString(undefined,{weekday:"long"})}</div><div className="small muted">{plan[new Date().toLocaleDateString("en-US",{weekday:"long"})]?.at(-1)||"Recovery"}</div></div>
      </div>
      <div className="grid g2" style={{marginTop:14}}>
        <div className="card"><h3>Today's food</h3>{foods.length?foods.slice(0,5).map(f=><div className="fooditem" key={f.id}><div><b>{f.name}</b><div className="small muted">{f.source} • {f.calories} kcal • {f.protein_g} g protein</div></div></div>):<p className="muted">No food logged yet.</p>}</div>
        <div className="card"><h3>Nutrition guardrails</h3><span className="pill">~2,500 kcal start</span><span className="pill">~200 g protein</span><span className="pill">3–4 L water</span><span className="pill">8–10k steps</span><p className="muted small">Photo estimates are approximate. Packaged-food barcode data is usually better, but always confirm the serving size on the label.</p></div>
      </div>
    </section>

    <section className={"section "+(tab==="food"?"active":"")}>
      <div className="grid g2">
        <div className="card"><h2>Log food</h2><div className="field"><label>Food</label><input value={manual.name} onChange={e=>setManual({...manual,name:e.target.value})}/></div><div className="row"><div className="field"><label>Calories</label><input type="number" value={manual.calories} onChange={e=>setManual({...manual,calories:e.target.value})}/></div><div className="field"><label>Protein (g)</label><input type="number" value={manual.protein} onChange={e=>setManual({...manual,protein:e.target.value})}/></div><div></div><button className="btn" onClick={()=>addFood({...manual,source:barcode?"barcode":"manual",barcode})}>Add</button></div>{scanMsg&&<p className="notice small">{scanMsg}</p>}</div>
        <div className="card"><h2>Food photo</h2><p className="muted small">Upload a meal photo. The server estimates foods, portions, calories and protein. Review before saving.</p><input type="file" accept="image/*" capture="environment" onChange={e=>e.target.files[0]&&analyzePhoto(e.target.files[0])}/>{photo&&<img className="photo" src={URL.createObjectURL(photo)} alt="meal" style={{marginTop:10}}/>}{photoBusy&&<p>Analyzing...</p>}{photoResult&&!photoResult.error&&<div className="notice" style={{marginTop:10}}><b>{photoResult.name}</b><div>{photoResult.calories} kcal • {photoResult.protein} g protein</div><p className="small muted">{photoResult.notes}</p><button className="btn" onClick={()=>addFood({...photoResult,source:"photo_ai"})}>Add estimate</button></div>}{photoResult?.error&&<p className="notice">{photoResult.error}</p>}</div>
      </div>
      <div className="card" style={{marginTop:14}}><h3>Today's entries</h3>{foods.map(f=><div className="fooditem" key={f.id}><div><b>{f.name}</b><div className="small muted">{f.calories} kcal • {f.protein_g} g protein • {f.source}</div></div><button className="btn red" onClick={()=>deleteFood(f.id)}>Delete</button></div>)}</div>
    </section>

    <section className={"section "+(tab==="scanner"?"active":"")}>
      <div className="twoCol">
        <div className="card"><h2>Barcode scanner</h2><div className="scanner"><video ref={videoRef} playsInline muted/></div><div style={{display:"flex",gap:8,marginTop:10}}><button className="btn" onClick={startScanner}>Start camera</button><button className="btn secondary" onClick={stopScanner}>Stop</button></div><p className="muted small">{scanMsg}</p></div>
        <div className="card"><h2>Manual barcode lookup</h2><div className="field"><label>UPC / EAN</label><input value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="e.g. 012345678905"/></div><button className="btn" onClick={()=>lookupBarcode(barcode)}>Look up product</button><p className="muted small">Product data is fetched from Open Food Facts. Always confirm serving size against the package.</p></div>
      </div>
    </section>

    <section className={"section "+(tab==="progress"?"active":"")}>
      <div className="grid g2">
        <form className="card" onSubmit={addWeight}><h2>Log weight</h2><div className="field"><label>Date</label><input name="date" type="date" defaultValue={todayISO()} required/></div><div className="field"><label>Weight (kg)</label><input name="weight" type="number" step="0.1" required/></div><button className="btn">Save weigh-in</button></form>
        <div className="card"><h2>History</h2>{weights.length?weights.slice().reverse().map(w=><div className="fooditem" key={w.id}><span>{w.logged_on}</span><b>{w.weight_kg} kg</b></div>):<p className="muted">No weigh-ins yet.</p>}</div>
      </div>
    </section>

    <section className={"section "+(tab==="schedule"?"active":"")}>
      <div className="schedule">{Object.entries(plan).map(([day,events])=><div className="day" key={day}><b>{day}</b>{events.map((e,i)=><div className={"event "+(e.includes("School")||e.includes("Class")?"school":e.includes("Club")?"club":e.includes("Work")?"":"gym")} key={i}>{e}</div>)}</div>)}</div>
    </section>

    <section className={"section "+(tab==="workouts"?"active":"")}>
      <div className="grid g2">{Object.entries(workout).map(([day,items])=><div className="card" key={day}><h3>{day}</h3>{items.map(x=><p key={x}>{x}</p>)}</div>)}</div>
    </section>

    <section className={"section "+(tab==="calendar"?"active":"")}>
      <div className="grid g2"><div className="card"><h2>Apple Calendar</h2><p className="muted">Download your weekly fitness schedule as an .ics calendar file, then open it on iPhone and add the events to Apple Calendar.</p><a className="btn" href="/api/calendar">Download calendar (.ics)</a></div><div className="card"><h2>Calendar subscription</h2><p className="muted small">For automatic recurring updates, deploy the app and subscribe to the public calendar endpoint using the webcal version of your app URL. This version provides one-way sync from BenFit to Apple Calendar.</p><div className="notice">Example: webcal://YOUR-DOMAIN.com/api/calendar</div></div></div>
    </section>

    <section className={"section "+(tab==="settings"?"active":"")}>
      <div className="card"><h2>Targets</h2><div className="row"><div className="field"><label>Calories</label><input type="number" value={profile.calorie_goal} onChange={e=>setProfile({...profile,calorie_goal:e.target.value})}/></div><div className="field"><label>Protein (g)</label><input type="number" value={profile.protein_goal} onChange={e=>setProfile({...profile,protein_goal:e.target.value})}/></div><div className="field"><label>Goal weight (kg)</label><input type="number" value={profile.goal_weight} onChange={e=>setProfile({...profile,goal_weight:e.target.value})}/></div><button className="btn" onClick={saveProfile}>Save</button></div></div>
    </section>
  </main>
}
