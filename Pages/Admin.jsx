import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  FileCheck, 
  FolderOpen, 
  CheckCircle, 
  XCircle,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Admin() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [pendingGuides, setPendingGuides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Wrench', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      
      if (userData.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      
      setUser(userData);

      const [pending, cats] = await Promise.all([
        base44.entities.Guide.filter({ status: 'pending' }, '-created_date'),
        base44.entities.Category.list()
      ]);

      setPendingGuides(pending);
      setCategories(cats);
    } catch (e) {
      base44.auth.redirectToLogin();
      return;
    }
    setLoading(false);
  };

  const handleApprove = async (guide) => {
    try {
      await base44.entities.Guide.update(guide.id, { status: 'approved' });
      
      // Update category guide count
      const category = categories.find(c => c.id === guide.category_id);
      if (category) {
        await base44.entities.Category.update(category.id, {
          guide_count: (category.guide_count || 0) + 1
        });
      }

      toast.success('Guide approved!');
      loadData();
      setShowGuideDialog(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve guide');
    }
  };

  const handleReject = async (guide) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await base44.entities.Guide.update(guide.id, { 
        status: 'rejected',
        rejection_reason: rejectionReason
      });

      toast.success('Guide rejected');
      setRejectionReason('');
      loadData();
      setShowGuideDialog(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject guide');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      await base44.entities.Category.create({
        name: newCategory.name,
        icon: newCategory.icon,
        description: newCategory.description,
        guide_count: 0
      });

      toast.success('Category added!');
      setNewCategory({ name: '', icon: 'Wrench', description: '' });
      setShowCategoryDialog(false);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await base44.entities.Category.delete(categoryId);
      toast.success('Category deleted');
      loadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border-2 border-emerald-500/30">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{t.admin.title}</h1>
              <p className="text-slate-400">Manage guides and categories</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FileCheck className="w-6 h-6 mb-2 text-amber-400" />
              <p className="text-2xl font-bold">{pendingGuides.length}</p>
              <p className="text-sm text-slate-400">{t.admin.pending}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <FolderOpen className="w-6 h-6 mb-2 text-blue-400" />
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-slate-400">{t.admin.categories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full sm:w-auto mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <FileCheck className="w-4 h-4" />
              {t.admin.pending}
              {pendingGuides.length > 0 && (
                <Badge className="bg-amber-500 text-white ml-1">{pendingGuides.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              {t.admin.categories}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingGuides.length > 0 ? (
              <div className="space-y-4">
                {pendingGuides.map((guide) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {guide.title}
                        </h3>
                        <p className="text-slate-600 mb-3">{guide.product_name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <Badge variant="secondary">{guide.difficulty}</Badge>
                          <span>By {guide.author_name}</span>
                          <span>{guide.steps?.length || 0} steps</span>
                          <span>{new Date(guide.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGuide(guide);
                            setShowGuideDialog(true);
                          }}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t.admin.noPending}</h3>
                <p className="text-slate-500">All guides have been reviewed</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-4">
              <Button 
                onClick={() => setShowCategoryDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                {t.admin.addCategory}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl border border-slate-100 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{category.description}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {category.guide_count || 0} guides
                  </p>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Guide Review Dialog */}
      <Dialog open={showGuideDialog} onOpenChange={setShowGuideDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Guide</DialogTitle>
            <DialogDescription>
              Review the submitted guide and approve or reject it
            </DialogDescription>
          </DialogHeader>

          {selectedGuide && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedGuide.title}</h3>
                <p className="text-slate-600">{selectedGuide.product_name}</p>
              </div>

              {selectedGuide.cover_image && (
                <img 
                  src={selectedGuide.cover_image} 
                  alt={selectedGuide.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Difficulty:</span> {selectedGuide.difficulty}
                </div>
                <div>
                  <span className="font-medium">Author:</span> {selectedGuide.author_name}
                </div>
                {selectedGuide.estimated_time && (
                  <div>
                    <span className="font-medium">Time:</span> {selectedGuide.estimated_time}
                  </div>
                )}
              </div>

              {selectedGuide.tools && selectedGuide.tools.length > 0 && (
                <div>
                  <span className="font-medium">Tools:</span>
                  <p className="text-slate-600 mt-1">{selectedGuide.tools.join(', ')}</p>
                </div>
              )}

              {selectedGuide.steps && selectedGuide.steps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Steps:</h4>
                  <div className="space-y-3">
                    {selectedGuide.steps.map((step, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-medium">Step {step.order}: {step.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="rejection">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this guide is being rejected..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => selectedGuide && handleReject(selectedGuide)}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              {t.admin.reject}
            </Button>
            <Button
              onClick={() => selectedGuide && handleApprove(selectedGuide)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4" />
              {t.admin.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.admin.addCategory}</DialogTitle>
            <DialogDescription>
              Create a new category for guides
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., Electronics"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="cat-icon">Icon Name</Label>
              <Input
                id="cat-icon"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                placeholder="e.g., Smartphone, Laptop, Home"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-500 mt-1">Use Lucide icon names</p>
            </div>

            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description..."
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className="bg-emerald-600 hover:bg-emerald-700">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}