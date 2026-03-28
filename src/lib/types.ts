export interface CandidateInput {
  cv: string;
  supervisorNotes: string;
  recommendationLetter: string;
  peerReviews: string;
}

export interface CandidateFiles {
  cv: File | null;
  supervisorNotes: File | null;
  recommendationLetter: File | null;
  peerReviews: File | null;
}

export interface KeywordSignals {
  speed_keywords: string[];
  quality_keywords: string[];
  risk_keywords: string[];
  stability_keywords: string[];
  leadership_keywords: string[];
}

export interface CandidateTraits {
  speed: number;
  strictness: number;
  risk_tolerance: number;
  reliability: number;
  communication_style: string;
  emotional_intelligence: number;
  experience: number;
}

export interface CvAnalysis {
  experience_level: number;
  technical_skill: number;
  leadership_indicators: string[];
}

export interface FeedbackAnalysis {
  communication_style: string;
  reliability: number;
  emotional_intelligence: number;
  leadership_behavior_signals: string[];
}

export interface CandidateProfile {
  name: string;
  classification: "Speed-oriented" | "Quality-oriented" | "Balanced";
  traits: CandidateTraits;
  cv_analysis: CvAnalysis;
  feedback_analysis: FeedbackAnalysis;
  detected_keywords: KeywordSignals;
}

export interface Interaction {
  conflicts: string[];
  alignments: string[];
  complementarities: string[];
}

export interface ScenarioInsight {
  best_scenario: string;
  current_scenario_fit: string;
  score_variations: {
    crisis: number;
    growth: number;
    stability: number;
  };
}

export interface Evaluation {
  compatibility_score: number;
  strengths: string[];
  risks: string[];
  explanation: string;
  scenario_insight: ScenarioInsight;
  reasoning: string[];
}

export interface AnalysisResult {
  candidateA: CandidateProfile;
  candidateB: CandidateProfile;
  interaction: Interaction;
  evaluation: Evaluation;
}
