import React, { useEffect, useState } from 'react';

const labelClass =
  'flex flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500';

const inputClass =
  'min-w-[180px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

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

  const handleDefaultDate = () => {
    onDateChange('2025-01-01');
  };

  return (
    <header className="flex items-center gap-6 border-b border-slate-200 bg-white px-8 py-4">
      <div className="text-base font-bold tracking-[0.2em] text-slate-800">LOGO</div>
      <div className="ml-auto flex flex-wrap items-center gap-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 shadow-sm"
        >
          <label htmlFor="city-search" className="sr-only">
            Search city
          </label>
          <input
            id="city-search"
            type="text"
            placeholder="Search city..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="w-56 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Search
          </button>
        </form>
        <label className={labelClass}>
          <span>Modify Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="button"
          onClick={handleDefaultDate}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          Default Date
        </button>
      </div>
    </header>
  );
};

export default LayoutHeader;
