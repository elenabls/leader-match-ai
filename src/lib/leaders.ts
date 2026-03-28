export interface Leader {
  id: string;
  name: string;
  role: string;
  description: string;
  traits: { speed: number; strictness: number; risk: number };
}

export const productionLeaders: Leader[] = [
  { id: "alex", name: "Alex", role: "Production Head", description: "Fast, Risk-taking, Low strictness", traits: { speed: 9, strictness: 3, risk: 8 } },
  { id: "sarah", name: "Sarah", role: "Production Head", description: "Balanced", traits: { speed: 6, strictness: 5, risk: 5 } },
  { id: "john", name: "John", role: "Production Head", description: "Slow, Careful, High strictness", traits: { speed: 3, strictness: 9, risk: 2 } },
];

export const qualityLeaders: Leader[] = [
  { id: "emma", name: "Emma", role: "Quality Head", description: "Very strict, Detail-focused", traits: { speed: 4, strictness: 9, risk: 3 } },
  { id: "mike", name: "Mike", role: "Quality Head", description: "Flexible, Fast", traits: { speed: 8, strictness: 3, risk: 7 } },
  { id: "lisa", name: "Lisa", role: "Quality Head", description: "Balanced", traits: { speed: 5, strictness: 6, risk: 5 } },
];

export type Scenario = "crisis" | "growth" | "stability";

export const scenarios: { id: Scenario; label: string; description: string }[] = [
  { id: "crisis", label: "Crisis", description: "Speed and quick decisions matter most" },
  { id: "growth", label: "Growth", description: "Risk-taking and innovation are key" },
  { id: "stability", label: "Stability", description: "Consistency and strictness are valued" },
];

export interface EvaluationResult {
  score: number;
  strengths: string[];
  risks: string[];
  reasoning: string[];
  bestScenario: string;
}

export function evaluate(a: Leader, b: Leader, scenario: Scenario): EvaluationResult {
  let score = 100;
  const strengths: string[] = [];
  const risks: string[] = [];
  const reasoning: string[] = [];

  const speedDiff = Math.abs(a.traits.speed - b.traits.speed);
  const strictDiff = Math.abs(a.traits.strictness - b.traits.strictness);
  const riskDiff = Math.abs(a.traits.risk - b.traits.risk);

  // Conflict: fast vs strict
  if ((a.traits.speed > 8 && b.traits.strictness > 8) || (b.traits.speed > 8 && a.traits.strictness > 8)) {
    score -= 20;
    risks.push("High tension between speed-oriented and strictness-oriented leadership styles");
    reasoning.push("One leader prioritizes speed (>8) while the other prioritizes strictness (>8), creating a -20 conflict penalty.");
  }

  // Conflict: risk mismatch
  if (riskDiff > 4) {
    score -= 15;
    risks.push("Significant disagreement on risk tolerance — may cause friction in decision-making");
    reasoning.push(`Risk tolerance gap of ${riskDiff} points (>4 threshold) adds a -15 conflict penalty.`);
  }

  // Compatibility: balanced traits
  let balancedCount = 0;
  if (speedDiff < 3) { balancedCount++; strengths.push("Similar pace — aligned on execution speed"); }
  if (strictDiff < 3) { balancedCount++; strengths.push("Aligned quality standards — fewer process conflicts"); }
  if (riskDiff < 3) { balancedCount++; strengths.push("Shared risk appetite — smoother strategic alignment"); }

  const compatBonus = balancedCount * 8;
  if (compatBonus > 0) {
    score += compatBonus;
    reasoning.push(`${balancedCount} trait(s) are well-balanced (difference <3), adding +${compatBonus} compatibility bonus.`);
  }

  // Scenario adjustments
  const avgSpeed = (a.traits.speed + b.traits.speed) / 2;
  const avgStrict = (a.traits.strictness + b.traits.strictness) / 2;
  const avgRisk = (a.traits.risk + b.traits.risk) / 2;

  if (scenario === "crisis") {
    const adj = Math.round((avgSpeed - 5) * 3);
    score += adj;
    reasoning.push(`Crisis scenario: combined speed average is ${avgSpeed.toFixed(1)}, applying ${adj >= 0 ? "+" : ""}${adj} adjustment.`);
    if (avgSpeed >= 7) strengths.push("High combined speed is ideal for crisis response");
    if (avgSpeed < 5) risks.push("Low combined speed may hinder crisis response");
  } else if (scenario === "growth") {
    const adj = Math.round((avgRisk - 5) * 3);
    score += adj;
    reasoning.push(`Growth scenario: combined risk appetite average is ${avgRisk.toFixed(1)}, applying ${adj >= 0 ? "+" : ""}${adj} adjustment.`);
    if (avgRisk >= 7) strengths.push("Strong risk appetite fuels growth and innovation");
    if (avgRisk < 5) risks.push("Low risk tolerance may slow growth initiatives");
  } else {
    const adj = Math.round((avgStrict - 5) * 3);
    score += adj;
    reasoning.push(`Stability scenario: combined strictness average is ${avgStrict.toFixed(1)}, applying ${adj >= 0 ? "+" : ""}${adj} adjustment.`);
    if (avgStrict >= 7) strengths.push("High strictness ensures process consistency");
    if (avgStrict < 5) risks.push("Low strictness may compromise operational stability");
  }

  score = Math.max(0, Math.min(100, score));

  // Best scenario recommendation
  const scenarioScores = { crisis: avgSpeed, growth: avgRisk, stability: avgStrict };
  const bestScenario = (Object.entries(scenarioScores).sort((x, y) => y[1] - x[1])[0][0]) as string;
  const bestLabel = bestScenario.charAt(0).toUpperCase() + bestScenario.slice(1);

  if (strengths.length === 0) strengths.push("Both leaders bring distinct perspectives to the team");
  if (risks.length === 0) risks.push("No major risks identified — a well-rounded pairing");

  return { score, strengths, risks, reasoning, bestScenario: bestLabel };
}
