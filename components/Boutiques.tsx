import React, { useState } from 'react';
import { Product, Category, ProductVariant, Boutique, StockTransfer, UserRole } from '../types';
import { Store, ArrowRight, Save, Search, AlertCircle, Package, Plus, Edit2, Trash2, MapPin, X, Loader2, AlertTriangle } from 'lucide-react';
import { saveProduct, saveBoutique, deleteBoutique } from '../services/db';
import { useNotifications } from './ui/Notifications';
import { formatStock } from '../utils';
import { Transfers } from './Transfers';

interface BoutiquesProps {
  products: Product[];
  boutiques?: Boutique[];
  userRole?: string;
  userBoutique?: string;
  transfers?: StockTransfer[];
  currentProvenderieId?: string;
  userRoleObj?: UserRole;
}

export const Boutiques: React.FC<BoutiquesProps> = ({ products, boutiques = [], userRole = 'Admin', userBoutique = 'Toutes', transfers = [], currentProvenderieId, userRoleObj }) => {
  const { notify } = useNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'transfers'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tout');
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>(() => {
    if (userBoutique && userBoutique !== 'Toutes') return userBoutique;
    return boutiques[0]?.id || 'Boutique 1';
  });

  const isVisible = (componentId: string) => {
    const normRole = (userRole || '').toLowerCase().trim();
    const isSuperOrAdmin = normRole === 'admin' || 
                           normRole === 'superadmin' || 
                           normRole === 'system-admin' || 
                           normRole.includes('administrateur') || 
                           normRole.includes('admin') || 
                           (normRole.includes('super') && normRole.includes('admin'));
    if (isSuperOrAdmin) return true;
    if (!userRoleObj?.pagePermissions) return true;
    const pagePerms = userRoleObj.pagePermissions;
    let pagePerm: any = null;
    if (Array.isArray(pagePerms)) {
      pagePerm = pagePerms.find(p => p.pageId === 'settings');
    } else if (pagePerms && typeof pagePerms === 'object') {
      pagePerm = pagePerms['settings' as any];
    }
    if (!pagePerm) return true;
    if (typeof pagePerm === 'boolean') return pagePerm;
    if (pagePerm && Array.isArray(pagePerm.components)) {
      return pagePerm.components.find((c: any) => c.id === componentId)?.visible ?? true;
    }
    return true;
  };

  const normRole = (userRole || '').toLowerCase().trim();
  const isSuperOrAdmin = normRole === 'admin' || 
                         normRole === 'superadmin' || 
                         normRole === 'system-admin' || 
                         normRole.includes('administrateur') || 
                         normRole.includes('admin') || 
                         (normRole.includes('super') && normRole.includes('admin'));
  const canManageBoutiques = isSuperOrAdmin || (userRole === 'Gérant' && userBoutique === 'Toutes');
  
  // Boutique Management State
  const [isAddingBoutique, setIsAddingBoutique] = useState(false);
  const [editingBoutique, setEditingBoutique] = useState<Boutique | null>(null);
  const [boutiqueForm, setBoutiqueForm] = useState<Partial<Boutique>>({ name: '', location: '', status: 'active' });
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Transfer State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');
  const [transferQty, setTransferQty] = useState<string>('');
  const [transferUnit, setTransferUnit] = useState<string>('Détail');
  const [isProcessing, setIsProcessing] = useState(false);

  // Derived Data
  const currentBoutique = boutiques.find(b => b.id === selectedBoutiqueId);
  const isMainBoutique = selectedBoutiqueId === boutiques[0]?.id;
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = selectedCategory === 'Tout' || p.category === selectedCategory;
    
    // Check if product has stock > 0 in the selected boutique
    const hasVariants = p.variants && p.variants.length > 0;
    const totalStock = hasVariants
        ? p.variants!.reduce((acc, v) => acc + (isMainBoutique ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutiqueId] || 0)), 0)
        : (isMainBoutique ? (p.stock || 0) : (p.boutiqueStock?.[selectedBoutiqueId] || 0));
    
    const hasStock = totalStock > 0;

    return matchesSearch && matchesCategory && hasStock;
  });

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants?.find(v => v.name === selectedVariantName);

  // --- BOUTIQUE CRUD ---

  const handleSaveBoutique = async () => {
    if (!boutiqueForm.name) return;
    setIsProcessing(true);
    try {
      const newBoutique: Boutique = {
        id: editingBoutique?.id || `BTQ-${Date.now()}`,
        name: boutiqueForm.name,
        location: boutiqueForm.location,
        address: boutiqueForm.address,
        status: boutiqueForm.status as 'active' | 'inactive' || 'active',
        managerId: editingBoutique?.managerId,
        provenderieId: currentProvenderieId
      };
      await saveBoutique(newBoutique);
      notify(editingBoutique ? "Boutique modifiée" : "Boutique ajoutée", "success");
      setIsAddingBoutique(false);
      setEditingBoutique(null);
      setBoutiqueForm({ name: '', location: '', status: 'active' });
    } catch (e) {
      notify("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBoutique = async (id: string) => {
    setShowConfirmDelete(id);
  };

  const confirmDeleteBoutique = async () => {
    if (showConfirmDelete) {
      await deleteBoutique(showConfirmDelete);
      notify("Boutique supprimée", "info");
      if (selectedBoutiqueId === showConfirmDelete && boutiques.length > 0) {
          setSelectedBoutiqueId(boutiques[0].id);
      }
      setShowConfirmDelete(null);
    }
  };

  const openEditBoutique = (b: Boutique) => {
    setEditingBoutique(b);
    setBoutiqueForm(b);
    setIsAddingBoutique(true);
  };

  // --- TRANSFERS ---

  const handleOpenTransfer = () => {
    setSelectedProductId('');
    setSelectedVariantName('');
    setTransferQty('');
    setTransferUnit('Détail');
    setTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !transferQty || !selectedBoutiqueId) return;
    const rawQty = parseFloat(transferQty);
    if (isNaN(rawQty) || rawQty <= 0) {
      notify("Quantité invalide", "error");
      return;
    }
    
    const multiplier = transferUnit === 'Sac 50kg' ? 50 : (transferUnit === 'Sac 25kg' ? 25 : (transferUnit === 'Sac 40kg' ? 40 : (transferUnit === 'Tonnes' ? 1000 : 1)));
    const qty = formatStock(rawQty * multiplier);

    setIsProcessing(true);
    try {
      let updatedProduct = { ...selectedProduct };
      
      if (selectedVariant) {
        const variantIndex = updatedProduct.variants?.findIndex(v => v.name === selectedVariant.name);
        if (variantIndex !== undefined && variantIndex >= 0 && updatedProduct.variants) {
          const currentMainStock = updatedProduct.variants[variantIndex].stock || 0;
          if (qty > currentMainStock) {
            notify("Stock principal insuffisant", "error");
            setIsProcessing(false);
            return;
          }
          
          const newVariants = [...updatedProduct.variants];
          const currentBoutiqueStock = newVariants[variantIndex].boutiqueStock?.[selectedBoutiqueId] || 0;
          
          newVariants[variantIndex] = {
            ...newVariants[variantIndex],
            stock: currentMainStock - qty,
            boutiqueStock: {
              ...(newVariants[variantIndex].boutiqueStock || {}),
              [selectedBoutiqueId]: currentBoutiqueStock + qty
            }
          };
          updatedProduct.variants = newVariants;
        }
      } else {
        if (qty > updatedProduct.stock) {
          notify("Stock principal insuffisant", "error");
          setIsProcessing(false);
          return;
        }
        
        const currentBoutiqueStock = updatedProduct.boutiqueStock?.[selectedBoutiqueId] || 0;
        updatedProduct.stock -= qty;
        updatedProduct.boutiqueStock = {
          ...(updatedProduct.boutiqueStock || {}),
          [selectedBoutiqueId]: currentBoutiqueStock + qty
        };
      }

      await saveProduct(updatedProduct);
      notify("Transfert réussi", "success");
      setTransferModalOpen(false);
    } catch (error) {
      console.error("Transfer error:", error);
      notify("Erreur lors du transfert", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate Total Stock Value for Selected Boutique
  const calculateBoutiqueValue = () => {
      return products.reduce((acc, p) => {
          if (p.variants && p.variants.length > 0) {
              return acc + p.variants.reduce((vAcc, v) => vAcc + ((isMainBoutique ? v.stock : (v.boutiqueStock?.[selectedBoutiqueId] || 0)) * v.price), 0);
          }
          return acc + ((isMainBoutique ? p.stock : (p.boutiqueStock?.[selectedBoutiqueId] || 0)) * p.price);
      }, 0);
  };

  const availableProductsCount = products.filter(p => {
    const hasVariants = p.variants && p.variants.length > 0;
    const totalStock = hasVariants
        ? p.variants!.reduce((acc, v) => acc + (isMainBoutique ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutiqueId] || 0)), 0)
        : (isMainBoutique ? (p.stock || 0) : (p.boutiqueStock?.[selectedBoutiqueId] || 0));
    return totalStock > 0;
  }).length;

  return (
    <div className="space-y-6 overflow-y-auto h-full pb-20 scrollbar-hide">
      {/* Header & Boutique Selector */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 shrink-0">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="w-6 h-6 text-farm-600" />
                Gestion des Boutiques
            </h2>
            <p className="text-gray-500 text-sm mt-1">Gérez les points de vente, stocks et transferts.</p>
         </div>

         {canManageBoutiques && (
             <div className="flex flex-wrap gap-3 items-center">
                 <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                     {boutiques
                       .filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique)
                       .map(b => (
                         <button
                            key={b.id}
                            onClick={() => setSelectedBoutiqueId(b.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedBoutiqueId === b.id ? 'bg-white shadow-sm text-farm-700' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                             {b.name}
                         </button>
                     ))}
                 </div>
             </div>
         )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-farm-600 text-farm-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'transfers' ? 'border-farm-600 text-farm-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Transferts
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Boutique Details Card */}
          {currentBoutique && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                      <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-gray-900">{currentBoutique.name}</h3>
                          {canManageBoutiques && (
                              <div className="flex gap-1">
                                  <button onClick={() => openEditBoutique(currentBoutique)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                  <button onClick={() => handleDeleteBoutique(currentBoutique.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                              </div>
                          )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                          <MapPin className="w-4 h-4" />
                          {currentBoutique.location || 'Aucune localisation'}
                      </div>
                  </div>
                  <div className="mt-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${currentBoutique.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                          {currentBoutique.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                  </div>
              </div>

              {isVisible('kpi-boutique-value') && (
                <div className="bg-gradient-to-br from-farm-500 to-farm-600 p-6 rounded-2xl shadow-lg text-white">
                    <p className="text-farm-100 font-medium text-sm">Valeur du Stock</p>
                    <h3 className="text-3xl font-bold mt-1">{new Intl.NumberFormat('fr-FR').format(calculateBoutiqueValue())} F</h3>
                    <p className="text-farm-100 text-xs mt-2 opacity-80">Basé sur les prix de vente actuels</p>
                </div>
              )}

              {isVisible('kpi-boutique-products') && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                        <Package className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{availableProductsCount}</h3>
                    <p className="text-gray-500 text-sm">Produits Disponibles</p>
                </div>
              )}
          </div>
      )}

      {/* Stock Transfer Interface */}
      {isVisible('table-boutique-stock') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Stock de {currentBoutique?.name}</h3>
            <div className="flex flex-wrap items-center gap-3">
                 <div className="relative w-full md:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                         type="text" 
                         placeholder="Rechercher..." 
                         className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-500 outline-none w-full md:w-64 bg-white"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                      />
                 </div>
                 <select 
                     className="p-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-500 outline-none bg-white font-medium text-gray-700 w-full md:w-auto"
                     value={selectedCategory}
                     onChange={e => setSelectedCategory(e.target.value)}
                 >
                     <option value="Tout">Toutes les catégories</option>
                     {Object.values(Category).map(cat => (
                         <option key={cat} value={cat}>{cat}</option>
                     ))}
                 </select>
                 {!isMainBoutique && currentBoutique?.name !== 'Annexe Marché' && (
                     <button 
                         onClick={handleOpenTransfer}
                         className="flex items-center justify-center gap-2 px-4 py-2 bg-farm-600 text-white rounded-xl hover:bg-farm-700 transition-colors shadow-lg shadow-farm-200 font-bold text-sm w-full md:w-auto"
                     >
                         <Package className="w-4 h-4" /> Réapprovisionner
                     </button>
                 )}
            </div>
        </div>
        {/* Mobile View: Cards */}
        <div className="md:hidden flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredProducts.map(product => {
            const hasVariants = product.variants && product.variants.length > 0;
            const totalStock = hasVariants
                ? product.variants!.reduce((acc, v) => acc + (isMainBoutique ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutiqueId] || 0)), 0)
                : (isMainBoutique ? (product.stock || 0) : (product.boutiqueStock?.[selectedBoutiqueId] || 0));

            return (
              <div key={product.id} className="p-4 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                    <span className="text-[10px] text-gray-400">{product.category}</span>
                  </div>
                  {!hasVariants && (
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Stock</div>
                      <div className="text-xs font-bold text-farm-700">{formatStock(totalStock)} {product.unit}</div>
                    </div>
                  )}
                </div>

                {hasVariants && (
                  <div className="space-y-2 mt-2 bg-gray-50 p-2 rounded-lg">
                    {product.variants!.map((variant, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{variant.name}</span>
                        <span className="font-bold text-farm-700">
                          {formatStock(isMainBoutique ? (variant.stock || 0) : (variant.boutiqueStock?.[selectedBoutiqueId] || 0))} {product.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              Aucun produit trouvé.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4 text-center">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => {
                const hasVariants = product.variants && product.variants.length > 0;
                
                if (hasVariants) {
                  return (
                    <React.Fragment key={product.id}>
                      <tr className="bg-gray-50/30">
                        <td colSpan={2} className="px-6 py-3 font-bold text-gray-900 border-b border-gray-100">
                          {product.name} <span className="text-xs font-normal text-gray-500 ml-2">({product.category})</span>
                        </td>
                      </tr>
                      {product.variants!.map((variant, idx) => (
                        <tr key={`${product.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 pl-10 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-farm-400"></div>
                            {variant.name}
                          </td>
                          <td className="px-6 py-3 text-center font-bold text-farm-700">
                            {formatStock(isMainBoutique ? (variant.stock || 0) : (variant.boutiqueStock?.[selectedBoutiqueId] || 0))} {product.unit}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                }

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {product.name} <span className="text-xs font-normal text-gray-500 ml-2">({product.category})</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-farm-700">
                      {formatStock(isMainBoutique ? (product.stock || 0) : (product.boutiqueStock?.[selectedBoutiqueId] || 0))} {product.unit}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-400">
                    Aucun produit trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-farm-600" />
                Réapprovisionner {currentBoutique?.name}
              </h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Produit</label>
                 <select 
                     className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-500 outline-none"
                     value={selectedProductId}
                     onChange={e => {
                         setSelectedProductId(e.target.value);
                         setSelectedVariantName('');
                     }}
                 >
                     <option value="">Sélectionner un produit</option>
                     {products.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                 </select>
              </div>

              {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Variante</label>
                     <select 
                         className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-500 outline-none"
                         value={selectedVariantName}
                         onChange={e => setSelectedVariantName(e.target.value)}
                     >
                         <option value="">Sélectionner une variante</option>
                         {selectedProduct.variants.map(v => (
                             <option key={v.name} value={v.name}>{v.name}</option>
                         ))}
                     </select>
                  </div>
              )}

              {selectedProduct && (
                  <div className="bg-farm-50 p-4 rounded-xl border border-farm-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock Principal dispo:</span>
                      <span className="font-bold text-gray-900">
                        {formatStock(selectedVariant ? (selectedVariant.stock || 0) : (selectedProduct.stock || 0))} {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Quantité à transférer</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-500 outline-none font-bold text-lg"
                        value={transferQty}
                        onChange={e => setTransferQty(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <select 
                        className="w-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-500 outline-none bg-white text-sm font-bold"
                        value={transferUnit}
                        onChange={e => setTransferUnit(e.target.value)}
                    >
                        <option value="Détail">Détail</option>
                        <option value="Sac 25kg">Sac 25kg</option>
                        <option value="Sac 40kg">Sac 40kg</option>
                        <option value="Sac 50kg">Sac 50kg</option>
                        <option value="Tonnes">Tonnes</option>
                    </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setTransferModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleTransfer}
                  disabled={isProcessing || !transferQty || !selectedProduct || (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariantName)}
                  className="flex-1 px-4 py-3 bg-farm-600 text-white rounded-xl font-bold hover:bg-farm-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  ) : (
    isVisible('table-boutique-transfers') ? (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-250px)]">
        <Transfers 
          products={products} 
          transfers={transfers} 
          boutiques={boutiques} 
          userRole={userRole} 
          userBoutique={userBoutique} 
          userName="Administrateur" 
          currentProvenderieId={currentProvenderieId}
        />
      </div>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-500 bg-white rounded-2xl border border-gray-100">
        Accès à l'historique des transferts non autorisé
      </div>
    )
  )}

  {/* Add/Edit Boutique Modal */}
      {isAddingBoutique && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 border border-gray-100">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                      <h3 className="font-bold text-lg font-display">{editingBoutique ? 'Modifier Boutique' : 'Nouvelle Boutique'}</h3>
                      <button onClick={() => setIsAddingBoutique(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Store className="w-3 h-3"/> Nom de la Boutique</label>
                          <input className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-500 outline-none" value={boutiqueForm.name} onChange={e => setBoutiqueForm({...boutiqueForm, name: e.target.value})} placeholder="Ex: Boutique Marché"/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Localisation (Bref)</label>
                          <input className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none" value={boutiqueForm.location} onChange={e => setBoutiqueForm({...boutiqueForm, location: e.target.value})} placeholder="Ex: Marché Central"/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Adresse (Détaillée pour facturation)</label>
                          <input className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none" value={boutiqueForm.address} onChange={e => setBoutiqueForm({...boutiqueForm, address: e.target.value})} placeholder="Ex: Nkomo, à côté de la Résidence des Palmiers"/>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">Statut</label>
                          <select className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none" value={boutiqueForm.status} onChange={e => setBoutiqueForm({...boutiqueForm, status: e.target.value as any})}>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                          </select>
                      </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
                      <button onClick={() => setIsAddingBoutique(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">Annuler</button>
                      <button onClick={handleSaveBoutique} disabled={isProcessing || !boutiqueForm.name} className="px-6 py-2.5 bg-farm-600 text-white rounded-xl font-bold shadow-lg hover:bg-farm-700 flex items-center gap-2 transition-all disabled:opacity-50">
                          {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : 'Enregistrer'}
                      </button>
                  </div>
              </div>
          </div>
      )}
      {showConfirmDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
                  <div className="flex items-center gap-3 mb-4 text-red-600">
                      <AlertTriangle className="w-6 h-6" />
                      <h3 className="text-xl font-bold text-gray-900">Supprimer la boutique ?</h3>
                  </div>
                  <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowConfirmDelete(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Annuler</button>
                      <button onClick={confirmDeleteBoutique} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Supprimer</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
