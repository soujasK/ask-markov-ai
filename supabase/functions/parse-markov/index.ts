import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string" || question.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Invalid question" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a Markov chain parameter extractor. Given a natural language question about a Markov chain, extract the parameters and return ONLY valid JSON with this exact structure:
{
  "states": ["State1", "State2", ...],
  "transition_matrix": [[p11, p12, ...], [p21, p22, ...], ...],
  "initial_state": [1, 0, ...],
  "steps": <number>
}

Rules:
- "states" is an array of state names
- "transition_matrix" rows must sum to 1.0. Each row i represents transitions FROM state i.
- "initial_state" is a probability vector (sums to 1) indicating the starting state
- "steps" is the number of time steps to compute
- If no initial state is mentioned, assume the first state mentioned
- If no steps are mentioned, default to 3
- Return ONLY the JSON object, no explanation or markdown`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_markov_params",
                description:
                  "Extract Markov chain parameters from a natural language question",
                parameters: {
                  type: "object",
                  properties: {
                    states: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of state names",
                    },
                    transition_matrix: {
                      type: "array",
                      items: {
                        type: "array",
                        items: { type: "number" },
                      },
                      description:
                        "Transition probability matrix where row i col j is P(i -> j)",
                    },
                    initial_state: {
                      type: "array",
                      items: { type: "number" },
                      description:
                        "Initial probability distribution vector",
                    },
                    steps: {
                      type: "number",
                      description: "Number of time steps to compute",
                    },
                  },
                  required: [
                    "states",
                    "transition_matrix",
                    "initial_state",
                    "steps",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_markov_params" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: try parsing content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        throw new Error("Could not extract parameters from the question");
      }
    }

    const params = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(params), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-markov error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
