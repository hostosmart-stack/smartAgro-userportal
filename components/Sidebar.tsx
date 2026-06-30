import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ShoppingCart, Package, FileText, Bot, Settings, BarChart3, Calculator, LogOut, Leaf, Wifi, WifiOff, Users, Store, BookOpen, ChevronLeft, ChevronRight, User, ArrowRightLeft, ArrowLeft, Download } from 'lucide-react';
import { auth, signOut } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { Provenderie } from '../types';
import { AppCategory } from './Hub';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

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
  sidebarWidth?: number;
  setSidebarWidth?: (width: number) => void;
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
  onLogout,
  sidebarWidth = 256,
  setSidebarWidth
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isInstallable, isInstalled, installPWA, showInstructions, setShowInstructions, isIOS } = usePWAInstall();

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

  // Swipe to close on mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX - currentX;
    
    if (isMobile && isOpen && diff > 50 && onClose) {
      onClose();
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  // Drag to resize on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth + deltaX;

      if (newWidth < 140) {
        if (!isCollapsed && onToggleCollapse) {
          onToggleCollapse();
        }
      } else {
        if (isCollapsed && onToggleCollapse) {
          onToggleCollapse();
        }
        if (newWidth > 450) newWidth = 450;
        if (newWidth < 200) newWidth = 200;
        if (setSidebarWidth) {
          setSidebarWidth(newWidth);
          localStorage.setItem('smartAgro_sidebarWidth', String(newWidth));
        }
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

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
    const isSuperOrAdmin = normRole === 'admin' || 
                           normRole === 'superadmin' || 
                           normRole === 'system-admin' ||
                           normRole === 'super administrateur' ||
                           normRole === 'superadministrateur' ||
                           normRole === 'super-administrateur' ||
                           normRole === 'administrateur' ||
                           normRole.includes('system') ||
                           (normRole.includes('super') && normRole.includes('admin')) ||
                           normRole.includes('administrateur');
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
          className="fixed inset-0 bg-black/60 z-[65] transition-opacity"
          onClick={onClose}
        />
      )}
      
      <motion.div 
        drag={isMobile ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: -280, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(event, info) => {
          if (info.offset.x < -60 && onClose) {
            onClose();
          }
        }}
        animate={isMobile ? { x: isOpen ? 0 : -280 } : { x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={isMobile ? { width: '280px' } : { width: isCollapsed ? '80px' : `${sidebarWidth}px` }}
        className={`fixed left-0 top-0 h-full bg-[#0E1116] text-white z-[70] flex flex-col font-sans border-r border-slate-800/40 shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}
      >
        {/* Background Subtle Gradient */}
        <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-slate-900/60 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div 
        onClick={isCollapsed && onToggleCollapse ? onToggleCollapse : undefined}
        className={`relative z-10 p-6 ${isMobile ? 'pl-[76px]' : ''} flex items-center ${isCollapsed ? 'justify-center cursor-pointer hover:bg-white/[0.04] transition-colors' : 'gap-3.5'} border-b border-white/[0.04]`}
        title={isCollapsed ? "Cliquez pour agrandir" : undefined}
      >
        <div className="w-10 h-10 rounded-2xl bg-white/5 p-1.5 shadow-md border border-white/10 shrink-0 flex items-center justify-center">
           <img src="/pwa-192.svg" alt="Smart Agro Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
          className="absolute -right-3 top-8 bg-slate-900 border border-white/10 text-white p-1 rounded-full shadow-lg z-50 hover:bg-slate-850 hover:border-[#10B981] hover:text-[#10B981] transition-all cursor-pointer scale-100 hover:scale-110 active:scale-95 flex items-center justify-center"
          title={isCollapsed ? "Agrandir la barre latérale" : "Réduire la barre latérale"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-[#10B981] animate-pulse" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Resizable drag handle (desktop only) */}
      {!isMobile && !isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute right-0 top-0 bottom-0 w-1.5 hover:w-2.5 cursor-col-resize hover:bg-[#10B981]/20 active:bg-[#10B981]/40 z-50 transition-all duration-150"
          title="Faites glisser pour redimensionner"
        />
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
                  ? 'bg-gradient-to-r from-farm-500 to-emerald-600 text-white shadow-[0_10px_20px_rgba(16,185,129,0.3)] font-bold' 
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform duration-250 ${currentView === item.id ? 'scale-110 text-white' : 'group-hover:scale-105'}`} />
              {!isCollapsed && (
                <span className={`text-xs font-black tracking-wide leading-tight ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} break-words line-clamp-2 uppercase`}>{item.label}</span>
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

        {!isInstalled && (
          <button 
            onClick={installPWA}
            title={isCollapsed ? t('nav.install_app') : undefined}
            className={`w-full flex items-center justify-center gap-2 py-3 mb-2.5 rounded-xl bg-white/[0.02] text-slate-300 hover:bg-white/[0.07] hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-white/5 cursor-pointer`}
          >
            <Download className="w-4 h-4 shrink-0" /> {!isCollapsed && <span>{t('nav.install_app')}</span>}
          </button>
        )}

        <button 
          onClick={onLogout || (() => signOut(auth))}
          title={isCollapsed ? t('nav.logout') : undefined}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider border border-rose-500/20 hover:border-rose-500 cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0" /> {!isCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </motion.div>

    <PWAInstallModal 
      isOpen={showInstructions} 
      onClose={() => setShowInstructions(false)} 
      isIOS={isIOS} 
    />
    </>
  );
};
