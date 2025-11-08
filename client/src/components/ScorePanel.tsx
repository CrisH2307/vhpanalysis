import React, { useEffect, useState } from 'react';

const heatPlans = {
  low: {
    title: 'Low Heat Level — Keep Your City Green and Thriving',
    message:
      'Temperatures are currently safe — a sign that your city’s tree canopy and green spaces are working effectively. However, consistent care and forward planning are essential to maintain this.',
    tips: [
      'Protect existing trees — mature canopies can cool air by up to 5°C through shade and evapotranspiration, acting as natural air conditioners.',
      'Conduct regular maintenance: prune safely, water during dry spells, and monitor for pests or diseases that weaken cooling capacity.',
      'Plant native and drought-tolerant tree species that are resilient to climate conditions.',
      'Create small urban forests and community gardens — these can lower local surface temperatures and improve air quality.',
    ],
    sources: [
      {
        name: 'CityGreen: How Urban Heat Impacts Vulnerable People',
        url: 'https://citygreen.com/how-does-urban-heat-impact-vulnerable-people/',
      },
      {
        name: 'Climate Atlas of Canada — Urban Heat Island Effect',
        url: 'https://climateatlas.ca/urban-heat-island-effect',
      },
    ],
    color: 'text-green-400',
  },

  moderate: {
    title: 'Moderate Heat Level — Plant Trees Strategically',
    message:
      'The area is warming. Adding targeted tree cover can drastically reduce air temperatures, improve health, and strengthen community resilience.',
    tips: [
      'Expand tree planting in areas with low canopy coverage — especially low-income or industrial neighborhoods that trap more heat.',
      'Trees cool air by 2–7°F (1–4°C) through shade and water release via evapotranspiration, making urban streets livable again.',
      'Establish tree corridors and rooftop gardens to connect cooling zones across neighborhoods.',
    ],
    sources: [
      {
        name: 'University of Michigan: Urban Heat Islands and Climate Inequities',
        url: 'https://seas.umich.edu/news/urban-heat-islands-and-climate-inequities-0',
      },
      {
        name: 'NASA Landsat Study: Heat Disparities in Low-Income Areas',
        url: 'https://landsat.gsfc.nasa.gov/article/hot-in-the-city-and-hotter-still-in-low-income-areas/',
      },
    ],
    color: 'text-yellow-400',
  },

  high: {
    title: 'High Heat Level — Trees Can Save Lives',
    message:
      'Extreme heat is a public health crisis. Urban forests and shade infrastructure are critical tools to cool cities, protect vulnerable people, and reduce mortality.',
    tips: [
      'Launch immediate large-scale tree planting programs focused on low-income and high-density zones lacking greenery.',
      'Create shaded cooling corridors connecting residential areas to public spaces and transit routes.',
      'Increase tree density around schools, healthcare facilities, and senior housing to protect vulnerable populations.',
      'Combine trees with reflective roofs and water features for maximum cooling efficiency.',
    ],
    sources: [
      {
        name: 'Health Journalism: Urban Heat and Vulnerable Populations',
        url: 'https://healthjournalism.org/blog/2024/08/everything-you-need-to-know-about-the-urban-heat-island-effect/',
      },
      {
        name: 'Scientific American: Extreme Heat Deadlier Than Hurricanes',
        url: 'https://www.scientificamerican.com/article/extreme-heat-is-deadlier-than-hurricanes-floods-and-tornadoes-combined/',
      },
    ],
    color: 'text-red-400 animate-pulse',
  },
};

const ScorePanel = () => {
  const [score, setScore] = useState(2); // Example starting score

  useEffect(() => {
    // Example: Fetch heat score dynamically
    // fetch('/api/heat-score')
    //   .then(res => res.json())
    //   .then(data => setScore(data.score));
  }, []);

  let plan;
  if (score <= 4) plan = heatPlans.low;
  else if (score <= 10) plan = heatPlans.moderate;
  else plan = heatPlans.high;

  return (
    <section className="flex min-h-[400px] flex-col rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-lg">
      <header className="mb-3">
        <h2 className="text-lg font-semibold text-slate-100">Urban Heat Score</h2>
        <p className="text-xs text-slate-400">
          Tree-centered heat mitigation insights
        </p>
      </header>

      <div
        className={`text-5xl font-bold ${plan.color} transition-all duration-300`}
      >
        {score}
      </div>

      <div className="mt-3 flex-1 text-sm leading-relaxed text-slate-300">
        <p className="font-medium text-slate-200">{plan.title}</p>
        <p className="mt-1 text-slate-400">{plan.message}</p>

        <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-400">
          {plan.tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>

        <div className="mt-4 text-xs text-slate-500">
          <strong>Sources:</strong>
          {plan.sources.map((src, i) => (
            <div key={i}>
              •{' '}
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {src.name}
              </a>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-4 w-fit rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-500 active:bg-green-400"
      >
        Recommend Tree Action
      </button>
    </section>
  );
};

export default ScorePanel;
