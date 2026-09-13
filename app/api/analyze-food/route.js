export const runtime = "nodejs";

function extractText(j){
  return j.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text || "";
}

export async function POST(req){
  try{
    if(!process.env.OPENAI_API_KEY){
      return Response.json({error:"OPENAI_API_KEY is not configured on the server."},{status:500});
    }

    const fd=await req.formData();
    const file=fd.get("image");
    if(!file) return Response.json({error:"No image uploaded."},{status:400});

    const bytes=Buffer.from(await file.arrayBuffer());
    const base64=bytes.toString("base64");
    const mime=file.type||"image/jpeg";

    const prompt = `
Analyze this meal photo for nutrition tracking.

Return ONLY valid JSON, no markdown, using exactly this shape:
{
  "meal_name": "short meal title",
  "items": [
    {
      "name": "food item",
      "portion": "estimated portion such as 200 g, 1 cup, 2 pieces",
      "calories": 0,
      "protein": 0,
      "confidence": "low|medium|high"
    }
  ],
  "notes": "brief note about uncertainty, hidden oils/sauces, or anything hard to estimate"
}

Rules:
- Break the meal into separate visible food items.
- Calories must be kcal per estimated portion, not per 100 g.
- Protein is grams for the estimated portion.
- Include cooking oil, dressing, cheese, sauce, or obvious calorie-dense toppings as separate items when visible or strongly implied.
- Be conservative and realistic; do not pretend visual estimates are exact.
- If portion size is uncertain, say so in notes and set confidence low or medium.
- Do not give medical advice.
`.trim();

    const payload={
      model:"gpt-4.1-mini",
      input:[{
        role:"user",
        content:[
          {type:"input_text",text:prompt},
          {type:"input_image",image_url:`data:${mime};base64,${base64}`}
        ]
      }]
    };

    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(payload)
    });

    const j=await r.json();
    if(!r.ok){
      return Response.json({error:j?.error?.message||"Vision API error"},{status:500});
    }

    const text=extractText(j).replace(/^```json\s*/,"").replace(/```$/,"").trim();
    const data=JSON.parse(text);

    if(!Array.isArray(data.items)){
      return Response.json({error:"The meal analysis response was incomplete. Try another photo."},{status:500});
    }

    return Response.json({
      meal_name:data.meal_name||"Estimated meal",
      items:data.items.map(x=>({
        name:String(x.name||"Food"),
        portion:String(x.portion||""),
        calories:Math.max(0,Math.round(Number(x.calories)||0)),
        protein:Math.max(0,Math.round((Number(x.protein)||0)*10)/10),
        confidence:["low","medium","high"].includes(x.confidence)?x.confidence:"medium"
      })),
      notes:String(data.notes||"Visual nutrition estimates are approximate.")
    });
  }catch(e){
    return Response.json({error:e.message||"Food analysis failed."},{status:500});
  }
}
