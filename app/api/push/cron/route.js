import webpush from "web-push";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

function localParts(timeZone){
  const parts=new Intl.DateTimeFormat("en-US",{
    timeZone,
    weekday:"short",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hour12:false
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map(x=>[x.type,x.value]));
}

function shouldFire(event,timeZone){
  const p=localParts(timeZone||"UTC");
  const today=`${p.year}-${p.month}-${p.day}`;
  const nowMin=(+p.hour)*60+(+p.minute);
  const [hh,mm]=String(event.start_time||"00:00").split(":").map(Number);
  const startMin=hh*60+mm;
  const fireAt=startMin-(+event.reminder_minutes||0);
  const diff=nowMin-fireAt;
  const base=new Date(event.event_date+"T12:00:00Z");
  const targetWeekday=base.toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"});
  const dateMatches=
    event.repeat_rule==="daily" ||
    (event.repeat_rule==="weekly" && targetWeekday===p.weekday) ||
    (event.repeat_rule==="none" && event.event_date===today);

  return {fire:dateMatches && diff>=0 && diff<15, occurrenceKey:`${today}-${event.id}-${event.reminder_minutes}`};
}

export async function GET(req){
  try{
    if(process.env.CRON_SECRET){
      const auth=req.headers.get("authorization")||"";
      if(auth!==`Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized",{status:401});
    }

    const pub=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv=process.env.VAPID_PRIVATE_KEY;
    const subject=process.env.VAPID_SUBJECT||"mailto:admin@example.com";
    if(!pub || !priv) return Response.json({ok:false,error:"VAPID keys missing"},{status:500});
    webpush.setVapidDetails(subject,pub,priv);

    const sb=supabaseAdmin();
    const [{data:events},{data:settings},{data:subs},{data:sent}]=await Promise.all([
      sb.from("calendar_events").select("*").eq("enabled",true),
      sb.from("calendar_settings").select("user_id,timezone"),
      sb.from("push_subscriptions").select("*"),
      sb.from("notification_deliveries").select("event_id,occurrence_key").gte("created_at",new Date(Date.now()-172800000).toISOString())
    ]);

    const tzByUser=new Map((settings||[]).map(x=>[x.user_id,x.timezone]));
    const sentKeys=new Set((sent||[]).map(x=>`${x.event_id}|${x.occurrence_key}`));
    let delivered=0;

    for(const ev of events||[]){
      const check=shouldFire(ev,tzByUser.get(ev.user_id)||"UTC");
      if(!check.fire || sentKeys.has(`${ev.id}|${check.occurrenceKey}`)) continue;

      const userSubs=(subs||[]).filter(s=>s.user_id===ev.user_id);
      if(!userSubs.length) continue;

      const payload=JSON.stringify({
        title:ev.title,
        body:`${ev.category==="workout"?"Workout":"BenFit"} reminder · ${String(ev.start_time).slice(0,5)}`,
        url:"/?open=calendar",
        tag:`benfit-event-${ev.id}`
      });

      let successful=false;
      for(const s of userSubs){
        try{
          await webpush.sendNotification({
            endpoint:s.endpoint,
            keys:{p256dh:s.p256dh,auth:s.auth}
          },payload);
          delivered++; successful=true;
        }catch(err){
          if(err.statusCode===404 || err.statusCode===410){
            await sb.from("push_subscriptions").delete().eq("id",s.id);
          }
        }
      }
      if(successful){
        await sb.from("notification_deliveries").insert({
          user_id:ev.user_id,event_id:ev.id,occurrence_key:check.occurrenceKey
        });
      }
    }

    return Response.json({ok:true,delivered});
  }catch(e){
    return Response.json({ok:false,error:e.message},{status:500});
  }
}
