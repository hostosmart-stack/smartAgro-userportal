import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Package, FileText, Bot, Settings, BarChart3, Calculator, LogOut, Leaf, Wifi, WifiOff, Users, Store, BookOpen, ChevronLeft, ChevronRight, User, ArrowRightLeft, ArrowLeft, Download } from 'lucide-react';
import { auth, signOut } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { Provenderie } from '../types';
import { AppCategory } from './Hub';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  userRole?: string;
  userPermissions?: string[];
  userName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  companyName?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  provenderies?: Provenderie[];
  currentProvenderieId?: string;
  onProvenderieChange?: (id: string) => void;
  activeCategory: AppCategory;
  onExitCategory: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  userRole = 'Admin', 
  userPermissions = [], 
  userName = 'Administrateur', 
  isCollapsed = false, 
  onToggleCollapse, 
  companyName = 'Smart Agro', 
  isMobile = false, 
  isOpen = false, 
  onClose, 
  provenderies = [], 
  currentProvenderieId, 
  onProvenderieChange,
  activeCategory,
  onExitCategory,
  onLogout
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isInstallable, installPWA } = usePWAInstall();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, permission: 'dashboard', category: 'all' },
    { id: 'inventory', label: t('nav.inventory'), icon: Package, permission: 'inventory', category: 'magasin' },
    { id: 'boutiques', label: t('nav.boutiques'), icon: Store, permission: 'settings', category: 'magasin' },
    { id: 'invoices', label: t('nav.invoices'), icon: FileText, permission: 'invoices', category: 'facturation' }, 
    { id: 'pos', label: t('nav.sales'), icon: ShoppingCart, permission: 'pos', category: 'facturation' },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3, permission: 'reports', category: 'comptabilite' }, 
    { id: 'accounting', label: t('nav.accounting'), icon: Calculator, permission: 'reports', category: 'comptabilite' },
    { id: 'employees', label: t('nav.employees'), icon: Users, permission: 'employees', category: 'administration' },
    { id: 'guide', label: t('nav.guide'), icon: BookOpen, permission: 'guide', category: 'always' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, permission: 'settings', category: 'administration' },
  ].filter(item => {
    // Role/Permission filter using userRole and userPermissions
    const normRole = (userRole || 'Admin').toLowerCase().trim();
    const isSuperOrAdmin = normRole === 'admin' || normRole === 'superadmin' || normRole === 'system-admin';
    const hasPermission = isSuperOrAdmin || 
                          userPermissions.includes(item.id) || 
                          (item.permission && userPermissions.includes(item.permission));
    
    if (!hasPermission) return false;

    // Category filter
    if (!activeCategory) return false;
    if (item.category === 'always') return true;
    if (item.category === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full ${isCollapsed && !isMobile ? 'w-20' : 'w-64'} bg-[#0E1116] text-white z-50 flex flex-col font-sans border-r border-slate-800/40 transition-transform duration-300 ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'} shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}>
        {/* Background Subtle Gradient */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className={`relative z-10 p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5'} border-b border-white/[0.04]`}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-2.5 shadow-lg shadow-rose-500/20 border border-white/10 shrink-0 flex items-center justify-center font-display font-black text-white text-base">
           S
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-lg font-black tracking-tight text-white font-display uppercase tracking-widest">Smart Agro</h1>
            <p className="text-[9px] text-slate-400 font-extrabold truncate uppercase tracking-widest mt-0.5">{companyName}</p>
          </div>
        )}
      </div>
      
      {/* Collapse Toggle */}
      {!isMobile && (
        <button 
          onClick={onToggleCollapse}
          className="absolute -right-3 top-8 bg-slate-900 border border-white/10 text-white p-1 rounded-full shadow-lg z-20 hover:bg-slate-850 hover:border-slate-700 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Navigation */}
      <nav className="relative z-10 flex-1 px-4 py-6 overflow-y-auto space-y-1.5 scrollbar-hide">
        {activeCategory && (
          <button
            onClick={onExitCategory}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 rounded-xl transition-all duration-200 group relative mb-4 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:border-white/10 border border-white/5 shadow-sm`}
          >
            <ArrowLeft className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-1 text-rose-400`} />
            {!isCollapsed && (
              <span className="text-[10px] font-black tracking-widest whitespace-nowrap uppercase text-slate-300">
                {t('nav.back_to_hub')}
              </span>
            )}
          </button>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                  setView(item.id);
                  if (isMobile && onClose) {
                      onClose();
                  }
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 rounded-xl transition-all duration-300 group relative ${
                currentView === item.id 
                  ? 'bg-white text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.15)] font-bold' 
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform duration-250 ${currentView === item.id ? 'scale-110 text-farm-500' : 'group-hover:scale-105'}`} />
              {!isCollapsed && (
                <span className={`text-xs font-black tracking-wide leading-tight ${currentView === item.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-200'} break-words line-clamp-2 uppercase`}>{item.label}</span>
              )}
            </button>
          );
        })}

        {/* 3D Decorative accessory loop matching the template graphic */}
        {!isCollapsed && (
          <div className="mx-1 mt-8 p-4 rounded-3xl bg-gradient-to-br from-farm-500/10 to-farm-300/10 border border-white/[0.03] relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-tr from-farm-500/20 to-farm-300/20 rounded-full blur-xl group-hover:scale-125 transition-all duration-500"></div>
            
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="relative w-8 h-8 flex items-center justify-center">
                 {/* CSS 3D Clay loop ribbon proxy */}
                 <div className="absolute w-6 h-6 rounded-full border-[5px] border-t-farm-500 border-r-farm-300 border-b-farm-300 border-l-farm-500 animate-spin-slow shadow-md"></div>
                 <div className="absolute w-2 h-2 rounded-full bg-white opacity-40"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-farm-400">Secured Core</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 leading-snug relative z-10">{t('nav.secured_core_desc')}</p>
          </div>
        )}
      </nav>

      {/* Footer / User Profile */}
      <div className="relative z-10 p-5 border-t border-white/[0.04] bg-[#0E1116]">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-1'} mb-4`}>
            <div 
              onClick={() => setView('profile')}
              className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-slate-700 font-display uppercase cursor-pointer hover:scale-105 transition-transform" 
              title={userName}
            >
              {userName.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setView('profile')}>
                <p className="text-xs font-black text-white truncate font-display hover:text-rose-400 transition-colors uppercase">{userName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                      {userRole}
                  </p>
                </div>
              </div>
            )}
        </div>
        
        {/* Language selector in sidebar */}
        <div className="flex items-center justify-between mb-4 px-1">
          {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">Language</span>}
          <div className="flex bg-[#090D14] border border-white/[0.08] p-0.5 rounded-full">
            <button 
              onClick={() => setLanguage('fr')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider transition-all ${language === 'fr' ? 'bg-[#10B981] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              FR
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider transition-all ${language === 'en' ? 'bg-[#10B981] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              EN
            </button>
          </div>
        </div>

        {isInstallable && (
          <button 
            onClick={installPWA}
            title={isCollapsed ? t('nav.install_app') : undefined}
            className={`w-full flex items-center justify-center gap-2 py-3 mb-2.5 rounded-xl bg-white/[0.02] text-slate-300 hover:bg-white/[0.07] hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-white/5`}
          >
            <Download className="w-4 h-4 shrink-0" /> {!isCollapsed && <span>{t('nav.install_app')}</span>}
          </button>
        )}

        <button 
          onClick={onLogout || (() => signOut(auth))}
          title={isCollapsed ? t('nav.logout') : undefined}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-rose-500/20 hover:border-rose-500`}
        >
          <LogOut className="w-4 h-4 shrink-0" /> {!isCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
    </>
  );
};
