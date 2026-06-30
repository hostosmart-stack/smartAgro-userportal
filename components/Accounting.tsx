import React, { useState, useMemo } from 'react';
import { Invoice, Product, Expense, Payment, Boutique, StockTransfer, Customer, Employee } from '../types';
import { Wallet, TrendingDown, TrendingUp, Calendar, Trash2, ArrowDownRight, AlertCircle, CheckCircle2, User, Coins, X, FileText, AlertTriangle, Package, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { deleteExpense, processPaymentRecovery, saveExpense, saveEmployee } from '../services/db';
import { useNotifications } from './ui/Notifications';
import { Pagination } from './Pagination';

interface AccountingProps {
  invoices: Invoice[];
  products: Product[]; // Used for Cost of Goods calculations
  expenses: Expense[];
  setExpenses?: any; // Deprecated
  transfers?: StockTransfer[];
  onUpdateInvoice: (invoice: Invoice) => void;
  boutiques?: Boutique[];
  userRole?: string;
  userBoutique?: string;
  customers?: Customer[];
  currentProvenderieId?: string;
  employees?: Employee[];
}

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all';

const getProductCostPrice = (product: Product, variantName?: string | null, productsList: Product[] = []) => {
  if (variantName) {
    const variant = product.variants?.find(v => v.name === variantName);
    if (variant?.costPrice) return variant.costPrice;
  }
  if (product.costPrice) return product.costPrice;

  // Fallback to recipe if formula
  if (product.recipe && product.recipe.length > 0) {
    let computedCost = 0;
    let totalWeight = 0;
    product.recipe.forEach(ingredient => {
      const ingredientProduct = productsList.find(p => p.id === ingredient.productId);
      if (ingredientProduct) {
        const ingredientCost = ingredient.variantName
          ? (ingredientProduct.variants?.find(v => v.name === ingredient.variantName)?.costPrice || ingredientProduct.costPrice || ingredientProduct.price || 0)
          : (ingredientProduct.costPrice || ingredientProduct.price || 0);
        computedCost += ingredientCost * ingredient.weight;
        totalWeight += ingredient.weight;
      }
    });
    if (totalWeight > 0) {
      return computedCost / totalWeight;
    }
  }

  return 0;
};

export const Accounting: React.FC<AccountingProps> = ({ invoices, products, expenses, transfers = [], onUpdateInvoice, boutiques = [], userRole = 'Admin', userBoutique = 'Toutes', customers = [], currentProvenderieId, employees = [] }) => {
  const { notify } = useNotifications();

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
        window.dispatchEvent(new Event('storage_annotations_changed'));
      } catch (e) {
        console.warn('Failed to save annotation settings', e);
      }
      return newVal;
    });
  };

  React.useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('smart_agro_show_annotations');
        if (saved !== null) {
          setShowAnnotations(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage_annotations_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('storage_annotations_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'expenses' | 'debts' | 'transfers'>(() => {
    const saved = localStorage.getItem('smartAgro_initialAccountingTab');
    if (saved === 'expenses' || saved === 'debts' || saved === 'transfers') {
      localStorage.removeItem('smartAgro_initialAccountingTab');
      return saved;
    }
    return 'expenses';
  });
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [boutiqueFilter, setBoutiqueFilter] = useState<string>(() => {
    if (userBoutique && userBoutique !== 'Toutes') return userBoutique;
    return 'all';
  });
  const normRole = (userRole || '').toLowerCase().trim();
  const isSuperOrAdmin = normRole === 'admin' || 
                         normRole.includes('super') || 
                         normRole.includes('system') || 
                         normRole.includes('administrateur');
  const canFilterBoutique = isSuperOrAdmin || (userRole === 'Gérant' && userBoutique === 'Toutes');
  const [includeDebts, setIncludeDebts] = useState<boolean>(true);
  const [includeAvance, setIncludeAvance] = useState<boolean>(false);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState<string>('');
  const [expenseDateFilter, setExpenseDateFilter] = useState<string>('');
  
  const [salesStatusFilter, setSalesStatusFilter] = useState<string>('all');
  const [salesSearchTerm, setSalesSearchTerm] = useState<string>('');
  const [salesDateFilter, setSalesDateFilter] = useState<string>('');

  // Pagination State
  const [salesPage, setSalesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const itemsPerPage = 5;

  // New Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    amount: 0,
    category: 'AUTRE',
    description: '',
    boutique: isSuperOrAdmin ? boutiques[0]?.id : userBoutique,
    employeeId: ''
  });

  const handleSaveExpense = async () => {
    let finalDescription = newExpense.description || '';
    if (newExpense.category === 'SALAIRE') {
      const emp = employees?.find(e => e.id === newExpense.employeeId);
      finalDescription = emp ? `Salaire - ${emp.name}` : 'Salaire';
    } else if (newExpense.category === 'RATION') {
      const emp = employees?.find(e => e.id === newExpense.employeeId);
      finalDescription = emp ? `Ration - ${emp.name}` : 'Ration';
    } else if (newExpense.category !== 'AUTRE') {
      const categoryNames: Record<string, string> = {
        'ELECTRICITE': 'Electricité',
        'EAU': 'Eau',
        'INTERNET': 'Internet',
        'DIVERS': 'Divers'
      };
      finalDescription = categoryNames[newExpense.category || 'AUTRE'] || newExpense.category || 'Dépense';
    }

    if (!newExpense.amount || newExpense.amount <= 0 || (newExpense.category === 'AUTRE' && !finalDescription)) {
      notify("Veuillez remplir le montant" + (newExpense.category === 'AUTRE' ? " et le motif" : ""), "error");
      return;
    }
    setIsSubmittingExpense(true);
    try {
      const expense: Expense = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount: newExpense.amount,
        category: newExpense.category as any || 'AUTRE',
        description: finalDescription,
        deleted: false,
        provenderieId: currentProvenderieId,
        boutique: newExpense.boutique || userBoutique,
        employeeId: newExpense.employeeId || undefined
      };
      await saveExpense(expense);

      if (newExpense.category === 'SALAIRE' || newExpense.category === 'RATION') {
        const emp = employees?.find(e => e.id === newExpense.employeeId);
        if (emp) {
          const updatedEmp = { ...emp };
          if (newExpense.category === 'SALAIRE') {
            updatedEmp.pendingSalary = Math.max(0, (updatedEmp.pendingSalary || 0) - newExpense.amount);
          } else {
            updatedEmp.pendingRation = Math.max(0, (updatedEmp.pendingRation || 0) - newExpense.amount);
          }
          await saveEmployee(updatedEmp);
        }
      }

      notify("Dépense enregistrée", "success");
      setIsExpenseModalOpen(false);
      setNewExpense({
        amount: 0,
        category: 'AUTRE',
        description: '',
        boutique: isSuperOrAdmin ? boutiques[0]?.id : userBoutique,
        employeeId: ''
      });
    } catch (error) {
      console.error(error);
      notify("Erreur lors de l'enregistrement de la dépense", "error");
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Debt Recovery Modal State
  const [recoveringInvoice, setRecoveringInvoice] = useState<Invoice | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [recoveryNote, setRecoveryNote] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // --- FILTERING HELPERS ---
  const isDateInRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (timeRange === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (timeRange === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      return date >= startOfWeek;
    }
    if (timeRange === 'month') {
      return date.getMonth() === new Date().getMonth() && 
             date.getFullYear() === new Date().getFullYear();
    }
    if (timeRange === 'year') {
      return date.getFullYear() === new Date().getFullYear();
    }
    return true; // 'all'
  };

  // --- FILTERED DATA ---
  const filteredInvoices = useMemo(() => invoices.filter(inv => {
      if (!isDateInRange(inv.date)) return false;
      if (boutiqueFilter !== 'all' && inv.boutique !== boutiqueFilter) return false;
      if (salesStatusFilter !== 'all') {
          if (salesStatusFilter === 'paye' && inv.status !== 'PAYÉ') return false;
          if (salesStatusFilter === 'impaye' && inv.status === 'PAYÉ') return false;
      }
      if (salesSearchTerm && !(inv.customerName || '').toLowerCase().includes((salesSearchTerm || '').toLowerCase())) return false;
      if (salesDateFilter && !inv.date.startsWith(salesDateFilter)) return false;
      return true;
  }), [invoices, timeRange, boutiqueFilter, salesStatusFilter, salesSearchTerm, salesDateFilter]);

  const filteredExpenses = useMemo(() => expenses.filter(exp => {
      if (!isDateInRange(exp.date)) return false;
      if (boutiqueFilter !== 'all' && exp.boutique !== boutiqueFilter) return false;
      if (expenseCategoryFilter !== 'all' && exp.category !== expenseCategoryFilter) return false;
      if (expenseSearchTerm && !(exp.description || '').toLowerCase().includes((expenseSearchTerm || '').toLowerCase())) return false;
      if (expenseDateFilter && !exp.date.startsWith(expenseDateFilter)) return false;
      return true;
  }), [expenses, timeRange, boutiqueFilter, expenseCategoryFilter, expenseSearchTerm, expenseDateFilter]);

  const filteredTransfers = useMemo(() => transfers.filter(tr => {
      if (!isDateInRange(tr.date)) return false;
      if (boutiqueFilter !== 'all' && tr.sourceBoutique !== boutiqueFilter && tr.destinationBoutique !== boutiqueFilter) return false;
      if (tr.status !== 'COMPLETED') return false; // Only show completed transfers in accounting
      return true;
  }), [transfers, timeRange, boutiqueFilter]);

  // --- PAGINATED DATA ---
  const paginatedInvoices = useMemo(() => {
    const start = (salesPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, salesPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, expensesPage]);

  const paginatedTransfers = useMemo(() => {
    const start = (transfersPage - 1) * itemsPerPage;
    return filteredTransfers.slice(start, start + itemsPerPage);
  }, [filteredTransfers, transfersPage]);

  // Reset pages when filters change
  React.useEffect(() => {
    setSalesPage(1);
  }, [timeRange, boutiqueFilter, salesStatusFilter, salesSearchTerm, salesDateFilter]);

  React.useEffect(() => {
    setExpensesPage(1);
  }, [timeRange, boutiqueFilter, expenseCategoryFilter, expenseSearchTerm, expenseDateFilter]);

  // --- CALCULATIONS ---
  // Unpaid Invoices List (Show all unpaid regardless of date filter, usually debts persist)
  const unpaidInvoices = useMemo(() => 
    invoices.filter(inv => inv.status !== 'PAYÉ' && (boutiqueFilter === 'all' || inv.boutique === boutiqueFilter)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [invoices, boutiqueFilter]);

  const totalRevenueBilled = useMemo(() => filteredInvoices.reduce((acc, inv) => acc + inv.total, 0), [filteredInvoices]);
  const totalCashCollected = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => {
      const base = inv.amountPaid - (inv.reimbursement || 0);
      if (includeAvance) {
        return acc + base + (inv.advanceUsed || 0);
      } else {
        return acc + base - (inv.newAdvanceCreated || 0);
      }
    }, 0);
  }, [filteredInvoices, includeAvance]);
  const totalReceivables = useMemo(() => filteredInvoices.reduce((acc, inv) => {
    const debt = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0));
    return acc + debt;
  }, 0), [filteredInvoices]);

  const totalUnpaidDebts = useMemo(() => {
    return unpaidInvoices.reduce((acc, inv) => {
      const debt = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0));
      return acc + debt;
    }, 0);
  }, [unpaidInvoices]);

  const recoveryRate = useMemo(() => {
    const invoicesForPeriodAndBoutique = invoices.filter(inv => {
      if (!isDateInRange(inv.date)) return false;
      if (boutiqueFilter !== 'all' && inv.boutique !== boutiqueFilter) return false;
      return true;
    });
    const billed = invoicesForPeriodAndBoutique.reduce((acc, inv) => acc + inv.total, 0);
    const collected = invoicesForPeriodAndBoutique.reduce((acc, inv) => {
      const base = inv.amountPaid - (inv.reimbursement || 0);
      if (includeAvance) {
        return acc + base + (inv.advanceUsed || 0);
      } else {
        return acc + base - (inv.newAdvanceCreated || 0);
      }
    }, 0);
    if (billed <= 0) return 0;
    return Math.min(100, (collected / billed) * 100);
  }, [invoices, timeRange, boutiqueFilter, includeAvance]);

  const totalCOGS = useMemo(() => {
    const getMultiplier = (unit: string) => {
      if (unit === 'Sac 50kg') return 50;
      if (unit === 'Sac 40kg') return 40;
      if (unit === 'Sac 25kg') return 25;
      return 1;
    };

    return filteredInvoices.reduce((acc, inv) => {
      const invoiceCost = (inv.items || []).reduce((sum, item) => {
        let unitCost = item.selectedVariant?.costPrice || item.costPrice || 0;
        
        // Fallback to current product catalog if cost is missing or 0
        if (!unitCost) {
           const currentProduct = products.find(p => p.id === item.id);
           if (currentProduct) {
               unitCost = getProductCostPrice(currentProduct, item.selectedVariant?.name, products);
           }
        }
        
        const multiplier = getMultiplier(item.unit || 'Détail');
        return sum + ((unitCost || 0) * multiplier * item.quantity);
      }, 0);
      return acc + invoiceCost;
    }, 0);
  }, [filteredInvoices, products]);

  const effectiveRevenue = includeDebts ? totalRevenueBilled : totalCashCollected;
  const grossProfit = effectiveRevenue - totalCOGS;
  const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0), [filteredExpenses]);
  const netProfit = grossProfit - totalExpenses;
  const totalEnCaisse = Math.max(0, totalCashCollected - totalExpenses);

  // --- HANDLERS ---
  const handleDeleteExpense = async (id: string) => {
    setShowConfirmDelete(id);
  };

  const confirmDeleteExpense = async () => {
    if (showConfirmDelete) {
      await deleteExpense(showConfirmDelete);
      setShowConfirmDelete(null);
    }
  };

  const openRecoveryModal = (invoice: Invoice) => {
      setRecoveringInvoice(invoice);
      setRecoveryAmount((invoice.total - invoice.amountPaid).toString());
      setRecoveryNote('Règlement solde');
  };

  const submitRecovery = () => {
      if (!recoveringInvoice) return;
      const amount = parseFloat(recoveryAmount);
      if (isNaN(amount) || amount <= 0) return;

      const currentBalance = recoveringInvoice.total - recoveringInvoice.amountPaid;
      if (amount > currentBalance) {
          notify('Le montant ne peut pas dépasser le reste à payer.', "error");
          return;
      }

      const newPaid = recoveringInvoice.amountPaid + amount;
      let newStatus: 'PAYÉ' | 'PARTIEL' = 'PARTIEL';
      if (Math.abs(newPaid - recoveringInvoice.total) < 1) newStatus = 'PAYÉ';

      const newPayment: Payment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: amount,
          note: recoveryNote
      };

      const updatedInvoice: Invoice = {
          ...recoveringInvoice,
          amountPaid: newPaid,
          remainingDebt: Math.max(0, recoveringInvoice.total - newPaid - (recoveringInvoice.advanceUsed || 0)),
          status: newStatus,
          paymentHistory: [...(recoveringInvoice.paymentHistory || []), newPayment]
      };

      const customer = customers.find(c => c.name === recoveringInvoice.customerName);
      processPaymentRecovery(updatedInvoice, customer).then(() => {
          onUpdateInvoice(updatedInvoice);
          setRecoveringInvoice(null);
          notify("Paiement enregistré", "success");
      }).catch(err => {
          console.error("Error recovering payment:", err);
          notify("Erreur lors de l'enregistrement", "error");
      });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="space-y-8 relative overflow-y-auto h-full pb-20 scrollbar-hide">
      
      {/* --- HEADER & TABS --- */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-4 border-b border-gray-100 pb-4 shrink-0">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Comptabilité</h2>
            <p className="text-gray-500 text-sm mt-1">Suivi financier simplifié.</p>
         </div>
         
         <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
             {/* --- TOGGLE DEBTS --- */}
             {activeTab === 'expenses' && (
                  <>
                  <label className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer bg-white dark:bg-gray-800 px-4 rounded-xl border border-gray-200 dark:border-gray-750 shadow-sm hover:border-farm-300 hover:shadow-md transition-all h-12 w-full sm:w-auto select-none">
                      <div className="relative inline-flex items-center">
                          <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={includeDebts}
                              onChange={() => setIncludeDebts(!includeDebts)}
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Inclure crédits</span>
                  </label>
                  <label className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer bg-white dark:bg-gray-800 px-4 rounded-xl border border-gray-200 dark:border-gray-750 shadow-sm hover:border-farm-300 hover:shadow-md transition-all h-12 w-full sm:w-auto select-none">
                      <div className="relative inline-flex items-center">
                          <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={includeAvance}
                              onChange={() => setIncludeAvance(!includeAvance)}
                          />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Inclure avances</span>
                  </label>
                  </>
              )}

             {canFilterBoutique && (
                 <select 
                     className="bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 rounded-xl shadow-sm outline-none cursor-pointer h-12 w-full sm:w-auto hover:border-farm-300 focus:ring-2 focus:ring-farm-500/20 transition-all"
                     value={boutiqueFilter}
                     onChange={e => setBoutiqueFilter(e.target.value)}
                 >
                     <option value="all">Toutes Boutiques</option>
                     {boutiques
                       .filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique)
                       .map(b => (
                         <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                 </select>
             )}

             <div className="bg-white border border-gray-200 rounded-xl px-4 flex items-center shadow-sm h-12 w-full sm:w-auto hover:border-farm-300 transition-all">
                 <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                 <select 
                    className="bg-transparent text-gray-700 text-sm font-bold px-2 outline-none cursor-pointer flex-1 sm:flex-none h-full"
                    value={timeRange}
                    onChange={e => setTimeRange(e.target.value as TimeRange)}
                 >
                     <option value="today">Aujourd'hui</option>
                     <option value="week">Cette Semaine</option>
                     <option value="month">Ce Mois</option>
                     <option value="year">Cette Année</option>
                     <option value="all">Tout l'historique</option>
                 </select>
            </div>

             <div className="bg-gray-100 p-2 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1.5 dark:bg-gray-800 w-full sm:w-auto shadow-inner min-h-14 items-center">
                <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`h-10 flex-1 sm:flex-none px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${activeTab === 'expenses' ? 'bg-white text-[var(--color-farm-700)] shadow-sm dark:bg-gray-700 dark:text-[var(--color-farm-400)]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Résultats
                </button>
                <button 
                    onClick={() => setActiveTab('debts')}
                    className={`h-10 flex-1 sm:flex-none px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'debts' ? 'bg-white text-[var(--color-farm-700)] shadow-sm dark:bg-gray-700 dark:text-[var(--color-farm-400)]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Crédits <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold dark:bg-red-900/30 dark:text-red-400">{unpaidInvoices.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('transfers')}
                    className={`h-10 flex-1 sm:flex-none px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'transfers' ? 'bg-white text-[var(--color-farm-700)] shadow-sm dark:bg-gray-700 dark:text-[var(--color-farm-400)]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Transferts <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">{filteredTransfers.length}</span>
                </button>
             </div>
             
             {/* Shared Annotation Toggle Switcher */}
             <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-3 h-12 rounded-2xl shadow-xs hover:border-emerald-500/50 transition-all shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${showAnnotations ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${showAnnotations ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleAnnotations}
                  className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer select-none"
                >
                  {showAnnotations ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-extrabold">Annotations : On</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Annotations : Off</span>
                    </>
                  )}
                </button>
             </div>

             {isSuperOrAdmin && (
                 <button 
                     onClick={() => setIsExpenseModalOpen(true)}
                     className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 w-full lg:w-auto"
                 >
                     <TrendingDown className="w-4 h-4" />
                     Enregistrer une Sortie
                 </button>
             )}
          </div>
       </div>

      {/* Annotations for Accounting */}
      {showAnnotations && (
        <div className="p-6 bg-emerald-50/40 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row gap-6 text-left animate-in fade-in duration-300 shadow-3xs">
          <div className="flex items-start gap-4 flex-1">
            <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
              14
            </span>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                État des Résultats & Trésorerie
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Suivez en temps réel le Chiffre d'Affaires encaissé ou total, le coût de revient des formules d'aliments vendues (COGS) et la marge nette consolidée.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 flex-1 border-t md:border-t-0 md:border-l border-slate-200/65 pt-4 md:pt-0 md:pl-6">
            <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
              15
            </span>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                Suivi des Crédits & Avances Clients
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Recouvrez les dettes de vos clients en enregistrant des paiements partiels directement depuis l'onglet des comptes débiteurs.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' ? (
      <>
          {/* --- CLEANER P&L SUMMARY --- */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <SummaryCard 
                title={includeDebts ? "Chiffre d'Affaires (Total)" : "Chiffre d'Affaires (Encaissé)"} 
                value={formatCurrency(effectiveRevenue)} 
                icon={Wallet} 
                iconColor="text-blue-600" 
                bgColor="bg-blue-50"
                subtext={`${filteredInvoices.length} ventes`}
            />
            <SummaryCard 
                title="Marge Brute" 
                value={formatCurrency(grossProfit)} 
                icon={TrendingUp} 
                iconColor="text-emerald-600" 
                bgColor="bg-emerald-50"
                subtext={`Coût: ${formatCurrency(totalCOGS)}`}
            />
            <SummaryCard 
                title="Dépenses" 
                value={`-${formatCurrency(totalExpenses)}`} 
                icon={TrendingDown} 
                iconColor="text-red-600" 
                bgColor="bg-red-50"
                subtext={`${filteredExpenses.length} sorties`}
            />
            
            {/* Résultat Net (Moved here) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center relative overflow-hidden group">
                <div className={`absolute right-0 top-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20 transition-transform group-hover:scale-110 ${netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium text-gray-500 relative z-10">Résultat Net</p>
                <h3 className={`text-2xl font-bold mt-1 relative z-10 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(netProfit)}
                </h3>
                <p className="text-xs text-gray-400 mt-1 relative z-10">Bénéfice final</p>
            </div>

            {/* Total En Caisse (Moved here) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center relative overflow-hidden group">
                <div className={`absolute right-0 top-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20 transition-transform group-hover:scale-110 ${totalEnCaisse >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                <p className="text-sm font-medium text-gray-500 relative z-10">Total en Caisse</p>
                <h3 className={`text-2xl font-bold mt-1 relative z-10 ${totalEnCaisse >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(totalEnCaisse)}
                </h3>
                <p className="text-xs text-gray-400 mt-1 relative z-10">Cash disponible</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            {/* --- SALES LIST --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1 h-4 bg-farm-500 rounded-full"></div>
                        Détail des Ventes
                      </h3>
                      <select 
                          className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-farm-400 transition-colors"
                          value={salesStatusFilter}
                          onChange={e => setSalesStatusFilter(e.target.value)}
                      >
                          <option value="all">Tous les statuts</option>
                          <option value="paye">Payé</option>
                          <option value="impaye">Impayé / Partiel</option>
                      </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                          type="text" 
                          placeholder="Chercher un client..." 
                          className="w-full sm:flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 dark:focus:ring-farm-900 transition-all"
                          value={salesSearchTerm}
                          onChange={e => setSalesSearchTerm(e.target.value)}
                      />
                      <input 
                          type="date" 
                          className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 dark:focus:ring-farm-900 transition-all"
                          value={salesDateFilter}
                          onChange={e => setSalesDateFilter(e.target.value)}
                      />
                  </div>
              </div>
              
              <div className="overflow-y-auto overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Boutique</th>
                          <th className="px-6 py-4 text-right">Total</th>
                          <th className="px-6 py-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {paginatedInvoices.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                                <div className="flex flex-col items-center justify-center py-4">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                      <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p>Aucune vente trouvée.</p>
                                </div>
                              </td>
                          </tr>
                        ) : (
                          paginatedInvoices.map(inv => (
                              <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                  {new Date(inv.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-gray-900 dark:text-white">{inv.customerName}</div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">#{inv.id.slice(-6)}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                        {inv.boutique || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white font-mono">
                                  {formatCurrency(inv.total)}
                                  {inv.status !== 'PAYÉ' && (
                                    <div 
                                      className="text-[10px] text-rose-500 hover:text-rose-600 mt-1 cursor-pointer hover:underline transition-colors flex items-center justify-end gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRecoveringInvoice(inv);
                                      }}
                                    >
                                      <span>Reste: {formatCurrency(inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0))}</span>
                                      <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                                        inv.status === 'PAYÉ' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 
                                        inv.status === 'PARTIEL' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}>
                                        {inv.status === 'PAYÉ' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                        {inv.status}
                                    </span>
                                </td>
                              </tr>
                          ))
                        )}
                    </tbody>
                  </table>
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <Pagination 
                  currentPage={salesPage}
                  totalPages={Math.ceil(filteredInvoices.length / itemsPerPage)}
                  onPageChange={setSalesPage}
                />
              </div>
            </div>

            {/* --- EXPENSE LIST --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                        Détail des Dépenses
                      </h3>
                      <div className="flex items-center gap-2">
                        <select 
                            className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-farm-400 transition-colors"
                            value={expenseCategoryFilter}
                            onChange={e => setExpenseCategoryFilter(e.target.value)}
                        >
                            <option value="all">Toutes catégories</option>
                            <option value="ELECTRICITE">Electricité</option>
                            <option value="EAU">Eau</option>
                            <option value="SALAIRE">Salaire</option>
                            <option value="INTERNET">Internet</option>
                            <option value="RATION">Rations</option>
                            <option value="DIVERS">Divers</option>
                        </select>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                          type="text" 
                          placeholder="Chercher un motif..." 
                          className="w-full sm:flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 dark:focus:ring-farm-900 transition-all"
                          value={expenseSearchTerm}
                          onChange={e => setExpenseSearchTerm(e.target.value)}
                      />
                      <input 
                          type="date" 
                          className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-2 rounded-lg outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100 dark:focus:ring-farm-900 transition-all"
                          value={expenseDateFilter}
                          onChange={e => setExpenseDateFilter(e.target.value)}
                      />
                  </div>
              </div>
              
              <div className="overflow-y-auto overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Catégorie</th>
                          <th className="px-6 py-4">Motif</th>
                          <th className="px-6 py-4">Boutique</th>
                          <th className="px-6 py-4 text-right">Montant</th>
                          <th className="px-6 py-4 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {paginatedExpenses.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                                <div className="flex flex-col items-center justify-center py-4">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                      <Coins className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p>Aucune dépense trouvée.</p>
                                </div>
                              </td>
                          </tr>
                        ) : (
                          paginatedExpenses.map(exp => (
                              <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                  {new Date(exp.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                      {exp.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{exp.description}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                        {exp.boutique || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400 font-mono">-{formatCurrency(exp.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                              </tr>
                          ))
                        )}
                    </tbody>
                  </table>
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <Pagination 
                  currentPage={expensesPage}
                  totalPages={Math.ceil(filteredExpenses.length / itemsPerPage)}
                  onPageChange={setExpensesPage}
                />
              </div>
            </div>
          </div>
      </>
      ) : activeTab === 'transfers' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 overflow-hidden flex flex-col min-h-[600px]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                    Mouvements de Stock Validés
                </h3>
                <div className="text-xs text-gray-500">
                    {filteredTransfers.length} transferts trouvés
                </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Référence</th>
                            <th className="px-6 py-4">Source → Destination</th>
                            <th className="px-6 py-4">Articles</th>
                            <th className="px-6 py-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {paginatedTransfers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                            <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                        </div>
                                        <p>Aucun transfert validé trouvé.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedTransfers.map(tr => (
                                <tr key={tr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                        {new Date(tr.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                        {tr.reference}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                {boutiques.find(b => b.id === tr.sourceBoutique)?.name || tr.sourceBoutique}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-gray-400" />
                                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 font-bold">
                                                {boutiques.find(b => b.id === tr.destinationBoutique)?.name || tr.destinationBoutique}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {tr.items.map((item, idx) => (
                                                <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                                                    <span>{item.unit}</span>
                                                    <span className="text-gray-400">of</span>
                                                    <span className="font-medium">{item.productName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Validé
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <Pagination 
                    currentPage={transfersPage}
                    totalPages={Math.ceil(filteredTransfers.length / itemsPerPage)}
                    onPageChange={setTransfersPage}
                />
            </div>
        </div>
      ) : (
      <>
        {/* --- CLEANER DEBT DASHBOARD --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <SummaryCard 
                title="Crédits Clients" 
                value={formatCurrency(totalUnpaidDebts)} 
                icon={AlertCircle} 
                iconColor="text-red-600"
                bgColor="bg-red-50"
                subtext={`${unpaidInvoices.length} factures en attente`}
            />
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-500">Taux de Recouvrement</p>
                <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                        {recoveryRate.toFixed(1)}%
                    </h3>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-farm-500" style={{ width: `${recoveryRate}%` }}></div>
                </div>
            </div>
        </div>

        {/* --- UNPAID INVOICES LIST --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
               <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Factures Impayées</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-3 font-medium">Client</th>
                            <th className="px-6 py-3 font-medium">Facture</th>
                            <th className="px-6 py-3 font-medium text-right">Montant Total</th>
                            <th className="px-6 py-3 font-medium text-right">Déjà Payé</th>
                            <th className="px-6 py-3 font-medium text-right">Reste</th>
                            <th className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {unpaidInvoices.length === 0 ? (
                           <tr>
                               <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                   <div className="flex flex-col items-center">
                                       <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-2" />
                                       <span className="text-sm">Tous vos clients sont à jour.</span>
                                   </div>
                               </td>
                           </tr>
                        ) : (
                           unpaidInvoices.map(inv => (
                               <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                   <td className="px-6 py-4">
                                       <div className="font-bold text-gray-900">{inv.customerName}</div>
                                       <div className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString()}</div>
                                   </td>
                                   <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                       {inv.id}
                                   </td>
                                   <td className="px-6 py-4 text-right text-gray-600 font-medium">{formatCurrency(inv.total)}</td>
                                   <td className="px-6 py-4 text-right text-green-600">{formatCurrency(inv.amountPaid)}</td>
                                   <td className="px-6 py-4 text-right">
                                       <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold text-xs">
                                           {formatCurrency(inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0)))}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                       <button 
                                          onClick={() => openRecoveryModal(inv)}
                                          className="text-farm-600 hover:text-farm-700 font-medium text-xs border border-farm-200 hover:border-farm-400 px-3 py-1.5 rounded-lg transition-all"
                                       >
                                          Encaisser
                                       </button>
                                   </td>
                               </tr>
                           ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </>
      )}

      {/* --- EXPENSE MODAL --- */}
      {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nouvelle Dépense</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enregistrer une sortie de caisse</p>
                      </div>
                      <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             Montant de la Dépense (FCFA)
                          </label>
                          <input 
                              type="number" 
                              value={newExpense.amount || ''}
                              onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                              className="w-full text-center text-3xl font-black text-slate-900 bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 outline-none focus:border-red-500 focus:bg-white transition-all font-mono"
                              placeholder="0"
                              autoFocus
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Catégorie</label>
                          <select 
                              value={newExpense.category}
                              onChange={e => {
                                  const cat = e.target.value as any;
                                  let empId = newExpense.employeeId || '';
                                  let amt = newExpense.amount || 0;
                                  let btq = newExpense.boutique || '';
                                  
                                  if ((cat === 'SALAIRE' || cat === 'RATION') && !empId && employees && employees.length > 0) {
                                      // Default to first employee
                                      const defaultEmp = employees[0];
                                      empId = defaultEmp.id;
                                      amt = cat === 'SALAIRE' ? (defaultEmp.salary || 0) : (defaultEmp.ration || 0);
                                      if (defaultEmp.assignedBoutique && defaultEmp.assignedBoutique !== 'Toutes') {
                                          const matchBoutique = boutiques.find(b => b.id === defaultEmp.assignedBoutique || b.name === defaultEmp.assignedBoutique);
                                          if (matchBoutique) {
                                              btq = matchBoutique.id;
                                          }
                                      }
                                  } else if (cat === 'SALAIRE' || cat === 'RATION') {
                                      const emp = employees?.find(emp => emp.id === empId);
                                      if (emp) {
                                          amt = cat === 'SALAIRE' ? (emp.salary || 0) : (emp.ration || 0);
                                      }
                                  }
                                  setNewExpense({
                                      ...newExpense,
                                      category: cat,
                                      employeeId: empId,
                                      amount: amt,
                                      boutique: btq
                                  });
                              }}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-red-500 focus:bg-white transition-all text-slate-700 font-bold"
                          >
                              <option value="ELECTRICITE">Electricité</option>
                              <option value="EAU">Eau</option>
                              <option value="SALAIRE">Salaire</option>
                              <option value="INTERNET">Internet</option>
                              <option value="RATION">Rations</option>
                              <option value="DIVERS">Divers</option>
                              <option value="AUTRE">Autre</option>
                          </select>
                      </div>
                      {(newExpense.category === 'SALAIRE' || newExpense.category === 'RATION') && (
                          <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Employé</label>
                              <select 
                                  value={newExpense.employeeId || ''}
                                  onChange={e => {
                                      const empId = e.target.value;
                                      const emp = employees?.find(emp => emp.id === empId);
                                      let updatedAmount = newExpense.amount || 0;
                                      let updatedBoutique = newExpense.boutique || '';
                                      if (emp) {
                                          if (newExpense.category === 'SALAIRE') {
                                              updatedAmount = emp.salary || 0;
                                          } else if (newExpense.category === 'RATION') {
                                              updatedAmount = emp.ration || 0;
                                          }
                                          if (emp.assignedBoutique && emp.assignedBoutique !== 'Toutes') {
                                              const matchBoutique = boutiques.find(b => b.id === emp.assignedBoutique || b.name === emp.assignedBoutique);
                                              if (matchBoutique) {
                                                  updatedBoutique = matchBoutique.id;
                                              }
                                          }
                                      }
                                      setNewExpense({
                                          ...newExpense,
                                          employeeId: empId,
                                          amount: updatedAmount,
                                          boutique: updatedBoutique
                                      });
                                  }}
                                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-red-500 focus:bg-white transition-all text-slate-700 font-bold"
                              >
                                  <option value="">-- Sélectionner un employé --</option>
                                  {employees?.map(emp => (
                                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                                  ))}
                              </select>
                          </div>
                      )}
                      {newExpense.category === 'AUTRE' && (
                          <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Motif de la Dépense</label>
                              <input 
                                  type="text" 
                                  value={newExpense.description || ''}
                                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-red-500 focus:bg-white transition-all text-slate-700 font-bold"
                                  placeholder="Ex: Achat de fournitures"
                              />
                          </div>
                      )}
                      {(isSuperOrAdmin || newExpense.category === 'SALAIRE' || newExpense.category === 'RATION') && (
                          <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Boutique</label>
                              <select 
                                  value={newExpense.boutique || ''}
                                  onChange={e => setNewExpense({...newExpense, boutique: e.target.value})}
                                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 outline-none focus:border-red-500 focus:bg-white transition-all text-slate-700 font-bold"
                              >
                                  {boutiques.map(b => (
                                      <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                              </select>
                          </div>
                      )}
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                      <button 
                          onClick={() => setIsExpenseModalOpen(false)}
                          className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                      >
                          Annuler
                      </button>
                      <button 
                          onClick={handleSaveExpense}
                          disabled={isSubmittingExpense}
                          className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                      >
                          {isSubmittingExpense ? 'Enregistrement...' : 'Valider'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- RECOVERY MODAL --- */}
      {recoveringInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Encaisser Paiement</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{recoveringInvoice.customerName} • {recoveringInvoice.id}</p>
                      </div>
                      <button onClick={() => setRecoveringInvoice(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      <div className="flex justify-between items-center p-5 bg-rose-50 rounded-[2rem] border border-rose-100 shadow-inner">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Reste à Payer</span>
                          <span className="text-2xl font-black text-rose-700 tabular-nums">{formatCurrency(recoveringInvoice.total - recoveringInvoice.amountPaid)}</span>
                      </div>

                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Montant du Versement *</label>
                          <div className="relative">
                              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                              <input 
                                  type="number" 
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none transition-all"
                                  value={recoveryAmount}
                                  onChange={e => setRecoveryAmount(e.target.value)}
                                  autoFocus
                                  placeholder="0"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Note / Référence</label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none transition-all"
                              placeholder="Ex: Espèces, Mobile Money..."
                              value={recoveryNote}
                              onChange={e => setRecoveryNote(e.target.value)}
                          />
                      </div>

                      <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => setRecoveringInvoice(null)} 
                            className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={submitRecovery}
                            className="flex-[2] py-4 bg-farm-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-farm-200 hover:bg-farm-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Confirmer
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showConfirmDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                  <div className="p-8 text-center">
                      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <AlertTriangle className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Supprimer la Dépense ?</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">
                          Cette action est irréversible. La dépense sera définitivement retirée de la comptabilité.
                      </p>
                  </div>
                  <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                      <button 
                        onClick={() => setShowConfirmDelete(null)} 
                        className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={confirmDeleteExpense} 
                        className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                      >
                        Supprimer
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// Helper Component for consistent cards
const SummaryCard = ({ title, value, icon: Icon, iconColor, bgColor, subtext }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex items-start justify-between group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-5 transition-transform group-hover:scale-150 ${iconColor.replace('text-', 'bg-')}`}></div>
    <div className="relative z-10">
      <p className="text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      {subtext && <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded-lg border border-gray-100">{subtext}</div>}
    </div>
    <div className={`p-3.5 rounded-2xl ${bgColor} ${iconColor} group-hover:scale-110 transition-transform duration-300 shadow-sm ring-4 ring-white`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);