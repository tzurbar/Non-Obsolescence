import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle,
  Image as ImageIcon,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubmitGuide() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    product_name: '',
    difficulty: 'beginner',
    tools: '',
    estimated_time: '',
    cover_image: '',
    steps: [{ order: 1, title: '', description: '', image_url: '' }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const cats = await base44.entities.Category.list();
      setCategories(cats);
    } catch (e) {
      base44.auth.redirectToLogin();
      return;
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        { order: prev.steps.length + 1, title: '', description: '', image_url: '' }
      ]
    }));
  };

  const removeStep = (index) => {
    if (formData.steps.length === 1) {
      toast.error('You must have at least one step');
      return;
    }
    const newSteps = formData.steps.filter((_, i) => i !== index);
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const handleImageUpload = async (file, field, stepIndex = null) => {
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (stepIndex !== null) {
        handleStepChange(stepIndex, 'image_url', file_url);
      } else {
        handleInputChange(field, file_url);
      }
      
      toast.success('Image uploaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.product_name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (formData.steps.some(s => !s.title.trim() || !s.description.trim())) {
      toast.error('Please fill in all step titles and descriptions');
      return;
    }

    setSubmitting(true);
    
    try {
      const toolsArray = formData.tools
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await base44.entities.Guide.create({
        title: formData.title,
        category_id: formData.category_id,
        product_name: formData.product_name,
        difficulty: formData.difficulty,
        tools: toolsArray,
        estimated_time: formData.estimated_time || null,
        cover_image: formData.cover_image || null,
        steps: formData.steps,
        status: 'pending',
        author_name: user.full_name || user.email,
        author_email: user.email
      });

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          title: '',
          category_id: '',
          product_name: '',
          difficulty: 'beginner',
          tools: '',
          estimated_time: '',
          cover_image: '',
          steps: [{ order: 1, title: '', description: '', image_url: '' }]
        });
        setSuccess(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      toast.error('Failed to submit guide');
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
          <p className="text-slate-600">{t.submit.success}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {t.submit.title}
            </h1>
            <p className="text-slate-600">
              Share your knowledge with the community. Your guide will be reviewed before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t.submit.guideTitle} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., How to Replace iPhone Battery"
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">{t.submit.category} *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => handleInputChange('category_id', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">{t.submit.difficulty} *</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(value) => handleInputChange('difficulty', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t.guide.beginner}</SelectItem>
                      <SelectItem value="intermediate">{t.guide.intermediate}</SelectItem>
                      <SelectItem value="advanced">{t.guide.advanced}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="product">{t.submit.product} *</Label>
                <Input
                  id="product"
                  value={formData.product_name}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  placeholder="e.g., iPhone 12 Pro"
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tools">{t.submit.tools}</Label>
                  <Input
                    id="tools"
                    value={formData.tools}
                    onChange={(e) => handleInputChange('tools', e.target.value)}
                    placeholder="Screwdriver, Tweezers, Spudger"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="time">{t.submit.time}</Label>
                  <Input
                    id="time"
                    value={formData.estimated_time}
                    onChange={(e) => handleInputChange('estimated_time', e.target.value)}
                    placeholder="e.g., 30 minutes"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cover">{t.submit.coverImage}</Label>
                <div className="mt-1.5">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], 'cover_image')}
                    />
                    {formData.cover_image ? (
                      <img 
                        src={formData.cover_image} 
                        alt="Cover" 
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-emerald-500" />
                        <p className="text-sm text-slate-500">Click to upload cover image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{t.submit.steps}</h2>
                <Button type="button" onClick={addStep} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  {t.submit.addStep}
                </Button>
              </div>

              <AnimatePresence>
                <div className="space-y-6">
                  {formData.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-slate-50 rounded-xl p-4 relative"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 mt-1">
                          {step.order}
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <Input
                            value={step.title}
                            onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                            placeholder={t.submit.stepTitle}
                            required
                          />
                          
                          <Textarea
                            value={step.description}
                            onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                            placeholder={t.submit.stepDescription}
                            rows={3}
                            required
                          />
                          
                          <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 transition-colors cursor-pointer group">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e.target.files[0], 'image_url', index)}
                            />
                            {step.image_url ? (
                              <img 
                                src={step.image_url} 
                                alt={`Step ${index + 1}`}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-400 group-hover:text-emerald-500" />
                                <p className="text-xs text-slate-500">{t.submit.stepImage}</p>
                              </div>
                            )}
                          </label>
                        </div>
                        
                        {formData.steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-8"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t.submit.submit}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}