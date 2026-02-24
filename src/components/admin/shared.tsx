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

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}
