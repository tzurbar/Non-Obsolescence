import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from './LanguageContext';
import { 
  Smartphone, 
  Laptop, 
  Home, 
  Car, 
  Bike, 
  Shirt, 
  Utensils, 
  Armchair,
  Hammer,
  Wrench
} from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  Smartphone,
  Laptop,
  Home,
  Car,
  Bike,
  Shirt,
  Utensils,
  Armchair,
  Hammer,
  Wrench
};

export default function CategoryCard({ category, index }) {
  const { language } = useLanguage();
  
  const getLocalizedName = () => {
    const key = `name_${language}`;
    return category[key] || category.name;
  };

  const Icon = iconMap[category.icon] || Wrench;

  const colors = [
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Link to={createPageUrl('Guides') + `?category=${category.id}`}>
        <div className="group relative overflow-hidden rounded-2xl p-6 h-40 cursor-pointer">
          <div className={`absolute inset-0 bg-gradient-to-br ${colors[index % colors.length]} opacity-90 group-hover:opacity-100 transition-opacity`} />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
          
          <div className="relative z-10 h-full flex flex-col justify-between text-white">
            <Icon className="w-10 h-10 opacity-90" />
            <div>
              <h3 className="font-bold text-xl mb-1">{getLocalizedName()}</h3>
              <p className="text-sm text-white/80">
                {category.guide_count || 0} guides
              </p>
            </div>
          </div>
          
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
        </div>
      </Link>
    </motion.div>
  );
}