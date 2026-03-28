import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CandidateInput {
  cv: string;
  supervisorNotes: string;
  recommendationLetter: string;
  peerReviews: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidateA, candidateB, scenario } = await req.json() as {
      candidateA: CandidateInput;
      candidateB: CandidateInput;
      scenario: string;
    };

    if (!candidateA || !candidateB || !scenario) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a multi-agent leadership evaluation system. You will analyze two candidates and return a structured JSON evaluation.

You operate as 6 sequential agents:

AGENT 1 - CV Agent: Extract from each candidate's CV/resume:
- experience_level (1-10)
- technical_skill (1-10)
- leadership_indicators (list of strings)

AGENT 2 - Feedback Agent: Analyze supervisor notes, recommendation letters, and peer reviews:
- communication_style: "collaborative" | "directive" | "aggressive" | "passive"
- reliability (1-10)
- emotional_intelligence (1-10)
- leadership_behavior_signals (list of strings)

AGENT 3 - Trait Aggregation Agent: Combine into structured traits:
- speed (1-10, execution speed)
- strictness (1-10, attention to detail)
- risk_tolerance (1-10)
- communication_style: string
- emotional_intelligence (1-10)
- experience (1-10)

AGENT 4 - Interaction Agent: Compare the two candidates and detect:
- conflicts (list of specific conflict descriptions)
- alignments (list of alignment descriptions)
- complementarities (list of complementary trait descriptions)

AGENT 5 - Scenario Agent: Given the scenario "${scenario}", adjust importance weights:
- Crisis: prioritize speed and experience
- Growth: prioritize risk-taking and innovation
- Stability: prioritize strictness and consistency

AGENT 6 - Decision Agent: Calculate compatibility score (0-100) and generate final output.

IMPORTANT RULES:
- Be SPECIFIC to the input text. Do not give generic answers.
- Extract actual details from the provided text.
- If text is vague or short, infer conservatively and note low confidence.
- Show clear reasoning for the score.

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):`;

    const userPrompt = `CANDIDATE A (Production Head):
CV/Resume: ${candidateA.cv || "Not provided"}
Supervisor Notes: ${candidateA.supervisorNotes || "Not provided"}
Recommendation Letter: ${candidateA.recommendationLetter || "Not provided"}
Peer/Manager Reviews: ${candidateA.peerReviews || "Not provided"}

CANDIDATE B (Quality Head):
CV/Resume: ${candidateB.cv || "Not provided"}
Supervisor Notes: ${candidateB.supervisorNotes || "Not provided"}
Recommendation Letter: ${candidateB.recommendationLetter || "Not provided"}
Peer/Manager Reviews: ${candidateB.peerReviews || "Not provided"}

SCENARIO: ${scenario}

