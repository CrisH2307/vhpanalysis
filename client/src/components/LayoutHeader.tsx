import React from 'react';

const cities = ['Toronto', 'Vancouver', 'Montreal'];

const labelClass =
  'flex flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500';

const inputClass =
  'min-w-[160px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

type LayoutHeaderProps = {
  selectedCity: string;
  onCityChange: (city: string) => void;
};

const LayoutHeader = ({ selectedCity, onCityChange }: LayoutHeaderProps) => {
  return (
    <header className="flex items-center gap-6 border-b border-slate-200 bg-white px-8 py-4">
      <div className="text-base font-bold tracking-[0.2em] text-slate-800">LOGO</div>
      <div className="ml-auto flex flex-wrap items-end gap-4">
        <label className={labelClass}>
          <span>Input City</span>
          <select
            className={inputClass}
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
          >
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span>Modify Date</span>
          <input type="date" className={inputClass} />
        </label>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          Default Date
        </button>
      </div>
    </header>
  );
};

export default LayoutHeader;