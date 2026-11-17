import React from 'react';
import { Search, Send, CheckCircle2, RotateCcw } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Find what you need',
      description: 'Search items available across your campus — chargers, scientific calculators, lab coats, textbooks, or drafting kits.',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
    },
    {
      step: '02',
      title: 'Select duration & request',
      description: 'Choose your pickup time and flexible duration — 1 hour, 2 hours, 3 hours, 1 day, or multiple days — and review expected return time.',
      icon: Send,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      step: '03',
      title: "Get owner's approval",
      description: "The student owner accepts or rejects your request. Once approved, your borrowing slot is reserved on campus.",
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      step: '04',
      title: 'Collect, use & return on time',
      description: 'Pick up at the campus spot, track the agreed duration and return time in your dashboard, and confirm handback.',
      icon: RotateCcw,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
            Simple 4-Step Process
          </h2>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How UniLoop Works
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Convenient, accountable, and designed specifically for student daily campus life.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative bg-slate-50/60 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-300 font-mono">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
