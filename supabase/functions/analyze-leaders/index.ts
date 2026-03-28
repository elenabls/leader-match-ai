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

    const systemPrompt = `You are a 7-agent leadership evaluation system that analyzes candidate documents using keyword-based reasoning. Process the input through these agents sequentially:

AGENT 1 - PDF Parsing Agent:
The text has already been extracted from PDF documents. Combine all text sources per candidate into a unified profile.

AGENT 2 - Keyword & Signal Detection Agent:
Scan the text for specific keywords and phrases indicating traits. Report which keywords were found.

Keyword categories to detect:
- Speed / Execution: fast, rapid, delivered quickly, accelerated, execution, deadline-driven, high throughput, agile, quick turnaround, on-time delivery, efficient
- Quality / Precision: detail-oriented, quality, accuracy, compliance, precision, standards, defect reduction, meticulous, thorough, zero-defect, audit, inspection
- Risk-taking: innovative, experimental, bold, transformation, change-driven, disruptive, pioneering, entrepreneurial, venture, startup
- Stability / Reliability: consistent, reliable, process-driven, structured, disciplined, methodical, systematic, dependable, steady, predictable
- Communication / Leadership: collaborative, decisive, assertive, team-oriented, leadership, mentoring, coaching, empowering, strategic, visionary, influential

Count frequency and strength of signals. Report the actual keywords found in each category.

AGENT 3 - Trait Extraction Agent:
Convert detected signals into structured scores (1-10):
- speed (execution ability)
- strictness (quality/precision focus)
- risk_tolerance
- reliability (consistency)
- communication_style (descriptive string)
- emotional_intelligence (1-10)
- experience (based on years/seniority indicators)

AGENT 4 - Role Classification Agent:
Classify each candidate as one of:
- "Speed-oriented" (dominant speed trait)
- "Quality-oriented" (dominant strictness trait)
- "Balanced" (no single dominant trait)

AGENT 5 - Interaction Agent:
Compare both candidates. Detect:
- Conflicts (e.g. very fast vs very strict)
- Alignments (similar communication/leadership style)
- Complementarities (traits that balance each other)

AGENT 6 - Scenario Agent:
Adjust weights for scenario "${scenario}":
- Crisis: prioritize speed and experience
- Growth: prioritize risk-taking and innovation
- Stability: prioritize quality, strictness, and reliability

AGENT 7 - Decision Agent:
Compute Compatibility Score (0-100). Generate strengths, risks, explanation, and scenario-based recommendations. Also compute what the score would be under ALL three scenarios.

CRITICAL RULES:
- Base ALL scores on actual keywords and phrases found in the text
- Report detected keywords for transparency
- Be SPECIFIC — reference actual content from the documents
- If documents are sparse, note low confidence and score conservatively
- Show clear reasoning connecting keywords → traits → scores`;

    const userPrompt = `CANDIDATE A (Production Head):
CV/Resume text: ${candidateA.cv || "[Not provided]"}
Supervisor Notes text: ${candidateA.supervisorNotes || "[Not provided]"}
Recommendation Letter text: ${candidateA.recommendationLetter || "[Not provided]"}
Peer/Manager Reviews text: ${candidateA.peerReviews || "[Not provided]"}

CANDIDATE B (Quality Head):
CV/Resume text: ${candidateB.cv || "[Not provided]"}
Supervisor Notes text: ${candidateB.supervisorNotes || "[Not provided]"}
Recommendation Letter text: ${candidateB.recommendationLetter || "[Not provided]"}
Peer/Manager Reviews text: ${candidateB.peerReviews || "[Not provided]"}

SCENARIO: ${scenario}

Analyze these candidates through all 7 agents and return the structured evaluation.`;

    const candidateSchema = {
      type: "object" as const,
      properties: {
        name: { type: "string" as const },
        classification: { type: "string" as const, enum: ["Speed-oriented", "Quality-oriented", "Balanced"] },
        traits: {
          type: "object" as const,
          properties: {
            speed: { type: "number" as const },
            strictness: { type: "number" as const },
            risk_tolerance: { type: "number" as const },
            reliability: { type: "number" as const },
            communication_style: { type: "string" as const },
            emotional_intelligence: { type: "number" as const },
            experience: { type: "number" as const },
          },
          required: ["speed", "strictness", "risk_tolerance", "reliability", "communication_style", "emotional_intelligence", "experience"],
        },
        cv_analysis: {
          type: "object" as const,
          properties: {
            experience_level: { type: "number" as const },
            technical_skill: { type: "number" as const },
            leadership_indicators: { type: "array" as const, items: { type: "string" as const } },
          },
          required: ["experience_level", "technical_skill", "leadership_indicators"],
        },
        feedback_analysis: {
          type: "object" as const,
          properties: {
            communication_style: { type: "string" as const },
            reliability: { type: "number" as const },
            emotional_intelligence: { type: "number" as const },
            leadership_behavior_signals: { type: "array" as const, items: { type: "string" as const } },
          },
          required: ["communication_style", "reliability", "emotional_intelligence", "leadership_behavior_signals"],
        },
        detected_keywords: {
          type: "object" as const,
          properties: {
            speed_keywords: { type: "array" as const, items: { type: "string" as const } },
            quality_keywords: { type: "array" as const, items: { type: "string" as const } },
            risk_keywords: { type: "array" as const, items: { type: "string" as const } },
            stability_keywords: { type: "array" as const, items: { type: "string" as const } },
            leadership_keywords: { type: "array" as const, items: { type: "string" as const } },
          },
          required: ["speed_keywords", "quality_keywords", "risk_keywords", "stability_keywords", "leadership_keywords"],
        },
      },
      required: ["name", "classification", "traits", "cv_analysis", "feedback_analysis", "detected_keywords"],
    };

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
            description: "Return the structured 7-agent leadership evaluation result with keyword detection",
            parameters: {
              type: "object",
              properties: {
                candidateA: candidateSchema,
                candidateB: candidateSchema,
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
