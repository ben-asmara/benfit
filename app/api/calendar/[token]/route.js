import { supabaseAdmin } from "../../../../lib/supabase-admin";

function esc(s=""){
  return String(s).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
}
function datePart(d){ return String(d).replaceAll("-",""); }
function timePart(t="00:00"){ return String(t).slice(0,5).replace(":","")+"00"; }

export async function GET(_req,{params}){
  try{
    const {token}=await params;
    const sb=supabaseAdmin();

    const {data:settings,error:se}=await sb.from("calendar_settings").select("user_id,timezone").eq("feed_token",token).single();
    if(se || !settings) return new Response("Calendar not found",{status:404});

    const {data:events,error:ee}=await sb.from("calendar_events").select("*").eq("user_id",settings.user_id).eq("enabled",true).order("event_date");
    if(ee) throw ee;

    const tz=settings.timezone||"UTC";
    const lines=[
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "PRODID:-//BenFit//Personal Calendar//EN",
      "X-WR-CALNAME:BenFit",
      `X-WR-TIMEZONE:${esc(tz)}`
    ];

    for(const e of events||[]){
      lines.push(
        "BEGIN:VEVENT",
        `UID:benfit-${e.id}@calendar`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}`,
        `DTSTART;TZID=${tz}:${datePart(e.event_date)}T${timePart(e.start_time)}`,
        `DTEND;TZID=${tz}:${datePart(e.event_date)}T${timePart(e.end_time)}`,
        `SUMMARY:${esc(e.title)}`,
        `DESCRIPTION:${esc(e.notes||"")}`,
        `CATEGORIES:${esc(e.category||"BenFit")}`
      );
      if(e.repeat_rule==="daily") lines.push("RRULE:FREQ=DAILY");
      if(e.repeat_rule==="weekly") lines.push("RRULE:FREQ=WEEKLY");
      if(Number(e.reminder_minutes)>=0){
        lines.push(
          "BEGIN:VALARM",
          `TRIGGER:-PT${Math.max(0,Number(e.reminder_minutes))}M`,
          "ACTION:DISPLAY",
          `DESCRIPTION:${esc(e.title)}`,
          "END:VALARM"
        );
      }
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");

    return new Response(lines.join("\r\n"),{
      headers:{
        "Content-Type":"text/calendar; charset=utf-8",
        "Content-Disposition":"inline; filename=benfit-personal-calendar.ics",
        "Cache-Control":"no-store"
      }
    });
  }catch(e){
    return new Response(e.message||"Calendar error",{status:500});
  }
}
