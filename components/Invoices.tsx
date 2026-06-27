import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Invoice, Payment, Product, Boutique, CartItem, Customer, Provenderie } from '../types';
import { FileText, Calendar, User, Search, X, Printer, Filter, CheckCircle, AlertCircle, Edit, Save, Trash2, CreditCard, Tag, Settings, Store, ChevronDown, AlertTriangle, Plus, Calculator, ShoppingCart, Coins } from 'lucide-react';
import { saveInvoice, voidSaleTransaction, saveProduct, processPaymentRecovery } from '../services/db';
import { useNotifications } from './ui/Notifications';
import { InvoiceTemplate } from './InvoiceTemplate';
import { Pagination } from './Pagination';

interface InvoicesProps {
  invoices: Invoice[];
  products: Product[];
  setProducts?: any; // Deprecated
  onUpdateInvoice: (invoice: Invoice) => void;
  boutiques?: Boutique[];
  provenderies?: Provenderie[];
  companyName?: string;
  userRole?: string;
  userPermissions?: string[];
  userBoutique?: string;
  customers?: Customer[];
  currentProvenderieId?: string;
}

export const Invoices: React.FC<InvoicesProps> = ({ invoices, products, onUpdateInvoice, boutiques = [], provenderies = [], companyName, userRole = 'Admin', userPermissions = [], userBoutique = 'Toutes', customers = [], currentProvenderieId }) => {
  const { notify } = useNotifications();
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  
  const currentProvenderie = provenderies.find(p => p.id === currentProvenderieId);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAdvance, setFilterAdvance] = useState<string>('all');
  const [filterDebt, setFilterDebt] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
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
  const [wholesaleFilter, setWholesaleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const customerDebtsMap = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.status !== 'PAYÉ') {
        const debt = inv.remainingDebt !== undefined ? inv.remainingDebt : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0));
        if (debt > 0) {
          const key = (inv.customerName || '').toLowerCase().trim();
          map[key] = (map[key] || 0) + debt;
        }
      }
    });
    return map;
  }, [invoices]);
  
  // Payment Recovery State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [excessAction, setExcessAction] = useState<'reimbursement' | 'advance'>('advance');
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ customerName: '', description: '' });
  const [editItems, setEditItems] = useState<CartItem[]>([]);
  const [showConfirmVoid, setShowConfirmVoid] = useState(false);

  const getMultiplier = (unit: string) => {
      if (unit === 'Sac 50kg') return 50;
      if (unit === 'Sac 25kg') return 25;
      return 1;
  };

  // Reset edit state when opening a new invoice
  React.useEffect(() => {
      if (selectedInvoice) {
          setEditForm({ 
              customerName: selectedInvoice.customerName, 
              description: selectedInvoice.description || '' 
          });
          setEditItems([...(selectedInvoice.items || [])]);
          setIsEditing(false);
      }
  }, [selectedInvoice]);

  const handleSaveEdit = async () => {
      if (!selectedInvoice) return;
      
      const productsToUpdate: Product[] = [];
      
      for (const originalItem of (selectedInvoice.items || [])) {
          const newItem = editItems.find(i => i.id === originalItem.id && i.selectedVariant?.name === originalItem.selectedVariant?.name && i.unit === originalItem.unit);
          
          const originalQty = originalItem.quantity * getMultiplier(originalItem.unit || 'Détail');
          const newQty = newItem ? newItem.quantity * getMultiplier(newItem.unit || 'Détail') : 0;
          
          const diff = originalQty - newQty;
          
          if (diff !== 0) {
              const product = products.find(p => p.id === originalItem.id);
              if (product) {
                  let updatedP = productsToUpdate.find(p => p.id === product.id) || { ...product };
                  
                  if (originalItem.selectedVariant) {
                      const variantIndex = updatedP.variants?.findIndex(v => v.name === originalItem.selectedVariant?.name);
                      if (variantIndex !== undefined && variantIndex >= 0 && updatedP.variants) {
                          const newVariants = [...updatedP.variants];
                          const boutique = selectedInvoice.boutique || 'Boutique 1';
                          if (boutique === 'Boutique 1') {
                              newVariants[variantIndex] = {
                                  ...newVariants[variantIndex],
                                  stock: (newVariants[variantIndex].stock || 0) + diff
                              };
                          } else {
                              const currentBoutiqueStock = newVariants[variantIndex].boutiqueStock?.[boutique] || 0;
                              newVariants[variantIndex] = {
                                  ...newVariants[variantIndex],
                                  boutiqueStock: {
                                      ...(newVariants[variantIndex].boutiqueStock || {}),
                                      [boutique]: currentBoutiqueStock + diff
                                  }
                              };
                          }
                          updatedP.variants = newVariants;
                      }
                  } else {
                      const boutique = selectedInvoice.boutique || 'Boutique 1';
                      if (boutique === 'Boutique 1') {
                          updatedP.stock = (updatedP.stock || 0) + diff;
                      } else {
                          const currentBoutiqueStock = updatedP.boutiqueStock?.[boutique] || 0;
                          updatedP.boutiqueStock = {
                              ...(updatedP.boutiqueStock || {}),
                              [boutique]: currentBoutiqueStock + diff
                          };
                      }
                  }
                  
                  if (!productsToUpdate.find(p => p.id === updatedP.id)) {
                      productsToUpdate.push(updatedP);
                  } else {
                      Object.assign(productsToUpdate.find(p => p.id === updatedP.id)!, updatedP);
                  }
              }
          }
      }

      const newTotal = editItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (selectedInvoice.serviceCost || 0);
      const newStatus: Invoice['status'] = (selectedInvoice.amountPaid + (selectedInvoice.advanceUsed || 0)) >= newTotal ? 'PAYÉ' : ((selectedInvoice.amountPaid + (selectedInvoice.advanceUsed || 0)) > 0 ? 'PARTIEL' : 'IMPAYÉ');

      const updatedInvoice: Invoice = { 
          ...selectedInvoice, 
          customerName: editForm.customerName, 
          description: editForm.description,
          items: editItems,
          total: newTotal,
          amountPaid: selectedInvoice.amountPaid, // Keep existing amount paid
          advanceUsed: selectedInvoice.advanceUsed,
          reimbursement: selectedInvoice.reimbursement,
          newAdvanceCreated: selectedInvoice.newAdvanceCreated,
          remainingDebt: Math.max(0, newTotal - selectedInvoice.amountPaid - (selectedInvoice.advanceUsed || 0)),
          status: newStatus
      };

      for (const p of productsToUpdate) {
          await saveProduct(p);
      }

      await saveInvoice(updatedInvoice);
      onUpdateInvoice(updatedInvoice);
      setSelectedInvoice(updatedInvoice);
      setIsEditing(false);
      notify("Facture mise à jour", "success");
  };

  const handleReuse = () => {
      if (!selectedInvoice) return;
      localStorage.setItem('cart_draft', JSON.stringify(selectedInvoice.items || []));
      notify("Panier chargé. Veuillez aller à la Caisse.", "success");
  };

  // Filter logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = (inv.id || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (inv.customerName || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'impaye') matchesStatus = inv.status === 'IMPAYÉ' || inv.status === 'PARTIEL';
    if (filterStatus === 'paye') matchesStatus = inv.status === 'PAYÉ';

    let matchesAdvance = true;
    if (filterAdvance === 'used') matchesAdvance = (inv.advanceUsed || 0) > 0;
    if (filterAdvance === 'created') matchesAdvance = (inv.newAdvanceCreated || 0) > 0;

    let matchesDebt = true;
    if (filterDebt === 'hasDebt') matchesDebt = ((inv.remainingDebt || 0) > 0 || Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0)) > 0);

    let matchesDate = true;
    const invDate = new Date(inv.date);
    const now = new Date();
    if (timeRange === 'today') {
        matchesDate = invDate.toDateString() === now.toDateString();
    } else if (timeRange === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0,0,0,0);
        matchesDate = invDate >= startOfWeek;
    } else if (timeRange === 'month') {
        matchesDate = invDate.getMonth() === new Date().getMonth() && invDate.getFullYear() === new Date().getFullYear();
    }

    let matchesSpecificDate = true;
    if (dateFilter) {
        matchesSpecificDate = inv.date.startsWith(dateFilter);
    }

    let matchesBoutique = true;
    if (boutiqueFilter !== 'all') {
        matchesBoutique = inv.boutique === boutiqueFilter;
    }

    let matchesWholesale = true;
    if (wholesaleFilter === 'wholesale') matchesWholesale = inv.isWholesale === true;
    if (wholesaleFilter === 'retail') matchesWholesale = inv.isWholesale !== true;

    return matchesSearch && matchesStatus && matchesAdvance && matchesDebt && matchesDate && matchesSpecificDate && matchesBoutique && matchesWholesale;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleVoidInvoice = async () => {
    if (!selectedInvoice) return;
    setShowConfirmVoid(true);
  };

  const confirmVoidInvoice = async () => {
    if (!selectedInvoice) return;
    try {
        // Calculate restored stock for relevant products
        const productsToRestore = products.map(p => {
            const itemsToRestore = (selectedInvoice.items || []).filter(i => i.id === p.id);
            if (itemsToRestore.length > 0) {
                let updatedP = { ...p };
                itemsToRestore.forEach(item => {
                    const multiplier = getMultiplier(item.unit || 'Détail');
                    const qtyToAddBack = item.quantity * multiplier;

                    if (item.selectedVariant) {
                        const variantIndex = updatedP.variants?.findIndex(v => v.name === item.selectedVariant?.name);
                        if (variantIndex !== undefined && variantIndex >= 0 && updatedP.variants) {
                            const newVariants = [...updatedP.variants];
                            const boutique = selectedInvoice.boutique || (boutiques[0]?.id || 'Boutique 1');
                            if (boutique === 'Boutique 1') {
                                newVariants[variantIndex] = {
                                    ...newVariants[variantIndex],
                                    stock: (newVariants[variantIndex].stock || 0) + qtyToAddBack
                                };
                            } else {
                                const currentBoutiqueStock = newVariants[variantIndex].boutiqueStock?.[boutique] || 0;
                                newVariants[variantIndex] = {
                                    ...newVariants[variantIndex],
                                    boutiqueStock: {
                                        ...(newVariants[variantIndex].boutiqueStock || {}),
                                        [boutique]: currentBoutiqueStock + qtyToAddBack
                                    }
                                };
                            }
                            updatedP.variants = newVariants;
                        }
                    } else {
                        const boutique = selectedInvoice.boutique || (boutiques[0]?.id || 'Boutique 1');
                        if (boutique === 'Boutique 1') {
                            updatedP.stock = (updatedP.stock || 0) + qtyToAddBack;
                        } else {
                            const currentBoutiqueStock = updatedP.boutiqueStock?.[boutique] || 0;
                            updatedP.boutiqueStock = {
                                ...(updatedP.boutiqueStock || {}),
                                [boutique]: currentBoutiqueStock + qtyToAddBack
                            };
                        }
                    }
                });
                return updatedP;
            }
            return p;
        }).filter(p => (selectedInvoice.items || []).some(i => i.id === p.id));

        await voidSaleTransaction(selectedInvoice.id, productsToRestore);
        setSelectedInvoice(null);
        setShowConfirmVoid(false);
        notify("Facture annulée et stock restauré", "info");
    } catch (e) {
        console.error("Error voiding invoice", e);
        notify("Erreur lors de l'annulation.", "error");
    }
  };

  const handleAddPayment = async () => {
      if (!selectedInvoice) return;
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
          notify("Montant invalide", "error");
          return;
      }

      const remaining = selectedInvoice.total - selectedInvoice.amountPaid - (selectedInvoice.advanceUsed || 0);
      // For now, allow paying more than remaining, and handle it
      
      const newPaid = selectedInvoice.amountPaid + amount;
      const newStatus = (newPaid + (selectedInvoice.advanceUsed || 0)) >= selectedInvoice.total - 0.01 ? 'PAYÉ' : 'PARTIEL';
      
      const payment: Payment = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          amount: amount,
          note: paymentNote || 'Règlement'
      };

      let reimbursement = 0;
      let newAdvanceCreated = 0;
      let remainingDebt = Math.max(0, selectedInvoice.total - newPaid - (selectedInvoice.advanceUsed || 0));

      if (newPaid + (selectedInvoice.advanceUsed || 0) > selectedInvoice.total) {
          const excess = newPaid + (selectedInvoice.advanceUsed || 0) - selectedInvoice.total;
          if (excessAction === 'advance') {
              newAdvanceCreated = excess;
              reimbursement = 0;
          } else {
              newAdvanceCreated = 0;
              reimbursement = excess;
          }
      }

      const updatedInvoice: Invoice = {
          ...selectedInvoice,
          amountPaid: newPaid,
          reimbursement: (selectedInvoice.reimbursement || 0) + reimbursement,
          newAdvanceCreated: (selectedInvoice.newAdvanceCreated || 0) + newAdvanceCreated,
          remainingDebt: remainingDebt,
          status: newStatus,
          paymentHistory: [...(selectedInvoice.paymentHistory || []), payment]
      };

      const customer = customers.find(c => c.name === selectedInvoice.customerName);
      await processPaymentRecovery(updatedInvoice, customer, newAdvanceCreated);
      onUpdateInvoice(updatedInvoice);
      setSelectedInvoice(updatedInvoice); // Update local view
      setIsAddingPayment(false);
      setPaymentAmount('');
      setPaymentNote('');
      notify("Paiement enregistré", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full overflow-y-auto pb-20 premium-scrollbar">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
         <div>
            <h2 className="text-2xl font-bold text-gray-900">Factures & Commandes</h2>
            <p className="text-gray-500 text-sm">Historique des ventes et paiements.</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 print:hidden">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-farm-500 text-farm-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Factures
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'customers' ? 'border-farm-500 text-farm-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Comptes Clients
        </button>
      </div>

      {activeTab === 'invoices' ? (
        <>
          <div className="print:hidden space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 sm:gap-4 items-center bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="relative group w-full lg:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors w-4 h-4" />
                 <input 
                    type="text" 
                    placeholder="Client ou Réf..." 
                    className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none w-full transition-all shadow-sm hover:shadow-md"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
             </div>
             
             <div className="relative group w-full sm:w-auto">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors">
                     <Filter className="w-4 h-4" />
                 </div>
                 <select 
                    className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md w-full"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                 >
                     <option value="all">Tous les Statuts</option>
                     <option value="paye">Payé (Factures)</option>
                     <option value="impaye">Impayé / Partiel (Commandes)</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
             </div>

             {canFilterBoutique && (
                 <div className="relative group w-full sm:w-auto">
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors">
                         <Store className="w-4 h-4" />
                     </div>
                     <select 
                        className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md w-full"
                        value={boutiqueFilter}
                        onChange={e => setBoutiqueFilter(e.target.value)}
                     >
                         <option value="all">Toutes les Boutiques</option>
                         {boutiques
                           .filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique)
                           .map(b => (
                             <option key={b.id} value={b.id}>{b.name}</option>
                         ))}
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                 </div>
             )}

             <div className="relative group w-full sm:w-auto">
                 <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors w-4 h-4" />
                 <select 
                    className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md w-full"
                    value={wholesaleFilter}
                    onChange={e => setWholesaleFilter(e.target.value)}
                 >
                     <option value="all">Tous les Prix</option>
                     <option value="retail">Détail</option>
                     <option value="wholesale">Gros</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
             </div>

             <div className="relative group w-full sm:w-auto">
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors w-4 h-4" />
                 <select 
                    className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none appearance-none cursor-pointer transition-all shadow-sm hover:shadow-md w-full"
                    value={timeRange}
                    onChange={e => setTimeRange(e.target.value)}
                 >
                     <option value="all">Période: Tout</option>
                     <option value="today">Aujourd'hui</option>
                     <option value="week">Cette semaine</option>
                     <option value="month">Ce mois</option>
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
             </div>

             <div className="relative group">
                 <input 
                    type="date" 
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-farm-500/10 focus:border-farm-500 outline-none cursor-pointer transition-all shadow-sm hover:shadow-md text-slate-700"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                 />
             </div>
         </div>

      {/* Invoice List */}
      <div className="bg-white rounded-[2rem] shadow-glass border border-gray-100/50 overflow-hidden flex flex-col relative">
          <div className="overflow-x-auto overflow-y-auto flex-1 premium-scrollbar">
             {/* Desktop Table */}
             <table className="w-full text-left text-sm relative min-w-[800px] hidden md:table">
                <thead className="bg-gray-50/90 backdrop-blur-md text-gray-400 uppercase text-[10px] tracking-wider font-display font-bold sticky top-0 z-10 shadow-sm border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Type & Réf</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Boutique</th>
                        <th className="px-6 py-4 text-center">Statut</th>
                        <th className="px-6 py-4 text-right">Total</th>
                        <th className="px-6 py-4 text-right">Versé</th>
                        <th className="px-6 py-4 text-right">Avance Restante</th>
                        <th className="px-6 py-4 text-right">Reste</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {paginatedInvoices.map((inv, idx) => {
                        const remainingAdvance = inv.newAdvanceCreated || 0;
                        return (
                        <tr 
                            key={`${inv.id}-${idx}`} 
                            onClick={() => setSelectedInvoice(inv)}
                            className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                                        inv.status === 'IMPAYÉ' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                    }`}>
                                        {inv.status === 'IMPAYÉ' ? 'COMMANDE' : 'FACTURE'}
                                    </span>
                                    <div className="font-bold text-gray-900 group-hover:text-[var(--color-farm-600)] transition-colors">{inv.id}</div>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">{new Date(inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--color-farm-50)] flex items-center justify-center text-[var(--color-farm-600)] shadow-inner border border-[var(--color-farm-100)]">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-gray-700">{inv.customerName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                    {inv.boutique || 'N/A'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    inv.status === 'PAYÉ' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' :
                                    inv.status === 'PARTIEL' ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm' :
                                    'bg-red-50 text-red-700 border-red-200 shadow-sm'
                                }`}>
                                    {inv.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                {formatCurrency(inv.total)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-600">
                                {formatCurrency(inv.amountPaid)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                                {remainingAdvance > 0 ? (
                                    <div className="text-blue-600 text-[10px] font-bold">{formatCurrency(remainingAdvance)}</div>
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                                {((inv.remainingDebt || 0) > 0 || Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0)) > 0) ? (
                                    <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg border border-red-100">{formatCurrency(inv.remainingDebt || Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0)))}</span>
                                ) : (
                                    <span className="text-gray-300">-</span>
                                )}
                            </td>
                        </tr>
                    )})}
                    {paginatedInvoices.length === 0 && (
                        <tr>
                            <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="font-medium">Aucune facture trouvée pour ces critères.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
             </table>

             {/* Mobile Card List */}
             <div className="md:hidden divide-y divide-gray-100">
                {paginatedInvoices.map((inv, idx) => {
                    const remainingAdvance = inv.newAdvanceCreated || 0;
                    return (
                        <div 
                            key={`${inv.id}-${idx}`} 
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-4 active:bg-gray-50 transition-colors flex flex-col gap-3"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                                            inv.status === 'IMPAYÉ' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                        }`}>
                                            {inv.status === 'IMPAYÉ' ? 'COMMANDE' : 'FACTURE'}
                                        </span>
                                        <span className="font-bold text-gray-900">{inv.id}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium">{new Date(inv.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    inv.status === 'PAYÉ' ? 'bg-emerald-100 text-emerald-700' : 
                                    inv.status === 'PARTIEL' ? 'bg-amber-100 text-amber-700' : 
                                    'bg-rose-100 text-rose-700'
                                }`}>
                                    {inv.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                    <User className="w-3 h-3" />
                                </div>
                                <span className="font-bold text-sm text-gray-700">{inv.customerName}</span>
                                <span className="text-[10px] text-gray-400 ml-auto">{inv.boutique || 'N/A'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Total</span>
                                    <span className="font-bold text-gray-900">{formatCurrency(inv.total)}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Reste</span>
                                    <span className="font-bold text-rose-600">{formatCurrency(inv.total - inv.amountPaid)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
      </div>
      </div>

      {/* Printable Invoice Template */}
      <div className="print-only">
        {selectedInvoice && <InvoiceTemplate invoice={selectedInvoice} boutique={boutiques.find(b => b.id === selectedInvoice.boutique)} provenderie={currentProvenderie} companyName={companyName} />}
      </div>
      </>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-glass border border-gray-100/50 overflow-hidden flex flex-col relative">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Comptes Clients</h3>
            <p className="text-sm text-gray-500">Gérez les dettes et avances de vos clients enregistrés.</p>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 premium-scrollbar">
            <table className="w-full text-left text-sm relative min-w-[800px]">
              <thead className="bg-gray-50/90 backdrop-blur-md text-gray-400 uppercase text-[10px] tracking-wider font-display font-bold sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Téléphone</th>
                  <th className="px-6 py-4 text-right">Dette Restante</th>
                  <th className="px-6 py-4 text-right">Avance Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.filter(c => userBoutique === 'Toutes' || c.boutique === userBoutique || (c.boutique === 'Maison Mère' && userBoutique === 'Boutique 1')).map(customer => (
                  <tr 
                    key={customer.id} 
                    onClick={() => setSelectedCustomer(customer)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-farm-100 text-farm-600 flex items-center justify-center font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900 group-hover:text-farm-600 transition-colors">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">
                      {customer.outstandingDebt > 0 ? `${customer.outstandingDebt.toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      {customer.advanceBalance > 0 ? `${customer.advanceBalance.toLocaleString()} FCFA` : '-'}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Aucun client enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[95vh] border border-white/20">
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-farm-100 text-farm-600 flex items-center justify-center font-bold text-2xl shadow-inner border border-farm-200">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 font-display tracking-tight">{selectedCustomer.name}</h3>
                  <p className="text-slate-500 font-medium mt-1">{selectedCustomer.phone || 'Aucun numéro'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 premium-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Dette Restante</p>
                    <p className="text-2xl font-black text-rose-600">{selectedCustomer.outstandingDebt.toLocaleString()} FCFA</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Avance Disponible</p>
                    <p className="text-2xl font-black text-blue-600">{selectedCustomer.advanceBalance.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              <h4 className="text-xl font-bold text-slate-900 mb-4 font-display">Historique des Factures</h4>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-500">Date & Réf</th>
                      <th className="px-6 py-4 font-bold text-slate-500 text-center">Statut</th>
                      <th className="px-6 py-4 font-bold text-slate-500 text-right">Total</th>
                      <th className="px-6 py-4 font-bold text-slate-500 text-right">Reste / Dette</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.filter(inv => inv.customerName && selectedCustomer.name && inv.customerName.toLowerCase().trim() === selectedCustomer.name.toLowerCase().trim() && (userBoutique === 'Toutes' || inv.boutique === userBoutique)).map(inv => (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedInvoice(inv);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{inv.id}</div>
                          <div className="text-xs text-slate-500">{new Date(inv.date).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              inv.status === 'PAYÉ' ? 'bg-green-50 text-green-700 border-green-200' :
                              inv.status === 'PARTIEL' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-red-50 text-red-700 border-red-200'
                          }`}>
                              {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                          {inv.total.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {((inv.remainingDebt || 0) > 0 || Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0)) > 0) ? (
                              <span className="text-rose-600 font-bold">{Math.max(0, inv.remainingDebt || (inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0))).toLocaleString()} FCFA</span>
                          ) : (
                              <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {invoices.filter(inv => inv.customerName === selectedCustomer.name && (userBoutique === 'Toutes' || inv.boutique === userBoutique)).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          Aucune facture trouvée pour ce client.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[98vh] md:max-h-[95vh] border border-white/20">
              {/* Modal Header */}
              <div className="p-4 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-farm-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  <div className="relative z-10 flex items-center gap-3 md:gap-6">
                      <div className="flex items-center gap-2 md:gap-4">
                          <div className="bg-slate-900 text-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg rotate-3">
                              <FileText className="w-4 h-4 md:w-6 md:h-6" />
                          </div>
                          <div>
                              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                  <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">{selectedInvoice.id}</h3>
                                  <div className="flex gap-1.5">
                                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                          selectedInvoice.status === 'PAYÉ' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                          selectedInvoice.status === 'PARTIEL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                          'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                          {selectedInvoice.status}
                                      </span>
                                      <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                          selectedInvoice.status === 'IMPAYÉ' ? 'bg-amber-500 text-white border-amber-600' : 'bg-blue-500 text-white border-blue-600'
                                      }`}>
                                          {selectedInvoice.status === 'IMPAYÉ' ? 'COMMANDE' : 'FACTURE'}
                                      </span>
                                  </div>
                              </div>
                              <p className="text-[10px] md:text-sm text-slate-500 font-medium flex items-center gap-2 mt-1">
                                  <Calendar className="w-3 h-3 md:w-4 md:h-4 text-farm-500" /> {new Date(selectedInvoice.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                          </div>
                      </div>

                      {(isSuperOrAdmin || userPermissions.includes('invoices')) && (
                          <button 
                              onClick={() => {
                                  if (isEditing) {
                                      setIsEditing(false);
                                  } else {
                                      setEditForm({ 
                                          customerName: selectedInvoice.customerName, 
                                          description: selectedInvoice.description || '' 
                                      });
                                      setEditItems([...(selectedInvoice.items || [])]);
                                      if (selectedInvoice.serviceCost === undefined) {
                                          setSelectedInvoice({ ...selectedInvoice, serviceCost: 0 });
                                      }
                                      setIsEditing(true);
                                  }
                              }}
                              className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all flex items-center gap-1.5 md:gap-2 font-black text-[8px] md:text-[10px] uppercase tracking-widest ${
                                  isEditing 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                  : 'bg-farm-50 text-farm-600 border border-farm-100 hover:bg-farm-100'
                              }`}
                          >
                              {isEditing ? <X className="w-3 h-3 md:w-4 md:h-4" /> : <Edit className="w-3 h-3 md:w-4 md:h-4" />}
                              <span className="hidden sm:inline">{isEditing ? 'Annuler' : 'Modifier'}</span>
                          </button>
                      )}
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 md:p-3 hover:bg-rose-50 hover:text-rose-500 rounded-xl md:rounded-2xl text-slate-400 transition-all hover:rotate-90 relative z-10">
                      <X className="w-5 h-5 md:w-6 md:h-6"/>
                  </button>
              </div>

              {/* Modal Body */}
              <div className="p-0 overflow-y-auto flex-1 premium-scrollbar">
                  <div className="p-4 md:p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-10">
                          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              <div className="bg-slate-50/50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                  <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                                      <User className="w-3 h-3 text-farm-500" /> Informations Client
                                  </p>

                                  <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-farm-600 border border-slate-100">
                                          <User className="w-7 h-7" />
                                      </div>
                                      <div>
                                          {isEditing ? (
                                              <input 
                                                  type="text"
                                                  value={editForm.customerName}
                                                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                                                  className="text-xl font-black text-slate-900 leading-tight bg-white border border-slate-200 rounded-xl px-3 py-1 w-full focus:ring-2 focus:ring-farm-500 outline-none"
                                              />
                                          ) : (
                                              <p className="text-xl font-black text-slate-900 leading-tight">{selectedInvoice.customerName}</p>
                                          )}
                                          <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">{selectedInvoice.boutique || 'Maison Mère'}</p>
                                      </div>
                                  </div>
                                  {isEditing ? (
                                      <div className="mt-4">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Description / Note</p>
                                          <textarea 
                                              value={editForm.description}
                                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-farm-500 outline-none min-h-[80px]"
                                              placeholder="Note sur la facture..."
                                          />
                                      </div>
                                  ) : selectedInvoice.description && (
                                      <div className="mt-4 p-3 bg-white/50 rounded-xl border border-slate-100">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Note</p>
                                          <p className="text-xs text-slate-600 italic">"{selectedInvoice.description}"</p>
                                      </div>
                                  )}
                              </div>
                              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                      <Calculator className="w-3 h-3 text-farm-500" /> Détails Financiers
                                  </p>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Facture</p>
                                          <p className="text-lg font-black text-slate-900">{selectedInvoice.total.toLocaleString()} F</p>
                                      </div>
                                      <div>
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant Versé</p>
                                          <p className="text-lg font-black text-emerald-600">{(selectedInvoice.amountPaid || 0).toLocaleString()} F</p>
                                      </div>
                                      {selectedInvoice.reimbursement > 0 && (
                                          <div>
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monnaie Rendue</p>
                                              <p className="text-lg font-black text-slate-600">{(selectedInvoice.reimbursement || 0).toLocaleString()} F</p>
                                          </div>
                                      )}
                                      {selectedInvoice.newAdvanceCreated > 0 && (
                                          <div>
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant Épargné</p>
                                              <p className="text-lg font-black text-blue-600">{(selectedInvoice.newAdvanceCreated || 0).toLocaleString()} F</p>
                                          </div>
                                      )}
                                      {selectedInvoice.debtPaid !== undefined && selectedInvoice.debtPaid > 0 && (
                                          <div>
                                              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Dette Réglée</p>
                                              <p className="text-lg font-black text-rose-600">{(selectedInvoice.debtPaid || 0).toLocaleString()} F</p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:scale-150"></div>
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 relative z-10">Reste à Payer</p>
                              <div className="relative z-10">
                                  <p className="text-4xl font-black text-white mb-2">
                                      {Math.max(0, selectedInvoice.remainingDebt || (selectedInvoice.total - (selectedInvoice.amountPaid || 0) - (selectedInvoice.advanceUsed || 0))).toLocaleString()} <span className="text-lg text-white/60">F</span>
                                  </p>
                                  <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${selectedInvoice.remainingDebt === 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`}></div>
                                          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                                              {selectedInvoice.remainingDebt === 0 ? 'Solde réglé' : 'Paiement en attente'}
                                          </p>
                                      </div>
                                      {!isEditing && selectedInvoice.status !== 'PAYÉ' && !isAddingPayment && (
                                          <button 
                                              onClick={() => setIsAddingPayment(true)}
                                              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2"
                                          >
                                              <Plus className="w-3 h-3" /> Régler
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      {isAddingPayment && (
                          <div className="lg:col-span-3 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-farm-500 shadow-xl shadow-farm-100/50 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-farm-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                              <div className="relative z-10">
                                  <div className="flex justify-between items-center mb-8">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-farm-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-farm-200">
                                              <CreditCard className="w-6 h-6" />
                                          </div>
                                          <div>
                                              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Enregistrer un Paiement</h4>
                                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Saisissez les détails du règlement</p>
                                          </div>
                                      </div>
                                      <button onClick={() => setIsAddingPayment(false)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-rose-500 active:scale-95">
                                          <X className="w-6 h-6" />
                                      </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Montant à Encaisser *</label>
                                          <div className="relative group">
                                              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors">
                                                  <Coins className="w-6 h-6" />
                                              </div>
                                              <input 
                                                  type="number"
                                                  value={paymentAmount}
                                                  onChange={e => setPaymentAmount(e.target.value)}
                                                  className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-2xl font-black text-slate-900 focus:ring-8 focus:ring-farm-500/5 focus:border-farm-500 outline-none transition-all shadow-sm"
                                                  placeholder="0"
                                                  autoFocus
                                              />
                                          </div>
                                          <div className="flex justify-between items-center mt-3 px-2">
                                              <div className="flex flex-col">
                                                  <div className="flex items-center gap-2">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reste: {Math.max(0, selectedInvoice.remainingDebt || (selectedInvoice.total - (selectedInvoice.amountPaid || 0) - (selectedInvoice.advanceUsed || 0))).toLocaleString()} F</span>
                                                  </div>
                                                  {(parseFloat(paymentAmount) || 0) > (selectedInvoice.remainingDebt || (selectedInvoice.total - (selectedInvoice.amountPaid || 0) - (selectedInvoice.advanceUsed || 0))) && (
                                                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">
                                                          Monnaie à rendre: {(((parseFloat(paymentAmount) || 0) - (selectedInvoice.remainingDebt || (selectedInvoice.total - (selectedInvoice.amountPaid || 0) - (selectedInvoice.advanceUsed || 0))))).toLocaleString()} F
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Note / Référence</label>
                                          <div className="relative group">
                                              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-farm-500 transition-colors">
                                                  <Tag className="w-5 h-5" />
                                              </div>
                                              <input 
                                                  type="text"
                                                  value={paymentNote}
                                                  onChange={e => setPaymentNote(e.target.value)}
                                                  className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 focus:ring-8 focus:ring-farm-500/5 focus:border-farm-500 outline-none transition-all shadow-sm"
                                                  placeholder="Ex: Espèces, Chèque N°..."
                                              />
                                          </div>
                                      </div>

                                      {parseFloat(paymentAmount) > (selectedInvoice.total - selectedInvoice.amountPaid - (selectedInvoice.advanceUsed || 0)) && (
                                          <div className="space-y-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                                              <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] block">Action pour le surplus</label>
                                              <div className="flex gap-4">
                                                  <button
                                                      onClick={() => setExcessAction('advance')}
                                                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${excessAction === 'advance' ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-600 border border-amber-200'}`}
                                                  >
                                                      Garder en Avance
                                                  </button>
                                                  <button
                                                      onClick={() => setExcessAction('reimbursement')}
                                                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${excessAction === 'reimbursement' ? 'bg-amber-600 text-white shadow-lg' : 'bg-white text-amber-600 border border-amber-200'}`}
                                                  >
                                                      Rembourser
                                                  </button>
                                              </div>
                                          </div>
                                      )}
                                  </div>

                                  <div className="flex gap-4 mt-10">
                                      <button 
                                          onClick={() => setIsAddingPayment(false)}
                                          className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white hover:shadow-md transition-all active:scale-95 border border-transparent hover:border-slate-100"
                                      >
                                          Annuler
                                      </button>
                                      <button 
                                          onClick={handleAddPayment}
                                          className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                                      >
                                          <CheckCircle className="w-5 h-5 text-emerald-400" /> Confirmer le Paiement
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}

                      <div className="space-y-8">
                          <div>
                              <div className="flex justify-between items-center mb-6">
                                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                                      <ShoppingCart className="w-5 h-5 text-farm-500" /> Articles Commandés
                                  </h4>
                                  <div className="h-px flex-1 bg-slate-100 mx-6 hidden md:block"></div>
                                  <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                      {(selectedInvoice.items || []).length} Références
                                  </span>
                              </div>
                              <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-slate-50/50 border-b border-slate-100">
                                          <tr>
                                              <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Désignation</th>
                                              <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Quantité</th>
                                              <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Prix Unitaire</th>
                                              <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Total</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                          {(isEditing ? editItems : (selectedInvoice.items || [])).map((item, idx) => (
                                              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                  <td className="px-8 py-5">
                                                      <div className="font-bold text-slate-900">{item.name}</div>
                                                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{item.selectedVariant?.name || item.unit || 'Standard'}</div>
                                                  </td>
                                                  <td className="px-8 py-5 text-center">
                                                      {isEditing ? (
                                                          <div className="flex items-center justify-center gap-2">
                                                              <input 
                                                                  type="number"
                                                                  value={item.quantity}
                                                                  onChange={(e) => {
                                                                      const newItems = [...editItems];
                                                                      newItems[idx] = { ...newItems[idx], quantity: parseFloat(e.target.value) || 0 };
                                                                      setEditItems(newItems);
                                                                  }}
                                                                  className="w-20 px-3 py-1 rounded-xl border border-slate-200 text-center font-black text-xs outline-none focus:ring-2 focus:ring-farm-500"
                                                              />
                                                          </div>
                                                      ) : (
                                                          <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-black text-xs">
                                                              {item.quantity}
                                                          </span>
                                                      )}
                                                  </td>
                                                  <td className="px-8 py-5 text-right font-mono font-bold text-slate-600">
                                                      {item.price.toLocaleString()} F
                                                  </td>
                                                  <td className="px-8 py-5 text-right font-mono font-black text-slate-900">
                                                      {(item.price * item.quantity).toLocaleString()} F
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                      <tfoot className="bg-slate-50">
                                          {(isEditing || (selectedInvoice.serviceCost !== undefined && selectedInvoice.serviceCost > 0)) && (
                                              <tr className="border-t border-slate-100">
                                                  <td colSpan={3} className="px-8 py-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Frais de Service / Livraison</td>
                                                  <td className="px-8 py-4 text-right">
                                                      {isEditing ? (
                                                          <div className="flex items-center justify-end gap-2">
                                                              <input 
                                                                  type="number"
                                                                  value={selectedInvoice.serviceCost || 0}
                                                                  onChange={(e) => {
                                                                      setSelectedInvoice({
                                                                          ...selectedInvoice,
                                                                          serviceCost: parseFloat(e.target.value) || 0
                                                                      });
                                                                  }}
                                                                  className="w-32 px-4 py-2 rounded-xl border border-slate-200 text-right font-black text-sm outline-none focus:ring-2 focus:ring-farm-500"
                                                              />
                                                              <span className="text-slate-400 font-bold">F</span>
                                                          </div>
                                                      ) : (
                                                          <span className="font-mono font-bold text-slate-900">{(selectedInvoice.serviceCost || 0).toLocaleString()} F</span>
                                                      )}
                                                  </td>
                                              </tr>
                                          )}
                                          <tr className="bg-slate-900 text-white">
                                              <td colSpan={3} className="px-8 py-6 font-black uppercase tracking-[0.2em] text-xs text-white/60">Total Général</td>
                                              <td className="px-8 py-6 text-right font-mono text-2xl font-black">
                                                  {(isEditing 
                                                      ? editItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (selectedInvoice.serviceCost || 0)
                                                      : selectedInvoice.total
                                                  ).toLocaleString()} F
                                              </td>
                                          </tr>
                                      </tfoot>
                                  </table>
                              </div>
                          </div>

                          {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 && (
                              <div>
                                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                                      <Calculator className="w-5 h-5 text-farm-500" /> Historique des Paiements
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {selectedInvoice.paymentHistory.map((p, idx) => (
                                          <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-farm-200 transition-all">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                      <CheckCircle className="w-5 h-5" />
                                                  </div>
                                                  <div>
                                                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-0.5">{new Date(p.date).toLocaleDateString('fr-FR')}</p>
                                                      <p className="font-black text-slate-900">{p.amount.toLocaleString()} F</p>
                                                  </div>
                                              </div>
                                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{p.note}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-8 border-t border-gray-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center relative z-10">
                  <div className="flex gap-3">
                      {isEditing ? (
                          <button 
                              onClick={handleSaveEdit}
                              className="px-10 py-4 bg-farm-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-farm-700 shadow-lg shadow-farm-200 transition-all active:scale-95 flex items-center gap-3"
                          >
                              <Save className="w-4 h-4" /> Enregistrer les Modifications
                          </button>
                      ) : (
                          <>
                              <button 
                                  onClick={() => window.print()}
                                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-3"
                              >
                                  <Printer className="w-4 h-4" /> Imprimer
                              </button>
                              {(isSuperOrAdmin || userPermissions.includes('reports')) && (
                                  <button 
                                      onClick={() => setShowConfirmVoid(true)}
                                      className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 border border-rose-100 transition-all active:scale-95 flex items-center gap-3"
                                  >
                                      <Trash2 className="w-4 h-4" /> Annuler
                                  </button>
                              )}
                          </>
                      )}
                  </div>
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => {
                              setSelectedInvoice(null);
                              setIsEditing(false);
                              setIsAddingPayment(false);
                          }}
                          className="px-8 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 border border-slate-200 transition-all active:scale-95"
                      >
                          Fermer
                      </button>
                  </div>
              </div>
          </div>
      </div>,
      document.body
      )}

      {/* Confirm Void Modal */}
      {showConfirmVoid && createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-gray-900">Annuler la facture ?</h3>
              </div>
              <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir annuler cette facture ? Le stock des articles sera restauré.</p>
              <div className="flex gap-3">
                  <button onClick={() => setShowConfirmVoid(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Non, garder</button>
                  <button onClick={confirmVoidInvoice} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Oui, annuler</button>
              </div>
          </div>
      </div>,
      document.body
      )}

    </div>
  );
};