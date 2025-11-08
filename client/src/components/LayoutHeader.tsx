import React, { useEffect, useState } from 'react';

type LayoutHeaderProps = {
  city: string;
  date: string;
  onCitySubmit: (city: string) => void;
  onDateChange: (date: string) => void;
};

const LayoutHeader = ({ city, date, onCitySubmit, onDateChange }: LayoutHeaderProps) => {
  const [searchValue, setSearchValue] = useState(city);

  useEffect(() => {
    setSearchValue(city);
  }, [city]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCity = searchValue.trim();
    if (nextCity) {
      onCitySubmit(nextCity);
    }
  };

  const inputClass =
    'w-full bg-transparent text-slate-200 placeholder:text-slate-400 pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
  const activeButtonClass =
    'rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 active:bg-blue-700';

  return (
    <header className="flex items-center gap-6 border-b border-slate-600 bg-slate-800 px-6 py-4 shadow-md">

      {/* Logo + Title Section */}
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 flex items-center justify-center">
          <img
            src="/Logo.png"
            alt="VHPA Logo"
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="flex flex-col">
          <div className="text-xl font-bold tracking-wide text-white">VHPA</div>
          <div className="text-sm text-slate-400">Vegetation Heat Propagation Analysis</div>
        </div>
      </div>


      {/* Search Bar + Date Picker + Button */}
      <div className="ml-auto flex flex-wrap items-center gap-4">

        {/* City Search */}
        <form
          onSubmit={handleSubmit}
          className="relative flex w-64 items-center rounded-md bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500"
        >
          <svg
            className="absolute left-3 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search city..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={inputClass}
          />
        </form>

        {/* Date Picker */}
        <div className="relative flex items-center rounded-md bg-slate-700 focus-within:ring-2 focus-within:ring-blue-500">
          <svg
            className="absolute left-3 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full bg-transparent pl-10 pr-3 py-2 text-slate-200 placeholder:text-slate-400 focus:outline-none rounded-md"
          />
        </div>

        <button
          type="button"
          onClick={() => onCitySubmit(searchValue.trim())}
          className={activeButtonClass}
        >
          Search
        </button>
      </div>

    </header>
  );
};

export default LayoutHeader;