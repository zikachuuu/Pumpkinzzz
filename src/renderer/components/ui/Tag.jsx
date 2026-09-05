import React from 'react';

export default function Tag({ color, children }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    pink: 'bg-pink-100 text-pink-800 border-pink-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
    zinc: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  };
  return <span className={`inline-block border text-[9px] font-bold px-1.5 py-0 rounded uppercase tracking-wide ${colors[color]}`}>{children}</span>;
}