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

export type LeaderClassification = "Speed-oriented" | "Quality-oriented" | "Balanced" | "Hybrid";
export type RoleFit = "Production" | "Quality" | "Operations" | "Innovation" | "General Leadership";
export type BusinessFunction = "manufacturing" | "quality_assurance" | "innovation" | "operations";

export interface CandidateProfile {
  name: string;
  classification: LeaderClassification;
  suggested_role_fit: RoleFit;
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

// Bulk Analysis
export interface BulkLeaderRow {
  name: string;
  data: string;
}

export interface BulkLeaderProfile {
  name: string;
  classification: LeaderClassification;
  suggested_role_fit: RoleFit;
  traits: CandidateTraits;
}

export interface BulkPairing {
  leaderA: string;
  leaderB: string;
  compatibility_score: number;
  strengths: string[];
  risks: string[];
  best_scenario: string;
}

export interface BulkAnalysisResult {
  leaders: BulkLeaderProfile[];
  pairings: BulkPairing[];
}

// Performance Tracking
export interface PerformanceRecord {
  id: string;
  leader_a_name: string;
  leader_b_name: string;
  compatibility_score: number;
  scenario: string;
  outcome: "success" | "failure" | "pending";
  created_at: string;
  notes?: string;
}

export interface LeaderPerformanceSummary {
  name: string;
  total_pairings: number;
  avg_compatibility: number;
  success_rate: number;
  conflict_count: number;
  improvement_suggestions: string[];
}
