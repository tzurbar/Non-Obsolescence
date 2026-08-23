import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from './LanguageContext';
import { Clock, Wrench, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function GuideCard({ guide, category }) {
  const { t, language } = useLanguage();
  
  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
    advanced: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  const getLocalizedTitle = () => {
    const key = `title_${language}`;
    return guide[key] || guide.title;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={createPageUrl('GuidePage') + `?id=${guide.id}`}>
        <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
            {guide.cover_image ? (
              <img
                src={guide.cover_image}
                alt={guide.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Wrench className="w-12 h-12 text-slate-300" />
              </div>
            )}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
              <Badge className={`${difficultyColors[guide.difficulty]} border font-medium`}>
                {t.guide[guide.difficulty]}
              </Badge>
              {guide.featured && (
                <Badge className="bg-emerald-600 text-white border-emerald-600">
                  ★ Featured
                </Badge>
              )}
            </div>
          </div>
          
          <div className="p-5">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">
              {category?.name || 'Guide'}
            </p>
            <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {getLocalizedTitle()}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {guide.product_name}
            </p>
            
            <div className="flex items-center justify-between text-sm text-slate-400">
              <div className="flex items-center gap-4">
                {guide.estimated_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {guide.estimated_time}
                  </span>
                )}
                {guide.steps?.length > 0 && (
                  <span>{guide.steps.length} {t.guide.steps.toLowerCase()}</span>
                )}
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-emerald-500" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}