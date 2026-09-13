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

const avatarChoices = [
  {id:"bolt",emoji:"⚡",label:"Bolt"},
  {id:"lion",emoji:"🦁",label:"Lion"},
  {id:"wolf",emoji:"🐺",label:"Wolf"},
  {id:"tiger",emoji:"🐯",label:"Tiger"},
  {id:"gorilla",emoji:"🦍",label:"Gorilla"},
  {id:"robot",emoji:"🤖",label:"Robot"},
  {id:"fire",emoji:"🔥",label:"Fire"},
  {id:"crown",emoji:"👑",label:"Crown"}
];

function todayISO(){return new Date().toISOString().slice(0,10)}



function TrendChart({data,suffix=""}){
  if(!data || data.length<2) return <p className="muted">Add at least two entries to see a trend.</p>;
  const W=600,H=220,pad=30;
  const vals=data.map(x=>x.value);
  const min=Math.min(...vals), max=Math.max(...vals);
  const span=Math.max(1,max-min);
  const points=data.map((x,i)=>{
    const px=pad+(W-pad*2)*(i/(data.length-1));
    const py=pad+(H-pad*2)*(1-(x.value-min)/span);
    return `${px},${py}`;
  }).join(" ");
  return <div className="trendWrap">
    <svg viewBox={`0 0 ${W} ${H}`} className="trendSvg" role="img" aria-label="Trend chart">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((x,i)=>{
        const [cx,cy]=points.split(" ")[i].split(",");
        return <circle key={i} cx={cx} cy={cy} r="4" fill="currentColor"/>;
      })}
    </svg>
    <div className="trendLegend"><span>{data[0].value.toFixed(1)} {suffix}</span><span>{data.at(-1).value.toFixed(1)} {suffix}</span></div>
  </div>
}


function MetricRing({value,max,label,sub,icon}){
  const pct=max>0?Math.max(0,Math.min(100,(value/max)*100)):0;
  return <div className="nativeRingCard">
    <div className="ringWrap" style={{"--pct":`${pct*3.6}deg`}}>
      <div className="ringInner"><span className="ringIcon">{icon}</span><b>{Math.round(value)}</b><small>{label}</small></div>
    </div>
    <div className="ringMeta"><b>{Math.round(pct)}%</b><small>{sub}</small></div>
  </div>
}

function NativeTitle({title,subtitle,action}){
  return <div className="nativeTitleRow"><div><div className="eyebrow">BenFit</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>
}

function ProgressPhotoUploader({onUpload}){
  const [pose,setPose]=useState("front");
  const [date,setDate]=useState(todayISO());
  const [file,setFile]=useState(null);
  return <div>
    <div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
    <div className="field"><label>Pose</label><select value={pose} onChange={e=>setPose(e.target.value)}><option value="front">Front</option><option value="side">Side</option><option value="back">Back</option></select></div>
    <div className="field"><label>Photo</label><input type="file" accept="image/*" capture="environment" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
    <button className="btn" onClick={()=>file&&onUpload(file,pose,date)}>Upload progress photo</button>
  </div>
}

