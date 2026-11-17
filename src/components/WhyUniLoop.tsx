import React from 'react';
import { PiggyBank, Clock, Users, Leaf } from 'lucide-react';

export const WhyUniLoop: React.FC = () => {
  const benefits = [
    {
      icon: PiggyBank,
      title: 'Save Money',
      description:
        'Why buy a ₹1,500 calculator or lab kit for one practical? Rent it for ₹10/hour or borrow free from a senior.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Clock,
      title: 'Flexible Borrowing Durations',
      description:
        'Borrow or rent for 1 hour, 2 hours, 3 hours, 1 day, or multiple days with crystal-clear return times.',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: Users,
      title: 'Lend & Help Your Campus',
      description:
        'Share idle academic gear free of charge or set your own fair rental rate to help fellow students out.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      icon: Leaf,
      title: 'Reduce Waste & Clutter',
      description:
        'Cut down on duplicate plastic, single-use electronics, and abandoned gear piled up in hostel rooms.',
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
            Student First
          </h2>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Choose UniLoop?
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Smart sharing designed around the real everyday realities of college life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${item.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
