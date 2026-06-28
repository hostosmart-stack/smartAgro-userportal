import React, { useMemo, useState } from 'react';
import { Product, Invoice, Category, Boutique } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Package, AlertCircle, ArrowUp, ArrowDown, Wallet, Info, Filter, PieChart as PieIcon, Calendar, Lightbulb, BarChart3, Store, FileText } from 'lucide-react';

interface AnalyticsProps {
  products: Product[];
  invoices: Invoice[];
  boutiques?: Boutique[];
  userRole?: string;
  userBoutique?: string;
  categories?: string[];
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

export const Analytics: React.FC<AnalyticsProps> = ({ products, invoices, boutiques = [], userRole = 'Admin', userBoutique = 'Toutes', categories = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory'>('overview');
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
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

  const mainBoutiqueId = boutiques[0]?.id || 'Boutique 1';

  const isSameBoutique = (b1: string, b2: string) => {
    if (b1 === b2) return true;
    const isB1Main = b1 === 'Boutique 1' || b1 === mainBoutiqueId;
    const isB2Main = b2 === 'Boutique 1' || b2 === mainBoutiqueId;
    return isB1Main && isB2Main;
  };

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

  const filteredInvoices = useMemo(() => invoices.filter(inv => {
      if (!isDateInRange(inv.date)) return false;
      if (boutiqueFilter !== 'all' && !isSameBoutique(inv.boutique || 'Boutique 1', boutiqueFilter)) return false;
      return true;
  }), [invoices, timeRange, boutiqueFilter, mainBoutiqueId]);

  // Filter Products based on Category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Tous') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  // --- Calculations ---
  
  // Helper to get stock and values for a product based on variants and boutique filter
  const getProductMetrics = (p: Product) => {
    let stock = 0;
    let costValue = 0;
    let sellValue = 0;
    const isMain = isSameBoutique(boutiqueFilter, mainBoutiqueId);
    
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        const vStock = boutiqueFilter === 'all' 
          ? (v.stock || 0) + Object.values(v.boutiqueStock || {}).reduce((a, b) => a + b, 0)
          : (isMain ? (v.stock || 0) : (v.boutiqueStock?.[boutiqueFilter] || 0));
        stock += vStock;
        costValue += vStock * getProductCostPrice(p, v.name, products);
        sellValue += vStock * (v.price || p.price);
      });
    } else {
      const pStock = boutiqueFilter === 'all'
        ? p.stock + Object.values(p.boutiqueStock || {}).reduce((a, b) => a + b, 0)
        : (isMain ? p.stock : (p.boutiqueStock?.[boutiqueFilter] || 0));
      stock = pStock;
      costValue = pStock * getProductCostPrice(p, null, products);
      sellValue = pStock * p.price;
    }