export default function Home(){
  const sb = useMemo(()=>supabaseBrowser(),[]);
  const [session,setSession]=useState(null), [loading,setLoading]=useState(true), [tab,setTab]=useState("dashboard"), [theme,setTheme]=useState("emerald"), [showOnboarding,setShowOnboarding]=useState(false), [moreOpen,setMoreOpen]=useState(false);
  const [foods,setFoods]=useState([]),[weights,setWeights]=useState([]),[profile,setProfile]=useState({calorie_goal:2500,protein_goal:200,goal_weight:95,username:"",display_name:"",avatar:"bolt",bio:"",age:"",sex:"male",height_cm:"",start_weight_kg:"",activity_level:"moderate",goal_type:"lose"}),[measurements,setMeasurements]=useState([]),[prs,setPrs]=useState([]),[progressPhotos,setProgressPhotos]=useState([]),[dailyLogs,setDailyLogs]=useState([]),[workoutSets,setWorkoutSets]=useState([]),[checkins,setCheckins]=useState([]),[calendarEvents,setCalendarEvents]=useState([]),[calendarSettings,setCalendarSettings]=useState(null),[pushEnabled,setPushEnabled]=useState(false);
  const [manual,setManual]=useState({name:"",calories:"",protein:""}), [barcode,setBarcode]=useState(""), [scanMsg,setScanMsg]=useState("");
  const [photo,setPhoto]=useState(null),[photoResult,setPhotoResult]=useState(null),[photoBusy,setPhotoBusy]=useState(false),[photoItems,setPhotoItems]=useState([]);
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[authMsg,setAuthMsg]=useState("");
  const scannerRef=useRef(null);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [isStandalone,setIsStandalone]=useState(false);

  useEffect(()=>{
    sb.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});
    const {data:{subscription}}=sb.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[sb]);

  useEffect(()=>{
    const saved=localStorage.getItem("benfit-theme")||"emerald";
    setTheme(saved);
    document.documentElement.dataset.theme=saved;
  },[]);

  function changeTheme(next){
    setTheme(next);
    localStorage.setItem("benfit-theme",next);
    document.documentElement.dataset.theme=next;
  }


  useEffect(()=>{
    if(typeof window==="undefined") return;
    setIsStandalone(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone===true);
    const handler=e=>{e.preventDefault();setInstallPrompt(e)};
    window.addEventListener("beforeinstallprompt",handler);
    return ()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  async function installApp(){
    if(installPrompt){
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    alert("On iPhone: open BenFit in Safari → Share → Add to Home Screen. On Android: open the browser menu → Install app / Add to Home screen.");
  }

  useEffect(()=>{ if(session) refresh(); },[session]);

  async function refresh(){
    const uid=session.user.id;
    const [f,w,p,m,pr,ph,dl,ws,ci,ce,cs,ps]=await Promise.all([
      sb.from("food_logs").select("*").eq("user_id",uid).eq("eaten_on",todayISO()).order("created_at",{ascending:false}),
      sb.from("weights").select("*").eq("user_id",uid).order("logged_on",{ascending:true}),
      sb.from("profiles").select("*").eq("id",uid).maybeSingle(),
      sb.from("measurements").select("*").eq("user_id",uid).order("logged_on",{ascending:true}),
      sb.from("workout_prs").select("*").eq("user_id",uid).order("logged_on",{ascending:false}),
      sb.from("progress_photos").select("*").eq("user_id",uid).order("logged_on",{ascending:false}),
      sb.from("daily_logs").select("*").eq("user_id",uid).order("logged_on",{ascending:false}).limit(60),
      sb.from("workout_sets").select("*").eq("user_id",uid).order("logged_on",{ascending:false}).order("created_at",{ascending:false}).limit(200),
      sb.from("weekly_checkins").select("*").eq("user_id",uid).order("week_of",{ascending:false}).limit(20),
      sb.from("calendar_events").select("*").eq("user_id",uid).order("event_date",{ascending:true}).order("start_time",{ascending:true}),
      sb.from("calendar_settings").select("*").eq("user_id",uid).maybeSingle(),
      sb.from("push_subscriptions").select("id").eq("user_id",uid).limit(1)
    ]);
    if(!f.error)setFoods(f.data||[]);
    if(!w.error)setWeights(w.data||[]);
    if(p.data){
      setProfile(p.data);
      if(!p.data.username || !p.data.display_name || !p.data.start_weight_kg || !p.data.goal_weight) setShowOnboarding(true);
    }
    if(!m.error)setMeasurements(m.data||[]);
    if(!pr.error)setPrs(pr.data||[]);
    if(!ph.error)setProgressPhotos(ph.data||[]);
    if(!dl.error)setDailyLogs(dl.data||[]);
    if(!ws.error)setWorkoutSets(ws.data||[]);
    if(!ci.error)setCheckins(ci.data||[]);
    if(!ce.error)setCalendarEvents(ce.data||[]);
    if(cs.data)setCalendarSettings(cs.data);
    if(!ps.error)setPushEnabled((ps.data||[]).length>0);
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
    setScanMsg("Starting camera...");
    try{
      if(scannerRef.current) await stopScanner();
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader", { verbose:false });
      scannerRef.current = scanner;

      const onSuccess = async (decodedText) => {
        setScanMsg(`Barcode detected: ${decodedText}`);
        await stopScanner();
        setBarcode(decodedText);
        await lookupBarcode(decodedText);
      };

      await scanner.start(
        { facingMode:"environment" },
        {
          fps:10,
          qrbox:{ width:280, height:140 },
          aspectRatio:1.7778,
          formatsToSupport: [
            5,   // EAN_13
            6,   // EAN_8
            14,  // UPC_A
            15,  // UPC_E
            10   // CODE_128
          ]
        },
        onSuccess,
        () => {}
      );
      setScanMsg("Point the camera at the barcode. Hold it steady and fill the box.");
    }catch(e){
      console.error(e);
      setScanMsg("Could not start the scanner. Make sure camera permission is allowed, then try again.");
    }
  }

  async function stopScanner(){
    const scanner=scannerRef.current;
    scannerRef.current=null;
    if(scanner){
      try{
        const state=scanner.getState?.();
        if(state===2 || state===3) await scanner.stop();
      }catch{}
      try{await scanner.clear();}catch{}
    }
  }

  async function analyzePhoto(file){
    setPhoto(file); setPhotoResult(null); setPhotoItems([]); setPhotoBusy(true);
    try{
      const fd=new FormData();fd.append("image",file);
      const r=await fetch("/api/analyze-food",{method:"POST",body:fd});
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||"Analysis failed");
      setPhotoResult(j);
      setPhotoItems((j.items||[]).map((x,i)=>({
        id:i+1,
        name:x.name||`Item ${i+1}`,
        portion:x.portion||"",
        calories:+x.calories||0,
        protein:+x.protein||0,
        confidence:x.confidence||"medium"
      })));
    }catch(e){setPhotoResult({error:e.message});}
    setPhotoBusy(false);
  }

  function updatePhotoItem(id,key,value){
    setPhotoItems(items=>items.map(x=>x.id===id?{...x,[key]:key==="calories"||key==="protein"?+value:value}:x));
  }

  function removePhotoItem(id){
    setPhotoItems(items=>items.filter(x=>x.id!==id));
  }

  async function savePhotoMeal(){
    if(!photoItems.length){alert("No meal items to save.");return}
    for(const item of photoItems){
      await addFood({
        name:`${item.name}${item.portion?` (${item.portion})`:""}`,
        calories:item.calories,
        protein:item.protein,
        source:"photo_ai"
      });
    }
    setPhoto(null);setPhotoResult(null);setPhotoItems([]);
    setTab("dashboard");
  }

  async function addWeight(e){
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const {error}=await sb.from("weights").insert({user_id:session.user.id,logged_on:fd.get("date"),weight_kg:+fd.get("weight")});
    if(error)alert(error.message);else{e.currentTarget.reset();refresh();}
  }
  async function saveProfile(){
    const row={
      id:session.user.id,
      calorie_goal:+profile.calorie_goal||2500,
      protein_goal:+profile.protein_goal||160,
      goal_weight:+profile.goal_weight||95,
      age:+profile.age||null,
      sex:profile.sex||"male",
      height_cm:+profile.height_cm||null,
      start_weight_kg:+profile.start_weight_kg||null,
      activity_level:profile.activity_level||"moderate",
      goal_type:profile.goal_type||"lose"
    };
    const {error}=await sb.from("profiles").upsert(row);
    if(error)alert(error.message);else{ setProfile({...profile,...row}); alert("Goals saved."); }
  }


  async function addMeasurement(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const row={
      user_id:session.user.id,
      logged_on:fd.get("date"),
      waist_cm:+fd.get("waist")||null,
      chest_cm:+fd.get("chest")||null,
      arm_cm:+fd.get("arm")||null,
      thigh_cm:+fd.get("thigh")||null
    };
    const {error}=await sb.from("measurements").insert(row);
    if(error) alert(error.message); else {e.currentTarget.reset();refresh();}
  }

  async function addPR(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const row={
      user_id:session.user.id,
      logged_on:fd.get("date"),
      exercise:String(fd.get("exercise")||"").trim(),
      weight_kg:+fd.get("weight")||0,
      reps:+fd.get("reps")||0
    };
    if(!row.exercise){alert("Enter an exercise.");return}
    const {error}=await sb.from("workout_prs").insert(row);
    if(error) alert(error.message); else {e.currentTarget.reset();refresh();}
  }

  async function uploadProgressPhoto(file, pose, date){
    if(!file)return;
    const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
    const key=`${session.user.id}/${date || todayISO()}-${pose}-${Date.now()}.${ext}`;
    const up=await sb.storage.from("progress-photos").upload(key,file,{upsert:false,contentType:file.type||"image/jpeg"});
    if(up.error){alert(up.error.message);return}
    const pub=sb.storage.from("progress-photos").getPublicUrl(key);
    const {error}=await sb.from("progress_photos").insert({
      user_id:session.user.id,
      logged_on:date || todayISO(),
      pose,
      image_url:pub.data.publicUrl,
      storage_path:key
    });
    if(error) alert(error.message); else refresh();
  }

  async function deleteProgressPhoto(photo){
    if(photo.storage_path) await sb.storage.from("progress-photos").remove([photo.storage_path]);
    await sb.from("progress_photos").delete().eq("id",photo.id);
    refresh();
  }

  function avgWeightLast(days){
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days+1);
    const vals=weights.filter(x=>new Date(x.logged_on+"T12:00:00")>=cutoff).map(x=>+x.weight_kg);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  }

  function weeklyChange(){
    if(weights.length<2) return null;
    const latest7=weights.slice(-7).map(x=>+x.weight_kg);
    const prev7=weights.slice(-14,-7).map(x=>+x.weight_kg);
    if(!latest7.length||!prev7.length) return null;
    const a=latest7.reduce((s,x)=>s+x,0)/latest7.length;
    const b=prev7.reduce((s,x)=>s+x,0)/prev7.length;
    return a-b;
  }


  async function saveDailyLog(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const row={
      user_id:session.user.id,
      logged_on:todayISO(),
      water_l:+fd.get("water")||0,
      sleep_h:+fd.get("sleep")||0,
      steps:+fd.get("steps")||0,
      workout_done:fd.get("workout_done")==="on",
      protein_hit:fd.get("protein_hit")==="on"
    };
    const {error}=await sb.from("daily_logs").upsert(row,{onConflict:"user_id,logged_on"});
    if(error) alert(error.message); else refresh();
  }

  function estimated1RM(weight,reps){
    return reps>0 ? weight*(1+reps/30) : weight;
  }

  async function addWorkoutSet(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const exercise=String(fd.get("exercise")||"").trim();
    const weight=+fd.get("weight")||0;
    const reps=+fd.get("reps")||0;
    const setNo=+fd.get("set_no")||1;
    if(!exercise||!reps){alert("Enter an exercise and reps.");return}
    const e1rm=estimated1RM(weight,reps);

    const prev=workoutSets.filter(s=>s.exercise.toLowerCase()===exercise.toLowerCase());
    const prevBest=prev.length?Math.max(...prev.map(s=>estimated1RM(+s.weight_kg,+s.reps))):0;

    const {error}=await sb.from("workout_sets").insert({
      user_id:session.user.id,
      logged_on:todayISO(),
      exercise,
      set_no:setNo,
      weight_kg:weight,
      reps
    });
    if(error){alert(error.message);return}

    if(e1rm>prevBest+0.1){
      await sb.from("workout_prs").insert({
        user_id:session.user.id,
        logged_on:todayISO(),
        exercise,
        weight_kg:weight,
        reps
      });
    }
    e.currentTarget.reset();
    refresh();
  }

  async function addCheckin(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const row={
      user_id:session.user.id,
      week_of:fd.get("week_of"),
      energy:+fd.get("energy")||3,
      hunger:+fd.get("hunger")||3,
      adherence:+fd.get("adherence")||0,
      notes:String(fd.get("notes")||"")
    };
    const {error}=await sb.from("weekly_checkins").upsert(row,{onConflict:"user_id,week_of"});
    if(error) alert(error.message); else {e.currentTarget.reset();refresh();}
  }

  function currentDaily(){
    return dailyLogs.find(x=>x.logged_on===todayISO())||{};
  }

  function adherenceScore(){
    const d=currentDaily();
    let score=0, total=5;
    if(totals.pro>=profile.protein_goal) score++;
    if(totals.cal<=profile.calorie_goal && totals.cal>=profile.calorie_goal*0.7) score++;
    if((d.water_l||0)>=3) score++;
    if((d.sleep_h||0)>=7) score++;
    if((d.steps||0)>=8000) score++;
    return Math.round(score/total*100);
  }

  function streakDays(){
    const sorted=[...dailyLogs].sort((a,b)=>b.logged_on.localeCompare(a.logged_on));
    let streak=0;
    for(let i=0;i<sorted.length;i++){
      const d=sorted[i];
      const ok=(d.water_l||0)>=3 && (d.sleep_h||0)>=7 && (d.steps||0)>=8000;
      if(ok) streak++; else break;
    }
    return streak;
  }

  function mealSuggestions(){
    const cal=Math.max(0,profile.calorie_goal-totals.cal);
    const pro=Math.max(0,profile.protein_goal-totals.pro);
    if(cal<200) return ["Greek yogurt or fruit","Low-calorie vegetables","Water / zero-calorie drink"];
    if(pro>70) return ["Chicken rice bowl","Lean beef + potatoes","Tuna wrap + Greek yogurt"];
    if(pro>35) return ["Turkey wrap + fruit","Egg-white omelet + toast","Protein shake + yogurt"];
    return ["Fruit + Greek yogurt","Popcorn + protein shake","Light dinner with vegetables"];
  }

  function nextMilestone(){
    const current=weights.length?+weights.at(-1).weight_kg:(+profile.start_weight_kg||120);
    const goal=+profile.goal_weight||current;
    if(goal<current){
      const next=Math.max(goal,Math.floor((current-0.01)/5)*5);
      return next;
    }
    if(goal>current){
      const next=Math.min(goal,Math.ceil((current+0.01)/5)*5);
      return next;
    }
    return goal;
  }


  function avatarEmoji(id){
    return avatarChoices.find(a=>a.id===id)?.emoji || "⚡";
  }

  function greeting(){
    const h=new Date().getHours();
    if(h<12) return "Good morning";
    if(h<18) return "Good afternoon";
    return "Good evening";
  }

  function firstName(){
    const n=(profile.display_name||profile.username||session?.user?.email?.split("@")[0]||"Athlete").trim();
    return n.split(/\s+/)[0];
  }

  function calculateSuggestedTargets(){
    const age=+profile.age, height=+profile.height_cm, weight=+profile.start_weight_kg, goal=+profile.goal_weight;
    if(!age||!height||!weight||!goal){alert("Add age, height, current weight and goal weight first.");return}
    const sexAdjust=profile.sex==="female"?-161:5;
    const bmr=10*weight+6.25*height-5*age+sexAdjust;
    const mult={sedentary:1.2,light:1.375,moderate:1.55,very_active:1.725}[profile.activity_level]||1.55;
    const maintenance=bmr*mult;
    let calories=maintenance;
    if(profile.goal_type==="lose") calories-=500;
    if(profile.goal_type==="gain") calories+=250;
    calories=Math.round(calories/50)*50;
    const proteinBase=profile.goal_type==="lose"?goal:weight;
    const protein=Math.round(proteinBase*(profile.goal_type==="gain"?1.7:1.8));
    setProfile(p=>({...p,calorie_goal:Math.max(1400,calories),protein_goal:Math.max(80,protein)}));
  }

  async function savePersonalProfile(){
    const username=(profile.username||"").trim().toLowerCase().replace(/[^a-z0-9_]/g,"");
    const row={
      id:session.user.id,
      username,
      display_name:(profile.display_name||"").trim(),
      avatar:profile.avatar||"bolt",
      bio:(profile.bio||"").trim(),
      age:+profile.age||null,
      sex:profile.sex||"male",
      height_cm:+profile.height_cm||null,
      start_weight_kg:+profile.start_weight_kg||null,
      activity_level:profile.activity_level||"moderate",
      goal_type:profile.goal_type||"lose",
      calorie_goal:+profile.calorie_goal||2500,
      protein_goal:+profile.protein_goal||160,
      goal_weight:+profile.goal_weight||95
    };
    if(!row.username){alert("Choose a username.");return}
    if(!row.display_name){alert("Add your display name.");return}
    if(!row.start_weight_kg || !row.goal_weight){alert("Add your current and goal weight.");return}
    const {error}=await sb.from("profiles").upsert(row);
    if(error){alert(error.message);return}

    const existing=await sb.from("weights").select("id").eq("user_id",session.user.id).limit(1);
    if(!existing.error && !(existing.data||[]).length && row.start_weight_kg){
      await sb.from("weights").insert({user_id:session.user.id,logged_on:todayISO(),weight_kg:row.start_weight_kg});
    }

    setProfile({...profile,...row});
    setShowOnboarding(false);
    refresh();
  }

  async function goTo(next){
    await stopScanner();
    setTab(next);
    setMoreOpen(false);
    if(typeof window!=="undefined") window.scrollTo({top:0,behavior:"smooth"});
  }

  function quickGo(next){ goTo(next); }

  function journeyPercent(){
    const start=+profile.start_weight_kg || (weights.length?+weights[0].weight_kg:120);
    const current=weights.length?+weights.at(-1).weight_kg:start;
    const goal=+profile.goal_weight||start;
    if(start===goal) return 100;
    const total=Math.abs(start-goal), moved=Math.abs(start-current);
    const inRightDirection=(goal<start&&current<=start)||(goal>start&&current>=start);
    return inRightDirection?Math.max(0,Math.min(100,(moved/total)*100)):0;
  }


  function urlBase64ToUint8Array(base64String){
    const padding="=".repeat((4-base64String.length%4)%4);
    const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
    const raw=window.atob(base64);
    return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
  }

  async function enablePushNotifications(){
    try{
      if(!("serviceWorker" in navigator) || !("PushManager" in window)){
        alert("Push notifications are not supported in this browser.");
        return;
      }
      const permission=await Notification.requestPermission();
      if(permission!=="granted"){
        alert("Notification permission was not granted.");
        return;
      }
      const reg=await navigator.serviceWorker.ready;
      const vapid=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if(!vapid){
        alert("BenFit push notifications are not configured yet. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY in Vercel.");
        return;
      }
      let sub=await reg.pushManager.getSubscription();
      if(!sub){
        sub=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(vapid)
        });
      }
      const payload=sub.toJSON();
      const {error}=await sb.from("push_subscriptions").upsert({
        user_id:session.user.id,
        endpoint:payload.endpoint,
        p256dh:payload.keys?.p256dh||"",
        auth:payload.keys?.auth||"",
        user_agent:navigator.userAgent
      },{onConflict:"endpoint"});
      if(error) throw error;
      setPushEnabled(true);
      new Notification("BenFit notifications enabled",{body:"Workout, weigh-in, meal-prep, and custom calendar reminders can now reach this device."});
    }catch(e){
      alert(e.message||"Could not enable notifications.");
    }
  }

  async function disablePushNotifications(){
    try{
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.getSubscription();
      if(sub){
        await sb.from("push_subscriptions").delete().eq("endpoint",sub.endpoint);
        await sub.unsubscribe();
      }
      setPushEnabled(false);
    }catch(e){ alert(e.message||"Could not disable notifications."); }
  }

  async function ensureCalendarSettings(){
    if(calendarSettings) return calendarSettings;
    const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
    const {data,error}=await sb.from("calendar_settings").upsert({
      user_id:session.user.id,
      timezone
    },{onConflict:"user_id"}).select().single();
    if(error) throw error;
    setCalendarSettings(data);
    return data;
  }

  async function addCalendarEvent(e){
    e.preventDefault();
    const fd=new FormData(e.currentTarget);
    const row={
      user_id:session.user.id,
      title:String(fd.get("title")||"").trim(),
      category:String(fd.get("category")||"custom"),
      event_date:String(fd.get("date")||todayISO()),
      start_time:String(fd.get("start_time")||"08:00"),
      end_time:String(fd.get("end_time")||"09:00"),
      repeat_rule:String(fd.get("repeat_rule")||"none"),
      reminder_minutes:+fd.get("reminder_minutes")||0,
      notes:String(fd.get("notes")||"").trim(),
      color:String(fd.get("color")||"green")
    };
    if(!row.title){alert("Enter an event title.");return}
    const {error}=await sb.from("calendar_events").insert(row);
    if(error) alert(error.message); else {e.currentTarget.reset();refresh();}
  }

  async function deleteCalendarEvent(id){
    await sb.from("calendar_events").delete().eq("id",id);
    refresh();
  }

  async function seedWorkoutCalendar(){
    const existing=calendarEvents.some(x=>x.category==="workout");
    if(existing && !confirm("You already have workout events. Add the starter workout week anyway?")) return;
    const today=new Date();
    const nextDateFor=(weekday)=>{
      const d=new Date(today);
      const diff=(weekday-d.getDay()+7)%7;
      d.setDate(d.getDate()+diff);
      return d.toISOString().slice(0,10);
    };
    const rows=[
      {day:1,title:"Push workout",start:"19:00",end:"20:15"},
      {day:2,title:"Pull workout",start:"08:00",end:"09:00"},
      {day:4,title:"Leg workout",start:"17:00",end:"18:20"},
      {day:5,title:"Upper workout",start:"16:00",end:"17:15"},
      {day:6,title:"Lower + Core",start:"11:00",end:"12:20"}
    ].map(x=>({
      user_id:session.user.id,
      title:x.title,
      category:"workout",
      event_date:nextDateFor(x.day),
      start_time:x.start,
      end_time:x.end,
      repeat_rule:"weekly",
      reminder_minutes:30,
      color:"green"
    }));
    const {error}=await sb.from("calendar_events").insert(rows);
    if(error) alert(error.message); else refresh();
  }

  async function updateCalendarTimezone(){
    try{
      const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";
      const {data,error}=await sb.from("calendar_settings").upsert({
        user_id:session.user.id,
        timezone
      },{onConflict:"user_id"}).select().single();
      if(error) throw error;
      setCalendarSettings(data);
      alert(`Calendar timezone set to ${timezone}`);
    }catch(e){alert(e.message)}
  }

  async function copyCalendarFeed(){
    try{
      const s=await ensureCalendarSettings();
      const url=`${window.location.origin}/api/calendar/${s.feed_token}`;
      await navigator.clipboard.writeText(url.replace(/^https:/,"webcal:"));
      alert("Personal Apple Calendar subscription link copied.");
    }catch(e){alert(e.message)}
  }

  function nextCalendarEvents(){
    const now=new Date();
    const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return [...calendarEvents].sort((a,b)=>{
      const aa=`${a.event_date}T${a.start_time||"00:00"}`;
      const bb=`${b.event_date}T${b.start_time||"00:00"}`;
      return aa.localeCompare(bb);
    }).slice(0,12);
  }

  const totals=foods.reduce((a,f)=>({cal:a.cal+(f.calories||0),pro:a.pro+(f.protein_g||0)}),{cal:0,pro:0});
  const avg7=avgWeightLast(7), change7=weeklyChange(), latestMeasurement=measurements.at(-1), daily=currentDaily(), score=adherenceScore(), streak=streakDays(), remainingCal=Math.max(0,profile.calorie_goal-totals.cal), remainingPro=Math.max(0,profile.protein_goal-totals.pro), milestone=nextMilestone(), journey=journeyPercent(), avatar=avatarEmoji(profile.avatar);
  if(loading)return <main className="shell"><div className="card">Loading BenFit...</div></main>;
  if(!session)return <main className="shell auth"><div className="card"><h1>BenFit Journey</h1><p className="muted">Sign in to sync your journey across phones, tablets and computers.</p><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div><div style={{display:"flex",gap:8}}><button className="btn" onClick={signIn}>Sign in</button><button className="btn secondary" onClick={signUp}>Create account</button></div><p className="muted small">{authMsg}</p></div></main>;

  return <main className="shell">
    <header className="nativeTopbar">
      <div className="brandWrap nativeBrand">
        <div className="brandLogoWrap"><img src="/benfit-logo.png" alt="BenFit logo" className="brandLogo"/></div>
        <div><div className="brand">BenFit</div><div className="muted small brandTagline">Track • Fuel • Train • Progress</div></div>
      </div>
      <div className="topActions">
        {!isStandalone&&<button className="installMini" onClick={installApp} aria-label="Install BenFit">↓</button>}
        <button className="profileChip" onClick={()=>goTo("profile")}>
          <span className="profileAvatar">{avatar}</span>
          <span><b>{profile.display_name||profile.username||"Set up profile"}</b><small>@{profile.username||"username"}</small></span>
        </button>
        <button className="appMenuBtn" onClick={()=>setMoreOpen(v=>!v)} aria-label="Open menu">•••</button>
      </div>
    </header>
    <nav className="desktopAppNav" aria-label="Primary navigation">
      <button className={tab==="dashboard"?"active":""} onClick={()=>goTo("dashboard")}><span>⌂</span>Home</button>
      <button className={["food","scanner"].includes(tab)?"active":""} onClick={()=>goTo("food")}><span>◉</span>Nutrition</button>
      <button className={["train","workouts","prs"].includes(tab)?"active":""} onClick={()=>goTo("train")}><span>◆</span>Training</button>
      <button className={["progress","measurements","photos","checkin"].includes(tab)?"active":""} onClick={()=>goTo("progress")}><span>↗</span>Progress</button>
      <button className={tab==="profile"?"active":""} onClick={()=>goTo("profile")}><span>●</span>Profile</button>
      <button className={moreOpen?"active":""} onClick={()=>setMoreOpen(v=>!v)}><span>•••</span>More</button>
    </nav>

    <section className={"section "+(tab==="dashboard"?"active":"")}>
      <NativeTitle
        title={`${greeting()}, ${firstName()}`}
        subtitle="Your day, your targets, your next win."
        action={<button className="nativeAvatarButton" onClick={()=>goTo("profile")}>{avatar}</button>}
      />

      <div className="nativeHeroCard">
        <div className="nativeHeroCopy">
          <span className="nativePill">{profile.goal_type==="gain"?"BUILD PHASE":profile.goal_type==="maintain"?"MAINTENANCE":"CUT PHASE"}</span>
          <h2>{Math.round(journey)}% to your goal</h2>
          <p>{weights.length?weights.at(-1).weight_kg:profile.start_weight_kg||"—"} kg now · {profile.goal_weight} kg target</p>
        </div>
        <div className="nativeHeroProgress"><span style={{width:`${journey}%`}}/></div>
        <div className="nativeHeroStats"><span><b>{streak}</b><small>day streak</small></span><span><b>{score}%</b><small>adherence</small></span><span><b>{milestone}</b><small>next kg goal</small></span></div>
      </div>

      <div className="nativeRingGrid">
        <MetricRing value={totals.cal} max={profile.calorie_goal} label="kcal" sub={`${remainingCal} left`} icon="🔥"/>
        <MetricRing value={totals.pro} max={profile.protein_goal} label="protein" sub={`${Math.round(remainingPro)} g left`} icon="⚡"/>
        <MetricRing value={daily.steps||0} max={10000} label="steps" sub="10k target" icon="👟"/>
      </div>

      <div className="nativeSectionLabel"><h2>Quick log</h2><button onClick={()=>setMoreOpen(true)}>All tools</button></div>
      <div className="nativeQuickGrid">
        <button onClick={()=>quickGo("food")}><span>＋</span><b>Food</b><small>Log a meal</small></button>
        <button onClick={()=>quickGo("scanner")}><span>▦</span><b>Scan</b><small>Barcode</small></button>
        <button onClick={()=>quickGo("train")}><span>◆</span><b>Workout</b><small>Log sets</small></button>
        <button onClick={()=>quickGo("progress")}><span>↗</span><b>Weight</b><small>Check in</small></button>
      </div>

      <div className="nativeDashboardGrid">
        <div className="nativePanel todayWorkoutPanel">
          <div className="nativePanelHead"><div><small>TODAY</small><h3>{new Date().toLocaleDateString(undefined,{weekday:"long"})}</h3></div><button onClick={()=>goTo("train")}>Start</button></div>
          <div className="todayWorkoutName">{plan[new Date().toLocaleDateString("en-US",{weekday:"long"})]?.at(-1)||"Recovery day"}</div>
          <div className="workoutMiniList">{(workout[new Date().toLocaleDateString("en-US",{weekday:"long"})]||["Walk, recover, and hit your steps."]).slice(0,3).map(x=><span key={x}>• {x}</span>)}</div>
        </div>
        <div className="nativePanel weightPanel">
          <div className="nativePanelHead"><div><small>WEIGHT TREND</small><h3>{avg7?`${avg7.toFixed(1)} kg`:"Build baseline"}</h3></div><button onClick={()=>goTo("progress")}>View</button></div>
          <div className={"trendBadge "+(change7!==null&&change7<0?"down":"")}>{change7===null?"Need more data":`${change7>0?"+":""}${change7.toFixed(1)} kg this week`}</div>
          <div className="miniProgressTrack"><span style={{width:`${journey}%`}}/></div>
        </div>
      </div>
      <div className="grid g4" style={{marginTop:14}}>
        <div className="card"><div className="muted">Calories left</div><div className="metric">{remainingCal}</div><div className="small muted">kcal remaining today</div></div>
        <div className="card"><div className="muted">Protein left</div><div className="metric">{Math.round(remainingPro)} g</div><div className="small muted">to hit target</div></div>
        <div className="card"><div className="muted">Adherence</div><div className="metric">{score}%</div><div className="small muted">based on food, water, sleep & steps</div></div>
        <div className="card"><div className="muted">Streak</div><div className="metric">{streak}</div><div className="small muted">strong days in a row</div></div>
      </div>
      <div className="grid g3" style={{marginTop:14}}>
        <div className="card"><div className="muted">7-day avg weight</div><div className="metric">{avg7?avg7.toFixed(1):"—"} kg</div><div className="small muted">Use this instead of a single weigh-in.</div></div>
        <div className="card"><div className="muted">Weekly trend</div><div className="metric">{change7===null?"—":`${change7>0?"+":""}${change7.toFixed(1)} kg`}</div><div className="small muted">{change7===null?"Need more weigh-ins":change7<0?"Trending down":"Trending up"}</div></div>
        <div className="card"><div className="muted">Waist</div><div className="metric">{latestMeasurement?.waist_cm?`${latestMeasurement.waist_cm} cm`:"—"}</div><div className="small muted">Latest body measurement</div></div>
      </div>
      <div className="grid g2" style={{marginTop:14}}>
        <div className="card">
          <h3>Next milestone</h3>
          <div className="metric">{milestone} kg</div>
          <p className="muted small">Keep the process simple: average weight down, strength maintained, waist down.</p>
        </div>
        <div className="card">
          <h3>What to eat next</h3>
          {mealSuggestions().map(x=><div className="fooditem" key={x}><span>{x}</span></div>)}
        </div>
      </div>
      <div className="grid g2" style={{marginTop:14}}>
        <form className="card" onSubmit={saveDailyLog}>
          <h3>Daily recovery log</h3>
          <div className="row">
            <div className="field"><label>Water (L)</label><input name="water" type="number" step="0.1" defaultValue={daily.water_l||""}/></div>
            <div className="field"><label>Sleep (h)</label><input name="sleep" type="number" step="0.1" defaultValue={daily.sleep_h||""}/></div>
            <div className="field"><label>Steps</label><input name="steps" type="number" defaultValue={daily.steps||""}/></div>
            <button className="btn">Save day</button>
          </div>
          <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
            <label className="checkline"><input name="workout_done" type="checkbox" defaultChecked={!!daily.workout_done}/> Workout done</label>
            <label className="checkline"><input name="protein_hit" type="checkbox" defaultChecked={!!daily.protein_hit}/> Protein hit</label>
          </div>
        </form>
        <div className="card"><h3>Today's food</h3>{foods.length?foods.slice(0,5).map(f=><div className="fooditem" key={f.id}><div><b>{f.name}</b><div className="small muted">{f.source} • {f.calories} kcal • {f.protein_g} g protein</div></div></div>):<p className="muted">No food logged yet.</p>}</div>
        <div className="card"><h3>Nutrition guardrails</h3><span className="pill">~2,500 kcal start</span><span className="pill">~200 g protein</span><span className="pill">3–4 L water</span><span className="pill">8–10k steps</span><p className="muted small">Photo estimates are approximate. Packaged-food barcode data is usually better, but always confirm the serving size on the label.</p></div>
      </div>
    </section>

    <section className={"section "+(tab==="food"?"active":"")}><NativeTitle title="Nutrition" subtitle="Fuel your target without overthinking it."/>
      <div className="grid g2">
        <div className="card"><h2>Log food</h2><div className="field"><label>Food</label><input value={manual.name} onChange={e=>setManual({...manual,name:e.target.value})}/></div><div className="row"><div className="field"><label>Calories</label><input type="number" value={manual.calories} onChange={e=>setManual({...manual,calories:e.target.value})}/></div><div className="field"><label>Protein (g)</label><input type="number" value={manual.protein} onChange={e=>setManual({...manual,protein:e.target.value})}/></div><div></div><button className="btn" onClick={()=>addFood({...manual,source:barcode?"barcode":"manual",barcode})}>Add</button></div>{scanMsg&&<p className="notice small">{scanMsg}</p>}</div>
        <div className="card">
          <h2>Meal photo analyzer</h2>
          <p className="muted small">Take or upload a meal photo. BenFit estimates each food item separately so you can fix portions before saving.</p>
          <input type="file" accept="image/*" capture="environment" onChange={e=>e.target.files[0]&&analyzePhoto(e.target.files[0])}/>
          {photo&&<img className="photo" src={URL.createObjectURL(photo)} alt="meal" style={{marginTop:10}}/>}
          {photoBusy&&<div className="notice" style={{marginTop:10}}>Analyzing foods, portions, calories and protein...</div>}
          {photoResult&&!photoResult.error&&<>
            <div className="notice" style={{marginTop:10}}>
              <b>{photoResult.meal_name || "Estimated meal"}</b>
              <p className="small muted">{photoResult.notes}</p>
            </div>
            <div style={{marginTop:10}}>
              {photoItems.map(item=><div key={item.id} className="mealEdit">
                <div className="mealEditTop">
                  <input value={item.name} onChange={e=>updatePhotoItem(item.id,"name",e.target.value)} aria-label="Food name"/>
                  <button className="btn red" onClick={()=>removePhotoItem(item.id)}>Remove</button>
                </div>
                <div className="mealEditGrid">
                  <div className="field"><label>Portion</label><input value={item.portion} onChange={e=>updatePhotoItem(item.id,"portion",e.target.value)} placeholder="e.g. 200 g"/></div>
                  <div className="field"><label>Calories</label><input type="number" value={item.calories} onChange={e=>updatePhotoItem(item.id,"calories",e.target.value)}/></div>
                  <div className="field"><label>Protein (g)</label><input type="number" step="0.1" value={item.protein} onChange={e=>updatePhotoItem(item.id,"protein",e.target.value)}/></div>
                  <div className="field"><label>Confidence</label><input value={item.confidence} disabled/></div>
                </div>
              </div>)}
            </div>
            <div className="notice" style={{marginTop:10}}>
              <b>Total: {Math.round(photoItems.reduce((s,x)=>s+(+x.calories||0),0))} kcal • {Math.round(photoItems.reduce((s,x)=>s+(+x.protein||0),0))} g protein</b>
            </div>
            <button className="btn" style={{marginTop:10}} onClick={savePhotoMeal}>Save meal to today</button>
          </>}
          {photoResult?.error&&<p className="notice">{photoResult.error}</p>}
        </div>
      </div>
      <div className="card" style={{marginTop:14}}><h3>Today's entries</h3>{foods.map(f=><div className="fooditem" key={f.id}><div><b>{f.name}</b><div className="small muted">{f.calories} kcal • {f.protein_g} g protein • {f.source}</div></div><button className="btn red" onClick={()=>deleteFood(f.id)}>Delete</button></div>)}</div>
    </section>

    <section className={"section "+(tab==="scanner"?"active":"")}><NativeTitle title="Scan food" subtitle="Point, scan, confirm, log."/>
      <div className="twoCol">
        <div className="card"><h2>Barcode scanner</h2><div className="scanner"><div id="qr-reader"/></div><div style={{display:"flex",gap:8,marginTop:10}}><button className="btn" onClick={startScanner}>Start camera</button><button className="btn secondary" onClick={stopScanner}>Stop</button></div><p className="muted small">{scanMsg || "Works on iPhone Safari, Android Chrome, and desktop browsers with camera access."}</p></div>
        <div className="card"><h2>Manual barcode lookup</h2><div className="field"><label>UPC / EAN</label><input value={barcode} onChange={e=>setBarcode(e.target.value)} placeholder="e.g. 012345678905"/></div><button className="btn" onClick={()=>lookupBarcode(barcode)}>Look up product</button><p className="muted small">Product data is fetched from Open Food Facts. Always confirm serving size against the package.</p></div>
      </div>
    </section>

    <section className={"section "+(tab==="progress"?"active":"")}><NativeTitle title="Progress" subtitle="Follow the trend, not one number."/>
      <div className="grid g2">
        <div className="card"><h2>Weight trend</h2><TrendChart data={weights.map(x=>({date:x.logged_on,value:+x.weight_kg}))} suffix="kg"/></div>
        <div className="card"><h2>Waist trend</h2><TrendChart data={measurements.filter(x=>x.waist_cm).map(x=>({date:x.logged_on,value:+x.waist_cm}))} suffix="cm"/></div>
      </div>
      <div className="grid g2" style={{marginTop:14}}>
        <form className="card" onSubmit={addWeight}><h2>Log weight</h2><div className="field"><label>Date</label><input name="date" type="date" defaultValue={todayISO()} required/></div><div className="field"><label>Weight (kg)</label><input name="weight" type="number" step="0.1" required/></div><button className="btn">Save weigh-in</button></form>
        <div className="card"><h2>History</h2>{weights.length?weights.slice().reverse().map(w=><div className="fooditem" key={w.id}><span>{w.logged_on}</span><b>{w.weight_kg} kg</b></div>):<p className="muted">No weigh-ins yet.</p>}</div>
      </div>
    </section>


    <section className={"section "+(tab==="measurements"?"active":"")}>
      <div className="grid g2">
        <form className="card" onSubmit={addMeasurement}>
          <h2>Body measurements</h2>
          <p className="muted small">Measure under similar conditions each time, ideally once per week.</p>
          <div className="field"><label>Date</label><input name="date" type="date" defaultValue={todayISO()} required/></div>
          <div className="row">
            <div className="field"><label>Waist (cm)</label><input name="waist" type="number" step="0.1"/></div>
            <div className="field"><label>Chest (cm)</label><input name="chest" type="number" step="0.1"/></div>
            <div className="field"><label>Arm (cm)</label><input name="arm" type="number" step="0.1"/></div>
            <div className="field"><label>Thigh (cm)</label><input name="thigh" type="number" step="0.1"/></div>
          </div>
          <button className="btn">Save measurements</button>
        </form>
        <div className="card">
          <h2>Measurement history</h2>
          {measurements.length?measurements.slice().reverse().map(m=><div className="measureRow" key={m.id}>
            <b>{m.logged_on}</b>
            <span>Waist {m.waist_cm??"—"} cm</span>
            <span>Chest {m.chest_cm??"—"} cm</span>
            <span>Arm {m.arm_cm??"—"} cm</span>
            <span>Thigh {m.thigh_cm??"—"} cm</span>
          </div>):<p className="muted">No measurements yet.</p>}
        </div>
      </div>
    </section>

    <section className={"section "+(tab==="photos"?"active":"")}>
      <div className="grid g2">
        <div className="card">
          <h2>Progress photos</h2>
          <p className="muted small">Use the same lighting, distance, and pose when possible.</p>
          <ProgressPhotoUploader onUpload={uploadProgressPhoto}/>
        </div>
        <div className="card">
          <h2>Photo history</h2>
          <div className="photoGrid">
            {progressPhotos.length?progressPhotos.map(p=><div className="progressPhotoCard" key={p.id}>
              <img src={p.image_url} alt={`${p.pose} progress`}/>
              <div className="small"><b>{p.pose}</b> • {p.logged_on}</div>
              <button className="btn red" onClick={()=>deleteProgressPhoto(p)}>Delete</button>
            </div>):<p className="muted">No progress photos yet.</p>}
          </div>
        </div>
      </div>
    </section>


    <section className={"section "+(tab==="train"?"active":"")}><NativeTitle title="Training" subtitle="Log the work. Beat the old you."/>
      <div className="grid g2">
        <form className="card" onSubmit={addWorkoutSet}>
          <h2>Workout logger</h2>
          <p className="muted small">Log every working set. BenFit automatically saves a PR when your estimated strength improves.</p>
          <div className="field"><label>Exercise</label><input name="exercise" placeholder="Bench Press" required/></div>
          <div className="row">
            <div className="field"><label>Set #</label><input name="set_no" type="number" min="1" defaultValue="1"/></div>
            <div className="field"><label>Weight (kg)</label><input name="weight" type="number" step="0.5"/></div>
            <div className="field"><label>Reps</label><input name="reps" type="number" min="1" required/></div>
            <button className="btn">Log set</button>
          </div>
        </form>
        <div className="card">
          <h2>Today's sets</h2>
          {workoutSets.filter(x=>x.logged_on===todayISO()).length?workoutSets.filter(x=>x.logged_on===todayISO()).map(s=><div className="fooditem" key={s.id}><div><b>{s.exercise}</b><div className="small muted">Set {s.set_no}</div></div><b>{s.weight_kg} kg × {s.reps}</b></div>):<p className="muted">No sets logged today.</p>}
        </div>
      </div>
    </section>

    <section className={"section "+(tab==="checkin"?"active":"")}>
      <div className="grid g2">
        <form className="card" onSubmit={addCheckin}>
          <h2>Weekly check-in</h2>
          <div className="field"><label>Week of</label><input name="week_of" type="date" defaultValue={todayISO()} required/></div>
          <div className="row">
            <div className="field"><label>Energy (1–5)</label><input name="energy" type="number" min="1" max="5" defaultValue="3"/></div>
            <div className="field"><label>Hunger (1–5)</label><input name="hunger" type="number" min="1" max="5" defaultValue="3"/></div>
            <div className="field"><label>Adherence %</label><input name="adherence" type="number" min="0" max="100" defaultValue={score}/></div>
            <div></div>
          </div>
          <div className="field"><label>Notes</label><textarea name="notes" rows="5" placeholder="What went well? What made the week difficult?"/></div>
          <button className="btn">Save weekly check-in</button>
        </form>
        <div className="card">
          <h2>Recent check-ins</h2>
          {checkins.length?checkins.map(c=><div className="checkinCard" key={c.id}><b>{c.week_of}</b><div className="small muted">Energy {c.energy}/5 • Hunger {c.hunger}/5 • Adherence {c.adherence}%</div><p>{c.notes}</p></div>):<p className="muted">No weekly check-ins yet.</p>}
        </div>
      </div>
    </section>

    <section className={"section "+(tab==="prs"?"active":"")}>
      <div className="grid g2">
        <form className="card" onSubmit={addPR}>
          <h2>Strength PR tracker</h2>
          <div className="field"><label>Date</label><input name="date" type="date" defaultValue={todayISO()} required/></div>
          <div className="field"><label>Exercise</label><input name="exercise" placeholder="Bench Press" required/></div>
          <div className="row">
            <div className="field"><label>Weight (kg)</label><input name="weight" type="number" step="0.5" required/></div>
            <div className="field"><label>Reps</label><input name="reps" type="number" required/></div>
            <div></div><button className="btn">Save PR</button>
          </div>
        </form>
        <div className="card">
          <h2>Recent PRs</h2>
          {prs.length?prs.map(p=><div className="fooditem" key={p.id}><div><b>{p.exercise}</b><div className="small muted">{p.logged_on}</div></div><b>{p.weight_kg} kg × {p.reps}</b></div>):<p className="muted">No PRs yet.</p>}
        </div>
      </div>
    </section>

    <section className={"section "+(tab==="schedule"?"active":"")}>
      <div className="schedule">{Object.entries(plan).map(([day,events])=><div className="day" key={day}><b>{day}</b>{events.map((e,i)=><div className={"event "+(e.includes("School")||e.includes("Class")?"school":e.includes("Club")?"club":e.includes("Work")?"":"gym")} key={i}>{e}</div>)}</div>)}</div>
    </section>

    <section className={"section "+(tab==="workouts"?"active":"")}>
      <div className="grid g2">{Object.entries(workout).map(([day,items])=><div className="card" key={day}><h3>{day}</h3>{items.map(x=><p key={x}>{x}</p>)}</div>)}</div>
    </section>

    <section className={"section "+(tab==="calendar"?"active":"")}>
      <NativeTitle title="My Calendar" subtitle="Your workouts, classes, work, meal prep, weigh-ins, and reminders — personalized to your account."/>
      <div className="calendarActionRow">
        <button className="btn" onClick={seedWorkoutCalendar}>＋ Starter workout week</button>
        <button className="btn secondary" onClick={copyCalendarFeed}> Copy Apple subscription</button>
        <button className="btn secondary" onClick={updateCalendarTimezone}>Use my timezone</button>
      </div>

      <div className="grid g2" style={{marginTop:14}}>
        <form className="card" onSubmit={addCalendarEvent}>
          <h2>Add event</h2>
          <div className="field"><label>Title</label><input name="title" placeholder="Gym — Push Day" required/></div>
          <div className="calendarFormGrid">
            <div className="field"><label>Category</label><select name="category"><option value="workout">Workout</option><option value="work">Work</option><option value="school">School / Class</option><option value="meal">Meal prep</option><option value="weighin">Weigh-in</option><option value="recovery">Recovery</option><option value="custom">Custom</option></select></div>
            <div className="field"><label>Date</label><input name="date" type="date" defaultValue={todayISO()} required/></div>
            <div className="field"><label>Starts</label><input name="start_time" type="time" defaultValue="08:00" required/></div>
            <div className="field"><label>Ends</label><input name="end_time" type="time" defaultValue="09:00" required/></div>
            <div className="field"><label>Repeats</label><select name="repeat_rule"><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
            <div className="field"><label>Reminder</label><select name="reminder_minutes"><option value="0">At event time</option><option value="10">10 min before</option><option value="15">15 min before</option><option value="30" selected>30 min before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></div>
            <div className="field"><label>Color</label><select name="color"><option value="green">Green</option><option value="blue">Blue</option><option value="purple">Purple</option><option value="orange">Orange</option><option value="pink">Pink</option></select></div>
          </div>
          <div className="field"><label>Notes</label><textarea name="notes" rows="3" placeholder="Optional notes..."/></div>
          <button className="btn">Save event</button>
        </form>

        <div className="card">
          <div className="calendarCardHead"><div><h2>Upcoming</h2><p className="muted small">{calendarSettings?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||"Local timezone"}</p></div></div>
          <div className="eventList">
            {nextCalendarEvents().length?nextCalendarEvents().map(ev=><div className={`calendarEvent event-${ev.color||"green"}`} key={ev.id}>
              <div className="calendarDateBadge"><b>{new Date(ev.event_date+"T12:00:00").toLocaleDateString(undefined,{day:"2-digit"})}</b><small>{new Date(ev.event_date+"T12:00:00").toLocaleDateString(undefined,{month:"short"})}</small></div>
              <div className="calendarEventBody"><b>{ev.title}</b><span>{ev.start_time?.slice(0,5)}–{ev.end_time?.slice(0,5)} · {ev.category}</span><small>{ev.repeat_rule!=="none"?`Repeats ${ev.repeat_rule} · `:""}Reminder {ev.reminder_minutes} min before</small></div>
              <button className="calendarDelete" onClick={()=>deleteCalendarEvent(ev.id)}>×</button>
            </div>):<p className="muted">Your calendar is empty. Add an event or generate the starter workout week.</p>}
          </div>
        </div>
      </div>

      <div className="grid g2" style={{marginTop:14}}>
        <div className="card">
          <h2>Push notifications</h2>
          <p className="muted">Receive BenFit reminders on supported phones and browsers. On iPhone, install BenFit to your Home Screen first, then enable notifications from the installed app.</p>
          <div className="notificationStatus"><span className={pushEnabled?"statusDot on":"statusDot"}></span><b>{pushEnabled?"Notifications enabled on this device":"Notifications off on this device"}</b></div>
          <button className="btn" onClick={pushEnabled?disablePushNotifications:enablePushNotifications}>{pushEnabled?"Disable on this device":"Enable notifications"}</button>
        </div>
        <div className="card">
          <h2>Apple / Google Calendar</h2>
          <p className="muted">Every BenFit account gets its own private calendar feed token. Subscribe once and your recurring BenFit events will stay separate from your friends' calendars.</p>
          <button className="btn secondary" onClick={copyCalendarFeed}>Copy my personal subscription</button>
          <p className="small muted" style={{marginTop:10}}>Apple Calendar: Add Calendar → Add Subscription Calendar → paste the copied webcal link. Google Calendar subscriptions are usually added from Google Calendar on the web using “From URL”.</p>
        </div>
      </div>
    </section>


    <section className={"section "+(tab==="profile"?"active":"")}><NativeTitle title="Profile" subtitle="Your identity, goals, and journey."/>
      <div className="profileHero card">
        <div className="profileHeroAvatar">{avatar}</div>
        <div className="profileHeroText">
          <div className="eyebrow">Your BenFit identity</div>
          <h2>{profile.display_name||"Your name"}</h2>
          <p className="muted">@{profile.username||"username"} {profile.bio?`• ${profile.bio}`:""}</p>
          <div className="profileGoalChips"><span>{profile.goal_type==="gain"?"Build":"Goal"}: {profile.goal_weight} kg</span><span>{profile.calorie_goal} kcal/day</span><span>{profile.protein_goal} g protein</span></div>
        </div>
      </div>

      <div className="grid g2" style={{marginTop:14}}>
        <div className="card">
          <h2>Edit profile</h2>
          <div className="field"><label>Display name</label><input value={profile.display_name||""} onChange={e=>setProfile({...profile,display_name:e.target.value})} placeholder="Ben"/></div>
          <div className="field"><label>Username</label><input value={profile.username||""} onChange={e=>setProfile({...profile,username:e.target.value})} placeholder="benfit"/></div>
          <div className="field"><label>Bio</label><input value={profile.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})} placeholder="Building a stronger version of me."/></div>
          <div className="miniFormGrid">
            <div className="field"><label>Age</label><input type="number" min="16" value={profile.age||""} onChange={e=>setProfile({...profile,age:e.target.value})}/></div>
            <div className="field"><label>Height (cm)</label><input type="number" value={profile.height_cm||""} onChange={e=>setProfile({...profile,height_cm:e.target.value})}/></div>
            <div className="field"><label>Starting weight (kg)</label><input type="number" step="0.1" value={profile.start_weight_kg||""} onChange={e=>setProfile({...profile,start_weight_kg:e.target.value})}/></div>
            <div className="field"><label>Goal weight (kg)</label><input type="number" step="0.1" value={profile.goal_weight||""} onChange={e=>setProfile({...profile,goal_weight:e.target.value})}/></div>
          </div>
          <button className="btn" onClick={savePersonalProfile}>Save profile</button>
        </div>
        <div className="card">
          <h2>Choose avatar</h2>
          <div className="avatarGrid">
            {avatarChoices.map(a=><button key={a.id} className={"avatarChoice "+(profile.avatar===a.id?"selected":"")} onClick={()=>setProfile({...profile,avatar:a.id})}>
              <span>{a.emoji}</span><small>{a.label}</small>
            </button>)}
          </div>
        </div>
      </div>

      <div className="grid g3" style={{marginTop:14}}>
        <div className="card statCard"><span>🔥</span><div><b>{streak}</b><small>Day streak</small></div></div>
        <div className="card statCard"><span>🏆</span><div><b>{prs.length}</b><small>PRs logged</small></div></div>
        <div className="card statCard"><span>📉</span><div><b>{weights.length?`${(+weights[0].weight_kg-(+weights.at(-1).weight_kg)).toFixed(1)} kg`:"0 kg"}</b><small>Total change</small></div></div>
      </div>
    </section>

    <section className={"section "+(tab==="settings"?"active":"")}>
      <div className="grid g2">
        <div className="card">
          <h2>Personal goals</h2>
          <p className="muted small">Every account has its own private targets and progress. Use the estimate as a starting point, then adjust from your real results.</p>
          <div className="miniFormGrid">
            <div className="field"><label>Age</label><input type="number" min="16" value={profile.age||""} onChange={e=>setProfile({...profile,age:e.target.value})}/></div>
            <div className="field"><label>Sex for calorie estimate</label><select value={profile.sex||"male"} onChange={e=>setProfile({...profile,sex:e.target.value})}><option value="male">Male</option><option value="female">Female</option></select></div>
            <div className="field"><label>Height (cm)</label><input type="number" value={profile.height_cm||""} onChange={e=>setProfile({...profile,height_cm:e.target.value})}/></div>
            <div className="field"><label>Starting weight (kg)</label><input type="number" step="0.1" value={profile.start_weight_kg||""} onChange={e=>setProfile({...profile,start_weight_kg:e.target.value})}/></div>
            <div className="field"><label>Goal type</label><select value={profile.goal_type||"lose"} onChange={e=>setProfile({...profile,goal_type:e.target.value})}><option value="lose">Lose fat / cut</option><option value="maintain">Maintain</option><option value="gain">Build / gain</option></select></div>
            <div className="field"><label>Goal weight (kg)</label><input type="number" step="0.1" value={profile.goal_weight||""} onChange={e=>setProfile({...profile,goal_weight:e.target.value})}/></div>
            <div className="field"><label>Activity</label><select value={profile.activity_level||"moderate"} onChange={e=>setProfile({...profile,activity_level:e.target.value})}><option value="sedentary">Mostly sedentary</option><option value="light">Lightly active</option><option value="moderate">Moderately active</option><option value="very_active">Very active</option></select></div>
          </div>
          <div className="targetEstimateRow"><button className="btn secondary" onClick={calculateSuggestedTargets}>Suggest my targets</button><span className="muted small">Estimate only — your weight trend is what we use to refine it.</span></div>
          <div className="targetNumbers"><div className="field"><label>Calories/day</label><input type="number" value={profile.calorie_goal} onChange={e=>setProfile({...profile,calorie_goal:e.target.value})}/></div><div className="field"><label>Protein/day (g)</label><input type="number" value={profile.protein_goal} onChange={e=>setProfile({...profile,protein_goal:e.target.value})}/></div></div>
          <button className="btn" onClick={saveProfile}>Save goals</button>
        </div>
        <div className="card">
          <h2>App appearance</h2>
          <p className="muted small">Change the entire BenFit color system. Your choice is saved on this device.</p>
          <div className="themeGrid">
            <button className={"themeChoice "+(theme==="emerald"?"selected":"")} onClick={()=>changeTheme("emerald")}>
              <span className="themeSwatch emeraldSwatch"></span>
              <span><b>Emerald Night</b><small>Black + emerald + mint</small></span>
            </button>
            <button className={"themeChoice "+(theme==="royal"?"selected":"")} onClick={()=>changeTheme("royal")}>
              <span className="themeSwatch royalSwatch"></span>
              <span><b>Royal Purple</b><small>Deep navy + violet</small></span>
            </button>
            <button className={"themeChoice "+(theme==="sunset"?"selected":"")} onClick={()=>changeTheme("sunset")}>
              <span className="themeSwatch sunsetSwatch"></span>
              <span><b>Sunset</b><small>Charcoal + orange + rose</small></span>
            </button>
            <button className={"themeChoice "+(theme==="frost"?"selected":"")} onClick={()=>changeTheme("frost")}>
              <span className="themeSwatch frostSwatch"></span>
              <span><b>Frost Light</b><small>Clean white + cobalt</small></span>
            </button>
          </div>
        </div>
      </div>
    </section>

    {moreOpen&&<div className="moreBackdrop" onClick={()=>setMoreOpen(false)}>
      <div className="moreSheet" onClick={e=>e.stopPropagation()}>
        <div className="moreHandle"/>
        <div className="moreTitle"><div><div className="eyebrow">BenFit</div><h2>More tools</h2></div><button onClick={()=>setMoreOpen(false)}>×</button></div>
        <div className="moreGrid">
          <button onClick={()=>goTo("scanner")}><span>▦</span><b>Barcode scanner</b><small>Scan packaged food</small></button>
          <button onClick={()=>goTo("measurements")}><span>⌁</span><b>Measurements</b><small>Waist, chest, arms</small></button>
          <button onClick={()=>goTo("photos")}><span>▣</span><b>Progress photos</b><small>Front, side, back</small></button>
          <button onClick={()=>goTo("prs")}><span>★</span><b>PRs</b><small>Strength records</small></button>
          <button onClick={()=>goTo("checkin")}><span>✓</span><b>Weekly check-in</b><small>Energy + adherence</small></button>
          <button onClick={()=>goTo("schedule")}><span>□</span><b>Schedule</b><small>Your weekly plan</small></button>
          <button onClick={()=>goTo("workouts")}><span>◇</span><b>Workout plan</b><small>Training program</small></button>
          <button onClick={()=>goTo("calendar")}><span>◫</span><b>Apple Calendar</b><small>Export training</small></button>
          <button onClick={()=>goTo("settings")}><span>⚙</span><b>Settings</b><small>Goals + appearance</small></button>
        </div>
        <button className="signOutLink" onClick={signOut}>Sign out</button>
      </div>
    </div>}

    <nav className="mobileBottomNav" aria-label="Mobile navigation">
      <button className={tab==="dashboard"?"active":""} onClick={()=>goTo("dashboard")}><span className="navGlyph">⌂</span><small>Home</small></button>
      <button className={["food","scanner"].includes(tab)?"active":""} onClick={()=>goTo("food")}><span className="navGlyph">◫</span><small>Nutrition</small></button>
      <button className={["train","workouts","prs"].includes(tab)?"active centerNav":"centerNav"} onClick={()=>goTo("train")}><span className="trainNavIcon">＋</span><small>Train</small></button>
      <button className={["progress","measurements","photos","checkin"].includes(tab)?"active":""} onClick={()=>goTo("progress")}><span className="navGlyph">⌁</span><small>Progress</small></button>
      <button className={tab==="profile"?"active":""} onClick={()=>goTo("profile")}><span className="navAvatar">{avatar}</span><small>Profile</small></button>
    </nav>

    {showOnboarding&&<div className="modalBackdrop">
      <div className="onboardingCard">
        <img src="/benfit-logo.png" alt="BenFit logo" className="onboardingBrandLogo"/>
        <div className="eyebrow">Welcome to BenFit</div>
        <h2>Make it yours</h2>
        <p className="muted">Choose how BenFit should welcome you. You can change everything later.</p>

        <div className="setupSection"><div className="setupSectionTitle"><span>1</span><div><b>Your identity</b><small>This is what BenFit will call you.</small></div></div>
          <div className="miniFormGrid"><div className="field"><label>Display name</label><input value={profile.display_name||""} onChange={e=>setProfile({...profile,display_name:e.target.value})} placeholder="Ben"/></div><div className="field"><label>Username</label><input value={profile.username||""} onChange={e=>setProfile({...profile,username:e.target.value})} placeholder="benfit"/></div></div>
        </div>

        <div className="setupSection"><div className="setupSectionTitle"><span>2</span><div><b>Your goal</b><small>Your account gets its own targets and progress.</small></div></div>
          <div className="miniFormGrid">
            <div className="field"><label>Age</label><input type="number" min="16" value={profile.age||""} onChange={e=>setProfile({...profile,age:e.target.value})}/></div>
            <div className="field"><label>Sex for estimate</label><select value={profile.sex||"male"} onChange={e=>setProfile({...profile,sex:e.target.value})}><option value="male">Male</option><option value="female">Female</option></select></div>
            <div className="field"><label>Height (cm)</label><input type="number" value={profile.height_cm||""} onChange={e=>setProfile({...profile,height_cm:e.target.value})}/></div>
            <div className="field"><label>Current weight (kg)</label><input type="number" step="0.1" value={profile.start_weight_kg||""} onChange={e=>setProfile({...profile,start_weight_kg:e.target.value})}/></div>
            <div className="field"><label>Goal</label><select value={profile.goal_type||"lose"} onChange={e=>setProfile({...profile,goal_type:e.target.value})}><option value="lose">Lose fat / cut</option><option value="maintain">Maintain</option><option value="gain">Build / gain</option></select></div>
            <div className="field"><label>Goal weight (kg)</label><input type="number" step="0.1" value={profile.goal_weight||""} onChange={e=>setProfile({...profile,goal_weight:e.target.value})}/></div>
            <div className="field"><label>Activity</label><select value={profile.activity_level||"moderate"} onChange={e=>setProfile({...profile,activity_level:e.target.value})}><option value="sedentary">Mostly sedentary</option><option value="light">Lightly active</option><option value="moderate">Moderately active</option><option value="very_active">Very active</option></select></div>
          </div>
          <button className="btn secondary setupSuggest" onClick={calculateSuggestedTargets}>Suggest calories + protein</button>
          <div className="suggestedTargets"><span><b>{profile.calorie_goal}</b><small>kcal/day</small></span><span><b>{profile.protein_goal} g</b><small>protein/day</small></span></div>
        </div>

        <label className="modalLabel">3 · Pick an avatar</label>
        <div className="avatarGrid compact">
          {avatarChoices.map(a=><button key={a.id} className={"avatarChoice "+(profile.avatar===a.id?"selected":"")} onClick={()=>setProfile({...profile,avatar:a.id})}>
            <span>{a.emoji}</span><small>{a.label}</small>
          </button>)}
        </div>

        <button className="btn onboardingBtn" onClick={savePersonalProfile}>Enter BenFit</button>
      </div>
    </div>}
  </main>
}
