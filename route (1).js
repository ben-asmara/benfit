export const runtime = "nodejs";

export async function POST(req){
  try{
    if(!process.env.OPENAI_API_KEY) return Response.json({error:"OPENAI_API_KEY is not configured on the server."},{status:500});
    const fd=await req.formData(), file=fd.get("image");
    if(!file) return Response.json({error:"No image uploaded."},{status:400});
    const bytes=Buffer.from(await file.arrayBuffer()), base64=bytes.toString("base64");
    const mime=file.type||"image/jpeg";

    const payload={
      model:"gpt-4.1-mini",
      input:[{
        role:"user",
        content:[
          {type:"input_text",text:"Estimate this meal. Return ONLY compact JSON with keys name (short meal name), calories (integer total kcal), protein (number grams), notes (short explanation including foods and approximate portions). Be conservative and state uncertainty in notes. Do not include markdown."},
          {type:"input_image",image_url:`data:${mime};base64,${base64}`}
        ]
      }]
    };
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const j=await r.json();
    if(!r.ok) return Response.json({error:j?.error?.message||"Vision API error"},{status:500});
    const text=j.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text || "";
    const clean=text.replace(/^```json\s*/,"").replace(/```$/,"").trim();
    const data=JSON.parse(clean);
    return Response.json(data);
  }catch(e){return Response.json({error:e.message||"Food analysis failed."},{status:500})}
}