    return { stock, costValue, sellValue };
  };

  // Inventory Value (Always current snapshop of stock, not time dependent)
  const totalInventoryValueCost = useMemo(() => 
    filteredProducts.reduce((acc, p) => acc + getProductMetrics(p).costValue, 0), [filteredProducts, boutiqueFilter]);
    
  const totalInventoryValueSell = useMemo(() => 
    filteredProducts.reduce((acc, p) => acc + getProductMetrics(p).sellValue, 0), [filteredProducts, boutiqueFilter]);

  const potentialProfit = totalInventoryValueSell - totalInventoryValueCost;

  // Margin Analysis per Product (Profit Tab)
  const productMargins = useMemo(() => {
    const list: any[] = [];
    
    filteredProducts.forEach(p => {
      const metrics = getProductMetrics(p);

      if (p.variants && p.variants.length > 0) {
        const isMain = isSameBoutique(boutiqueFilter, mainBoutiqueId);
        p.variants.forEach(v => {
          const vStock = boutiqueFilter === 'all' 
            ? (v.stock || 0) + Object.values(v.boutiqueStock || {}).reduce((a, b) => a + b, 0)
            : (isMain ? (v.stock || 0) : (v.boutiqueStock?.[boutiqueFilter] || 0));

          // Calculate sold quantity for this specific variant
          const soldQty = filteredInvoices.reduce((acc, inv) => {
             const items = (inv.items || []).filter(i => i.id === p.id && i.selectedVariant?.name === v.name);
             return acc + items.reduce((sum, item) => sum + item.quantity, 0);
          }, 0);

          // Calculate profit realized for this specific variant
          const realizedProfit = filteredInvoices.reduce((acc, inv) => {
             const items = (inv.items || []).filter(i => i.id === p.id && i.selectedVariant?.name === v.name);
             return acc + items.reduce((sum, item) => {
                 const cost = item.selectedVariant?.costPrice || getProductCostPrice(p, v.name, products);
                 const price = item.price;
                 return sum + (item.quantity * (price - cost));
             }, 0);
          }, 0);

          const price = v.price || p.price;
          const cost = getProductCostPrice(p, v.name, products);

          list.push({
            name: p.name,
            variantName: v.name,
            isVariant: true,
            cost: cost,
            price: price,
            margin: price - cost,
            marginPercent: cost ? ((price - cost) / cost) * 100 : 100,
            stock: vStock,
            unit: p.unit,
            totalProjectedProfit: realizedProfit,
            soldQty: soldQty,
            category: p.category
          });
        });

        // Check if there are Sales of this product WITHOUT a registered variant matching
        const soldQtyWithoutRegisteredVar = filteredInvoices.reduce((acc, inv) => {
          const items = (inv.items || []).filter(i => {
            if (i.id !== p.id) return false;
            const hasMatchedVar = p.variants?.some(v => v.name === i.selectedVariant?.name);
            return !i.selectedVariant || !hasMatchedVar;
          });
          return acc + items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        if (soldQtyWithoutRegisteredVar > 0) {
          const realizedProfitWithoutRegisteredVar = filteredInvoices.reduce((acc, inv) => {
            const items = (inv.items || []).filter(i => {
              if (i.id !== p.id) return false;
              const hasMatchedVar = p.variants?.some(v => v.name === i.selectedVariant?.name);
              return !i.selectedVariant || !hasMatchedVar;
            });
            return acc + items.reduce((sum, item) => {
              const cost = item.selectedVariant?.costPrice || getProductCostPrice(p, item.selectedVariant?.name, products);
              const price = item.price;
              return sum + (item.quantity * (price - cost));
            }, 0);
          }, 0);

          const isMain = isSameBoutique(boutiqueFilter, mainBoutiqueId);
          const baseStock = boutiqueFilter === 'all'
            ? p.stock + Object.values(p.boutiqueStock || {}).reduce((a, b) => a + b, 0)
            : (isMain ? p.stock : (p.boutiqueStock?.[boutiqueFilter] || 0));

          const baseCost = getProductCostPrice(p, null, products);

          list.push({
            name: p.name,
            variantName: 'Sans variante',
            isVariant: true,
            cost: baseCost,
            price: p.price,
            margin: p.price - baseCost,
            marginPercent: baseCost ? ((p.price - baseCost) / baseCost) * 100 : 100,
            stock: baseStock,
            unit: p.unit,
            totalProjectedProfit: realizedProfitWithoutRegisteredVar,
            soldQty: soldQtyWithoutRegisteredVar,
            category: p.category
          });
        }

      } else {
        // Product has NO variants
        const soldQty = filteredInvoices.reduce((acc, inv) => {
            const items = (inv.items || []).filter(i => i.id === p.id);
            return acc + items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        const realizedProfit = filteredInvoices.reduce((acc, inv) => {
            const items = (inv.items || []).filter(i => i.id === p.id);
            return acc + items.reduce((sum, item) => {
                const cost = item.selectedVariant?.costPrice || getProductCostPrice(p, item.selectedVariant?.name, products);
                const price = item.price;
                return sum + (item.quantity * (price - cost));
            }, 0);
        }, 0);

        const baseCost = getProductCostPrice(p, null, products);

        list.push({
          name: p.name,
          variantName: null,
          isVariant: false,
          cost: baseCost,
          price: p.price,
          margin: p.price - baseCost,
          marginPercent: baseCost ? ((p.price - baseCost) / baseCost) * 100 : 100,
          stock: metrics.stock,
          unit: p.unit,
          totalProjectedProfit: realizedProfit,
          soldQty: soldQty,
          category: p.category
        });
      }
    });

    return list.sort((a, b) => b.totalProjectedProfit - a.totalProjectedProfit);
  }, [filteredProducts, filteredInvoices, boutiqueFilter]);

  // Stock Valuation Analysis (Inventory Tab)
  const stockValuation = useMemo(() => {
    const list: any[] = [];
    const isMain = isSameBoutique(boutiqueFilter, mainBoutiqueId);
    filteredProducts.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          const vStock = boutiqueFilter === 'all' 
            ? (v.stock || 0) + Object.values(v.boutiqueStock || {}).reduce((a, b) => a + b, 0)
            : (isMain ? (v.stock || 0) : (v.boutiqueStock?.[boutiqueFilter] || 0));
          const unitCost = getProductCostPrice(p, v.name, products);
          const totalValue = vStock * unitCost;
          list.push({
            name: p.name,
            variantName: v.name,
            isVariant: true,
            stock: vStock,
            unit: p.unit,
            unitCost: unitCost,
            totalValue: totalValue,
            category: p.category
          });
        });
      } else {
        const pStock = boutiqueFilter === 'all'
          ? p.stock + Object.values(p.boutiqueStock || {}).reduce((a, b) => a + b, 0)
          : (isMain ? p.stock : (p.boutiqueStock?.[boutiqueFilter] || 0));
        const unitCost = getProductCostPrice(p, null, products);
        const totalValue = pStock * unitCost;
        list.push({
          name: p.name,
          variantName: null,
          isVariant: false,
          stock: pStock,
          unit: p.unit,
          unitCost: unitCost,
          totalValue: totalValue,
          category: p.category
        });
      }
    });
    return list.sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredProducts, boutiqueFilter]);

  // Pie Chart Data: Value by Category
  const stockValueByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    filteredProducts.forEach(p => {
        data[p.category] = (data[p.category] || 0) + getProductMetrics(p).costValue;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] })).filter(d => d.value > 0);
  }, [filteredProducts, boutiqueFilter]);

  // Pie Chart Data: Profit by Product
  const profitByProduct = useMemo(() => {
     return productMargins.filter(p => p.totalProjectedProfit > 0).slice(0, 6).map(p => ({
         name: p.variantName ? `${p.name} (${p.variantName})` : p.name,
         value: p.totalProjectedProfit
     }));
  }, [productMargins]);

  const chartData = productMargins.slice(0, 10); // Top 10 for charts

  // Formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const CATEGORY_COLORS: Record<string, string> = {
    'Matières Premières': '#10b981', // emerald-500
    'Volailles & Aliments Complets': '#3b82f6', // blue-500
    'Bétail (Porcs/Bovins)': '#f59e0b', // amber-500
    'Matériel & Abreuvoirs': '#ec4899', // pink-500
    'Santé Animale': '#8b5cf6', // violet-500
    'Divers': '#6b7280', // gray-500
  };

  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || '#9ca3af';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 overflow-y-auto h-full pb-20 scrollbar-hide">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100 pb-3 bg-white/50 backdrop-blur-sm sticky top-0 z-20 -mx-6 px-6 pt-2 items-center text-center md:items-start md:text-left">
        <div className="flex flex-col items-center md:items-start">
           <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight flex items-center justify-center md:justify-start gap-2.5">
               <div className="p-1.5 bg-blue-50 rounded-lg">
                   <BarChart3 className="w-6 h-6 text-blue-600" />
               </div>
               Analyses
           </h2>
           <p className="text-gray-500 text-xs mt-0.5 font-medium ml-1">Performances et valorisation de votre activité.</p>
           
           <div className="mt-4 flex gap-2">
              <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                  Vue Générale
              </button>
              <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'inventory' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                  Résumé Inventaire
              </button>
           </div>
        </div>
            <div className="flex flex-row flex-wrap gap-3 w-full md:w-auto justify-center mt-4 md:mt-0 px-2 sm:px-0">
             {canFilterBoutique && (
                 <div className="relative group w-full sm:w-auto">
                     <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-farm-600 transition-colors" />
                     <select 
                         className="w-full h-12 pl-11 pr-10 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none shadow-sm hover:border-farm-300 hover:shadow-md focus:ring-2 focus:ring-farm-500/20 transition-all appearance-none cursor-pointer sm:min-w-[160px]"
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
                     <ArrowDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                 </div>
             )}



            <div className="relative group w-full sm:w-auto">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-hover:text-purple-600 transition-colors" />
                <select 
                    className="w-full h-12 pl-11 pr-10 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none shadow-sm hover:border-purple-300 hover:shadow-md focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer sm:min-w-[160px]"
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                >
                    <option value="Tous">Tous les rayons</option>
                    {(categories.length > 0 ? categories : Object.values(Category)).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ArrowDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
            </div>
        </div>
      </div>

      {activeTab === 'overview' && (
      <div className="w-full space-y-6">
      {/* --- KPI CARDS (Minimalist) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
           title="Valeur du Stock" 
           value={formatCurrency(totalInventoryValueCost)} 
           subtext="Prix d'achat"
           icon={Package}
           color="blue"
        />
        <KpiCard 
           title="CA Potentiel" 
           value={formatCurrency(totalInventoryValueSell)} 
           subtext="Si stock vendu"
           icon={TrendingUp}
           color="purple"
        />
        <KpiCard 
           title="Marge Potentielle" 
           value={
               <div className="flex items-baseline gap-2">
                   <span>{formatCurrency(potentialProfit)}</span>
                   <span className="text-sm text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">
                       {totalInventoryValueCost > 0 ? ((potentialProfit / totalInventoryValueCost) * 100).toFixed(1) : 0}%
                   </span>
               </div>
           } 
           subtext="Profit estimé"
           icon={Wallet}
           color="amber"
        />
        <KpiCard 
           title="Profit Réalisé" 
           value={formatCurrency(productMargins.reduce((acc, p) => acc + p.totalProjectedProfit, 0))} 
           subtext="Sur la période"
           isPositive
           icon={DollarSign}
           color="emerald"
        />
      </div>

      {/* --- CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
           {/* STOCK VALUATION PIE CHART */}
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-xl">
                      <PieIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">Répartition Valeur Stock</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-1 w-full">
                  {/* Center Pie Container */}
                  <div className="relative w-full sm:w-1/2 h-[220px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie 
                                  data={stockValueByCategory} 
                                  dataKey="value" 
                                  nameKey="name" 
                                  cx="50%" 
                                  cy="50%" 
                                  outerRadius={85} 
                                  innerRadius={60}
                                  paddingAngle={4}
                                  cornerRadius={5}
                              >
                                  {stockValueByCategory.map((entry, index) => (
                                      <Cell key={index} fill={getCategoryColor(entry.name)} strokeWidth={0} />
                                  ))}
                              </Pie>
                              <Tooltip 
                                  formatter={(val: number) => formatCurrency(val)} 
                                  contentStyle={{ 
                                      borderRadius: '16px', 
                                      border: 'none', 
                                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                      fontFamily: 'Plus Jakarta Sans',
                                      padding: '10px 14px',
                                      fontSize: '11px'
                                  }} 
                                  itemStyle={{ color: '#374151', fontWeight: 600 }}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                      {/* Center Text Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total</span>
                              <span className="text-base font-bold text-gray-900">{formatCurrency(totalInventoryValueCost).split(' ')[0]}</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Custom Legend */}
                  <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                     {stockValueByCategory.map((entry, index) => {
                         const percentage = totalInventoryValueCost > 0 ? ((entry.value / totalInventoryValueCost) * 100).toFixed(1) : '0';
                         return (
                             <div key={index} className="flex items-start gap-2 p-1.5 rounded-xl hover:bg-gray-50/80 transition-colors">
                                 <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: getCategoryColor(entry.name) }}></div>
                                 <div className="min-w-0 flex-1">
                                     <p className="text-xs font-bold text-gray-800 truncate" title={entry.name}>{entry.name}</p>
                                     <p className="text-[10px] font-mono text-gray-500 font-semibold">{formatCurrency(entry.value)} ({percentage}%)</p>
                                 </div>
                             </div>
                         );
                     })}
                  </div>
              </div>
           </div>

           {/* STOCK VALUATION TABLE */}
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                      <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">Valorisation Détaillée</h3>
              </div>
              <div className="overflow-y-auto overflow-x-auto max-h-[300px] pr-2 custom-scrollbar flex-1 w-full">
                 <table className="w-full text-sm min-w-[500px]">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                       <tr className="text-left text-gray-400 text-[10px] uppercase font-bold font-display tracking-wider">
                          <th className="pb-4 pl-2 bg-white">Produit</th>
                          <th className="pb-4 text-right bg-white">Stock</th>
                          <th className="pb-4 text-right bg-white">Coût U.</th>
                          <th className="pb-4 text-right bg-white">Valeur</th>
                          <th className="pb-4 text-right pr-2 bg-white">%</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {stockValuation.map((p, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                             <td className="py-3 pl-2">
                                 <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: getCategoryColor(p.category) }}></div>
                                     <div>
                                         <div className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                             {p.name}
                                             {p.variantName && (
                                                 <span className="ml-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md font-medium">
                                                     {p.variantName}
                                                 </span>
                                             )}
                                         </div>
                                         <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{p.category}</div>
                                     </div>
                                 </div>
                             </td>
                             <td className="py-3 text-right text-gray-600 font-medium font-mono">
                                 {p.stock}
                             </td>
                             <td className="py-3 text-right text-gray-500 text-xs font-mono">
                                 {formatCurrency(p.unitCost)}
                             </td>
                             <td className="py-3 text-right font-bold text-gray-900 font-mono bg-gray-50/50 rounded-lg px-2">
                                 {formatCurrency(p.totalValue)}
                             </td>
                             <td className="py-3 text-right text-gray-400 text-xs font-medium pr-2">
                                 {totalInventoryValueCost > 0 ? ((p.totalValue / totalInventoryValueCost) * 100).toFixed(1) : 0}%
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* PROFIT PIE CHART */}
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">Top Profits (Produits)</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 flex-1 w-full">
                  {/* Center Pie Container */}
                  <div className="relative w-full sm:w-1/2 h-[220px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie 
                                  data={profitByProduct} 
                                  dataKey="value" 
                                  nameKey="name" 
                                  cx="50%" 
                                  cy="50%" 
                                  outerRadius={85} 
                                  innerRadius={60}
                                  paddingAngle={4}
                                  cornerRadius={5}
                              >
                                  {profitByProduct.map((entry, index) => {
                                      const product = products.find(p => entry.name.startsWith(p.name));
                                      return <Cell key={index} fill={product ? getCategoryColor(product.category) : COLORS[index % COLORS.length]} strokeWidth={0} />
                                  })}
                              </Pie>
                              <Tooltip 
                                  formatter={(val: number) => formatCurrency(val)} 
                                  contentStyle={{ 
                                      borderRadius: '16px', 
                                      border: 'none', 
                                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                      fontFamily: 'Plus Jakarta Sans',
                                      padding: '10px 14px',
                                      fontSize: '11px'
                                  }} 
                                  itemStyle={{ color: '#374151', fontWeight: 600 }}
                              />
                          </PieChart>
                      </ResponsiveContainer>
                      {/* Center Text Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Top 6</span>
                              <span className="text-base font-bold text-gray-900 font-display">Profit</span>
                          </div>
                      </div>
                  </div>
                  
                  {/* Custom Legend */}
                  <div className="w-full sm:w-1/2 grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                     {profitByProduct.map((entry, index) => {
                         const product = products.find(p => entry.name.startsWith(p.name));
                         const totalProfit = profitByProduct.reduce((acc, item) => acc + item.value, 0);
                         const percentage = totalProfit > 0 ? ((entry.value / totalProfit) * 100).toFixed(1) : '0';
                         const color = product ? getCategoryColor(product.category) : COLORS[index % COLORS.length];
                         return (
                             <div key={index} className="flex items-start gap-2 p-1.5 rounded-xl hover:bg-gray-50/80 transition-colors">
                                 <div className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: color }}></div>
                                 <div className="min-w-0 flex-1">
                                     <p className="text-xs font-bold text-gray-800 truncate" title={entry.name}>{entry.name}</p>
                                     <p className="text-[10px] font-mono text-gray-500 font-semibold">{formatCurrency(entry.value)} ({percentage}%)</p>
                                 </div>
                             </div>
                         );
                     })}
                  </div>
              </div>
           </div>

           {/* PROFIT TABLE */}
           <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 rounded-xl">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 font-display tracking-tight">Détail des Ventes</h3>
              </div>
              <div className="overflow-y-auto overflow-x-auto max-h-[300px] pr-2 custom-scrollbar flex-1">
                 <table className="w-full text-sm min-w-[500px]">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                       <tr className="text-left text-gray-400 text-[10px] uppercase font-bold font-display tracking-wider">
                          <th className="pb-4 pl-2 bg-white">Produit</th>
                          <th className="pb-4 text-right bg-white">Marge U.</th>
                          <th className="pb-4 text-right bg-white">Vendu</th>
                          <th className="pb-4 text-right bg-white">Profit Total</th>
                          <th className="pb-4 text-right pr-2 bg-white">%</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {productMargins.map((p, idx) => {
                          const product = products.find(prod => prod.name === p.name);
                          const totalProfit = productMargins.reduce((acc, item) => acc + item.totalProjectedProfit, 0);
                          
                          return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                             <td className="py-3 pl-2">
                                 <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: product ? getCategoryColor(product.category) : '#9ca3af' }}></div>
                                     <div className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                         {p.name}
                                         {p.variantName && (
                                             <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md font-medium">
                                                 {p.variantName}
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             </td>
                             <td className="py-3 text-right text-gray-500 text-xs font-mono">
                                 {formatCurrency(p.margin)}
                             </td>
                             <td className="py-3 text-right text-gray-800 font-bold font-mono bg-gray-50/50 rounded-lg px-2">{p.soldQty}</td>
                             <td className="py-3 text-right font-bold text-emerald-600 font-mono">+{formatCurrency(p.totalProjectedProfit)}</td>
                             <td className="py-3 text-right text-gray-400 text-xs font-medium pr-2">
                                 {totalProfit > 0 ? ((p.totalProjectedProfit / totalProfit) * 100).toFixed(1) : 0}%
                             </td>
                          </tr>
                       )})}
                    </tbody>
                 </table>
              </div>
           </div>
      </div>
      </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display flex items-center gap-2">
                        <Package className="w-5 h-5 text-farm-500" />
                        Inventaire Global
                    </h3>
                    <p className="text-sm text-gray-500">Résumé du stock avec totaux par catégorie</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                >
                    <FileText className="w-4 h-4" />
                    Exporter (PDF/Print)
                </button>
            </div>
            
            <div className="overflow-x-auto print:overflow-visible rounded-2xl border border-gray-100 shadow-inner bg-gray-50/50">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-white text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Produit</th>
                            <th className="px-6 py-4">Catégorie</th>
                            <th className="px-6 py-4 text-right">Quantité En Stock</th>
                            <th className="px-6 py-4 text-right">Prix Unitaire (Achat)</th>
                            <th className="px-6 py-4 text-right">Valeur Totale</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {(() => {
                            // Group products by category
                            const grouped: Record<string, { items: any[], catTotal: number }> = {};
                            let grandTotal = 0;
                            
                            stockValuation.forEach(item => {
                                const cat = item.category || 'Autres';
                                if (!grouped[cat]) grouped[cat] = { items: [], catTotal: 0 };
                                
                                if (item.stock > 0) {
                                    grouped[cat].items.push({ 
                                        name: item.variantName ? `${item.name} - ${item.variantName}` : item.name, 
                                        stock: item.stock, 
                                        cost: item.unitCost, 
                                        value: item.totalValue 
                                    });
                                    grouped[cat].catTotal += item.totalValue;
                                    grandTotal += item.totalValue;
                                }
                            });
                            
                            return (
                                <>
                                    {Object.entries(grouped).map(([cat, data], idx) => (
                                        <React.Fragment key={idx}>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <td colSpan={5} className="px-6 py-3 font-black text-slate-700 text-xs uppercase tracking-widest bg-slate-100/50">
                                                    {cat}
                                                </td>
                                            </tr>
                                            {data.items.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-3 font-bold text-slate-800">{item.name}</td>
                                                    <td className="px-6 py-3 text-slate-500 text-xs font-medium">{cat}</td>
                                                    <td className="px-6 py-3 text-right font-mono font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{item.stock}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-slate-500">{formatCurrency(item.cost)}</td>
                                                    <td className="px-6 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(item.value)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-farm-50 border-t border-farm-100">
                                                <td colSpan={4} className="px-6 py-3 text-right font-black text-farm-800 text-xs uppercase tracking-wider">Sous-total {cat}</td>
                                                <td className="px-6 py-3 text-right font-black font-mono text-farm-700 bg-farm-100/50">{formatCurrency(data.catTotal)}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                    <tr className="bg-slate-900 text-white shadow-lg">
                                        <td colSpan={4} className="px-6 py-5 text-right font-black uppercase tracking-widest text-sm text-slate-300">Valeur Totale Globale</td>
                                        <td className="px-6 py-5 text-right font-black font-mono text-xl text-emerald-400">{formatCurrency(grandTotal)}</td>
                                    </tr>
                                </>
                            );
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
      )}

    </div>
  );
};

// Helper Component for consistent minimalist cards
const KpiCard = ({ title, value, subtext, isPositive, icon: Icon, color = 'blue' }: any) => {
    const colorStyles: any = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };

    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider font-display">{title}</p>
              {Icon && (
                  <div className={`p-2 rounded-xl ${colorStyles[color]} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-4 h-4" />
                  </div>
              )}
          </div>
          <div className="flex items-baseline gap-2">
             <h3 className={`text-3xl font-bold font-display tracking-tight ${isPositive ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</h3>
          </div>
          {subtext && <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
              {isPositive ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <Info className="w-3 h-3" />}
              {subtext}
          </p>}
      </div>
    );
};