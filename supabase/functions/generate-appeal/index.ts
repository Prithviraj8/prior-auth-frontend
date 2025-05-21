
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

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
    const { requestId, userName } = await req.json();

    if (!requestId) {
      return new Response(
        JSON.stringify({
          error: "Request ID is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
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

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase credentials not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch the auth request details
    const { data: request, error: requestError } = await supabase
      .from("auth_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching request:", requestError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve request details" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Calling OpenAI API for appeal letter generation");

    // Call OpenAI API to generate appeal letter
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
            content: `You are a medical professional assistant helping to generate a formal appeal letter for a denied insurance authorization request. 
            The letter should be professional, evidence-based, and formatted as a proper business letter with date, address blocks, and signature.
            Include references to medical necessity, supporting evidence, and relevant policies.
            Write in a formal tone, approximately 300-500 words.`,
          },
          {
            role: "user",
            content: `Generate an appeal letter for a denied insurance authorization request with the following details:
            
            Patient: ${request.patient_name}
            Procedure: ${request.procedure_description} (Code: ${request.procedure_code})
            Diagnosis: ${request.diagnosis_description} (Code: ${request.diagnosis_code})
            Justification: ${request.justification}
            Insurance: ${request.payer_name || "Insurance Provider"}
            Reason for Denial: ${request.response_notes || "Medical necessity not established"}
            
            The letter should be signed by ${userName || "Healthcare Provider"}.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await openAIResponse.json();
    console.log("OpenAI API response status:", openAIResponse.status);
    
    if (!openAIResponse.ok) {
      console.error("OpenAI API error details:", data);
      throw new Error(`OpenAI API error: ${data.error?.message || JSON.stringify(data.error) || "Unknown error"}`);
    }

    const appealText = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ appealText }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-appeal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
