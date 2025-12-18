import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import GuideCard from '@/components/GuideCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Bookmark, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [savedGuides, setSavedGuides] = useState([]);
  const [submittedGuides, setSubmittedGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [saved, submitted, cats] = await Promise.all([
        base44.entities.SavedGuide.filter({ user_email: userData.email }),
        base44.entities.Guide.filter({ author_email: userData.email }, '-created_date'),
        base44.entities.Category.list()
      ]);

      // Load full guide details for saved guides
      const guideIds = saved.map(s => s.guide_id);
      const guidesData = await Promise.all(
        guideIds.map(id => 
          base44.entities.Guide.filter({ id, status: 'approved' })
        )
      );
      
      setSavedGuides(guidesData.flat());
      setSubmittedGuides(submitted);
      setCategories(cats);
    } catch (e) {
      base44.auth.redirectToLogin();
      return;
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200', text: t.profile.pending },
      approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: t.profile.approved },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200', text: t.profile.rejected }
    };
    
    const { icon: Icon, color, text } = config[status] || config.pending;
    
    return (
      <Badge className={`${color} border gap-1`}>
        <Icon className="w-3 h-3" />
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const stats = [
    { label: t.profile.saved, value: savedGuides.length, icon: Bookmark, color: 'text-emerald-600' },
    { label: t.profile.submitted, value: submittedGuides.length, icon: FileText, color: 'text-blue-600' },
    { 
      label: t.profile.approved, 
      value: submittedGuides.filter(g => g.status === 'approved').length, 
      icon: CheckCircle, 
      color: 'text-emerald-600' 
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6"
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.full_name || 'User'}</h1>
              <div className="flex items-center gap-2 text-emerald-100">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <stat.icon className="w-6 h-6 mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-emerald-100">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="w-full sm:w-auto mb-6">
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="w-4 h-4" />
              {t.profile.saved}
            </TabsTrigger>
            <TabsTrigger value="submitted" className="gap-2">
              <FileText className="w-4 h-4" />
              {t.profile.submitted}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved">
            {savedGuides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedGuides.map((guide) => (
                  <GuideCard 
                    key={guide.id} 
                    guide={guide}
                    category={categories.find(c => c.id === guide.category_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t.profile.noSaved}</h3>
                <p className="text-slate-500">Start exploring guides and save your favorites</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="submitted">
            {submittedGuides.length > 0 ? (
              <div className="space-y-4">
                {submittedGuides.map((guide) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {guide.title}
                          </h3>
                          {getStatusBadge(guide.status)}
                        </div>
                        <p className="text-slate-600 mb-2">{guide.product_name}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{guide.difficulty}</span>
                          {guide.steps?.length > 0 && (
                            <span>{guide.steps.length} steps</span>
                          )}
                          <span>{new Date(guide.created_date).toLocaleDateString()}</span>
                        </div>
                        {guide.status === 'rejected' && guide.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong>Rejection reason:</strong> {guide.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>
                      {guide.cover_image && (
                        <img 
                          src={guide.cover_image} 
                          alt={guide.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t.profile.noSubmitted}</h3>
                <p className="text-slate-500 mb-4">Share your knowledge with the community</p>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = '/SubmitGuide'}
                >
                  Submit Your First Guide
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}