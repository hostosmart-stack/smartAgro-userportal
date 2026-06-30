import React, { useState } from 'react';
import { 
  LogOut, 
  ChevronRight, 
  Layers, 
  FileText, 
  Calculator, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff,
  LayoutGrid, 
  Zap, 
  AlertTriangle,
  X,
  ArrowRight
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
  const { t } = useLanguage();
  
  // Persist showAnnotations state to localStorage to prevent reset when switching views
  const [showAnnotations, setShowAnnotations] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('smart_agro_show_annotations');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const handleToggleAnnotations = () => {
    setShowAnnotations(prev => {
      const newVal = !prev;
      try {
        localStorage.setItem('smart_agro_show_annotations', JSON.stringify(newVal));
      } catch (e) {
        console.warn('Failed to save annotation settings', e);
      }
      return newVal;
    });
  };

  // Verify permissions for each module
  const isCategoryPermitted = (catId: AppCategory) => {
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
    
    if (catId === 'magasin') return userPermissions.includes('inventory') || userPermissions.includes('settings');
    if (catId === 'facturation') return userPermissions.includes('invoices') || userPermissions.includes('pos');
    if (catId === 'comptabilite') return userPermissions.includes('reports') || userPermissions.includes('accounting') || userPermissions.includes('analytics');
    if (catId === 'administration') return userPermissions.includes('employees');
    return false;
  };

  const currentName = userName || 'jyres';
  const currentRole = userRole || 'Super Administrateur';

  return (
    <div className="min-h-screen w-full bg-[#f4f7f2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans overflow-y-auto pb-24 selection:bg-emerald-500 selection:text-white transition-colors">
      
      {/* 1. MAIN GRAND HUB HEADER */}
      <header className="w-full bg-white/90 dark:bg-slate-900/95 sticky top-0 z-40 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/60 shadow-[0_2px_24px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)] transition-all py-4 sm:py-5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          
          {/* Brand block on Left */}
          <div className="flex items-center gap-4 group">
            <div className="bg-gradient-to-br from-[#10b981] to-[#059669] p-3 rounded-2xl text-white flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(16,185,129,0.3)] dark:shadow-[0_8px_24px_-6px_rgba(16,185,129,0.4)] hover:scale-105 hover:rotate-3 active:scale-95 transition-all duration-300">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase group-hover:text-[#10b981] transition-colors">
                SMART AGRO
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-[#10b981]/90 dark:text-[#10b981] tracking-[0.25em] uppercase leading-none mt-2">
                GESTION AGRICOLE & PROVENDERIE
              </span>
            </div>
          </div>

          {/* Right Utilities (Annotations Control, User identity & Logout) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-5 w-full md:w-auto justify-between md:justify-end relative">
            
            {/* Annotations Toggle Switcher */}
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950/65 px-3.5 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/65 shadow-3xs hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${showAnnotations ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${showAnnotations ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              </span>
              <button
                onClick={handleToggleAnnotations}
                className="flex items-center gap-2 font-black text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-550 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer select-none"
              >
                {showAnnotations ? (
                  <>
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600 dark:text-emerald-450 font-extrabold">Annotations : On</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Annotations : Off</span>
                  </>
                )}
              </button>
            </div>

            {/* Profile & Logout Group with relative positioning for Annotations 2 */}
            <div className="flex items-center gap-3 sm:gap-4 relative">
              
              {/* User Avatar & Name block */}
              <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200/50 dark:border-slate-800/70 py-1">
                <div className="flex flex-col items-end text-right hidden sm:flex">
                  <span className="text-xs sm:text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                    {currentName}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    {currentRole}
                  </span>
                </div>
                
                {/* Micro initials avatar in navbar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-550 text-white flex items-center justify-center font-black text-xs shadow-xs select-none">
                  {currentName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout Button wrapper */}
              <div className="relative">
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/60 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer active:scale-95 shrink-0"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>

                {/* Annotation 2 Floating badge on top of logout button */}
                {showAnnotations && (
                  <div className="absolute -top-2.5 -right-2.5 z-30 animate-bounce">
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-[#137333] text-white font-black text-[10px] items-center justify-center shadow-md">
                        2
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Annotation 2 Floating popover with custom SVG connection arrow */}
            {showAnnotations && (
              <div className="absolute top-[56px] right-0 w-80 sm:w-96 z-50 p-5 bg-emerald-50/95 dark:bg-emerald-950/95 backdrop-blur-md border border-emerald-150 dark:border-emerald-900/40 rounded-2xl text-left animate-in fade-in slide-in-from-top-3 duration-300 shadow-xl hidden md:block">
                
                {/* Visual Connector Line / Speech pointer */}
                <div className="absolute top-0 right-14 -mt-2 w-4 h-4 rotate-45 bg-emerald-50 dark:bg-emerald-950/95 border-t border-l border-emerald-150 dark:border-emerald-900/40"></div>
                
                {/* Curved SVG Arrow pointing to the Logout button */}
                <div className="absolute -top-12 right-20 w-16 h-10 pointer-events-none text-emerald-600 dark:text-emerald-400 overflow-visible">
                  <svg width="100" height="40" viewBox="0 0 100 40" fill="none" className="overflow-visible">
                    <path 
                      d="M10,35 Q40,5 90,5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeDasharray="4 4" 
                    />
                    <path 
                      d="M80,0 L92,5 L80,10" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </div>

                <div className="flex gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm mt-0.5">
                    2
                  </span>
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>Module Déconnexion</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 rotate-[-45deg]" />
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-semibold">
                      Cliquez sur ce bouton pour fermer votre session de travail en toute sécurité. Cela garantit la parfaite confidentialité de vos informations de stock et d'exploitation.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 sm:mt-12 flex-grow flex flex-col gap-10">
        
        {/* Mobile Annotation 2 fallback when popover is hidden */}
        {showAnnotations && (
          <div className="md:hidden p-5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/30 rounded-[1.5rem] flex items-start gap-4 text-left animate-in fade-in duration-300 shadow-2xs">
            <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 shadow-sm">
              2
            </span>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 dark:text-emerald-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                <span>Module Déconnexion</span>
                <ArrowRight className="w-4 h-4 text-emerald-500 rotate-[-90deg]" />
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-medium">
                Cliquez sur le bouton de déconnexion dans l'en-tête pour clore votre session de travail sécurisée.
              </p>
            </div>
          </div>
        )}

        {/* License Banner Warning */}
        {isLicenseEndingSoon && !dismissLicenseBanner && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-rose-500/5 dark:from-amber-500/15 dark:to-rose-500/10 border border-amber-500/20 dark:border-amber-500/15 rounded-[1.5rem] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-rose-500 rounded-l-full"></div>
            <div className="flex items-start gap-4 pl-1">
              <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 shadow-xs shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-450" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-amber-200 tracking-tight">
                  ⚠️ Attention : Votre abonnement expire bientôt !
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-gray-300 max-w-2xl leading-normal">
                  Votre licence d'utilisation Smart Agro expire dans seulement {remainingDays} jours (le {licenseExpiryDate ? new Date(licenseExpiryDate).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}). Veuillez renouveler votre abonnement.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={onNavigateToSettings}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 active:scale-95 text-white font-black text-[11px] uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Gérer l'abonnement</span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </button>
              {setDismissLicenseBanner && (
                <button
                  type="button"
                  onClick={() => setDismissLicenseBanner(true)}
                  className="p-2 hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-300 text-slate-400 dark:text-slate-500 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* WELCOME BANNER SECTION */}
        <section className="relative">
          
          {/* Badge 1 Floating indicator */}
          {showAnnotations && (
            <div className="absolute -top-3.5 -left-3.5 z-30 animate-bounce">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-[#137333] text-white font-black text-xs items-center justify-center shadow-md">
                  1
                </span>
              </span>
            </div>
          )}

          {/* Core Banner Component */}
          <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center md:items-center justify-between gap-8 shadow-xs hover:shadow-md transition-all">
            
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Grand Elegant Avatar Icon with dynamic gradient */}
              <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-tr from-[#00a86b] to-[#00c9ff] text-white flex items-center justify-center font-black text-3.5xl shadow-lg shadow-[#00a86b]/20 shrink-0 select-none hover:rotate-6 transition-transform">
                {currentName.charAt(0).toUpperCase()}
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3.5xl font-black text-slate-850 dark:text-white tracking-tight leading-none uppercase">
                  Bienvenue, <span className="text-blue-600 dark:text-blue-400 font-extrabold">{currentName}</span> !
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 font-semibold leading-normal">
                  Vous êtes connecté avec le rôle <span className="text-blue-600 dark:text-blue-400 font-black">{currentRole}</span>.
                </p>
              </div>
            </div>

            {/* Glowing Active Status Card */}
            <div className="bg-[#f4f7f2] dark:bg-slate-950 px-6 py-4.5 rounded-[1.5rem] border border-gray-200/60 dark:border-slate-800 shadow-2xs shrink-0 flex items-center gap-4 self-stretch md:self-auto justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/40"></div>
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none">
                  Statut de Session
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1.5 block uppercase tracking-wider">
                  Session Active
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Annotation 1 Details Box with Curved SVG Arrow */}
        {showAnnotations && (
          <div className="relative p-6 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/30 rounded-[2rem] flex items-start gap-4 text-left animate-in fade-in duration-300 shadow-2xs">
            
            {/* Custom SVG curved dashed line with arrow pointer pointing up to the avatar above */}
            <div className="absolute top-[-38px] left-14 w-12 h-10 pointer-events-none hidden lg:block text-emerald-600 dark:text-emerald-450 overflow-visible">
              <svg width="60" height="40" viewBox="0 0 60 40" fill="none" className="overflow-visible">
                <path 
                  d="M40,35 Q20,25 20,5" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeDasharray="4 4" 
                />
                <path 
                  d="M12,12 L20,0 L28,12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>

            <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
              1
            </span>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 dark:text-emerald-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                <span>Utilisateur Connecté & Rôle</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 rotate-[-90deg] hidden sm:inline" />
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                Cette zone confirme instantanément l'identité de l'utilisateur actif de la session ainsi que ses droits d'accès administratifs. Elle s'adapte en temps réel à la langue sélectionnée et au niveau d'autorisation.
              </p>
            </div>
          </div>
        )}

        {/* MODULES CATEGORY SECTION */}
        <section className="relative space-y-8">
          
          {/* Badge 3 Floating indicator */}
          {showAnnotations && (
            <div className="absolute -top-3.5 -left-3.5 z-30 animate-bounce">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-[#137333] text-white font-black text-xs items-center justify-center shadow-md">
                  3
                </span>
              </span>
            </div>
          )}

          {/* Module Title header */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200/60 dark:border-slate-800/80">
            <div className="bg-blue-500/10 p-2.5 rounded-xl">
              <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
            <div className="text-left">
              <h3 className="text-xs sm:text-sm font-black text-slate-850 dark:text-slate-200 uppercase tracking-[0.25em] leading-none">
                MODULES PRINCIPAUX Smart Agro
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-semibold mt-2">
                Cliquez sur l'un des espaces ci-dessous pour gérer vos opérations et moduler vos stocks.
              </p>
            </div>
          </div>

          {/* Annotation 3 Details Box with Curved SVG Arrow */}
          {showAnnotations && (
            <div className="relative p-6 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/30 rounded-[2rem] flex items-start gap-4 text-left animate-in fade-in duration-300 shadow-2xs">
              
              {/* Custom SVG curved dashed line pointing down to the first card */}
              <div className="absolute bottom-[-36px] left-16 w-24 h-10 pointer-events-none hidden lg:block text-emerald-600 dark:text-emerald-450 overflow-visible">
                <svg width="100" height="40" viewBox="0 0 100 40" fill="none" className="overflow-visible">
                  <path 
                    d="M10,5 Q50,35 90,35" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeDasharray="4 4" 
                  />
                  <path 
                    d="M80,27 L92,35 L80,43" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </div>

              <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                3
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-emerald-400 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <span>Modules Opérationnels & Sécurisés</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 rotate-[45deg] hidden sm:inline" />
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Les 4 piliers fonctionnels de Smart Agro s'activent dynamiquement selon votre profil d'autorisation. Si votre compte dispose de droits insuffisants, le module affiche un statut "Bloqué" et désactive le clic.
                </p>
              </div>
            </div>
          )}

          {/* High-Fidelity Spacious Grid of Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 mt-6">
            
            {/* CARD 1: GESTION DE MAGASIN */}
            <button
              onClick={() => isCategoryPermitted('magasin') && onSelectCategory('magasin')}
              disabled={!isCategoryPermitted('magasin')}
              className={`group p-8 sm:p-10 rounded-[2rem] border text-left flex flex-col items-start gap-6 transition-all relative min-h-[380px] shadow-sm ${
                isCategoryPermitted('magasin')
                  ? 'bg-white dark:bg-slate-900 border-gray-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xl hover:-translate-y-2.5 cursor-pointer'
                  : 'bg-gray-150/70 dark:bg-slate-900/40 border-gray-250/45 dark:border-slate-850 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Icon Container with Emerald styling */}
              <div className="w-16 h-16 rounded-2xl bg-[#e6f4ea] dark:bg-emerald-950/40 text-[#137333] dark:text-emerald-400 flex items-center justify-center font-black shadow-2xs shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Layers className="w-8 h-8" />
              </div>
              
              <div className="space-y-3.5 flex-grow text-left">
                <h4 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight leading-tight flex flex-wrap items-center gap-2">
                  <span>Gestion de Magasin</span>
                  {!isCategoryPermitted('magasin') && (
                    <span className="text-[9px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                      Bloqué
                    </span>
                  )}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Suivi rigoureux des stocks en temps réel, alertes de seuil critique, formulations de nutrition animale optimisées et transferts de stocks.
                </p>
              </div>

              {/* Action Trigger Line */}
              <div className="w-full pt-5 border-t border-gray-150 dark:border-slate-800/80 mt-auto flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-650 dark:text-emerald-400">
                <span>{isCategoryPermitted('magasin') ? "Ouvrir l'Espace" : "Accès Restreint"}</span>
                <ChevronRight className="w-4 h-4 text-emerald-500 transition-transform group-hover:translate-x-1.5" />
              </div>
            </button>

            {/* CARD 2: CAISSE & FACTURATION */}
            <button
              onClick={() => isCategoryPermitted('facturation') && onSelectCategory('facturation')}
              disabled={!isCategoryPermitted('facturation')}
              className={`group p-8 sm:p-10 rounded-[2rem] border text-left flex flex-col items-start gap-6 transition-all relative min-h-[380px] shadow-sm ${
                isCategoryPermitted('facturation')
                  ? 'bg-white dark:bg-slate-900 border-gray-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl hover:-translate-y-2.5 cursor-pointer'
                  : 'bg-gray-150/70 dark:bg-slate-900/40 border-gray-250/45 dark:border-slate-850 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Icon Container with Blue styling */}
              <div className="w-16 h-16 rounded-2xl bg-[#e8f0fe] dark:bg-blue-950/40 text-[#1a73e8] dark:text-blue-400 flex items-center justify-center font-black shadow-2xs shrink-0 transition-transform duration-300 group-hover:scale-110">
                <FileText className="w-8 h-8" />
              </div>
              
              <div className="space-y-3.5 flex-grow text-left">
                <h4 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight leading-tight flex flex-wrap items-center gap-2">
                  <span>Caisse & Facturation</span>
                  {!isCategoryPermitted('facturation') && (
                    <span className="text-[9px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                      Bloqué
                    </span>
                  )}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Caisse tactile et ventes rapides, édition de factures de vente normalisées, gestion de caisse boutique et suivi des acomptes.
                </p>
              </div>

              {/* Action Trigger Line */}
              <div className="w-full pt-5 border-t border-gray-150 dark:border-slate-800/80 mt-auto flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-650 dark:text-blue-400">
                <span>{isCategoryPermitted('facturation') ? "Ouvrir l'Espace" : "Accès Restreint"}</span>
                <ChevronRight className="w-4 h-4 text-blue-500 transition-transform group-hover:translate-x-1.5" />
              </div>
            </button>

            {/* CARD 3: COMPTABILITÉ */}
            <button
              onClick={() => isCategoryPermitted('comptabilite') && onSelectCategory('comptabilite')}
              disabled={!isCategoryPermitted('comptabilite')}
              className={`group p-8 sm:p-10 rounded-[2rem] border text-left flex flex-col items-start gap-6 transition-all relative min-h-[380px] shadow-sm ${
                isCategoryPermitted('comptabilite')
                  ? 'bg-white dark:bg-slate-900 border-gray-200/80 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-xl hover:-translate-y-2.5 cursor-pointer'
                  : 'bg-gray-150/70 dark:bg-slate-900/40 border-gray-250/45 dark:border-slate-850 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Icon Container with Amber/Yellow styling */}
              <div className="w-16 h-16 rounded-2xl bg-[#fef7e0] dark:bg-amber-950/40 text-[#b06000] dark:text-amber-400 flex items-center justify-center font-black shadow-2xs shrink-0 transition-transform duration-300 group-hover:scale-110">
                <Calculator className="w-8 h-8" />
              </div>
              
              <div className="space-y-3.5 flex-grow text-left">
                <h4 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight leading-tight flex flex-wrap items-center gap-2">
                  <span>Comptabilité</span>
                  {!isCategoryPermitted('comptabilite') && (
                    <span className="text-[9px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                      Bloqué
                    </span>
                  )}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Grand livre financier et consolidation des flux, suivi analytique des bénéfices nets, et gestion des charges d'exploitation.
                </p>
              </div>

              {/* Action Trigger Line */}
              <div className="w-full pt-5 border-t border-gray-150 dark:border-slate-800/80 mt-auto flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-655 dark:text-amber-450">
                <span>{isCategoryPermitted('comptabilite') ? "Ouvrir l'Espace" : "Accès Restreint"}</span>
                <ChevronRight className="w-4 h-4 text-amber-500 transition-transform group-hover:translate-x-1.5" />
              </div>
            </button>

            {/* CARD 4: ADMINISTRATION */}
            <button
              onClick={() => isCategoryPermitted('administration') && onSelectCategory('administration')}
              disabled={!isCategoryPermitted('administration')}
              className={`group p-8 sm:p-10 rounded-[2rem] border text-left flex flex-col items-start gap-6 transition-all relative min-h-[380px] shadow-sm ${
                isCategoryPermitted('administration')
                  ? 'bg-white dark:bg-slate-900 border-gray-200/80 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-xl hover:-translate-y-2.5 cursor-pointer'
                  : 'bg-gray-150/70 dark:bg-slate-900/40 border-gray-250/45 dark:border-slate-850 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Icon Container with Purple styling */}
              <div className="w-16 h-16 rounded-2xl bg-[#f3e8fd] dark:bg-purple-950/40 text-[#9333ea] dark:text-purple-400 flex items-center justify-center font-black shadow-2xs shrink-0 transition-transform duration-300 group-hover:scale-110">
                <ShieldCheck className="w-8 h-8" />
              </div>
              
              <div className="space-y-3.5 flex-grow text-left">
                <h4 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl tracking-tight leading-tight flex flex-wrap items-center gap-2">
                  <span>Administration</span>
                  {!isCategoryPermitted('administration') && (
                    <span className="text-[9px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                      Bloqué
                    </span>
                  )}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                  Gestion des fiches collaborateurs d'exploitation, distribution granulaire des rôles & droits d'accès et audit d'activité.
                </p>
              </div>

              {/* Action Trigger Line */}
              <div className="w-full pt-5 border-t border-gray-150 dark:border-slate-800/80 mt-auto flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-650 dark:text-purple-400">
                <span>{isCategoryPermitted('administration') ? "Ouvrir l'Espace" : "Accès Restreint"}</span>
                <ChevronRight className="w-4 h-4 text-purple-500 transition-transform group-hover:translate-x-1.5" />
              </div>
            </button>

          </div>
        </section>

      </main>

      {/* 3. SOLE FOOTER INFO BAR MATCHING BOTTOM BAR OF DOCUMENT */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-8 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 dark:text-slate-500 text-[10px] font-black tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600/10 p-1.5 rounded-lg">
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span>SMART AGRO – GESTION DE PROVENDERIE</span>
        </div>
        <div>
          Le Hub – Accueil Principal
        </div>
      </footer>
    </div>
  );
};
