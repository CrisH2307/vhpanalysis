import React, { useEffect, useState } from 'react';

const baseClass = "flex h-full flex-col rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg overflow-auto";

const ScorePanelSkeleton = () => (
  <section className={`${baseClass} animate-pulse`}
  >
    <header className="mb-3">
      <div className="h-5 w-48 rounded bg-slate-700" />
      <div className="mt-2 h-3 w-56 rounded bg-slate-700" />
    </header>
    <div className="mt-4 h-16 w-24 rounded-lg bg-slate-700" />
    <div className="mt-6 space-y-3">
      <div className="h-3 w-full rounded bg-slate-700" />
      <div className="h-3 w-11/12 rounded bg-slate-700" />
      <div className="h-3 w-5/6 rounded bg-slate-700" />
      <div className="h-3 w-4/5 rounded bg-slate-700" />
      <div className="h-3 w-3/4 rounded bg-slate-700" />
    </div>
  </section>
);

const ScorePanel = ({ className, score, explanation }: ScorePanelProps) => {
  const [color, setColor] = useState('text-slate-400');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (score <= 40) setColor('text-red-400');
    else if (score <= 75) setColor('text-yellow-400');
    else setColor('text-green-400');
  }, [score]);

  useEffect(() => {
    setIsLoading(!(explanation && explanation.trim().length > 0));
  }, [explanation]);

  const composedClass = className ? `${baseClass} ${className}` : baseClass;

  if (isLoading) {
    return <ScorePanelSkeleton />;
  }

  return (
    <section className={composedClass}
    >
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-slate-100">Urban Heat Score</h2>
        <p className="text-xs text-slate-400">
          Vegetation-centered heat mitigation insights
        </p>
      </header>

      <div
        className={`text-5xl font-bold ${color} transition-all duration-300`}
      >
        {Math.round(score*10)/10}
      </div>

      <div
        className="prose prose-invert mt-3 flex-1 text-sm leading-relaxed text-slate-300"
        dangerouslySetInnerHTML={{ __html: explanation }}
      />
{/* 
      <button
        type="button"
        className="mt-4 w-fit rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-500 active:bg-green-400"
      >
        Recommend Tree Action
      </button> */}
    </section>
  );
};

type ScorePanelProps = {
  className?: string;
  score: number;
  explanation: string;
};

export default ScorePanel;