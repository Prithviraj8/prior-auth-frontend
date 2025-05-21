
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { procedureDescription, diagnosisDescription } = await req.json();

    if (!procedureDescription || !diagnosisDescription) {
      return new Response(
        JSON.stringify({
          error: "Procedure and diagnosis descriptions are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openAIApiKey) {
      console.error("OpenAI API key not found in environment variables");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Calling OpenAI API with:", { procedureDescription, diagnosisDescription });

    // Call OpenAI API to generate justification
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a medical professional assistant helping to generate a concise but comprehensive medical justification for an insurance prior authorization request. 
            The justification should be professional, evidence-based, and explain why the procedure is medically necessary based on the diagnosis. 
            Include references to standard of care, previous treatments, and medical necessity criteria. 
            Write in a formal medical tone, approximately 150-250 words.`,
          },
          {
            role: "user",
            content: `Generate a medical justification for the following:
            
            Procedure: ${procedureDescription}
            Diagnosis: ${diagnosisDescription}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await openAIResponse.json();
    console.log("OpenAI API response status:", openAIResponse.status);
    
    if (!openAIResponse.ok) {
      console.error("OpenAI API error details:", data);
      throw new Error(`OpenAI API error: ${data.error?.message || JSON.stringify(data.error) || "Unknown error"}`);
    }

    const justification = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ justification }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-justification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
