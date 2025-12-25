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
    const { transcript } = await req.json();
    
    if (!transcript) {
      throw new Error('No transcript provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a voice command interpreter for an educational classroom app. Your job is to understand what the user wants to do and return the appropriate command.

Available commands:
- "navigate_dashboard" - Go to dashboard (phrases: go to dashboard, open dashboard, show dashboard, dashboard)
- "navigate_notifications" - Go to notifications (phrases: go to notifications, open notifications, show notifications, notifications, my notifications, check notifications)
- "navigate_gpa_calculator" - Open GPA/CGPA calculator (phrases: gpa calculator, cgpa calculator, calculate gpa, calculate cgpa, open calculator, gpa, cgpa)
- "create_class" - Create a new class (phrases: create class, new class, add class, make class)
- "join_class" - Join a class (phrases: join class, enter class, join a class)
- "go_home" - Go to home page (phrases: go home, home, main page, home page)
- "sign_out" - Sign out hint (phrases: sign out, logout, log out)
- "help" - Show help (phrases: help, what can I do, commands, show commands)
- "unknown" - Command not recognized

Analyze the user's speech and determine which command they want. Be flexible with variations, accents, and similar phrases.
For students, be especially helpful - they might say things like:
- "I want to see my classes" -> navigate_dashboard
- "take me to my dashboard" -> navigate_dashboard
- "I need to join a class" -> join_class
- "show me the main screen" -> go_home
- "create a new classroom" -> create_class
- "show my notifications" -> navigate_notifications
- "do I have any notifications" -> navigate_notifications
- "calculate my gpa" -> navigate_gpa_calculator
- "open gpa calculator" -> navigate_gpa_calculator
- "I want to check my cgpa" -> navigate_gpa_calculator

Respond ONLY with a JSON object in this exact format:
{"command": "command_name", "confidence": 0.95, "interpreted_as": "what you understood"}`;

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
          { role: "user", content: `User said: "${transcript}"` }
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      result = { command: "unknown", confidence: 0, interpreted_as: transcript };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error processing voice command:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      command: "unknown",
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