Return the analysis as JSON with this structure:
{
  "candidateA": {
    "name": "extracted or inferred name",
    "traits": {
      "speed": number,
      "strictness": number,
      "risk_tolerance": number,
      "communication_style": string,
      "emotional_intelligence": number,
      "experience": number
    },
    "cv_analysis": {
      "experience_level": number,
      "technical_skill": number,
      "leadership_indicators": [string]
    },
    "feedback_analysis": {
      "communication_style": string,
      "reliability": number,
      "emotional_intelligence": number,
      "leadership_behavior_signals": [string]
    }
  },
  "candidateB": { same structure },
  "interaction": {
    "conflicts": [string],
    "alignments": [string],
    "complementarities": [string]
  },
  "evaluation": {
    "compatibility_score": number,
    "strengths": [string],
    "risks": [string],
    "explanation": string,
    "scenario_insight": {
      "best_scenario": string,
      "current_scenario_fit": string,
      "score_variations": {
        "crisis": number,
        "growth": number,
        "stability": number
      }
    },
    "reasoning": [string]
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_evaluation",
            description: "Return the structured leadership evaluation result",
            parameters: {
              type: "object",
              properties: {
                candidateA: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    traits: {
                      type: "object",
                      properties: {
                        speed: { type: "number" },
                        strictness: { type: "number" },
                        risk_tolerance: { type: "number" },
                        communication_style: { type: "string" },
                        emotional_intelligence: { type: "number" },
                        experience: { type: "number" },
                      },
                      required: ["speed", "strictness", "risk_tolerance", "communication_style", "emotional_intelligence", "experience"],
                    },
                    cv_analysis: {
                      type: "object",
                      properties: {
                        experience_level: { type: "number" },
                        technical_skill: { type: "number" },
                        leadership_indicators: { type: "array", items: { type: "string" } },
                      },
                      required: ["experience_level", "technical_skill", "leadership_indicators"],
                    },
                    feedback_analysis: {
                      type: "object",
                      properties: {
                        communication_style: { type: "string" },
                        reliability: { type: "number" },
                        emotional_intelligence: { type: "number" },
                        leadership_behavior_signals: { type: "array", items: { type: "string" } },
                      },
                      required: ["communication_style", "reliability", "emotional_intelligence", "leadership_behavior_signals"],
                    },
                  },
                  required: ["name", "traits", "cv_analysis", "feedback_analysis"],
                },
                candidateB: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    traits: {
                      type: "object",
                      properties: {
                        speed: { type: "number" },
                        strictness: { type: "number" },
                        risk_tolerance: { type: "number" },
                        communication_style: { type: "string" },
                        emotional_intelligence: { type: "number" },
                        experience: { type: "number" },
                      },
                      required: ["speed", "strictness", "risk_tolerance", "communication_style", "emotional_intelligence", "experience"],
                    },
                    cv_analysis: {
                      type: "object",
                      properties: {
                        experience_level: { type: "number" },
                        technical_skill: { type: "number" },
                        leadership_indicators: { type: "array", items: { type: "string" } },
                      },
                      required: ["experience_level", "technical_skill", "leadership_indicators"],
                    },
                    feedback_analysis: {
                      type: "object",
                      properties: {
                        communication_style: { type: "string" },
                        reliability: { type: "number" },
                        emotional_intelligence: { type: "number" },
                        leadership_behavior_signals: { type: "array", items: { type: "string" } },
                      },
                      required: ["communication_style", "reliability", "emotional_intelligence", "leadership_behavior_signals"],
                    },
                  },
                  required: ["name", "traits", "cv_analysis", "feedback_analysis"],
                },
                interaction: {
                  type: "object",
                  properties: {
                    conflicts: { type: "array", items: { type: "string" } },
                    alignments: { type: "array", items: { type: "string" } },
                    complementarities: { type: "array", items: { type: "string" } },
                  },
                  required: ["conflicts", "alignments", "complementarities"],
                },
                evaluation: {
                  type: "object",
                  properties: {
                    compatibility_score: { type: "number" },
                    strengths: { type: "array", items: { type: "string" } },
                    risks: { type: "array", items: { type: "string" } },
                    explanation: { type: "string" },
                    scenario_insight: {
                      type: "object",
                      properties: {
                        best_scenario: { type: "string" },
                        current_scenario_fit: { type: "string" },
                        score_variations: {
                          type: "object",
                          properties: {
                            crisis: { type: "number" },
                            growth: { type: "number" },
                            stability: { type: "number" },
                          },
                          required: ["crisis", "growth", "stability"],
                        },
                      },
                      required: ["best_scenario", "current_scenario_fit", "score_variations"],
                    },
                    reasoning: { type: "array", items: { type: "string" } },
                  },
                  required: ["compatibility_score", "strengths", "risks", "explanation", "scenario_insight", "reasoning"],
                },
              },
              required: ["candidateA", "candidateB", "interaction", "evaluation"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_evaluation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiResponse));
      return new Response(JSON.stringify({ error: "AI returned an unexpected format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-leaders error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
