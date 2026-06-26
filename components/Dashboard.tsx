import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Product, Invoice, Category, Boutique, UserRole, StockTransfer, Expense } from '../types';
import { TrendingUp, AlertTriangle, Wallet, Package, ArrowUpRight, Filter, Calendar, Store, CreditCard, CheckCircle2, XCircle, ChevronRight, Clock, Lock, Unlock, Loader2, RefreshCw, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { toggleBoutiqueOpenStatus } from '../services/db';
import { useNotifications } from './ui/Notifications';

interface DashboardProps {
  products: Product[];
  invoices: Invoice[];
  boutiques?: Boutique[];
  transfers?: StockTransfer[];
  expenses?: Expense[];
  onNavigate: (view: string) => void;
  userRole?: string;
  userBoutique?: string;
  userRoleObj?: UserRole;
  userName?: string;
  userEmail?: string;
  parentActiveCategory?: string | null;
  categories?: string[];
}

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({ 
  products, 
  invoices, 
  boutiques = [], 
  transfers = [],
  expenses = [],
  onNavigate, 
  userRole = 'Admin', 
  userBoutique = 'Toutes', 
  userRoleObj,
  userName,
  userEmail,
  parentActiveCategory,
  categories = []
}) => {
  const { t } = useLanguage();
  const { notify } = useNotifications();
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [togglingBoutiqueId, setTogglingBoutiqueId] = useState<string | null>(null);

  const cleanRole = (userRole || '').toLowerCase().trim();
  const isAdmin = cleanRole === 'admin' || 
                  cleanRole === 'superadmin' || 
                  cleanRole === 'system-admin' || 
                  cleanRole.includes('administrateur') || 
                  cleanRole.includes('admin') || 
                  (cleanRole.includes('super') && cleanRole.includes('admin'));
  const isMagasinier = !isAdmin && (parentActiveCategory ? parentActiveCategory === 'magasin' : userRole.toLowerCase().includes('magasinier'));
  const isCaissier = !isAdmin && (parentActiveCategory ? (parentActiveCategory === 'facturation' || parentActiveCategory === 'comptabilite') : (userRole.toLowerCase().includes('caissier') || userRole.toLowerCase().includes('vendeur')));

  // Magasinier-specific computations
  const formulasCount = useMemo(() => {
    return products.filter(p => p.recipe && p.recipe.length > 0).length;
  }, [products]);

  // Caissier-specific computations
  const todayInvoices = useMemo(() => {
    const todayStr = new Date().toDateString();
    return invoices.filter(inv => {
      if (userBoutique && userBoutique !== 'Toutes' && inv.boutique !== userBoutique) {
        return false;
      }
      return new Date(inv.date).toDateString() === todayStr;
    });
  }, [invoices, userBoutique]);

  const todaySalesCount = todayInvoices.length;
  const todaySalesRevenue = useMemo(() => todayInvoices.reduce((acc, inv) => acc + inv.total, 0), [todayInvoices]);
  const todayOutstandingDebt = useMemo(() => {
    return todayInvoices
      .filter(inv => inv.status !== 'PAYÉ')
      .reduce((acc, inv) => acc + (inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0))), 0);
  }, [todayInvoices]);

  const todayExpensesAmount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return (expenses || [])
      .filter(exp => {
        if (exp.deleted) return false;
        if (userBoutique && userBoutique !== 'Toutes' && exp.boutique && exp.boutique !== userBoutique) {
          return false;
        }
        return new Date(exp.date).toDateString() === todayStr;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, userBoutique]);

  const boutiqueStockStats = useMemo(() => {
    return (boutiques || []).filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique).map(b => {
      const totalStock = products.reduce((sum, p) => {
        if (p.variants && p.variants.length > 0) {
          return sum + p.variants.reduce((acc, v) => acc + (v.boutiqueStock?.[b.id] || v.boutiqueStock?.[b.name] || 0), 0);
        }
        return sum + (p.boutiqueStock?.[b.id] || p.boutiqueStock?.[b.name] || 0);
      }, 0);
      return {
        ...b,
        stock: totalStock
      };
    });
  }, [boutiques, products, userBoutique]);

  const handleToggleBoutiqueStatus = async (boutiqueId: string, currentStatus: 'OPEN' | 'CLOSED' | undefined) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingBoutiqueId(boutiqueId);
    try {
      await toggleBoutiqueOpenStatus(boutiqueId, newStatus, userEmail, userName);
      notify(`La boutique a été ${newStatus === 'OPEN' ? 'ouverte' : 'fermée'} avec succès !`, 'success');
    } catch (error) {
      console.error(error);
      notify("Erreur lors de la modification du statut de la boutique", "error");
    } finally {
      setTogglingBoutiqueId(null);
    }
  };

  const isVisible = (componentId: string) => {
    if (isAdmin) return true;
    if (!userRoleObj?.pagePermissions) return true;
    const pagePerms = userRoleObj.pagePermissions;
    let pagePerm: any = null;
    if (Array.isArray(pagePerms)) {
      pagePerm = pagePerms.find(p => p.pageId === 'dashboard');
    } else if (pagePerms && typeof pagePerms === 'object') {
      pagePerm = pagePerms['dashboard' as any];
    }
    if (!pagePerm) return true;
    if (typeof pagePerm === 'boolean') return pagePerm;
    if (pagePerm && Array.isArray(pagePerm.components)) {
      return pagePerm.components.find((c: any) => c.id === componentId)?.visible ?? true;
    }
    return true;
  };

  // Helper to filter invoices by date and boutique
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    return invoices.filter(inv => {
      // Boutique filter
      if (userBoutique && userBoutique !== 'Toutes' && inv.boutique !== userBoutique) {
        return false;
      }

      if (isCaissier) {
        return new Date(inv.date).toDateString() === todayStr;
      }

      const invDate = new Date(inv.date);
      
      if (timeRange === 'today') {
        return invDate.toDateString() === now.toDateString();
      }
      if (timeRange === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        return invDate >= startOfWeek;
      }
      if (timeRange === 'month') {
        return invDate.getMonth() === new Date().getMonth() && 
               invDate.getFullYear() === new Date().getFullYear();
      }
      if (timeRange === 'year') {
        return invDate.getFullYear() === new Date().getFullYear();
      }
      return true;
    });
  }, [invoices, timeRange, isCaissier, userBoutique]);

  // Calculate Stats based on filtered invoices
  const totalRevenue = useMemo(() => filteredInvoices.reduce((acc, curr) => acc + curr.total, 0), [filteredInvoices]);
  
  // Calculate Total Debts (Outstanding balance)
  const totalDebts = useMemo(() => {
    return filteredInvoices
      .filter(inv => inv.status !== 'PAYÉ')
      .reduce((acc, inv) => acc + (inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0))), 0);
  }, [filteredInvoices]);

  // Filtered Revenue for Charts if specific category selected
  const filteredRevenue = useMemo(() => {
    if (activeCategory === 'Tous') return totalRevenue;
    return filteredInvoices.reduce((acc, inv) => {
      const catTotal = (inv.items || [])
        .filter(item => item.category === activeCategory)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return acc + catTotal;
    }, 0);
  }, [filteredInvoices, activeCategory, totalRevenue]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => {
      const isMainBoutique = userBoutique === (boutiques[0]?.id || 'Boutique 1') || userBoutique === 'Toutes';
      const stock = p.variants && p.variants.length > 0
        ? p.variants.reduce((acc, v) => acc + (isMainBoutique ? (v.stock || 0) : (v.boutiqueStock?.[userBoutique] || 0)), 0)
        : (isMainBoutique ? (p.stock || 0) : (p.boutiqueStock?.[userBoutique] || 0));
      const threshold = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : 20;
      return stock < threshold;
    }).length;
  }, [products, userBoutique, boutiques]);
  const totalProducts = products.length;

  const filteredBoutiques = useMemo(() => {
    return boutiques.filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique);
  }, [boutiques, userBoutique]);

  // Chart Data: Revenue by Category STACKED by Boutique
  const stackedCategoryData = useMemo(() => {
    const data: Record<string, any> = {};
    
    // Initialize categories
    (categories.length > 0 ? categories : Object.values(Category)).forEach(cat => {
        const simpleCat = cat.split(' ')[0];
        data[simpleCat] = { name: simpleCat };
        filteredBoutiques.forEach(b => {
            data[simpleCat][b.name] = 0;
        });
        // Handle 'Unknown' boutique or main store if not in boutiques list?
        // Assuming all invoices have a valid boutique ID that maps to a name.
        // If not, we might miss data. Let's add a fallback.
        if (userBoutique === 'Toutes' || userBoutique === 'Boutique 1') {
            data[simpleCat]['Main'] = 0; 
        }
    });

    filteredInvoices.forEach(inv => {
      const boutiqueName = boutiques.find(b => b.id === inv.boutique)?.name || 'Main';
      
      (inv.items || []).forEach(item => {
        if (activeCategory !== 'Tous' && item.category !== activeCategory) return;
        
        const cat = item.category.split(' ')[0];
        if (data[cat] && data[cat][boutiqueName] !== undefined) {
            data[cat][boutiqueName] = (data[cat][boutiqueName] || 0) + (item.price * item.quantity);
        }
      });
    });

    return Object.values(data);
  }, [filteredInvoices, activeCategory, boutiques, filteredBoutiques, userBoutique]);

  const BOUTIQUE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
        case 'today': return t('common.today');
        case 'week': return t('common.this_week');
        case 'month': return t('common.this_month');
        case 'year': return t('common.this_year');
        default: return t('common.all_history');
    }
  };

  // Boutique Stats Calculation
  const boutiqueStats = useMemo(() => {
    return filteredBoutiques.map(b => {
      const boutiqueInvoices = invoices.filter(inv => inv.boutique === b.id);
      
      const periodInvoices = boutiqueInvoices.filter(inv => {
          const invDate = new Date(inv.date);
          const now = new Date();
          if (timeRange === 'today') return invDate.toDateString() === now.toDateString();
          if (timeRange === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            startOfWeek.setHours(0, 0, 0, 0);
            return invDate >= startOfWeek;
          }
          if (timeRange === 'month') return invDate.getMonth() === new Date().getMonth() && invDate.getFullYear() === new Date().getFullYear();
          if (timeRange === 'year') return invDate.getFullYear() === new Date().getFullYear();
          return true;
      });

      const revenue = periodInvoices.reduce((acc, inv) => acc + inv.total, 0);
      
      const debts = boutiqueInvoices
        .filter(inv => inv.status !== 'PAYÉ')
        .reduce((acc, inv) => acc + (inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0))), 0);

      return {
        ...b,
        revenue,
        debts
      };
    });
  }, [boutiques, invoices, timeRange]);

  const headerInfo = useMemo(() => {
    if (isMagasinier) {
      return {
        tag: `Dépôt • ${userBoutique}`,
        title: "Tableau de Bord Stock",
        subtitle: "Aperçu de vos alertes de stock, de vos formules et de vos transferts récents"
      };
    } else if (isCaissier) {
      return {
        tag: `Caisse Journalière • ${userBoutique}`,
        title: "Suivi de Caisse & Ventes",
        subtitle: "Aperçu en temps réel de vos gains journaliers, règlements de factures et dettes clients"
      };
    } else {
      return {
        tag: "Live Management Admin",
        title: t('dashboard.title') || "Tableau de Bord Administrateur",
        subtitle: t('dashboard.subtitle') || "Aperçu global, performances financières, suivi des stocks de toutes les boutiques."
      };
    }
  }, [isMagasinier, isCaissier, userBoutique, t]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full pb-20 scrollbar-hide font-sans">
      
      {/* Sleek Minimalist Header Panel from Template */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-2" id="dashboard-header-panel">
        <div>
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-farm-600 dark:text-farm-400 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-farm-500 animate-pulse"></span>
              {headerInfo.tag}
           </div>
           <h2 className="text-3xl font-display font-black text-slate-805 dark:text-slate-100 tracking-tight leading-none uppercase" id="dashboard-header-title">
              {headerInfo.title}
           </h2>
           <p className="text-xs text-slate-400 font-bold tracking-wide mt-1 uppercase" id="dashboard-header-subtitle">{headerInfo.subtitle}</p>
        </div>

        {/* Central Pill Selector & Actions */}
        <div className="flex flex-wrap items-center gap-4">
             {/* Time range Pill Selector Matches the center option of template header */}
             {!isCaissier && (
             <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                 <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                 <select 
                     id="dashboard-timerange-select"
                     className="bg-transparent text-xs font-black text-slate-700 dark:text-gray-200 outline-none cursor-pointer uppercase tracking-wider pr-4 font-sans border-none focus:ring-0"
                     value={timeRange}
                     onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                 >
                     <option value="today">{t('common.today')}</option>
                     <option value="week">{t('common.this_week')}</option>
                     <option value="month">{t('common.this_month')}</option>
                     <option value="year">{t('common.this_year')}</option>
                     <option value="all">{t('common.all')}</option>
                 </select>
             </div>
             )}

             {/* Category Pill Selector */}
             <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 px-2.5 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                 <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                 <select 
                     id="dashboard-category-select"
                     className="bg-transparent text-xs font-black text-slate-700 dark:text-gray-200 outline-none cursor-pointer uppercase tracking-wider pr-4 font-sans border-none focus:ring-0"
                     value={activeCategory}
                     onChange={(e) => setActiveCategory(e.target.value)}
                 >
                     <option value="Tous">{t('common.all_categories')}</option>
                     {(categories.length > 0 ? categories : Object.values(Category)).map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </div>

             {/* Black active CTA capsule resembling the "New Company" button in the template */}
             {isMagasinier ? (
               <button 
                 id="dashboard-nav-transfers-btn"
                 onClick={() => onNavigate('transfers')}
                 className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs px-6 py-3 uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
               >
                  Nouveau Transfert
                  <RefreshCw className="w-3.5 h-3.5 text-white/80" />
               </button>
             ) : (
               <button 
                 id="dashboard-nav-pos-btn"
                 onClick={() => onNavigate('pos')}
                 className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs px-6 py-3 uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
               >
                  Nouvelle Vente
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
               </button>
             )}
             {/* --- ROW 1: PRECISE HIGH-END TEMPLATE METRIC CARDS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="dashboard-metric-cards-row">
        
        {isMagasinier ? (
          <>
            {/* MAGASINIER CARD A: Coral Red/Orange Stock Alert Card (takes 5/12 cols) */}
            <div 
              id="magasinier-kpi-low-stock"
              onClick={() => onNavigate('inventory')}
              className="lg:col-span-5 rounded-[2.5rem] bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 p-8 text-white shadow-[0_20px_40px_-10px_rgba(239,68,68,0.3)] hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(239,68,68,0.4)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group min-h-[220px]"
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none flex items-end">
                 <svg viewBox="0 0 400 120" className="w-full h-24 stroke-white fill-none stroke-[3] stroke-round">
                    <path d="M0,40 Q50,90 100,20 T200,80 T300,30 T400,90" />
                 </svg>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                       ALERTE DE STOCK
                    </p>
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Selon vos seuils définis</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                    Attention
                 </div>
              </div>

              <div className="relative z-10 my-6">
                 <h3 className="text-4xl xs:text-5xl font-display font-black tracking-tight leading-none text-white drop-shadow-sm truncate">
                    {lowStockCount} 
                    <span className="text-xs font-black uppercase ml-1.5 text-white/80">alertes</span>
                 </h3>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/80 pt-4 border-t border-white/10">
                 <span>Statut</span>
                 <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5 text-white/95" />
                    <span>À réapprovisionner</span>
                 </div>
              </div>
            </div>

            {/* MAGASINIER CARD B: Circular Donut Chart Card showing global stock (middle - takes 4/12 cols) */}
            <div 
              id="magasinier-kpi-global-stock"
              onClick={() => onNavigate('inventory')}
              className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden min-h-[220px] cursor-pointer group"
            >
               <div className="flex justify-between items-center mb-4">
                 <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Stock total</h4>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Répartition</p>
                 </div>
                 <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                    En Entrepôt
                 </span>
               </div>

               <div className="flex items-center justify-between gap-6 my-2">
                  <div className="text-left font-sans">
                     <div className="mb-3">
                        <p className="text-xs font-black text-slate-400 uppercase">Aliments simples</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                           {totalProducts}
                        </p>
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-400 uppercase">Formules</p>
                        <p className="text-2xl font-black text-farm-500">
                           {formulasCount}
                        </p>
                     </div>
                  </div>

                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100 dark:text-slate-800"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          stroke="var(--color-farm-500)"
                          strokeDasharray="65, 100"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-amber-400"
                          stroke="currentColor"
                          strokeDasharray="20, 100"
                          strokeDashoffset="-65"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                     </svg>
                     <div className="absolute w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-farm-500 to-amber-400 shadow-md"></div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                  <span className="flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-full bg-farm-500"></span> Matières P.
                  </span>
                  <span className="flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-full bg-amber-400"></span> Formules
                  </span>
               </div>
            </div>

            {/* MAGASINIER CARD C: Transfer & Formulas Side Stats (takes 3/12 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6 justify-between" id="magasinier-kpi-substacks">
               <div 
                 id="magasinier-sub-pending-transfers"
                 onClick={() => onNavigate('transfers')}
                 className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${transfers.filter(t => t.status === 'PENDING').length > 0 ? 'border-amber-100 dark:border-amber-950 ring-4 ring-amber-50/50' : 'border-white'} shadow-sm flex items-center justify-between hover:translate-x-0.5 transition-all cursor-pointer flex-1`}
               >
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRANSFERTS PENDANTS</p>
                     <p className="text-xl font-black text-amber-500 font-display">
                        {transfers.filter(t => t.status === 'PENDING').length} <span className="text-[10px] font-bold">en attente</span>
                     </p>
                     <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        À valider
                     </p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/25 p-3 rounded-2xl text-amber-500">
                     <RefreshCw className="w-5 h-5" />
                  </div>
               </div>

               <div 
                 id="magasinier-sub-formulas-count"
                 onClick={() => onNavigate('inventory')}
                 className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-white shadow-sm flex items-center justify-between hover:translate-x-0.5 transition-all cursor-pointer flex-1"
               >
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FORMULES SAUVEGARDÉES</p>
                     <p className="text-xl font-black text-teal-600 font-display">
                        {formulasCount}
                     </p>
                     <p className="text-[9px] text-teal-500 font-black uppercase tracking-widest">
                        Recettes actives
                     </p>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-950 p-3 rounded-2xl text-teal-600">
                     <Layers className="w-5 h-5" />
                  </div>
               </div>
            </div>
          </>
        ) : isCaissier ? (
          <>
            {/* CAISSIER CARD A: Today's Cash Performance (left - takes 5/12 cols) */}
            <div 
              id="caissier-kpi-today-sales"
              onClick={() => onNavigate('invoices')}
              className="lg:col-span-4 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-8 text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(16,185,129,0.4)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group min-h-[220px]"
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none flex items-end">
                 <svg viewBox="0 0 400 120" className="w-full h-24 stroke-white fill-none stroke-[3] stroke-round">
                    <path d="M0,80 Q50,40 100,70 T200,30 T300,90 T400,20" />
                 </svg>
              </div>

              <div className="relative z-10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                       CHIFFRE D'AFFAIRES DU JOUR (C.A)
                    </p>
                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Enregistré aujourd'hui</p>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider tracking-widest">
                    Caisse Directe
                 </div>
              </div>

              <div className="relative z-10 my-6">
                 <h3 className="text-4xl xs:text-5xl font-display font-black tracking-tight leading-none text-white drop-shadow-sm truncate">
                    {todaySalesRevenue.toLocaleString('fr-FR')} 
                    <span className="text-xs font-black uppercase ml-1.5 text-white/80">FCFA</span>
                 </h3>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/80 pt-4 border-t border-white/10">
                 <span>Nombre de ventes : {todaySalesCount}</span>
                 <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5 text-white/95" />
                    <span>En Activité</span>
                 </div>
              </div>
            </div>

            {/* CAISSIER CARD C: Outstanding Debt check (right - takes 4/12 cols) */}
            <div 
              id="caissier-kpi-debts-tracking"
              onClick={() => onNavigate('invoices')}
              className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden min-h-[220px] cursor-pointer"
            >
               <div className="flex justify-between items-center mb-4">
                 <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Créances & Recouvrement</h4>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Alertes Dettes</p>
                 </div>
                 <span className="text-[10px] bg-red-400/10 text-red-500 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Déficits clients
                 </span>
               </div>

               <div className="flex items-center justify-between gap-6 my-2">
                  <div className="text-left font-sans">
                     <div className="mb-3">
                        <p className="text-xs font-black text-slate-400 uppercase">Dettes Enregistrées</p>
                        <p className="text-xl font-black text-rose-500 font-display">
                           {totalDebts.toLocaleString('fr-FR')} <span className="text-[10px]">F</span>
                        </p>
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-400 uppercase">Impayés du Jour</p>
                        <p className="text-xl font-black text-slate-800 dark:text-slate-100 font-display">
                           {todayOutstandingDebt.toLocaleString('fr-FR')} <span className="text-[10px]">F</span>
                        </p>
                     </div>
                  </div>

                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 rounded-full text-rose-500">
                     <AlertTriangle className="w-10 h-10 animate-pulse" />
                  </div>
               </div>

               <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400">Total Factures du Jour : {filteredInvoices.length}</span>
               </div>
            </div>

            {/* CAISSIER CARD B: Today's Expenses (middle - takes 4/12 cols) */}
            <div 
              id="caissier-kpi-today-expenses"
              onClick={() => onNavigate('accounting')}
              className="lg:col-span-4 rounded-[2.5rem] bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500 p-8 text-white shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(245,158,11,0.4)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group min-h-[220px]"
            >
               <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none flex items-end">
                  <svg viewBox="0 0 400 120" className="w-full h-24 stroke-white fill-none stroke-[3] stroke-round">
                     <path d="M0,100 Q100,20 200,80 T400,40" />
                  </svg>
               </div>

               <div className="relative z-10 flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                        DÉPENSES DU JOUR
                     </p>
                     <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Sorties de caisse</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider tracking-widest">
                     Comptabilité
                  </div>
               </div>

               <div className="relative z-10 my-6">
                  <h3 className="text-4xl xs:text-5xl font-display font-black tracking-tight leading-none text-white drop-shadow-sm truncate">
                     {todayExpensesAmount.toLocaleString('fr-FR')} 
                     <span className="text-xs font-black uppercase ml-1.5 text-white/80">FCFA</span>
                  </h3>
               </div>

               <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/80 pt-4 border-t border-white/10">
                  <span>Bas en stock : {lowStockCount} Aliments</span>
                  <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                     <Wallet className="w-3.5 h-3.5 text-white/95" />
                     <span>Suivi Dépenses</span>
                  </div>
               </div>
            </div>
          </>
        ) : (
          // IMPROVED ADMIN ONLY DASHBOARD (HIGH PERFORMANCE BUSINESS LEVEL ANALYTICS PILLARS)
          <>
            {/* CARD A: Coral Core KPI Card (left - takes 5/12 cols) */}
            {isVisible('kpi-sales') && (
              <div 
                id="admin-kpi-sales"
                onClick={() => onNavigate('analytics')}
                className="lg:col-span-5 rounded-[2.5rem] bg-gradient-to-br from-farm-500 via-farm-400 to-farm-300 p-8 text-white shadow-[0_20px_40px_-10px_var(--color-farm-500)] hover:-translate-y-1 hover:shadow-[0_24px_50px_var(--color-farm-500)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group min-h-[220px]"
              >
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none flex items-end">
                   <svg viewBox="0 0 400 120" className="w-full h-24 stroke-white fill-none stroke-[3] stroke-round">
                      <path d="M0,80 Q50,40 100,70 T200,30 T300,90 T400,20" />
                   </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                         {activeCategory === 'Tous' ? t('dashboard.revenue_today') : "CA " + activeCategory.split(' ')[0]}
                      </p>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-0.5">{getTimeRangeLabel()}</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider tracking-widest">
                      Live Sales
                   </div>
                </div>

                <div className="relative z-10 my-6">
                   <h3 className="text-4xl xs:text-5xl font-display font-black tracking-tight leading-none text-white drop-shadow-sm truncate">
                      {filteredRevenue.toLocaleString('fr-FR')} 
                      <span className="text-xs font-black uppercase ml-1.5 text-white/80">FCFA</span>
                   </h3>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/80 pt-4 border-t border-white/10">
                   <span>Performance Brute</span>
                   <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5 text-white/95" />
                      <span>+14.8%</span>
                   </div>
                </div>
              </div>
            )}

            {/* CARD B: Circular Donut Chart Card (middle - takes 4/12 cols) */}
            {isVisible('kpi-orders') && (
              <div 
                id="admin-kpi-orders"
                className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden min-h-[220px]"
              >
                 <div className="flex justify-between items-center mb-4">
                   <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Disponibilité Aliments</h4>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Distribution</p>
                   </div>
                   <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Real Time
                   </span>
                 </div>

                 <div className="flex items-center justify-between gap-6 my-2">
                    <div className="text-left">
                       <div className="mb-3">
                          <p className="text-xs font-black text-slate-400 uppercase">Alerte Bas</p>
                          <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
                             {lowStockCount}
                          </p>
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-400 uppercase">En Stock</p>
                          <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                             {totalProducts}
                          </p>
                       </div>
                    </div>

                    <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100 dark:text-slate-800"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="none"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            stroke="var(--color-farm-500)"
                            strokeDasharray="45, 100"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-amber-400"
                            stroke="currentColor"
                            strokeDasharray="30, 100"
                            strokeDashoffset="-45"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                       </svg>
                       <div className="absolute w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-farm-500 to-amber-400 shadow-md animate-pulse"></div>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pt-3 border-t border-slate-50 dark:border-slate-800/40">
                    <span className="flex items-center gap-1.5">
                       <span className="w-2 h-2 rounded-full bg-farm-500"></span> Volaille
                    </span>
                    <span className="flex items-center gap-1.5">
                       <span className="w-2 h-2 rounded-full bg-amber-400"></span> Porc/Autre
                    </span>
                 </div>
              </div>
            )}

            {/* CARD C: Double Stacked Minor Cards (right - takes 3/12 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6 justify-between" id="admin-kpi-substacks">
               {/* Stat Row 1: Credits/Dettes */}
               {isVisible('kpi-debt') && (
                  <div 
                    id="admin-sub-debts"
                    onClick={() => onNavigate('pos')}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border ${totalDebts > 0 ? 'border-rose-100 dark:border-rose-950 ring-4 ring-rose-50/50' : 'border-white'} shadow-sm flex items-center justify-between hover:translate-x-0.5 transition-all cursor-pointer flex-1`}
                  >
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.customer_debts')}</p>
                        <p className="text-xl font-black text-rose-600 font-display">
                           {totalDebts.toLocaleString('fr-FR')} <span className="text-[10px] font-bold">F</span>
                        </p>
                        <p className="text-[9px] text-farm-500 font-black uppercase tracking-widest flex items-center gap-1">
                           <AlertTriangle className="w-3 h-3" />
                           A Recouvrer
                        </p>
                     </div>
                     <div className="bg-farm-50 dark:bg-farm-900/20 p-3 rounded-2xl text-farm-500">
                        <CreditCard className="w-5 h-5" />
                     </div>
                  </div>
               )}

               {/* Stat Row 2: Total Items */}
               {isVisible('kpi-customers') && (
                  <div 
                    id="admin-sub-active-items"
                    onClick={() => onNavigate('inventory')}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-white shadow-sm flex items-center justify-between hover:translate-x-0.5 transition-all cursor-pointer flex-1"
                  >
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.top_products')}</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white font-display">
                           {totalProducts}
                        </p>
                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                           Aliments Actifs
                        </p>
                     </div>
                     <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-2xl text-emerald-600">
                        <Package className="w-5 h-5" />
                     </div>
                  </div>
               )}
            </div>
          </>
        )}

      </div>   </div>

      </div>

      {/* --- TRACKER DE STATUT D'OUVERTURE DES BOUTIQUES --- */}
      {isVisible('boutique-status-tracker') && !isMagasinier && !isCaissier && (
        <div className="my-8 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800/40">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <Store className="w-4 h-4 text-farm-500" />
                Suivi des Ouvertures & Fermetures
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Statut opérationnel en temps réel de vos points de vente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boutiques.filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique).map((b) => {
              const isOpen = b.openStatus === 'OPEN';
              const isToggling = togglingBoutiqueId === b.id;
              
              // Allowed to toggle if Admin or assigned to this specific boutique
              const canToggle = isAdmin || userBoutique === 'Toutes' || userBoutique === b.id || userBoutique === b.name;

              // Format date/time
              const lastActionTime = isOpen ? b.lastOpenedAt : b.lastClosedAt;
              const actionUser = isOpen ? b.openedBy : b.closedBy;
              const formattedTime = lastActionTime
                ? new Date(lastActionTime).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : null;

              return (
                <div 
                  key={b.id} 
                  className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isOpen 
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/80 dark:border-emerald-900/30' 
                      : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                          {b.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          {b.location || 'Sans localisation'}
                        </span>
                      </div>

                      <span 
                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                          isOpen 
                            ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {isOpen ? 'Ouverte' : 'Fermée'}
                      </span>
                    </div>

                    {/* Historical logs inside card */}
                    <div className="bg-white/80 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-800/40 space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        Dernier mouvement
                      </p>
                      {formattedTime ? (
                        <div className="font-sans leading-tight">
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                            {isOpen ? 'Ouverte' : 'Fermée'} le {formattedTime}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            Par: {actionUser || 'Système'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider italic">
                          Aucun historique d'ouverture
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {boutiques.filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique).length === 0 && (
              <div className="col-span-full text-center p-12 text-slate-400 uppercase tracking-widest text-xs">
                Aucune boutique disponible.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ROW 2: FEED ACTIVITY LIST & POOL STATS COLUMN GRAPH --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* LEFT LIST: Feed Activity Table component taking 7/12 cols */}
         {isVisible('table-recent') && (
            <div className={`${isMagasinier || isCaissier ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)]`}>
               {isMagasinier ? (
                  <>
                     <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800/40">
                        <div>
                           <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                              Transferts de stock
                           </h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Suivi des transferts récents</p>
                        </div>
                        
                        <button 
                           onClick={() => onNavigate('transfers')}
                           className="text-[10px] font-black text-slate-400 uppercase hover:text-farm-500 tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                           Tout Afficher
                           <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                     </div>

                     <div className="space-y-4">
                        {transfers.slice(-4).reverse().map((trans, idx) => {
                           const totalQty = trans.items.reduce((sum, item) => sum + item.quantity, 0);
                           // Find boutique names
                           const fromBoutique = boutiques.find(b => b.id === trans.sourceBoutique)?.name || trans.sourceBoutique;
                           const toBoutique = boutiques.find(b => b.id === trans.destinationBoutique)?.name || trans.destinationBoutique;

                           return (
                              <div 
                                key={trans.id || idx} 
                                className="flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-850/40 border border-transparent hover:border-slate-100/50 dark:hover:border-slate-800/40 transition-all duration-300"
                              >
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-100 to-amber-200/50 dark:from-slate-800 dark:to-slate-755/50 flex items-center justify-center text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                                       TR
                                    </div>
                                    
                                    <div className="text-left font-sans">
                                       <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                                          De <span className="text-farm-500 font-extrabold">{fromBoutique}</span> à <span className="text-teal-600 font-extrabold">{toBoutique}</span>
                                       </p>
                                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                          Initié par {trans.createdBy || 'Magasinier'} • {new Date(trans.date).toLocaleDateString('fr-FR')}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-6">
                                    <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                                       {totalQty} sacs
                                    </span>

                                    <div className="text-right">
                                       <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                          trans.status === 'COMPLETED' 
                                             ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                             : trans.status === 'PENDING'
                                             ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                             : 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                                       }`}>
                                          {trans.status === 'COMPLETED' ? 'COMPLÉTÉ' : trans.status === 'PENDING' ? 'PENDANT' : 'ANNULÉ'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}

                        {transfers.length === 0 && (
                           <div className="text-center p-12 text-slate-400 uppercase tracking-widest text-xs">
                              Aucun transfert de stock enregistré.
                           </div>
                        )}
                     </div>
                  </>
               ) : (
                  <>
                     <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800/40">
                        <div>
                           <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                              Flux d'Activité & Ventes Récentes
                           </h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Suivi des dernières caisses enregistrées</p>
                        </div>
                        
                        <button 
                           onClick={() => onNavigate('invoices')}
                           className="text-[10px] font-black text-slate-400 uppercase hover:text-farm-500 tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                           Voir Tout
                           <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                     </div>

                     <div className="space-y-4">
                        {filteredInvoices.slice(0, 4).map((inv, idx) => {
                           return (
                              <div 
                                key={`${inv.id || 'inv'}-${idx}`} 
                                className="flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-850/40 border border-transparent hover:border-slate-100/50 dark:hover:border-slate-800/40 transition-all duration-300"
                              >
                                 <div className="flex items-center gap-4">
                                    {/* Sleek Rounded avatar as seen in mockup */}
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200/50 dark:from-slate-800 dark:to-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 font-extrabold text-xs">
                                       {inv.customerName?.charAt(0) || 'C'}
                                    </div>
                                    
                                    <div className="text-left font-sans">
                                       <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                                          {inv.customerName || 'Client de Passage'}
                                       </p>
                                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                          {new Date(inv.date).toLocaleDateString('fr-FR')} à {new Date(inv.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                       </p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-6">
                                    {/* Responsive category status styled as in template (e.g., tags) */}
                                    <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                                       {inv.boutique || 'Boutique #1'}
                                    </span>

                                    {/* Amount Paid indicator */}
                                    <div className="text-right">
                                       <p className="text-xs font-black text-slate-900 dark:text-white font-display">
                                          {(inv.total).toLocaleString('fr-FR')} <span className="text-[9px] font-bold">F</span>
                                       </p>
                                       <span className={`text-[9px] font-black uppercase tracking-widest ${inv.status === 'PAYÉ' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                          {inv.status}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}

                        {filteredInvoices.length === 0 && (
                           <div className="text-center p-12 text-slate-400 uppercase tracking-widest text-xs">
                              Aucune activité récente.
                           </div>
                        )}
                     </div>
                  </>
               )}
            </div>
         )}

         {/* RIGHT GRAPH: Boutique Performance Column graphic matching Pool Stats 3/12 cols */}
         {isVisible('chart-revenue') && !isMagasinier && !isCaissier && (
            <div className="lg:col-span-4 bg-white dark:bg-[#121824] rounded-[2.5rem] p-8 border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                        Pool Stats
                     </h3>
                     <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Performance Boutiques</p>
                  </div>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                     CA brut
                  </span>
               </div>

               {/* Custom vertical bar graph matching Pool Stats from the mockup */}
               <div className="flex items-end justify-around h-48 w-full gap-4 relative px-2">
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100 dark:bg-slate-800"></div>

                  {boutiqueStats.map((b, i) => {
                     // Calculate height percentage relative to highest revenue
                     const maxRevenue = Math.max(...boutiqueStats.map(s => s.revenue || 1), 1);
                     const heightPct = Math.max(((b.revenue || 0) / maxRevenue) * 100, 10);
                     // Highlight the highest performing boutique with the hot-pink signature collar color
                     const isHighest = b.revenue > 0 && b.revenue === maxRevenue;

                     return (
                        <div key={b.id || i} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                           {/* Hover tooltip for revenue */}
                           <div className="absolute -top-10 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-lg pointer-events-none transition-transform z-10 whitespace-nowrap shadow-md uppercase tracking-wider">
                              {b.revenue.toLocaleString('fr-FR')} F
                           </div>

                           {/* Elegant vertical rounded columns reflecting template picture */}
                           <div 
                             style={{ height: `${heightPct}%` }}
                             className={`w-4 sm:w-6 rounded-t-xl transition-all duration-500 relative ${
                               isHighest 
                                 ? 'bg-farm-500 shadow-[0_12px_24px_var(--color-farm-500)]' 
                                 : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                             }`}
                           >
                              {isHighest && (
                                 <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm border border-farm-500/20"></div>
                              )}
                           </div>
                           
                           {/* Brief labels */}
                           <span className="text-[8px] font-black text-slate-400 mt-2 truncate max-w-[65px] uppercase tracking-wider">
                              {b.name.split(' ')[0]}
                           </span>
                        </div>
                     );
                  })}

                  {boutiqueStats.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center text-slate-300 uppercase tracking-widest text-[9px]">
                        Aucune boutique enregistrée
                     </div>
                  )}
               </div>

               {/* Stats Summary Panel */}
               <div className="border-t border-slate-50 dark:border-slate-800/40 pt-5 mt-6 space-y-3.5">
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                     <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-farm-500"></span> Leader
                     </span>
                     <span className="text-slate-800 dark:text-slate-100 font-extrabold">
                        {boutiqueStats.length > 0 ? (boutiqueStats.reduce((max, b) => b.revenue > max.revenue ? b : max, boutiqueStats[0]).name) : '-'}
                     </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                     <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-750"></span> Total CA
                     </span>
                     <span className="text-slate-800 dark:text-slate-100 font-extrabold">
                        {totalRevenue.toLocaleString('fr-FR')} FCFA
                     </span>
                  </div>
               </div>
            </div>
         )}

      </div>

    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: any; color: string; alert?: boolean; trend?: string; onClick?: () => void }> = ({ title, value, icon: Icon, color, alert, trend, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative bg-white p-6 rounded-3xl shadow-sm border ${alert ? 'border-red-200 ring-4 ring-red-50' : 'border-gray-100'} transition-all duration-300 hover:-translate-y-1 hover:shadow-glass overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12 group-hover:rotate-0 duration-500">
        <Icon className="w-32 h-32 text-gray-900" />
    </div>
    
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3.5 rounded-2xl shadow-lg shadow-gray-100 ${color.replace('bg-', 'bg-opacity-10 text-').replace('text-', 'text-white')}`}>
         <div className={`p-2 rounded-xl ${color} text-white shadow-sm`}>
            <Icon className="w-5 h-5" />
         </div>
      </div>
      {alert && <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>}
      {onClick && <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </div>
    
    <div className="relative z-10">
        <h3 className="text-gray-400 text-xs font-bold tracking-wider uppercase font-display">{title}</h3>
        <p className="text-3xl font-display font-bold text-gray-900 mt-2 tracking-tight">{value}</p>
        {trend && (
            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-gray-400 bg-gray-50 w-fit px-2 py-1 rounded-lg">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                {trend}
            </div>
        )}
    </div>
  </div>
);