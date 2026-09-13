function esc(s){return String(s).replace(/[,;\\]/g,m=>"\\"+m).replace(/\n/g,"\\n")}
function dt(day,hour,minute=0){
  const now=new Date(); const d=new Date(now); const dow=(day-now.getDay()+7)%7; d.setDate(now.getDate()+dow); d.setHours(hour,minute,0,0);
  const z=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}T${z(d.getHours())}${z(d.getMinutes())}00`;
}
export async function GET(){
  const events=[
    {day:1,start:[19,0],end:[20,15],title:"BenFit — Push"},
    {day:2,start:[8,0],end:[9,0],title:"BenFit — Pull"},
    {day:3,start:[19,0],end:[19,45],title:"BenFit — Recovery Walk"},
    {day:4,start:[17,0],end:[18,20],title:"BenFit — Legs"},
    {day:5,start:[16,0],end:[17,15],title:"BenFit — Upper"},
    {day:6,start:[11,0],end:[12,20],title:"BenFit — Lower + Core"},
    {day:6,start:[15,0],end:[16,30],title:"BenFit — Meal Prep"},
    {day:0,start:[18,0],end:[18,20],title:"BenFit — Weekly Check-in"}
  ];
  const body=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BenFit//Journey//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH",
    ...events.flatMap((e,i)=>["BEGIN:VEVENT",`UID:benfit-${i}@benfit`,`DTSTART:${dt(e.day,...e.start)}`,`DTEND:${dt(e.day,...e.end)}`,`RRULE:FREQ=WEEKLY`,`SUMMARY:${esc(e.title)}`,"END:VEVENT"]),
    "END:VCALENDAR"].join("\r\n");
  return new Response(body,{headers:{"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":"attachment; filename=benfit-calendar.ics","Cache-Control":"no-store"}});
}
