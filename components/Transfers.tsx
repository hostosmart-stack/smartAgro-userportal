import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Product, Boutique, StockTransfer, TransferItem } from '../types';
import { Plus, Check, X, Search, Package, ArrowRight, Clock, CheckCircle2, XCircle, Eye, Printer, AlertTriangle } from 'lucide-react';
import { saveTransfer, saveProduct } from '../services/db';
import { useNotifications } from './ui/Notifications';

interface TransfersProps {
  products: Product[];
  transfers: StockTransfer[];
  boutiques: Boutique[];
  userRole: string;
  userBoutique: string;
  userName: string;
  preSelectedProductId?: string | null;
  onClearPreSelection?: () => void;
  currentProvenderieId?: string;
}

export const Transfers: React.FC<TransfersProps> = ({ products, transfers, boutiques, userRole, userBoutique, userName, preSelectedProductId, onClearPreSelection, currentProvenderieId }) => {
  const { notify } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<StockTransfer | null>(null);
  const [confirmPartialTransfer, setConfirmPartialTransfer] = useState<StockTransfer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Transfer Form State
  const [destinationBoutique, setDestinationBoutique] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (preSelectedProductId) {
      setIsCreating(true);
      setSelectedProduct(preSelectedProductId);
      if (onClearPreSelection) {
        onClearPreSelection();
      }
    }
  }, [preSelectedProductId, onClearPreSelection]);

  const getBoutiqueName = (id: string) => {
    if (id === 'Toutes' || id === 'Boutique 1') return 'Maison Mère';
    const boutique = boutiques.find(b => b.id === id);
    return boutique ? boutique.name : id;
  };

  const userBoutiqueName = useMemo(() => {
    return getBoutiqueName(userBoutique);
  }, [userBoutique, boutiques]);

  // Filter transfers based on user's boutique
  const visibleTransfers = useMemo(() => {
    let filtered = transfers;
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.reference.toLowerCase().includes(lowerTerm) ||
        t.sourceBoutique.toLowerCase().includes(lowerTerm) ||
        t.destinationBoutique.toLowerCase().includes(lowerTerm)
      );
    }

    return filtered;
  }, [transfers, userBoutique, statusFilter, searchTerm]);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    // Check available stock at source
    const sourceStock = userBoutique === 'Toutes' ? product.stock : (product.boutiqueStock?.[userBoutique] || 0);
    if (parseInt(quantity) > sourceStock) {
      notify('Stock insuffisant pour ce transfert.', 'error');
      return;
    }

    const newItem: TransferItem = {
      productId: product.id,
      productName: product.name,
      variantName: selectedVariant || undefined,
      quantity: parseInt(quantity),
      unit: product.unit
    };

    setTransferItems([...transferItems, newItem]);
    setSelectedProduct('');
    setSelectedVariant('');
    setQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleCreateTransfer = async () => {
    if (!destinationBoutique || transferItems.length === 0) {
      notify('Veuillez sélectionner une destination et ajouter des articles.', 'error');
      return;
    }

    const sourceId = userBoutique === 'Toutes' ? 'Boutique 1' : userBoutique;
    
    if (sourceId === destinationBoutique) {
      notify('La source et la destination doivent être différentes.', 'error');
      return;
    }

    const newTransfer: StockTransfer = {
      id: Date.now().toString(),
      reference: `TRF-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      sourceBoutique: sourceId,
      destinationBoutique,
      items: transferItems,
      status: 'PENDING',
      createdBy: userName,
      notes,
      provenderieId: currentProvenderieId
    };

    try {
      // Save transfer record
      await saveTransfer(newTransfer);
      notify('Bon de transfert créé avec succès.', 'success');
      setIsCreating(false);
      setTransferItems([]);
      setDestinationBoutique('');
      setNotes('');
    } catch (error) {
      console.error(error);
      notify('Erreur lors de la création du transfert.', 'error');
    }
  };

  const handleValidateTransfer = async (transfer: StockTransfer, force: boolean = false) => {
    try {
      const validatedItems = transfer.items.filter(i => i.validated);
      const unvalidatedItems = transfer.items.filter(i => !i.validated);
      
      if (validatedItems.length === 0) {
        notify('Veuillez valider au moins un article.', 'error');
        return;
      }

      // If not all items are validated, show an alarm/confirmation
      if (unvalidatedItems.length > 0 && !force) {
        setConfirmPartialTransfer(transfer);
        return;
      }

      // Update stock for both source and destination
      for (const item of validatedItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const updatedProduct = { ...product };
          if (!updatedProduct.boutiqueStock) updatedProduct.boutiqueStock = {};
          
          // 1. Deduct from source
          if (transfer.sourceBoutique === 'Boutique 1') {
            updatedProduct.stock -= item.quantity;
          } else {
            updatedProduct.boutiqueStock[transfer.sourceBoutique] = (updatedProduct.boutiqueStock[transfer.sourceBoutique] || 0) - item.quantity;
          }

          // 2. Add to destination
          if (transfer.destinationBoutique === 'Boutique 1') {
            updatedProduct.stock += item.quantity;
          } else {
            updatedProduct.boutiqueStock[transfer.destinationBoutique] = (updatedProduct.boutiqueStock[transfer.destinationBoutique] || 0) + item.quantity;
          }
          
          await saveProduct(updatedProduct);
        }
      }

      // Update transfer status
      const newStatus = unvalidatedItems.length > 0 ? 'PARTIAL' : 'COMPLETED';
      await saveTransfer({ ...transfer, status: newStatus });
      notify(newStatus === 'PARTIAL' ? 'Transfert validé PARTIELLEMENT.' : 'Transfert validé et stock mis à jour.', 'success');
      setViewingTransfer(null);
      setConfirmPartialTransfer(null);
    } catch (error) {
      console.error(error);
      notify('Erreur lors de la validation.', 'error');
    }
  };

  const handleRejectTransfer = async (transfer: StockTransfer) => {
    try {
      // Update transfer status (no stock change needed as it's only deducted on validation)
      await saveTransfer({ ...transfer, status: 'REJECTED' });
      notify('Transfert rejeté.', 'success');
      setViewingTransfer(null);
    } catch (error) {
      console.error(error);
      notify('Erreur lors du rejet.', 'error');
    }
  };

  const handleCancelTransfer = async (transfer: StockTransfer) => {
    try {
      // Update transfer status (no stock change needed as it's only deducted on validation)
      await saveTransfer({ ...transfer, status: 'CANCELLED' });
      notify('Transfert annulé.', 'success');
      setViewingTransfer(null);
    } catch (error) {
      console.error(error);
      notify('Erreur lors de l\'annulation.', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> En attente</span>;
      case 'PARTIAL': return <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Partiel</span>;
      case 'COMPLETED': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Validé</span>;
      case 'REJECTED': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejeté</span>;
      case 'CANCELLED': return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3"/> Annulé</span>;
      default: return null;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-3xl shadow-glass border border-gray-100/50 overflow-hidden">
        {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-gray-900">Transferts de Stock</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les bons de transfert entre boutiques</p>
        </div>
        <div className="flex gap-3">
          {(userBoutique === 'Toutes' || userBoutique === 'Maison Mère') && (
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-farm-600 hover:bg-farm-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-farm-200 font-bold text-sm"
            >
              <Plus className="w-4 h-4" /> Nouveau Transfert
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par référence ou boutique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2.5 px-4 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500 bg-white"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PARTIAL">Partiels</option>
          <option value="COMPLETED">Validés</option>
          <option value="REJECTED">Rejetés</option>
        </select>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4">
          {visibleTransfers.map(transfer => (
            <div key={transfer.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{transfer.reference}</span>
                    {getStatusBadge(transfer.status)}
                    {userBoutique !== 'Toutes' && (userBoutique === transfer.sourceBoutique || userBoutique === transfer.destinationBoutique) && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        userBoutique === transfer.destinationBoutique 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {userBoutique === transfer.destinationBoutique ? 'Entrant' : 'Sortant'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{new Date(transfer.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>Par {transfer.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm font-medium text-gray-700">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{getBoutiqueName(transfer.sourceBoutique)}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{getBoutiqueName(transfer.destinationBoutique)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-4">
                  <p className="text-sm text-gray-500">Articles</p>
                  <p className="font-bold text-gray-900">{transfer.items.reduce((acc, item) => acc + item.quantity, 0)} unités</p>
                </div>
                <button
                  onClick={() => setViewingTransfer(transfer)}
                  className="p-2 text-gray-400 hover:text-farm-600 hover:bg-farm-50 rounded-xl transition-colors"
                  title="Voir les détails"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {visibleTransfers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun transfert trouvé.
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Create Modal */}
      {isCreating && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 font-display">Nouveau Bon de Transfert</h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input type="text" value={userBoutique === 'Toutes' ? 'Maison Mère' : userBoutiqueName} disabled className="w-full p-2.5 rounded-xl border-gray-200 bg-gray-100 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <select
                    value={destinationBoutique}
                    onChange={(e) => setDestinationBoutique(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500"
                  >
                    <option value="">Sélectionner une boutique</option>
                    {boutiques.filter(b => b.id !== (userBoutique === 'Toutes' ? 'Boutique 1' : userBoutique)).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                    {userBoutique !== 'Toutes' && userBoutique !== 'Boutique 1' && <option value="Boutique 1">Maison Mère</option>}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                <h4 className="font-bold text-gray-900 mb-4">Ajouter des articles</h4>
                <div className="flex flex-col md:flex-row gap-3">
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      setSelectedVariant('');
                    }}
                    className="flex-1 p-2.5 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.filter(p => !p.deleted).map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {userBoutique === 'Toutes' ? p.stock : (p.boutiqueStock?.[userBoutique] || 0)})</option>
                    ))}
                  </select>
                  {selectedProduct && products.find(p => p.id === selectedProduct)?.variants && products.find(p => p.id === selectedProduct)!.variants!.length > 0 && (
                    <select
                      value={selectedVariant}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      className="w-full md:w-48 p-2.5 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500"
                    >
                      <option value="">Variante (Optionnel)</option>
                      {products.find(p => p.id === selectedProduct)?.variants?.map(v => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    placeholder="Qté"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full md:w-32 p-2.5 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500"
                  />
                  <button
                    onClick={handleAddItem}
                    className="bg-farm-100 text-farm-700 hover:bg-farm-200 px-4 py-2.5 rounded-xl font-bold transition-colors whitespace-nowrap"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {transferItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Articles à transférer</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="p-3 font-semibold text-gray-600">Produit</th>
                          <th className="p-3 font-semibold text-gray-600">Variante</th>
                          <th className="p-3 font-semibold text-gray-600 text-right">Quantité</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="p-3 text-gray-900">{item.productName}</td>
                            <td className="p-3 text-gray-500">{item.variantName || '-'}</td>
                            <td className="p-3 text-gray-900 text-right font-medium">{item.quantity}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-gray-200 focus:border-farm-500 focus:ring-farm-500"
                  rows={3}
                  placeholder="Informations complémentaires..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTransfer}
                disabled={transferItems.length === 0 || !destinationBoutique}
                className="bg-farm-600 hover:bg-farm-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Créer le transfert
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* View/Validate Modal */}
      {viewingTransfer && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col printable-content">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-display flex items-center gap-3">
                  Détails du Transfert
                  {getStatusBadge(viewingTransfer.status)}
                  {userBoutique !== 'Toutes' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      userBoutiqueName === viewingTransfer.destinationBoutique 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {userBoutiqueName === viewingTransfer.destinationBoutique ? 'Entrant' : 'Sortant'}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Réf: {viewingTransfer.reference}</p>
              </div>
              <button onClick={() => setViewingTransfer(null)} className="text-gray-400 hover:text-gray-600 print:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Source</p>
                  <p className="font-bold text-gray-900">{getBoutiqueName(viewingTransfer.sourceBoutique)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Destination</p>
                  <p className="font-bold text-gray-900">{getBoutiqueName(viewingTransfer.destinationBoutique)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-gray-900">{new Date(viewingTransfer.date).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Créé par</p>
                  <p className="font-medium text-gray-900">{viewingTransfer.createdBy}</p>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 mb-3">Articles</h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-3 font-semibold text-gray-600">Produit</th>
                      <th className="p-3 font-semibold text-gray-600">Variante</th>
                      <th className="p-3 font-semibold text-gray-600 text-right">Quantité</th>
                      <th className="p-3 font-semibold text-gray-600 text-center">Reçu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingTransfer.items.map((item, idx) => (
                      <tr key={idx} className={`border-b border-gray-100 last:border-0 transition-colors ${
                        viewingTransfer.status !== 'PENDING' && !item.validated 
                          ? 'bg-red-50' 
                          : 'hover:bg-gray-50'
                      }`}>
                        <td className="p-3 text-gray-900">
                          <div className="flex flex-col">
                            <span>{item.productName}</span>
                            {viewingTransfer.status !== 'PENDING' && !item.validated && (
                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Non validé</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-500">{item.variantName || '-'}</td>
                        <td className="p-3 text-gray-900 text-right font-medium">{item.quantity}</td>
                        <td className="p-3 text-center">
                          {viewingTransfer.status === 'PENDING' && userBoutique === viewingTransfer.destinationBoutique ? (
                            <button 
                              onClick={() => {
                                const newItems = [...viewingTransfer.items];
                                newItems[idx] = { ...newItems[idx], validated: !newItems[idx].validated };
                                setViewingTransfer({ ...viewingTransfer, items: newItems });
                              }}
                              className={`p-1.5 rounded-lg transition-all ${item.validated ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className={`inline-flex p-1 rounded-full ${item.validated ? 'text-green-600' : 'text-gray-300'}`}>
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewingTransfer.notes && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{viewingTransfer.notes}</p>
                </div>
              )}
            </div>

            {/* Actions for Destination Boutique if PENDING */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              
              {viewingTransfer.status === 'PENDING' && (
                <>
                  {userBoutique === viewingTransfer.destinationBoutique && userBoutique !== 'Toutes' && userBoutique !== 'Boutique 1' && (
                    <>
                      <button
                        onClick={() => handleRejectTransfer(viewingTransfer)}
                        className="px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Rejeter
                      </button>
                      <button
                        onClick={() => handleValidateTransfer(viewingTransfer)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                      >
                        <Check className="w-4 h-4" /> Valider la réception
                      </button>
                    </>
                  )}
                  {(userBoutique === viewingTransfer.sourceBoutique || userBoutique === 'Toutes' || userBoutique === 'Boutique 1') && (
                    <button
                      onClick={() => handleCancelTransfer(viewingTransfer)}
                      className="px-5 py-2.5 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" /> Annuler le transfert
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Partial Confirmation Modal */}
      {confirmPartialTransfer && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Validation Partielle</h3>
              <p className="text-gray-600 mb-6">
                ALERTE : {confirmPartialTransfer.items.filter(i => !i.validated).length} article(s) ne sont pas cochés.
                <br /><br />
                Voulez-vous valider ce bon <strong>PARTIELLEMENT</strong> ?
                <br />
                Les articles non cochés ne seront pas ajoutés au stock.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleValidateTransfer(confirmPartialTransfer, true)}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
                >
                  Oui, Valider Partiellement
                </button>
                <button
                  onClick={() => setConfirmPartialTransfer(null)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
};
