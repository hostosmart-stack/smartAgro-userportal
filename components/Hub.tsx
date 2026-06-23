import React from 'react';
import { 
  ShoppingCart, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  LayoutDashboard, 
  Calculator, 
  LogOut, 
  ChevronRight, 
  Menu, 
  Globe, 
  Package, 
  Users, 
  BarChart3, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Zap,
  Coffee,
  AlertTriangle,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export type AppCategory = 'magasin' | 'facturation' | 'comptabilite' | 'administration' | null;

interface HubProps {
  onSelectCategory: (category: AppCategory) => void;
  userName: string;
  userRole: string;
  userPermissions: string[];
  onLogout: () => void;
  isLicenseEndingSoon?: boolean;
  remainingDays?: number | null;
  licenseExpiryDate?: string;
  onNavigateToSettings?: () => void;
  dismissLicenseBanner?: boolean;
  setDismissLicenseBanner?: (dismissed: boolean) => void;
}

export const Hub: React.FC<HubProps> = ({ 
  onSelectCategory, 
  userName, 
  userRole, 
  userPermissions, 
  onLogout,
  isLicenseEndingSoon,
  remainingDays,
  licenseExpiryDate,
  onNavigateToSettings,
  dismissLicenseBanner,
  setDismissLicenseBanner
}) => {
  const { t, language, setLanguage } = useLanguage();

  // Define categories metadata
  const categoriesMap = {
    magasin: {
      id: 'magasin' as AppCategory,
      title: t('hub.section.magasin_title'),
      subtitle: t('hub.section.magasin_subtitle'),
      description: t('hub.section.magasin_description'),
      icon: Package,
      badge: t('hub.section.magasin_badge'),
      badgeColor: 'bg-blue-500/10 text-blue-700 border border-blue-200 dark:border-blue-500/30',
      color: 'text-blue-600',
      bgColor: 'bg-blue-5/70 dark:bg-blue-950/20',
      gradient: 'from-blue-500/10 to-indigo-500/5',
      accentColor: 'group-hover:text-blue-600',
      shadowColor: 'shadow-blue-500/10 hover:shadow-blue-500/20',
      features: [
        t('hub.section.magasin_f1'),
        t('hub.section.magasin_f2'),
        t('hub.section.magasin_f3')
      ],
      tag: t('hub.section.magasin_tag'),
      permissions: ['inventory', 'settings']
    },
    facturation: {
      id: 'facturation' as AppCategory,
      title: t('hub.section.facturation_title'),
      subtitle: t('hub.section.facturation_subtitle'),
      description: t('hub.section.facturation_description'),
      icon: FileText,
      badge: t('hub.section.facturation_badge'),
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:border-emerald-500/30',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-5/70 dark:bg-emerald-950/20',
      gradient: 'from-emerald-500/10 to-teal-500/5',
      accentColor: 'group-hover:text-emerald-600',
      shadowColor: 'shadow-emerald-500/10 hover:shadow-emerald-500/20',
      features: [
        t('hub.section.facturation_f1'),
        t('hub.section.facturation_f2'),
        t('hub.section.facturation_f3')
      ],
      tag: t('hub.section.facturation_tag'),
      permissions: ['invoices', 'pos']
    },
    comptabilite: {
      id: 'comptabilite' as AppCategory,
      title: t('hub.section.comptabilite_title'),
      subtitle: t('hub.section.comptabilite_subtitle'),
      description: t('hub.section.comptabilite_description'),
      icon: Calculator,
      badge: t('hub.section.comptabilite_badge'),
      badgeColor: 'bg-amber-500/10 text-amber-700 border border-amber-200 dark:border-amber-500/30',
      color: 'text-amber-600',
      bgColor: 'bg-amber-5/70 dark:bg-amber-950/20',
      gradient: 'from-amber-500/10 to-orange-500/5',
      accentColor: 'group-hover:text-amber-600',
      shadowColor: 'shadow-amber-500/10 hover:shadow-amber-500/20',
      features: [
        t('hub.section.comptabilite_f1'),
        t('hub.section.comptabilite_f2'),
        t('hub.section.comptabilite_f3')
      ],
      tag: t('hub.section.comptabilite_tag'),
      permissions: ['reports', 'accounting', 'analytics']
    },
    administration: {
      id: 'administration' as AppCategory,
      title: t('hub.section.administration_title'),
      subtitle: t('hub.section.administration_subtitle'),
      description: t('hub.section.administration_description'),
      icon: ShieldCheck,
      badge: t('hub.section.administration_badge'),
      badgeColor: 'bg-slate-500/10 text-slate-700 border border-slate-200 dark:border-slate-500/30',
      color: 'text-slate-705 dark:text-slate-300',
      bgColor: 'bg-slate-100/70 dark:bg-slate-800/40',
      gradient: 'from-slate-500/10 to-zinc-500/5',
      accentColor: 'group-hover:text-slate-800 dark:group-hover:text-white',
      shadowColor: 'shadow-slate-500/10 hover:shadow-slate-500/20',
      features: [
        t('hub.section.administration_f1'),
        t('hub.section.administration_f2'),
        t('hub.section.administration_f3')
      ],
      tag: t('hub.section.administration_tag'),
      permissions: ['employees']
    }
  };

  const categories = [
    categoriesMap.magasin,
    categoriesMap.facturation,
    categoriesMap.comptabilite,
    categoriesMap.administration
  ].filter(cat => {
    const norm = (userRole || '').toLowerCase().trim();
    const isSuperOrAdmin = norm === 'admin' || 
                           norm === 'superadmin' || 
                           norm === 'system-admin' ||
                           norm === 'super administrateur' ||
                           norm === 'superadministrateur' ||
                           norm === 'super-administrateur' ||
                           norm === 'administrateur' ||
                           norm.includes('system') ||
                           (norm.includes('super') && norm.includes('admin')) ||
                           norm.includes('administrateur');
    if (isSuperOrAdmin) return true;
    return cat.permissions.some(p => userPermissions.includes(p));
  });

  // Separate categories into Primary (Operational Core) and Secondary (Insights/Admin)
  const primaryCategories = categories.filter(cat => cat.id === 'magasin' || cat.id === 'facturation');
  const secondaryCategories = categories.filter(cat => cat.id === 'comptabilite' || cat.id === 'administration');

  return (
    <div className="min-h-full w-full bg-slate-50/20 dark:bg-[#0B1120] flex flex-col font-sans overflow-y-auto selection:bg-blue-500 selection:text-white pb-12">
      
      {/* Navigation Header */}
      <nav className="w-full bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/60 shadow-[0_2px_30px_rgba(0,0,0,0.01)] sticky top-0 z-50 transition-all duration-300 py-3.5 px-6 md:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-farm-500 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-farm-500/15">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">SMART AGRO</span>
            <span className="text-[9px] font-black text-farm-500 tracking-wider uppercase leading-none">{t('hub.nav.hub_grid')}</span>
          </div>
        </div>

        {/* Dynamic Navigation Links arranged elegantly */}
        <div className="hidden lg:flex items-center gap-2 font-sans bg-slate-100/60 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 shadow-inner">
          <a href="#" className="text-xs font-black text-farm-600 dark:text-farm-400 uppercase tracking-wider transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/20">
            <span>{t('hub.nav.home')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-farm-500 animate-pulse"></span>
          </a>
          <a href="#services" className="text-xs font-black text-slate-500 hover:text-slate-805 dark:hover:text-slate-100 uppercase tracking-wider transition-all px-4 py-2 hover:bg-white/40 dark:hover:bg-slate-800/30 rounded-xl">{t('hub.nav.modules')}</a>
        </div>

        {/* Action Controls & Logout */}
        <div className="flex items-center gap-3.5">
          {/* Language Switcher pill */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-[10px]">
            <button 
              onClick={() => setLanguage('fr')} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black transition-all ${language === 'fr' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <span>🇫🇷</span> <span className="hidden sm:inline">FR</span>
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <span>🇬🇧</span> <span className="hidden sm:inline">EN</span>
            </button>
          </div>

          <div className="hidden md:flex flex-col items-end mr-1 text-right font-sans">
            <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">{userName}</span>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">{userRole}</span>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-750 text-slate-650 dark:text-slate-350 rounded-xl font-black text-xs hover:bg-rose-50 dark:hover:bg-rose-950/25 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-150 dark:hover:border-rose-900/30 transition-all cursor-pointer active:scale-95 group shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-rose-500" />
            <span className="hidden sm:inline">{t('nav.logout')}</span>
          </button>
        </div>
      </nav>

      <div className="flex-grow flex flex-col items-center w-full">
        {/* Dynamic integrated license banner */}
        {isLicenseEndingSoon && !dismissLicenseBanner && (
          <section className="w-full max-w-7xl px-6 md:px-20 pt-8 pb-1">
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-rose-500/5 dark:from-amber-500/15 dark:to-rose-500/10 border border-amber-550/20 dark:border-amber-500/15 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Decorative vertical gradient strip */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-rose-500 rounded-l-full"></div>
              
              <div className="flex items-start gap-4 Pl-1">
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 shadow-sm shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse text-amber-600 dark:text-amber-450" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-amber-200 tracking-tight flex items-center gap-2">
                    {language === 'fr' 
                      ? '⚠️ Attention : Votre abonnement expire bientôt !' 
                      : '⚠️ Attention: Your subscription is expiring soon!'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                    {language === 'fr'
                      ? `Votre licence d'utilisation Smart Agro expire dans seulement ${remainingDays} jour${remainingDays! > 1 ? 's' : ''} (le ${licenseExpiryDate ? new Date(licenseExpiryDate).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}). Veuillez renouveler votre abonnement pour conserver l'accès continu.`
                      : `Your Smart Agro application access license will expire in just ${remainingDays} day${remainingDays! > 1 ? 's' : ''} (on ${licenseExpiryDate ? new Date(licenseExpiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}). Please renew to avoid service interruption.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md shadow-amber-600/10 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{language === 'fr' ? 'Gérer mon abonnement' : 'Manage Subscription'}</span>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </button>
                {setDismissLicenseBanner && (
                  <button
                    type="button"
                    onClick={() => setDismissLicenseBanner(true)}
                    className="p-2.5 hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-300 text-slate-400 dark:text-slate-500 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-amber-550/10"
                    title={language === 'fr' ? 'Ignorer pour cette session' : 'Ignore for this session'}
                  >
                    <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
        {/* Compact welcome row */}
        <section className="w-full max-w-7xl px-6 md:px-20 pt-10 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 p-8 rounded-[2.5rem] w-full">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black tracking-widest uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                {t('hub.header.dashboard')}
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {t('hub.header.welcome')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600">{userName}</span> !
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                {t('hub.header.connected_role_prefix')}<strong className="text-blue-600 font-extrabold">{userRole}</strong>{t('hub.header.connected_role_suffix')}
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-lg overflow-hidden shadow-lg shadow-blue-500/15">
                {userName.charAt(0)}
              </div>
              <div className="text-left font-sans">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('hub.header.active_session')}</p>
                 <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{userName}</p>
                 <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-none">{userRole}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Modules List View */}
        <section id="services" className="w-full py-8 px-6 md:px-20 transition-colors">
          <div className="max-w-7xl mx-auto">
            
            {/* --- VISUAL TIER 1: HIGHLY HIGHLIGHTED CORE OPERATIONAL MODULES --- */}
            <div className="mb-14">
              <div className="flex items-center gap-3 mb-8">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.3em] font-sans">
                  {t('hub.labels.operational_modules')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {primaryCategories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      className="group flex flex-col p-10 sm:p-12 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_40px_80px_-16px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.01] text-left relative overflow-hidden cursor-pointer"
                    >
                      <div className={`absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-30 rounded-full transition-all duration-500 blur-[80px]`}></div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-6 w-full mb-8 relative z-10">
                        <div className={`${cat.bgColor} ${cat.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                          <Icon className="w-8 h-8" />
                        </div>
                        
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${cat.badgeColor}`}>
                          {cat.badge}
                        </span>
                      </div>

                      <div className="relative z-10 flex-grow">
                        <h4 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors tracking-tight">
                          {cat.title}
                        </h4>
                        
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-relaxed mb-6 opacity-80 group-hover:opacity-100">
                          {cat.description}
                        </p>

                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-2">
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                            {cat.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-bold">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-8 pt-5 border-t border-slate-55 dark:border-slate-800/40 flex items-center justify-between w-full relative z-10 text-slate-400 group-hover:text-blue-600 font-black text-[10px] uppercase tracking-wider transition-all">
                        <span>{t('hub.labels.open_space')}</span>
                        <div className="bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 text-slate-600 group-hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-all">
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- VISUAL TIER 2: SECONDARY MODULES --- */}
            {secondaryCategories.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <Calculator className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.3em] font-sans">
                    {t('hub.labels.management_pilot')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {secondaryCategories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onSelectCategory(cat.id)}
                        className="group flex flex-col p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] text-left relative overflow-hidden cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-6 w-full mb-6 relative z-10">
                          <div className={`${cat.bgColor} ${cat.color} w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${cat.badgeColor}`}>
                            {cat.badge}
                          </span>
                        </div>

                        <h4 className="text-xl font-display font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">
                          {cat.title}
                        </h4>
                        
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-6">
                          {cat.description}
                        </p>

                        <div className="mt-auto pt-5 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between w-full relative z-10 text-slate-400 group-hover:text-indigo-600 font-black text-[10px] uppercase tracking-wider transition-all">
                          <span>{t('hub.labels.access')}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Footer info in the Hub page */}
        <footer className="w-full py-12 px-6 md:px-20 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8 bg-white dark:bg-[#0B1120] mt-10">
          <div className="flex items-center gap-3 opacity-70">
            <div className="bg-slate-900 dark:bg-slate-800 p-2 rounded-xl">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-0.5">Smart Agro</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cloud Admin</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-blue-600 transition-colors">{t('landing.privacy')}</a>
            <a href="#" className="hover:text-blue-600 transition-colors">{t('landing.terms')}</a>
          </div>

          <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} - {t('landing.rights')}
          </p>
        </footer>
      </div>
    </div>
  );
};
