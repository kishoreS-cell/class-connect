import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const systemPrompt = `You are a job opportunity curator for an educational platform serving students and teachers. Generate 10 realistic job interview opportunities that would be relevant for fresh graduates, students seeking internships, and teachers looking for positions.

Today's date is ${today}.

Return a JSON array with exactly 10 job opportunities. Each item should have:
- "id": a unique number 1-10
- "company": company name (use realistic company names)
- "role": job title/role needed
- "location": city/location (mix of in-person and remote)
- "date": interview date in format "YYYY-MM-DD" (within next 2 weeks from today)
- "time": interview time (e.g., "10:00 AM", "2:30 PM")
- "type": one of "Full-time", "Part-time", "Internship", "Contract"
- "category": one of "Teaching", "Technology", "Administration", "Research", "Entry-level"

Include a mix of:
- Teaching positions for teachers
- Tech roles for students (internships, entry-level)
- Administrative roles
- Research positions

Make the opportunities feel current and realistic. Include well-known companies and educational institutions.

Respond ONLY with the JSON array, no markdown or extra text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate today's job interview opportunities for students and teachers." }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let jobs;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jobs = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      jobs = [];
    }

    return new Response(JSON.stringify({ jobs, date: today }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error fetching jobs:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      jobs: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
