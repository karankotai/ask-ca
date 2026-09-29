export interface CriterionScore {
  criterion: string;
  score: number;
  reasoning: string;
}

export interface EvalRunRecord {
  id: string;
  createdAt: string;
  question: string;
  groundTruth: string | null;
  sourceFilter: string | null;
  ragAnswer: string;
  ragAvgScore: number;
  ragTotalScore: number;
  gptAnswer: string | null;
  gptAvgScore: number | null;
  gptTotalScore: number | null;
  geminiAnswer: string | null;
  geminiAvgScore: number | null;
  geminiTotalScore: number | null;
  ragAdvantageVsGpt: number | null;
  ragAdvantageVsGemini: number | null;
  ragScores: CriterionScore[];
  gptScores: CriterionScore[] | null;
  geminiScores: CriterionScore[] | null;
  ragSources: unknown[];
}

export function LoadingPlaceholder({ message }: { message?: string }) {
  return (
    <div className="empty-state">
      {message ?? "Loading…"}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="admin-error">{message}</div>
  );
}
