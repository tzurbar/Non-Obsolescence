import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  PlusCircle, 
  User, 
  Settings,
  Leaf,
  LogOut
} from 'lucide-react';

function LayoutContent({ children, currentPageName }) {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      setUser(null);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { name: t.nav.home, path: 'Home', icon: Home },
    { name: t.nav.guides, path: 'Guides', icon: BookOpen },
    { name: t.nav.submit, path: 'SubmitGuide', icon: PlusCircle, requireAuth: true },
    { name: t.nav.profile, path: 'Profile', icon: User, requireAuth: true },
  ];

  if (user?.role === 'admin') {
    navItems.push({ name: t.nav.admin, path: 'Admin', icon: Settings });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 hidden sm:block">
                Non-Obsolescence
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                if (item.requireAuth && !user) return null;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPageName === item.path
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-slate-600">{user.full_name || user.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  className="hidden md:flex bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                  onClick={() => base44.auth.redirectToLogin()}
                >
                  {t.nav.login}
                </Button>
              )}

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full pt-8">
                    <nav className="flex-1 space-y-2">
                      {navItems.map((item) => {
                        if (item.requireAuth && !user) return null;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={createPageUrl(item.path)}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                              currentPageName === item.path
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                    
                    <div className="border-t pt-4">
                      {user ? (
                        <div className="space-y-3">
                          <p className="px-4 text-sm text-slate-600">{user.email}</p>
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            {t.nav.logout}
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => base44.auth.redirectToLogin()}
                        >
                          {t.nav.login}
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl">Non-Obsolescence</span>
              </div>
              <p className="text-slate-400 text-sm">{t.footer.mission}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to={createPageUrl('Home')} className="block text-slate-400 hover:text-white text-sm">
                  {t.nav.home}
                </Link>
                <Link to={createPageUrl('Guides')} className="block text-slate-400 hover:text-white text-sm">
                  {t.nav.guides}
                </Link>
                <Link to={createPageUrl('SubmitGuide')} className="block text-slate-400 hover:text-white text-sm">
                  {t.nav.submit}
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Join the Movement</h4>
              <p className="text-slate-400 text-sm mb-4">
                Help build a world where products last longer and waste less.
              </p>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Non-Obsolescence. {t.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </LanguageProvider>
  );
}