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
    const body = await req.json();
    const { candidateA, candidateB, scenario, businessFunction, mode } = body as {
      candidateA?: CandidateInput;
      candidateB?: CandidateInput;
      scenario?: string;
      businessFunction?: string;
      mode?: "pair" | "bulk";
      leaders?: { name: string; data: string }[];
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Bulk mode
    if (mode === "bulk" && body.leaders) {
      return await handleBulk(body.leaders, businessFunction || "operations", LOVABLE_API_KEY);
    }

    // Pair mode (default)
    if (!candidateA || !candidateB || !scenario) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domainContext = businessFunction
      ? `\nBUSINESS DOMAIN: ${businessFunction}. Adjust trait importance accordingly:\n- Manufacturing → speed and execution most important\n- Quality Assurance → precision, strictness, compliance most important\n- Innovation → risk-taking, creativity, experimentation most important\n- Operations → reliability, consistency, process management most important`
      : "";

    const systemPrompt = `You are an 8-agent organizational decision intelligence system that analyzes leader documents using keyword-based reasoning. Process through these agents:

AGENT 1 - PDF Parsing Agent:
Text already extracted. Combine all text sources per candidate into a unified profile.

AGENT 2 - Keyword & Signal Detection Agent:
Scan for keywords indicating traits:
- Speed / Execution: fast, rapid, delivered quickly, accelerated, execution, deadline-driven, high throughput, agile, quick turnaround, on-time delivery, efficient
- Quality / Precision: detail-oriented, quality, accuracy, compliance, precision, standards, defect reduction, meticulous, thorough, zero-defect, audit, inspection
- Risk-taking: innovative, experimental, bold, transformation, change-driven, disruptive, pioneering, entrepreneurial, venture, startup
- Stability / Reliability: consistent, reliable, process-driven, structured, disciplined, methodical, systematic, dependable, steady, predictable
- Communication / Leadership: collaborative, decisive, assertive, team-oriented, leadership, mentoring, coaching, empowering, strategic, visionary, influential

AGENT 3 - Trait Extraction Agent:
Convert signals into scores (1-10): speed, strictness, risk_tolerance, reliability, communication_style, emotional_intelligence, experience.

AGENT 4 - Classification Agent:
Classify each leader dynamically:
- "Speed-oriented" (dominant speed/execution traits)
- "Quality-oriented" (dominant strictness/precision traits)
- "Balanced" (no single dominant trait)
- "Hybrid" (multiple strong dominant traits)

Also suggest role fit: "Production", "Quality", "Operations", "Innovation", or "General Leadership" based on trait profile.
Do NOT assume predefined roles — infer from the data.${domainContext}

AGENT 5 - Interaction Agent:
Compare both leaders. Detect: Conflicts, Alignments, Complementarities.

AGENT 6 - Scenario Agent:
Adjust weights for scenario "${scenario}":
- Crisis: prioritize speed and experience
- Growth: prioritize risk-taking and innovation
- Stability: prioritize quality, strictness, and reliability

AGENT 7 - Learning Agent:
Note patterns that would improve future predictions. Flag if any traits seem inconsistent across documents.

AGENT 8 - Decision Agent:
Compute Compatibility Score (0-100). Generate strengths, risks, explanation, reasoning, and scenario recommendations. Compute score under ALL three scenarios.

CRITICAL:
- Base ALL scores on actual keywords found
- Report detected keywords
- Be SPECIFIC to the documents
- If sparse, note low confidence
- Do NOT hardcode roles — infer everything from the text`;

    const userPrompt = `LEADER A:
CV/Resume: ${candidateA.cv || "[Not provided]"}
Supervisor Notes: ${candidateA.supervisorNotes || "[Not provided]"}
Recommendation Letter: ${candidateA.recommendationLetter || "[Not provided]"}
Peer/Manager Reviews: ${candidateA.peerReviews || "[Not provided]"}

LEADER B:
CV/Resume: ${candidateB.cv || "[Not provided]"}
Supervisor Notes: ${candidateB.supervisorNotes || "[Not provided]"}
Recommendation Letter: ${candidateB.recommendationLetter || "[Not provided]"}
Peer/Manager Reviews: ${candidateB.peerReviews || "[Not provided]"}

SCENARIO: ${scenario}

Analyze through all 8 agents and return structured evaluation.`;

    const candidateSchema = {
      type: "object" as const,
      properties: {
        name: { type: "string" as const },
        classification: { type: "string" as const, enum: ["Speed-oriented", "Quality-oriented", "Balanced", "Hybrid"] },
        suggested_role_fit: { type: "string" as const, enum: ["Production", "Quality", "Operations", "Innovation", "General Leadership"] },
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
      required: ["name", "classification", "suggested_role_fit", "traits", "cv_analysis", "feedback_analysis", "detected_keywords"],
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
            description: "Return the structured 8-agent leadership evaluation result",
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
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
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
      return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
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

async function handleBulk(
  leaders: { name: string; data: string }[],
  businessFunction: string,
  apiKey: string
) {
  const systemPrompt = `You are an organizational decision intelligence system. Analyze multiple leaders and find optimal pairings.

For each leader, extract traits (speed, strictness, risk_tolerance, reliability, communication_style, emotional_intelligence, experience) scored 1-10.
Classify each as: Speed-oriented, Quality-oriented, Balanced, or Hybrid.
Suggest role fit: Production, Quality, Operations, Innovation, or General Leadership.

Business domain: ${businessFunction}

Then evaluate ALL possible pairings and rank them by compatibility.

CRITICAL:
- Infer everything from the text
- Be specific to each leader's data
- Rank pairings by actual compatibility`;

  const userPrompt = leaders.map((l, i) => `LEADER ${i + 1} - ${l.name}:\n${l.data}`).join("\n\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
          name: "return_bulk_analysis",
          description: "Return bulk leader analysis with optimal pairings",
          parameters: {
            type: "object",
            properties: {
              leaders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    classification: { type: "string" },
                    suggested_role_fit: { type: "string" },
                    traits: {
                      type: "object",
                      properties: {
                        speed: { type: "number" },
                        strictness: { type: "number" },
                        risk_tolerance: { type: "number" },
                        reliability: { type: "number" },
                        communication_style: { type: "string" },
                        emotional_intelligence: { type: "number" },
                        experience: { type: "number" },
                      },
                      required: ["speed", "strictness", "risk_tolerance", "reliability", "communication_style", "emotional_intelligence", "experience"],
                    },
                  },
                  required: ["name", "classification", "suggested_role_fit", "traits"],
                },
              },
              pairings: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    leaderA: { type: "string" },
                    leaderB: { type: "string" },
                    compatibility_score: { type: "number" },
                    strengths: { type: "array", items: { type: "string" } },
                    risks: { type: "array", items: { type: "string" } },
                    best_scenario: { type: "string" },
                  },
                  required: ["leaderA", "leaderB", "compatibility_score", "strengths", "risks", "best_scenario"],
                },
              },
            },
            required: ["leaders", "pairings"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_bulk_analysis" } },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Bulk AI error:", response.status, errText);
    return new Response(JSON.stringify({ error: "Bulk analysis failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const aiResponse = await response.json();
  const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall?.function?.arguments) {
    return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result = typeof toolCall.function.arguments === "string"
    ? JSON.parse(toolCall.function.arguments)
    : toolCall.function.arguments;

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
