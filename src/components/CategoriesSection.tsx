import React from 'react';
import { ItemCategory } from '../types/index.js';
import {
  Laptop,
  Calculator,
  BookOpen,
  FlaskConical,
  PenTool,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CategoriesSectionProps {
  onSelectCategory: (cat: ItemCategory) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onSelectCategory }) => {
  const categories: { name: ItemCategory; icon: any; count: string; desc: string; bg: string }[] = [
    {
      name: 'Electronics',
      icon: Laptop,
      count: 'Chargers, Laptops, Casio Calculators',
      desc: 'Never let a dead battery or forgotten adapter ruin your lab.',
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      name: 'Academic Equipment',
      icon: Calculator,
      count: 'Calculators, Sensors, Project Kits',
      desc: 'Scientific instruments & kits for exams and project demos.',
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      name: 'Lab Equipment',
      icon: FlaskConical,
      count: 'Lab Coats, Multimeters, Breadboards',
      desc: 'Stay practical-ready without scrambling before your shift.',
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      name: 'Books and Notes',
      icon: BookOpen,
      count: 'Standard Textbooks, Reference Handbooks',
      desc: 'Borrow textbooks for semester exams and assignment crunch.',
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      name: 'Stationery',
      icon: PenTool,
      count: 'Mini Drafters, Geometry Boxes, Sets',
      desc: 'Specialized tools needed for engineering and design studios.',
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      name: 'Other',
      icon: Layers,
      count: 'Project Supplies, Accessories',
      desc: 'Anything helpful you can lend or borrow between classes.',
      bg: 'bg-slate-50 text-slate-600 border-slate-200',
    },
  ];

  return (
    <section className="py-16 bg-slate-50/50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Browse by Needs
            </h2>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Categories
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Academic resources and tools students can borrow or rent on campus without buying new.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectCategory(cat.name)}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-3 ${cat.bg} group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {cat.count}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Browse items</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
