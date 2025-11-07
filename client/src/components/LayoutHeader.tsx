import React, { useState } from 'react';

const inputClass =
  'min-w-[200px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const LayoutHeader = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (event: any) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    onSearch(searchTerm);
  };
  
  const onSearch = (term: string) => {
    console.log('Searching for city:', term);
    // Implement search logic here
  };
  return (
    <header className="flex items-center gap-6 border-b border-slate-200 bg-white px-8 py-4">
      <div className="text-base font-bold tracking-[0.2em] text-slate-800">LOGO</div>
      <div className="ml-auto flex flex-wrap items-center gap-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-1 shadow-sm"
        >
          <input
            id="city-search"
            type="text"
            placeholder="Search city..."
            value={searchTerm}
            onChange={handleChange}
            className="w-56 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Search
          </button>
        </form>

        <input type="date" className={inputClass} />

        <button
          type="button"
          className="rounded-2xl border border-slate-200 px-5 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          Default Date
        </button>
      </div>
    </header>
  );
};

export default LayoutHeader;
