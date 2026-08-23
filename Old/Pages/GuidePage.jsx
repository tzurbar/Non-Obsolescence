import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Wrench, 
  BookmarkPlus, 
  Bookmark, 
  ChevronLeft,
  CheckCircle2,
  User,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function GuidePage() {
  const { t } = useLanguage();
  const [guide, setGuide] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const params = new URLSearchParams(window.location.search);
    const guideId = params.get('id');
    
    if (!guideId) {
      window.location.href = createPageUrl('Guides');
      return;
    }

    try {
      // Load user
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        setUser(null);
      }

      // Load guide
      const guides = await base44.entities.Guide.filter({ id: guideId });
      if (guides.length === 0) {
        window.location.href = createPageUrl('Guides');
        return;
      }
      
      const guideData = guides[0];
      setGuide(guideData);

      // Increment view count
      await base44.entities.Guide.update(guideId, {
        view_count: (guideData.view_count || 0) + 1
      });

      // Load category
      if (guideData.category_id) {
        const cats = await base44.entities.Category.filter({ id: guideData.category_id });
        if (cats.length > 0) setCategory(cats[0]);
      }

      // Check if saved
      if (user) {
        const saved = await base44.entities.SavedGuide.filter({
          guide_id: guideId,
          user_email: user.email
        });
        setIsSaved(saved.length > 0);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      if (isSaved) {
        const saved = await base44.entities.SavedGuide.filter({
          guide_id: guide.id,
          user_email: user.email
        });
        if (saved.length > 0) {
          await base44.entities.SavedGuide.delete(saved[0].id);
          setIsSaved(false);
          toast.success('Guide removed from saved');
        }
      } else {
        await base44.entities.SavedGuide.create({
          guide_id: guide.id,
          user_email: user.email
        });
        setIsSaved(true);
        toast.success('Guide saved!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save guide');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: guide.title,
        text: `Check out this repair guide: ${guide.title}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    intermediate: 'bg-amber-100 text-amber-700 border-amber-200',
    advanced: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!guide) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to={createPageUrl('Guides')}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Guides
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8"
        >
          {guide.cover_image && (
            <div className="aspect-[21/9] relative overflow-hidden bg-slate-100">
              <img 
                src={guide.cover_image} 
                alt={guide.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                {category && (
                  <p className="text-sm font-medium text-emerald-600 uppercase tracking-wide mb-2">
                    {category.name}
                  </p>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {guide.title}
                </h1>
                <p className="text-lg text-slate-600">{guide.product_name}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="h-11 w-11"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleSave}
                  className={`gap-2 h-11 ${
                    isSaved 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Bookmark className="w-5 h-5 fill-current" />
                      <span className="hidden sm:inline">{t.guide.saved}</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-5 h-5" />
                      <span className="hidden sm:inline">{t.guide.save}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center text-sm text-slate-600">
              <Badge className={`${difficultyColors[guide.difficulty]} border`}>
                {t.guide[guide.difficulty]}
              </Badge>
              {guide.estimated_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {guide.estimated_time}
                </div>
              )}
              {guide.author_name && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {t.guide.by} {guide.author_name}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tools Required */}
        {guide.tools && guide.tools.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900">{t.guide.tools}</h2>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guide.tools.map((tool, index) => (
                <li key={index} className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {tool}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Steps */}
        {guide.steps && guide.steps.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.guide.steps}</h2>
            
            <div className="space-y-8">
              {guide.steps
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                          {step.order || index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {step.title}
                        </h3>
                        <p className="text-slate-600 mb-4 leading-relaxed">
                          {step.description}
                        </p>
                        
                        {step.image_url && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img 
                              src={step.image_url} 
                              alt={step.title}
                              className="w-full h-auto"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < guide.steps.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-slate-200" />
                    )}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}