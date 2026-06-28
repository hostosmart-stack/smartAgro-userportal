import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, StockMovement, ProductVariant, Boutique } from '../types';
import { Search, Plus, Edit2, Trash2, Save, Filter, Package, FlaskConical, X, RefreshCw, History, Tag, TrendingUp, Wallet, Coins, Scale, Loader2, Factory, ScrollText, Printer, CornerDownRight, ArrowRightLeft, ChevronDown, CheckCircle } from 'lucide-react';
import { saveProduct, deleteProduct, clearAllFormulas } from '../services/db';
import { useNotifications } from './ui/Notifications';
import { formatStock } from '../utils';
import { useLanguage } from '../contexts/LanguageContext';

interface InventoryProps {
  products: Product[];
  userRole?: string;
  userPermissions?: string[];
  userBoutique?: string;
  boutiques?: Boutique[];
  onNavigate?: (view: string) => void;
  onTransferProduct?: (productId: string) => void;
  currentProvenderieId?: string;
  categories?: string[];
}

interface MixIngredient {
  product: Product;
  variantName?: string;
  weight: number; // kg
}

export const Inventory: React.FC<InventoryProps> = ({ products, userRole = 'Admin', userPermissions = [], userBoutique = 'Toutes', boutiques = [], onNavigate, onTransferProduct, currentProvenderieId, categories = [] }) => {
  const { t } = useLanguage();
  const { notify } = useNotifications();
  
  const isInventoryAdmin = userRole === 'Admin' || 
                           userRole.toLowerCase().trim() === 'superadmin' || 
                           userRole.toLowerCase().trim() === 'system-admin' || 
                           userRole.toLowerCase().trim().includes('administrateur');
                           
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');

  const categoryGroups = useMemo(() => ({
    'raw_materials': { label: t('inventory.raw_materials'), categories: [Category.RAW_MATERIALS] },
    'food': { label: t('inventory.food'), categories: [Category.POULTRY, Category.LIVESTOCK] },
    'health': { label: t('inventory.health'), categories: [Category.MEDICINE] },
    'equipment': { label: t('inventory.equipment'), categories: [Category.EQUIPMENT, Category.OTHER] }
  }), [t]);
  
  // States for Modals
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [restockingProductId, setRestockingProductId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockAssignmentModal, setStockAssignmentModal] = useState<{
    isOpen: boolean;
    existingStock: number;
    variants: ProductVariant[];
    assignedStocks: { [key: string]: number };
  } | null>(null);

  // Forms
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  // Enhanced Restock Form
  const [restockForm, setRestockForm] = useState({ 
    quantity: 0, 
    note: '', 
    date: new Date().toISOString().split('T')[0],
    buyingPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    variantName: '' // Added for variant selection
  });
  
  // Variant Inputs
  const [variantName, setVariantName] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantWholesalePrice, setVariantWholesalePrice] = useState('');
  const [variantCostPrice, setVariantCostPrice] = useState('');
  const [variantLowStockThreshold, setVariantLowStockThreshold] = useState('');

  // Mixing State
  const [isMixing, setIsMixing] = useState(false);
  const [mixIngredients, setMixIngredients] = useState<MixIngredient[]>([]);
  const [mixName, setMixName] = useState('');
  const [mixCategory, setMixCategory] = useState<Category>(Category.POULTRY);
  const [mixSellingPrice, setMixSellingPrice] = useState<string>('');
  const [mixCostPriceInput, setMixCostPriceInput] = useState<string>('');
  const [isCostPriceManuallyEdited, setIsCostPriceManuallyEdited] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [mixerTab, setMixerTab] = useState<'production' | 'formulas' | 'history'>('production');
  const [showProductionSummary, setShowProductionSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const viewingProduct = useMemo(() => products.find(p => p.id === viewingProductId), [products, viewingProductId]);
  const restockingProduct = useMemo(() => products.find(p => p.id === restockingProductId), [products, restockingProductId]);
  const [historyFilterVariant, setHistoryFilterVariant] = useState<string>('All');

  useEffect(() => {
    setHistoryFilterVariant('All');
  }, [viewingProductId]);

  const isMainBoutique = userBoutique === (boutiques[0]?.id || 'Boutique 1') || userBoutique === 'Toutes';

  const filteredProducts = products.filter(p => {
    const search = (searchTerm || '').toLowerCase();
    const matchesSearch = (p.name || '').toLowerCase().includes(search) || 
                          p.variants?.some(v => (v.name || '').toLowerCase().includes(search));
    
    let matchesCat = true;
    if (activeGroup !== 'all') {
      const group = categoryGroups[activeGroup as keyof typeof categoryGroups];
      if (group) {
        matchesCat = group.categories.includes(p.category) || false;
      } else {
        matchesCat = p.category === activeGroup;
      }
    }
    return matchesSearch && matchesCat;
  });

  const [isEditingVariant, setIsEditingVariant] = useState(false);
  const [originalVariantName, setOriginalVariantName] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // --- CRUD Handlers ---

  const handleEditClick = (product: Product, targetVariantName?: string) => {
    setEditingId(product.id);
    setEditForm({ ...product });
    setIsAdding(false);
    setIsMixing(false);
    setViewingProductId(null);
    
    if (targetVariantName) {
        setIsEditingVariant(true);
        setOriginalVariantName(targetVariantName);
        const variant = product.variants?.find(v => v.name === targetVariantName);
        if (variant) {
            setVariantName(variant.name);
            setVariantPrice(variant.price.toString());
            setVariantWholesalePrice(variant.wholesalePrice?.toString() || '');
            setVariantCostPrice(variant.costPrice?.toString() || '');
            setVariantLowStockThreshold(variant.lowStockThreshold?.toString() || '');
        }
    } else {
        setIsEditingVariant(false);
        setVariantName('');
        setVariantPrice('');
        setVariantWholesalePrice('');
        setVariantCostPrice('');
        setVariantLowStockThreshold('');
    }
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setIsMixing(false);
    setIsEditingVariant(false);
    setViewingProductId(null);
    setEditForm({
      name: '',
      category: (categories[0] as Category) || Category.POULTRY,
      price: 0,
      costPrice: 0,
      stock: 0,
      unit: '',
      variants: [],
      history: []
    });
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    // Validation
    if (!editForm.name || !editForm.name.trim()) {
        notify(t('inventory.product_name_required'), "error");
        return;
    }

    if (!editForm.category) {
        notify("La catégorie est requise", "error");
        return;
    }

    if (!editForm.unit || !editForm.unit.trim()) {
        notify("Veuillez sélectionner une unité de stock (ex: kg, sac)", "error");
        return;
    }

    if (editForm.price !== undefined && (isNaN(Number(editForm.price)) || Number(editForm.price) < 0)) {
        notify("Le prix de vente par défaut doit être supérieur ou égal à 0", "error");
        return;
    }

    if (editForm.costPrice !== undefined && (isNaN(Number(editForm.costPrice)) || Number(editForm.costPrice) < 0)) {
        notify("Le prix d'achat par défaut doit être supérieur ou égal à 0", "error");
        return;
    }

    if (editForm.stock !== undefined && (isNaN(Number(editForm.stock)) || Number(editForm.stock) < 0)) {
        notify("Le stock initial doit être supérieur ou égal à 0", "error");
        return;
    }

    setIsSubmitting(true);
    try {
      if (isEditingVariant && editingId) {
          // Saving specific variant changes
          const trimmedName = variantName.trim();
          if (!trimmedName) {
              notify(t('inventory.variant_name_required'), "error");
              setIsSubmitting(false);
              return;
          }
          
          const price = parseFloat(variantPrice);
          if (isNaN(price)) {
              notify(t('inventory.variant_price_invalid'), "error");
              setIsSubmitting(false);
              return;
          }

          const currentVariants = editForm.variants || [];
          const updatedVariants = [...currentVariants];
          
          // Find index using the ORIGINAL name to support renaming
          const existingIndex = updatedVariants.findIndex(v => (v.name || '').toLowerCase() === (originalVariantName || '').toLowerCase());
          
            const newVariant: ProductVariant = {
            name: trimmedName,
            price: price,
            wholesalePrice: variantWholesalePrice ? parseFloat(variantWholesalePrice) : undefined,
            costPrice: variantCostPrice ? parseFloat(variantCostPrice) : undefined,
            stock: existingIndex >= 0 ? updatedVariants[existingIndex].stock : 0,
            lowStockThreshold: variantLowStockThreshold ? parseFloat(variantLowStockThreshold) : undefined
          };

          if (existingIndex >= 0) {
              updatedVariants[existingIndex] = newVariant;
          } else {
              // If original not found (shouldn't happen), push as new
              updatedVariants.push(newVariant);
          }
          
          const updatedProduct = { ...editForm, variants: updatedVariants } as Product;
          await saveProduct(updatedProduct);
          notify("Variante modifiée", "success");
          setEditingId(null);
          setIsEditingVariant(false);
          setOriginalVariantName('');

      } else if (isAdding) {
        const newProduct: Product = {
          id: Math.random().toString(36).substr(2, 9),
          name: editForm.name.trim(),
          category: editForm.category as Category,
          price: Number(editForm.price) || 0,
          costPrice: Number(editForm.costPrice) || 0,
          stock: Number(editForm.stock) || 0,
          lowStockThreshold: Number(editForm.lowStockThreshold) || 5,
          unit: editForm.unit || 'pièce',
          description: editForm.description || '',
          variants: editForm.variants || [],
          provenderieId: currentProvenderieId,
          history: [{
             id: Date.now().toString(),
             date: new Date().toISOString(),
             type: 'AJUSTEMENT',
             quantity: Number(editForm.stock) || 0,
             note: t('inventory.initial_stock'),
             unitCost: Number(editForm.costPrice) || 0
          }]
        };
        await saveProduct(newProduct);
        notify("Produit créé avec succès", "success");
        setIsAdding(false);
      } else if (editingId) {
        const originalProduct = products.find(p => p.id === editingId);
        const originallyHasNoVariants = !originalProduct?.variants || originalProduct.variants.length === 0;
        const nowHasVariants = editForm.variants && editForm.variants.length > 0;
        const hasExistingStock = originalProduct && originalProduct.stock > 0;

        if (originallyHasNoVariants && nowHasVariants && hasExistingStock) {
          const currentVariantStocksSum = editForm.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
          if (currentVariantStocksSum !== originalProduct.stock) {
            const initialAssignments: { [key: string]: number } = {};
            editForm.variants.forEach(v => {
              initialAssignments[v.name] = 0;
            });
            if (editForm.variants.length === 1) {
              initialAssignments[editForm.variants[0].name] = originalProduct.stock;
            }
            setStockAssignmentModal({
              isOpen: true,
              existingStock: originalProduct.stock,
              variants: editForm.variants,
              assignedStocks: initialAssignments
            });
            setIsSubmitting(false);
            return;
          }
        }

        const updated = { 
            ...editForm,
            name: editForm.name.trim(),
            provenderieId: editForm.provenderieId || currentProvenderieId
        } as Product;
        await saveProduct(updated);
        notify("Modifications enregistrées", "success");
        setEditingId(null);
      }
    } catch (e) {
      notify("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStockAssignment = async () => {
    if (!stockAssignmentModal || !editingId) return;
    const { existingStock, assignedStocks, variants } = stockAssignmentModal;
    
    const sumAssigned = Object.values(assignedStocks).reduce((sum, s) => sum + s, 0);
    if (Math.abs(sumAssigned - existingStock) > 0.0001) {
      notify(`La somme des stocks attribués (${sumAssigned}) doit être exactement égale au stock existant (${existingStock})`, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedVariants = variants.map(v => ({
        ...v,
        stock: assignedStocks[v.name] || 0
      }));

      const updated = {
        ...editForm,
        name: editForm.name.trim(),
        variants: updatedVariants,
        provenderieId: editForm.provenderieId || currentProvenderieId
      } as Product;

      await saveProduct(updated);
      notify("Modifications enregistrées avec répartition du stock", "success");
      setStockAssignmentModal(null);
      setEditingId(null);
    } catch (e) {
      notify("Erreur lors de la répartition", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (product: Product) => {
      setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
      if (!productToDelete) return;
      if(isSubmitting) return;
      setIsSubmitting(true);
      try {
        await deleteProduct(productToDelete.id);
        notify("Produit supprimé", "info");
        setViewingProductId(null);
      } catch (e) {
        notify("Erreur de suppression", "error");
      } finally {
        setIsSubmitting(false);
        setProductToDelete(null);
      }
  };

  const cancelDeleteProduct = () => {
      setProductToDelete(null);
  };

  const addVariant = () => {
    const trimmedName = variantName.trim();
    if (!trimmedName) {
      notify("Veuillez saisir un nom pour la variante (ex: Sac 50kg)", "error");
      return;
    }

    const priceNum = variantPrice ? parseFloat(variantPrice) : (editForm.price || 0);
    if (isNaN(priceNum) || priceNum < 0) {
      notify("Le prix de vente de la variante doit être supérieur ou égal à 0", "error");
      return;
    }

    const currentVariants = editForm.variants || [];
    const existingIndex = currentVariants.findIndex(v => (v.name || '').toLowerCase() === trimmedName.toLowerCase());

    const newVariant: ProductVariant = {
      name: trimmedName,
      price: priceNum,
      wholesalePrice: variantWholesalePrice ? parseFloat(variantWholesalePrice) : undefined,
      costPrice: variantCostPrice ? parseFloat(variantCostPrice) : undefined,
      stock: existingIndex >= 0 ? currentVariants[existingIndex].stock : 0,
      lowStockThreshold: variantLowStockThreshold ? parseFloat(variantLowStockThreshold) : undefined
    };

    let updatedVariants;
    if (existingIndex >= 0) {
        updatedVariants = [...currentVariants];
        updatedVariants[existingIndex] = newVariant;
    } else {
        updatedVariants = [...currentVariants, newVariant];
    }

    setEditForm({ ...editForm, variants: updatedVariants });
    setVariantName('');
    setVariantPrice('');
    setVariantWholesalePrice('');
    setVariantCostPrice('');
    setVariantLowStockThreshold('');
  };

  const removeVariant = (index: number) => {
    const currentVariants = editForm.variants || [];
    setEditForm({ ...editForm, variants: currentVariants.filter((_, i) => i !== index) });
  };

  // --- Restock Logic ---
  const handleRestockSubmit = async () => {
    if (isSubmitting) return;

    if (!restockingProductId) {
       notify("Erreur: Aucun produit sélectionné pour le réapprovisionnement", "error");
       return;
    }

    if (!restockForm.quantity || isNaN(restockForm.quantity) || restockForm.quantity <= 0) {
       notify("Veuillez saisir une quantité supérieure à 0", "error");
       return;
    }

    if (!restockForm.date) {
       notify("Veuillez spécifier une date de réapprovisionnement", "error");
       return;
    }

    if (restockForm.buyingPrice && (isNaN(parseFloat(restockForm.buyingPrice)) || parseFloat(restockForm.buyingPrice) < 0)) {
       notify("Le prix d'achat doit être supérieur ou égal à 0", "error");
       return;
    }

    if (restockForm.sellingPrice && (isNaN(parseFloat(restockForm.sellingPrice)) || parseFloat(restockForm.sellingPrice) < 0)) {
       notify("Le prix de vente doit être supérieur ou égal à 0", "error");
       return;
    }

    if (restockForm.wholesalePrice && (isNaN(parseFloat(restockForm.wholesalePrice)) || parseFloat(restockForm.wholesalePrice) < 0)) {
       notify("Le prix de gros doit être supérieur ou égal à 0", "error");
       return;
    }
    
    setIsSubmitting(true);
    try {
      const p = products.find(prod => prod.id === restockingProductId);
      if (!p) {
         notify("Erreur: Le produit sélectionné n'existe pas", "error");
         setIsSubmitting(false);
         return;
      }

      const roundedQty = Math.round(restockForm.quantity * 100) / 100;
      const newCostPrice = parseFloat(restockForm.buyingPrice) || 0;
      const newSellingPrice = parseFloat(restockForm.sellingPrice) || 0;
      const newWholesalePrice = parseFloat(restockForm.wholesalePrice) || 0;

      const newMovement: StockMovement = {
          id: Date.now().toString(),
          date: restockForm.date || new Date().toISOString(),
          type: 'ACHAT',
          quantity: roundedQty,
          note: restockForm.note || 'Réapprovisionnement',
          unitCost: newCostPrice,
          variantName: restockForm.variantName || undefined
      };
      const updatedHistory = [newMovement, ...(p.history || [])];
      
      let updatedProduct: Product;

      if (restockForm.variantName) {
         // Update Variant Stock
         const updatedVariants = p.variants?.map(v => {
             if (v.name === restockForm.variantName) {
                 if (isMainBoutique) {
                     return {
                         ...v,
                         stock: (v.stock || 0) + roundedQty,
                         price: newSellingPrice || v.price,
                         wholesalePrice: newWholesalePrice || v.wholesalePrice,
                         costPrice: newCostPrice || v.costPrice
                     };
                 } else {
                     return {
                         ...v,
                         boutiqueStock: {
                             ...(v.boutiqueStock || {}),
                             [userBoutique]: (v.boutiqueStock?.[userBoutique] || 0) + roundedQty
                         },
                         price: newSellingPrice || v.price,
                         wholesalePrice: newWholesalePrice || v.wholesalePrice,
                         costPrice: newCostPrice || v.costPrice
                     };
                 }
             }
             return v;
         });
         updatedProduct = {
             ...p,
             variants: updatedVariants,
             history: updatedHistory
         };
      } else {
         // Update Product Stock
         if (isMainBoutique) {
             updatedProduct = { 
                ...p, 
                stock: p.stock + roundedQty, 
                price: newSellingPrice || p.price,
                wholesalePrice: newWholesalePrice || p.wholesalePrice,
                costPrice: newCostPrice || p.costPrice, 
                history: updatedHistory 
            };
         } else {
             updatedProduct = {
                ...p,
                boutiqueStock: {
                    ...(p.boutiqueStock || {}),
                    [userBoutique]: (p.boutiqueStock?.[userBoutique] || 0) + roundedQty
                },
                price: newSellingPrice || p.price,
                wholesalePrice: newWholesalePrice || p.wholesalePrice,
                costPrice: newCostPrice || p.costPrice,
                history: updatedHistory
             };
         }
      }

      await saveProduct(updatedProduct);
      notify("Stock et prix mis à jour", "success");
      setRestockingProductId(null);
      setRestockForm({ quantity: 0, note: '', date: new Date().toISOString().split('T')[0], buyingPrice: '', sellingPrice: '', wholesalePrice: '', variantName: '' });
    } catch (e) {
      notify("Erreur de mise à jour stock", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRestockModal = (product: Product, variantName?: string) => {
    setRestockingProductId(product.id);
    
    let buyingPrice = product.costPrice ? product.costPrice.toString() : '';
    let sellingPrice = product.price ? product.price.toString() : '';
    let wholesalePrice = product.wholesalePrice ? product.wholesalePrice.toString() : '';

    if (variantName) {
        const variant = product.variants?.find(v => v.name === variantName);
        if (variant) {
            buyingPrice = variant.costPrice ? variant.costPrice.toString() : '';
            sellingPrice = variant.price ? variant.price.toString() : '';
            wholesalePrice = variant.wholesalePrice ? variant.wholesalePrice.toString() : '';
        }
    }

    setRestockForm({
        quantity: 0,
        note: '',
        date: new Date().toISOString().split('T')[0],
        buyingPrice,
        sellingPrice,
        wholesalePrice,
        variantName: variantName || ''
    });
  };

  // --- Mixing Logic ---
  const rawMaterialOptions: { product: Product, variantName?: string, stock: number, name: string, id: string }[] = [];
  products.filter(p => p.category === Category.RAW_MATERIALS).forEach(p => {
      const hasVariants = p.variants && p.variants.length > 0;
      
      if (hasVariants) {
          p.variants!.forEach(v => {
              if ((v.stock || 0) > 0) {
                  rawMaterialOptions.push({ product: p, variantName: v.name, stock: v.stock || 0, name: `${p.name} - ${v.name}`, id: `${p.id}-${v.name}` });
              }
          });
      } else {
          if (p.stock > 0) {
              rawMaterialOptions.push({ product: p, stock: p.stock, name: p.name, id: p.id });
          }
      }
  });

  const existingFormulas = products.filter(p => p.category === Category.POULTRY || p.category === Category.LIVESTOCK);
  const filteredRawMaterials = rawMaterialOptions.filter(p => (p.name || '').toLowerCase().includes((ingredientSearch || '').toLowerCase()));

  // Load recipe from existing formula
  const loadFormula = (formulaId: string) => {
      const formula = products.find(p => p.id === formulaId);
      if (formula && formula.recipe) {
          setMixName(formula.name);
          setMixCategory(formula.category);
          // Map recipe ingredients to current products
          const ingredients = formula.recipe.map(item => {
              const prod = products.find(p => p.id === item.productId);
              return prod ? { product: prod, variantName: item.variantName, weight: item.weight } : null;
          }).filter(i => i !== null) as MixIngredient[];
          setMixIngredients(ingredients);
          if (formula.costPrice !== undefined) {
              setMixCostPriceInput(formula.costPrice.toString());
              setIsCostPriceManuallyEdited(true);
          } else {
              setMixCostPriceInput('');
              setIsCostPriceManuallyEdited(false);
          }
      }
  };

  const addToMix = (option: { product: Product, variantName?: string }) => {
    if (mixIngredients.find(i => i.product.id === option.product.id && i.variantName === option.variantName)) return;
    setMixIngredients([...mixIngredients, { product: option.product, variantName: option.variantName, weight: 1 }]);
  };

  const updateIngredientWeight = (id: string, variantName: string | undefined, weight: number) => {
    setMixIngredients(prev => prev.map(i => (i.product.id === id && i.variantName === variantName) ? { ...i, weight } : i));
  };

  const removeIngredient = (id: string, variantName: string | undefined) => {
    setMixIngredients(prev => prev.filter(i => !(i.product.id === id && i.variantName === variantName)));
  };

  const mixTotalWeight = useMemo(() => mixIngredients.reduce((acc, curr) => acc + curr.weight, 0), [mixIngredients]);
  // Use costPrice for accurate production cost. Fallback to price if costPrice is missing (though it should be fixed by DB migration)
  const mixCostPrice = useMemo(() => mixIngredients.reduce((acc, curr) => {
      const cost = curr.variantName 
          ? (curr.product.variants?.find(v => v.name === curr.variantName)?.costPrice || curr.product.costPrice || curr.product.price)
          : (curr.product.costPrice || curr.product.price);
      return acc + (cost * curr.weight);
  }, 0), [mixIngredients]);
  const mixCostPerKg = mixTotalWeight > 0 ? mixCostPrice / mixTotalWeight : 0;
  
  useEffect(() => {
    if (!isCostPriceManuallyEdited && mixCostPerKg > 0) {
      setMixCostPriceInput(mixCostPerKg.toFixed(2));
    }
  }, [mixCostPerKg, isCostPriceManuallyEdited]);

  // Suggested Prices
  const suggestedWholesale = Math.ceil(mixCostPerKg * 1.15 / 5) * 5; // +15% margin, rounded to nearest 5
  const suggestedRetail = Math.ceil(mixCostPerKg * 1.30 / 5) * 5; // +30% margin

  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);

  // ...

  const resetMixer = () => {
      setMixName('');
      setMixIngredients([]);
      setMixCategory(Category.POULTRY);
      setEditingFormulaId(null);
      setIsEditingFormula(false);
      setSelectedProductionFormulaId(null);
      setMixCostPriceInput('');
      setIsCostPriceManuallyEdited(false);
  };

  const startNewFormula = () => {
      resetMixer();
      setIsEditingFormula(true);
  };

  const startEditFormula = (formulaId: string) => {
      const formula = products.find(p => p.id === formulaId);
      if (formula) {
          setMixName(formula.name);
          loadFormula(formulaId);
          setEditingFormulaId(formulaId);
          setIsEditingFormula(true);
      }
  };

  const handleSaveFormula = async () => {
    if (isSubmitting) return;
    if (!mixName || mixIngredients.length === 0) {
      notify("Nom ou ingrédients manquants", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let existingFormula: Product | undefined;

      if (editingFormulaId) {
          existingFormula = products.find(p => p.id === editingFormulaId);
      } else {
          // Check if name already exists to prevent duplicates or update by name
          existingFormula = products.find(p => (p.name || '').toLowerCase() === (mixName || '').toLowerCase() && (p.category === Category.POULTRY || p.category === Category.LIVESTOCK));
      }

      const recipe = mixIngredients.map(i => ({ productId: i.product.id, variantName: i.variantName, weight: i.weight }));
      
      const finalCostPrice = mixCostPriceInput ? parseFloat(mixCostPriceInput) : mixCostPerKg;
      let productToSave: Product;

      if (existingFormula) {
          productToSave = {
              ...existingFormula,
              name: mixName, // Update name in case it changed
              category: mixCategory, // Update category as selected by the user
              recipe: recipe,
              costPrice: finalCostPrice, // Save calculated or manual cost
              // We don't change stock here
          };
          notify("Recette mise à jour", "success");
      } else {
          productToSave = {
            id: `FORM-${Date.now().toString().slice(-6)}`,
            name: mixName,
            category: mixCategory, // Use dynamic mixCategory
            price: 0,
            wholesalePrice: 0,
            costPrice: finalCostPrice, // Save calculated or manual cost
            stock: 0,
            unit: 'kg',
            description: `Formule maison.`,
            variants: [],
            recipe: recipe,
            provenderieId: currentProvenderieId,
            history: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              type: 'AJUSTEMENT',
              quantity: 0,
              note: 'Création Recette',
              unitCost: finalCostPrice
            }]
          };
          notify("Nouvelle formule créée", "success");
      }

      await saveProduct(productToSave);
      resetMixer(); // Exit edit mode
    } catch (e) {
      notify("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mixSearch, setMixSearch] = useState('');
  const [selectedProductionFormulaId, setSelectedProductionFormulaId] = useState<string | null>(null);
  const [targetProductionWeight, setTargetProductionWeight] = useState<number>(100);
  const [productionUnit, setProductionUnit] = useState<'kg' | 'tonnes'>('kg');
  const [formulaToDelete, setFormulaToDelete] = useState<Product | null>(null);

  const handleDeleteFormula = async (formulaId?: string) => {
      let existingFormula: Product | undefined;
      const idToDelete = formulaId || editingFormulaId;

      if (idToDelete) {
           existingFormula = products.find(p => p.id === idToDelete);
      } else {
           existingFormula = products.find(p => (p.name || '').toLowerCase() === (mixName || '').toLowerCase());
      }

      if (!existingFormula) return;
      
      setFormulaToDelete(existingFormula);
  };

  const confirmDeleteFormula = async () => {
      if (!formulaToDelete) return;
      
      setIsSubmitting(true);
      try {
          await deleteProduct(formulaToDelete.id);
          notify("Formule supprimée", "info");
          if (editingFormulaId === formulaToDelete.id) {
              resetMixer();
          }
      } catch (e) {
          notify("Erreur suppression", "error");
      } finally {
          setIsSubmitting(false);
          setFormulaToDelete(null);
      }
  };

  const cancelDeleteFormula = () => {
      setFormulaToDelete(null);
  };

  const openProductionSummary = () => {
    if (!mixName || mixIngredients.length === 0) {
      notify("Nom ou ingrédients manquants", "error");
      return;
    }

    if (targetProductionWeight <= 0) {
        notify("La quantité à produire doit être supérieure à 0", "error");
        return;
    }

    setShowProductionSummary(true);
  };

  const handlePrintSummary = () => {
      const content = summaryRef.current;
      if (content) {
          const printWindow = window.open('', '', 'height=600,width=800');
          if (printWindow) {
              printWindow.document.write('<html><head><title>Résumé Production</title>');
              printWindow.document.write('<style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; } .total { font-weight: bold; margin-top: 20px; text-align: right; }</style>');
              printWindow.document.write('</head><body>');
              printWindow.document.write(content.innerHTML);
              printWindow.document.write('</body></html>');
              printWindow.document.close();
              printWindow.print();
          }
      }
  };

  const confirmProduction = async () => {
    if (isSubmitting) return;

    // Check for sufficient stock BEFORE starting transaction
    const baseTotalWeight = mixIngredients.reduce((acc, curr) => acc + curr.weight, 0);
    const targetWeightInKg = productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight;
    
    if (baseTotalWeight <= 0) {
        notify("La formule est vide ou le poids total est 0", "error");
        return;
    }

    const multiplier = targetWeightInKg / baseTotalWeight;
    const missingIngredients: string[] = [];

    for (const item of mixIngredients) {
        const p = products.find(prod => prod.id === item.product.id);
        if (p) {
            const requiredWeight = item.weight * multiplier;
            let currentStock = 0;
            
            if (item.variantName) {
                const v = p.variants?.find(v => v.name === item.variantName);
                currentStock = v?.stock || 0;
            } else {
                currentStock = p.stock || 0;
            }

            // Allow small float precision errors, but generally strict
            if (currentStock < requiredWeight - 0.001) {
                missingIngredients.push(`${p.name} ${item.variantName ? `(${item.variantName})` : ''}`);
            }
        }
    }

    if (missingIngredients.length > 0) {
        notify(`Stock insuffisant pour: ${missingIngredients.join(', ')}. Production impossible.`, "error");
        return;
    }

    setIsSubmitting(true);
    try {
      let existingFormula: Product | undefined;
      
      if (selectedProductionFormulaId) {
          existingFormula = products.find(p => p.id === selectedProductionFormulaId);
      } else {
          existingFormula = products.find(p => (p.name || '').toLowerCase() === (mixName || '').toLowerCase() && (p.category === Category.POULTRY || p.category === Category.LIVESTOCK));
      }

      const recipe = mixIngredients.map(i => ({ productId: i.product.id, variantName: i.variantName, weight: i.weight }));
      
      let productToSave: Product;

      const finalCostPrice = existingFormula?.costPrice || mixCostPerKg;

      if (existingFormula) {
          const newMovement: StockMovement = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              type: 'PRODUCTION',
              quantity: targetWeightInKg,
              note: `Production depuis Mélangeur (${targetProductionWeight} ${productionUnit})`,
              unitCost: finalCostPrice
          };
          
          productToSave = {
              ...existingFormula,
              stock: existingFormula.stock + targetWeightInKg,
              recipe: recipe,
              costPrice: finalCostPrice, // Update calculated or manual production cost
              history: [newMovement, ...(existingFormula.history || [])]
          };
      } else {
          productToSave = {
            id: `FORM-${Date.now().toString().slice(-6)}`,
            name: mixName,
            category: mixCategory,
            price: 0,
            wholesalePrice: 0,
            costPrice: finalCostPrice, // Update calculated or manual production cost
            stock: targetWeightInKg,
            unit: 'kg',
            description: `Formule maison.`,
            variants: [],
            recipe: recipe,
            provenderieId: currentProvenderieId,
            history: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              type: 'PRODUCTION',
              quantity: targetWeightInKg,
              note: `Production Initiale (${targetProductionWeight} ${productionUnit})`,
              unitCost: finalCostPrice
            }]
          };
      }

      await saveProduct(productToSave);

      for (const item of mixIngredients) {
        const p = products.find(prod => prod.id === item.product.id);
        if (p) {
           const requiredWeight = item.weight * multiplier;
           const movement: StockMovement = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              type: 'PRODUCTION',
              quantity: -requiredWeight,
              note: `Utilisé pour ${mixName} (${targetProductionWeight} ${productionUnit})`,
              variantName: item.variantName
           };
           
           let updatedP = { ...p };
           if (item.variantName) {
               const vIdx = updatedP.variants?.findIndex(v => v.name === item.variantName);
               if (vIdx !== undefined && vIdx >= 0 && updatedP.variants) {
                   updatedP.variants[vIdx] = {
                       ...updatedP.variants[vIdx],
                       stock: (updatedP.variants[vIdx].stock || 0) - requiredWeight
                   };
               }
           } else {
               updatedP.stock -= requiredWeight;
           }
           updatedP.history = [movement, ...(updatedP.history || [])];
           await saveProduct(updatedP);
        }
      }

      notify(`Production de ${targetProductionWeight} ${productionUnit} de ${mixName} enregistrée !`, "success");
      resetMixer();
      setSelectedProductionFormulaId(null);
      setTargetProductionWeight(100);
      setProductionUnit('kg');
      setShowProductionSummary(false);
    } catch (e) {
      notify("Erreur lors de la production", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERERS ---

  if (isMixing) {
    return (
      <div className="flex flex-col h-full bg-gray-50 animate-in fade-in duration-200">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4">
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                <div className="bg-farm-100 p-2 rounded-lg shrink-0">
                    <FlaskConical className="w-5 h-5 md:w-6 md:h-6 text-farm-600" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{t('inventory.mixer')}</h2>
                    <p className="text-xs md:text-sm text-gray-500 truncate">{t('inventory.mixer_subtitle')}</p>
                </div>
                <button 
                    onClick={() => {
                        setIsMixing(false);
                        resetMixer();
                    }}
                    className="sm:hidden ml-auto p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl dark:bg-gray-800 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setMixerTab('production')}
                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        mixerTab === 'production' 
                        ? 'bg-white text-farm-700 shadow-sm dark:bg-gray-700 dark:text-farm-400' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <Factory className="w-4 h-4" />
                    {t('inventory.production')}
                </button>
                <button
                    onClick={() => setMixerTab('formulas')}
                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        mixerTab === 'formulas' 
                        ? 'bg-white text-farm-700 shadow-sm dark:bg-gray-700 dark:text-farm-400' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <ScrollText className="w-4 h-4" />
                    {t('inventory.formulas')}
                </button>
                <button
                    onClick={() => setMixerTab('history')}
                    className={`flex-1 sm:flex-none px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        mixerTab === 'history' 
                        ? 'bg-white text-farm-700 shadow-sm dark:bg-gray-700 dark:text-farm-400' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                    <History className="w-4 h-4" />
                    {t('inventory.history')}
                </button>
            </div>

            <button 
                onClick={() => {
                    setIsMixing(false);
                    resetMixer();
                }}
                className="hidden sm:block p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* --- TAB: PRODUCTION --- */}
          {mixerTab === 'production' && (
            <>
              {/* Left: Formula Selection */}
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col h-[40%] md:h-full shrink-0">
                <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50">
                   <h3 className="font-bold text-gray-700 uppercase text-[10px] md:text-sm mb-2">Sélectionner Formule</h3>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-farm-500"
                        placeholder="Rechercher une formule..."
                        value={mixSearch}
                        onChange={e => setMixSearch(e.target.value)}
                     />
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                   {existingFormulas
                      .filter(f => (f.name || '').toLowerCase().includes((mixSearch || '').toLowerCase()))
                      .map(f => (
                        <div 
                          key={f.id}
                          onClick={() => {
                             setSelectedProductionFormulaId(f.id);
                             setMixName(f.name);
                             setMixIngredients(f.recipe?.map(r => {
                                const prod = products.find(p => p.id === r.productId);
                                return prod ? { product: prod, variantName: r.variantName, weight: r.weight } : null;
                             }).filter(Boolean) as any[] || []);
                             setMixCategory(f.category);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                             mixName === f.name 
                               ? 'border-farm-500 bg-farm-50 ring-1 ring-farm-500' 
                               : 'border-gray-200 hover:border-farm-300 hover:bg-gray-50'
                          }`}
                        >
                           <div className="font-bold text-gray-900 text-sm md:text-base">{f.name}</div>
                           <div className="text-[10px] md:text-xs text-gray-500 flex justify-between mt-1">
                               <span>Stock: {formatStock(f.stock)} {f.unit}</span>
                               <span>{f.recipe?.length || 0} ingrédients</span>
                           </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Right: Production Details */}
              <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                 {mixName ? (
                    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                       {/* Header */}
                       <div className="p-4 md:p-6 bg-white border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                          <div>
                              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{mixName}</h2>
                              <div className="flex gap-4 mt-1 md:mt-2 text-xs md:text-sm text-gray-500">
                                 <span className="flex items-center gap-1"><Scale className="w-3 h-3 md:w-4 md:h-4"/> {mixTotalWeight.toFixed(2)} kg (Base)</span>
                                 <span className="flex items-center gap-1"><Coins className="w-3 h-3 md:w-4 md:h-4"/> {mixCostPerKg.toFixed(0)} F/kg</span>
                              </div>
                          </div>
                          <button 
                             onClick={openProductionSummary}
                             disabled={isSubmitting}
                             className="w-full sm:w-auto bg-green-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-lg hover:bg-green-700 shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3 transition-all transform hover:scale-105"
                          >
                             {isSubmitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin"/> : <Factory className="w-5 h-5 md:w-6 md:h-6"/>}
                             Lancer Production
                          </button>
                       </div>

                       {/* Production Settings */}
                       <div className="p-4 md:p-6 bg-farm-50 border-b border-farm-100 shrink-0">
                           <h3 className="font-bold text-farm-900 text-xs md:text-sm mb-3">Paramètres de Production</h3>
                           <div className="flex items-end gap-3 md:gap-4">
                               <div className="flex-1">
                                   <label className="block text-[10px] md:text-xs font-bold text-farm-700 uppercase mb-1">Quantité à produire</label>
                                   <input 
                                       type="number" 
                                       min="0.1"
                                       value={targetProductionWeight}
                                       onChange={(e) => setTargetProductionWeight(parseFloat(e.target.value) || 0)}
                                       className="w-full p-2 md:p-3 border border-farm-200 rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-farm-500 outline-none"
                                   />
                               </div>
                               <div className="w-24 md:w-32">
                                   <label className="block text-[10px] md:text-xs font-bold text-farm-700 uppercase mb-1">Unité</label>
                                   <select 
                                       value={productionUnit}
                                       onChange={(e) => setProductionUnit(e.target.value as 'kg' | 'tonnes')}
                                       className="w-full p-2 md:p-3 border border-farm-200 rounded-xl font-bold text-base md:text-lg focus:ring-2 focus:ring-farm-500 outline-none bg-white"
                                   >
                                       <option value="kg">kg</option>
                                       <option value="tonnes">Tonnes</option>
                                   </select>
                               </div>
                           </div>
                       </div>

                       {/* Ingredients Table */}
                       <div className="flex-1 overflow-y-auto p-4 md:p-6">
                          <h3 className="font-bold text-gray-700 text-xs md:text-sm mb-3 md:mb-4">Matières premières requises</h3>
                          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                             <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm text-left">
                                   <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                      <tr>
                                         <th className="p-2 md:p-3">Ingrédient</th>
                                         <th className="p-2 md:p-3 text-right">Stock</th>
                                         <th className="p-2 md:p-3 text-right">Requis (kg)</th>
                                         <th className="p-2 md:p-3 text-right">Coût</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                      {mixIngredients.map((item, idx) => {
                                         const requiredWeight = item.weight * ((productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight) / mixTotalWeight);
                                         let currentStock = 0;
                                          if (item.variantName) {
                                              const v = item.product.variants?.find(v => v.name === item.variantName);
                                              currentStock = v?.stock || 0;
                                          } else {
                                              currentStock = item.product.stock || 0;
                                          }
                                          const hasEnoughStock = currentStock >= requiredWeight;
                                         return (
                                         <tr key={idx} className={hasEnoughStock ? '' : 'bg-red-50/70 border-l-4 border-red-500'}>
                                            <td className="p-2 md:p-3 font-medium text-gray-900">{item.product.name}{item.variantName ? ` - ${item.variantName}` : ''}</td>
                                            <td className={`p-2 md:p-3 text-right ${hasEnoughStock ? 'text-gray-500' : 'text-red-500 font-bold'}`}>
                                                {formatStock(currentStock)}
                                            </td>
                                            <td className="p-2 md:p-3 text-right font-bold text-farm-700">{requiredWeight.toFixed(1)}</td>
                                            <td className="p-2 md:p-3 text-right text-gray-400">
                                                {((item.variantName 
                                                    ? (item.product.variants?.find(v => v.name === item.variantName)?.costPrice || item.product.costPrice || item.product.price || 0)
                                                    : (item.product.costPrice || item.product.price || 0)
                                                ) * requiredWeight).toFixed(0)} F
                                            </td>
                                         </tr>
                                         );
                                      })}
                                   </tbody>
                                   <tfoot className="bg-gray-50 font-bold text-gray-900">
                                      <tr>
                                         <td className="p-2 md:p-3" colSpan={2}>Total</td>
                                         <td className="p-2 md:p-3 text-right text-farm-700">{(productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight).toFixed(1)}</td>
                                         <td className="p-2 md:p-3 text-right">{(mixCostPerKg * (productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight)).toFixed(0)} F</td>
                                      </tr>
                                   </tfoot>
                                 </table>
                             </div>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                       <FlaskConical className="w-12 md:w-16 h-12 md:h-16 mb-4 opacity-20" />
                       <p className="text-base md:text-lg font-medium">Sélectionnez une formule pour lancer la production</p>
                    </div>
                 )}
              </div>
            </>
          )}

          {/* --- TAB: FORMULES (MANAGEMENT) --- */}
          {mixerTab === 'formulas' && (
              <>
                {!isEditingFormula ? (
                    /* VIEW MODE: List Only (Full Width or Centered) */
                    <div className="w-full flex flex-col bg-gray-50">
                        <div className="p-3 md:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-3">
                            <div>
                                <h3 className="font-bold text-gray-800 text-base md:text-lg">{t('inventory.my_formulas')}</h3>
                                <p className="text-xs md:text-sm text-gray-500">{t('inventory.my_formulas_desc')}</p>
                            </div>
                            <button onClick={startNewFormula} className="w-full sm:w-auto bg-farm-600 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-farm-700 shadow-sm transition-all text-sm">
                                <Plus className="w-4 h-4"/> {t('inventory.new_formula')}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {existingFormulas.map(f => {
                                    const isLowStock = f.stock <= (f.lowStockThreshold || 5);
                                    return (
                                    <div key={f.id} className={`p-4 rounded-xl border transition-all group ${isLowStock ? 'bg-red-50/70 border-red-300 shadow-sm hover:shadow-md' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-900 text-base md:text-lg truncate">{f.name}</h4>
                                                <span className={`text-[10px] md:text-xs font-mono font-bold ${isLowStock ? 'text-red-600' : 'text-gray-500'}`}>{formatStock(f.stock)} {f.unit} {t('inventory.in_stock')}</span>
                                            </div>
                                            <div className={`p-2 rounded-lg transition-colors shrink-0 ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 group-hover:bg-farm-50 group-hover:text-farm-500'}`}>
                                                <FlaskConical className="w-4 h-4 md:w-5 md:h-5"/>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                                            <button 
                                                onClick={() => {
                                                    setIsMixing(false);
                                                    openRestockModal(f);
                                                }}
                                                className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs md:text-sm font-bold flex justify-center items-center gap-2 transition-colors"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5"/> {t('inventory.restock')}
                                            </button>
                                            <button 
                                                onClick={() => startEditFormula(f.id)}
                                                className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs md:text-sm font-bold hover:bg-gray-100 border border-gray-200 flex justify-center items-center gap-2 transition-colors"
                                                title={t('common.edit')}
                                            >
                                                <Edit2 className="w-3 h-3"/>
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFormula(f.id);
                                                }}
                                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs md:text-sm font-bold hover:bg-red-100 border border-red-100 flex justify-center items-center"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                ); })}
                                {existingFormulas.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-gray-400">
                                        {t('inventory.no_formulas')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* EDIT MODE: Raw Materials (Left) + Editor (Right) */
                    <>
                        {/* Middle: Raw Materials (Add) - Reusing the layout but making it visible only in edit mode */}
                        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col h-[35%] md:h-full shrink-0 animate-in slide-in-from-left-5 duration-200">
                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-bold text-gray-700 text-[10px] md:text-sm uppercase mb-2">{t('inventory.available_ingredients')}</h3>
                                <input 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-farm-500"
                                    placeholder="Chercher matière..."
                                    value={ingredientSearch}
                                    onChange={e => setIngredientSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2">
                            {filteredRawMaterials.map(raw => (
                                <button key={raw.id} onClick={() => addToMix(raw)} className="w-full flex justify-between items-center p-2 md:p-3 bg-white border border-gray-200 rounded-lg hover:border-farm-400 text-left group shadow-sm">
                                <div className="min-w-0">
                                    <div className="font-semibold text-gray-800 text-xs md:text-sm truncate">{raw.name}</div>
                                    <div className="text-[10px] md:text-xs text-gray-500">{formatStock(raw.stock)} {raw.product.unit}</div>
                                </div>
                                <Plus className="w-4 h-4 text-farm-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                            ))}
                            </div>
                        </div>

                        {/* Right: Editor */}
                        <div className="w-full md:w-2/3 flex flex-col bg-white flex-1 animate-in slide-in-from-right-5 duration-200 overflow-hidden">
                            <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="flex-1 w-full sm:w-auto mr-0 sm:mr-4">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nom de la Formule</label>
                                    <input 
                                        className="w-full p-2 border border-gray-300 rounded-lg text-base font-bold focus:ring-2 focus:ring-farm-500 outline-none animate-none" 
                                        placeholder="Ex: Aliment Démarrage" 
                                        value={mixName} 
                                        onChange={e => setMixName(e.target.value)} 
                                    />
                                </div>
                                <div className="w-full sm:w-40 shrink-0">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Catégorie</label>
                                    <select 
                                        value={mixCategory} 
                                        onChange={e => setMixCategory(e.target.value as Category)}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-farm-500 outline-none font-bold text-gray-700"
                                    >
                                        <option value={Category.POULTRY}>{Category.POULTRY}</option>
                                        <option value={Category.LIVESTOCK}>{Category.LIVESTOCK}</option>
                                    </select>
                                </div>
                                <div className="w-full sm:w-40 shrink-0">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Prix d'achat (F/kg)</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="any"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-farm-500 outline-none font-bold text-gray-700"
                                        placeholder="Ex: 250"
                                        value={mixCostPriceInput}
                                        onChange={e => {
                                            setMixCostPriceInput(e.target.value);
                                            setIsCostPriceManuallyEdited(true);
                                        }}
                                    />
                                </div>
                                <button onClick={() => setIsEditingFormula(false)} className="text-gray-400 hover:text-gray-600 p-2 shrink-0 self-end sm:self-center">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-3 md:p-4">
                                {mixIngredients.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 text-center">
                                        <FlaskConical className="w-10 md:w-12 h-10 md:h-12 opacity-20"/>
                                        <p className="text-sm">Ajoutez des ingrédients depuis le panneau de gauche</p>
                                    </div>
                                )}
                                {mixIngredients.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs md:text-sm text-left">
                                        <thead className="text-[10px] md:text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-2 md:px-3 py-2">Ingrédient</th>
                                            <th className="px-2 md:px-3 py-2 text-right">Poids (kg)</th>
                                            <th className="px-2 md:px-3 py-2 text-right hidden sm:table-cell">Coût</th>
                                            <th className="px-2 md:px-3 py-2 w-8 md:w-10"></th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                        {mixIngredients.map(item => (
                                            <tr key={`${item.product.id}-${item.variantName || 'default'}`} className="hover:bg-gray-50">
                                            <td className="px-2 md:px-3 py-2 font-medium text-gray-900 truncate max-w-[100px] md:max-w-none">{item.product.name}{item.variantName ? ` - ${item.variantName}` : ''}</td>
                                            <td className="px-2 md:px-3 py-2 text-right">
                                                <input 
                                                type="number" 
                                                min="0.1" 
                                                value={item.weight || ''} 
                                                onChange={e => updateIngredientWeight(item.product.id, item.variantName, parseFloat(e.target.value) || 0)} 
                                                className="w-16 md:w-24 p-1 text-right font-bold border rounded bg-gray-50 focus:ring-1 focus:ring-farm-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-2 md:px-3 py-2 text-right text-gray-400 hidden sm:table-cell">
                                                {(item.weight * (item.variantName 
                                                    ? (item.product.variants?.find(v => v.name === item.variantName)?.costPrice || item.product.costPrice || item.product.price || 0)
                                                    : (item.product.costPrice || item.product.price || 0)
                                                )).toFixed(0)} F
                                            </td>
                                            <td className="px-2 md:px-3 py-2 text-right">
                                                <button onClick={() => removeIngredient(item.product.id, item.variantName)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"><X className="w-4 h-4" /></button>
                                            </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                )}
                            </div>
                            
                            <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-center mb-3 md:mb-4">
                                    <div className="text-xs md:text-sm text-gray-600">
                                        Poids: <span className="font-bold text-gray-900">{mixTotalWeight.toFixed(1)} kg</span>
                                    </div>
                                    <div className="text-xs md:text-sm text-gray-600 flex items-center gap-2">
                                        Coût calculé: <span className="font-bold text-gray-900">{mixCostPrice.toFixed(0)} F</span> ({mixCostPerKg.toFixed(1)} F/kg)
                                        {isCostPriceManuallyEdited && (
                                            <button 
                                                onClick={() => {
                                                    setIsCostPriceManuallyEdited(false);
                                                    setMixCostPriceInput(mixCostPerKg.toFixed(2));
                                                }}
                                                className="text-[10px] text-farm-600 hover:underline font-semibold flex items-center gap-1 bg-farm-50 px-1.5 py-0.5 rounded border border-farm-200 cursor-pointer"
                                                title="Réinitialiser le prix d'achat au coût calculé des ingrédients"
                                            >
                                                Réinitialiser
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 md:gap-3">
                                    <button onClick={() => setIsEditingFormula(false)} className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs md:text-sm">
                                        Annuler
                                    </button>
                                    
                                    <button onClick={handleSaveFormula} disabled={isSubmitting} className="flex-1 py-2.5 md:py-3 bg-farm-600 text-white rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 hover:bg-farm-700 transition-all text-xs md:text-sm">
                                        <Save className="w-4 h-4"/> Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
              </>
          )}

          {/* --- TAB: HISTORY --- */}
          {mixerTab === 'history' && (
              <div className="w-full bg-gray-50 flex flex-col">
                  <div className="p-6 border-b border-gray-200 bg-white">
                      <h3 className="font-bold text-gray-800 text-lg">Historique de Production</h3>
                      <p className="text-sm text-gray-500">Journal des productions réalisées</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                  <tr>
                                      <th className="px-6 py-4">Date</th>
                                      <th className="px-6 py-4">Formule</th>
                                      <th className="px-6 py-4 text-right">Quantité Produite</th>
                                      <th className="px-6 py-4 text-right">Coût Unitaire</th>
                                      <th className="px-6 py-4 text-right">Coût Total</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {products
                                      .filter(p => (p.category === Category.POULTRY || p.category === Category.LIVESTOCK) && p.history)
                                      .flatMap(p => p.history?.filter(h => h.type === 'PRODUCTION' && h.quantity > 0).map(h => ({ ...h, productName: p.name })) || [])
                                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                      .map((h, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                              <td className="px-6 py-4 text-gray-600">
                                                  {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString()}
                                              </td>
                                              <td className="px-6 py-4 font-bold text-gray-900">{h.productName}</td>
                                              <td className="px-6 py-4 text-right font-mono font-bold text-green-600">
                                                  {h.quantity} kg
                                              </td>
                                              <td className="px-6 py-4 text-right font-mono text-gray-600">
                                                  {(h.unitCost || 0).toFixed(0)} F/kg
                                              </td>
                                              <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                                                  {((h.unitCost || 0) * h.quantity).toFixed(0)} F
                                              </td>
                                          </tr>
                                      ))}
                                  {products
                                      .filter(p => (p.category === Category.POULTRY || p.category === Category.LIVESTOCK) && p.history)
                                      .flatMap(p => p.history?.filter(h => h.type === 'PRODUCTION' && h.quantity > 0) || []).length === 0 && (
                                      <tr>
                                          <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                              Aucune production enregistrée.
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

        </div>

        {/* Production Summary Modal */}
        {showProductionSummary && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                        <h3 className="font-bold text-xl font-display flex items-center gap-2">
                            <ScrollText className="w-5 h-5 text-farm-600"/> Résumé de Production
                        </h3>
                        <button onClick={() => setShowProductionSummary(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto bg-white" ref={summaryRef}>
                        <div className="header mb-6 border-b border-gray-200 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{mixName}</h2>
                            <p className="text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                            <p className="text-gray-500">Quantité Cible: <strong>{targetProductionWeight} {productionUnit}</strong></p>
                        </div>

                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-300">
                                    <th className="py-2 px-3 font-bold text-gray-700">Ingrédient</th>
                                    <th className="py-2 px-3 text-right font-bold text-gray-700">Poids (kg)</th>
                                    <th className="py-2 px-3 text-right font-bold text-gray-700">Coût Estimé</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mixIngredients.map((item, idx) => {
                                    const requiredWeight = item.weight * ((productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight) / mixTotalWeight);
                                    return (
                                        <tr key={idx} className="border-b border-gray-100">
                                            <td className="py-2 px-3">{item.product.name}{item.variantName ? ` - ${item.variantName}` : ''}</td>
                                            <td className="py-2 px-3 text-right font-mono">{requiredWeight.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-right font-mono">
                                                {((item.variantName 
                                                    ? (item.product.variants?.find(v => v.name === item.variantName)?.costPrice || item.product.costPrice || item.product.price || 0)
                                                    : (item.product.costPrice || item.product.price || 0)
                                                ) * requiredWeight).toFixed(0)} F
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold">
                                    <td className="py-3 px-3 text-right">Total</td>
                                    <td className="py-3 px-3 text-right">{(productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight).toFixed(2)} kg</td>
                                    <td className="py-3 px-3 text-right">{(mixCostPerKg * (productionUnit === 'tonnes' ? targetProductionWeight * 1000 : targetProductionWeight)).toFixed(0)} F</td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        <div className="mt-6 text-sm text-gray-500 italic">
                            * Ce document est un récapitulatif de production généré par le système.
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-gray-50 rounded-b-2xl">
                        <button onClick={handlePrintSummary} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                            <Printer className="w-4 h-4"/> Imprimer
                        </button>
                        <button onClick={confirmProduction} disabled={isSubmitting} className="px-8 py-3 bg-farm-600 text-white rounded-xl font-bold shadow-lg hover:bg-farm-700 hover:shadow-farm-200 flex items-center gap-2 transition-all">
                            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : 'Confirmer & Produire'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {formulaToDelete && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4 text-red-600 mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Supprimer la formule</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Êtes-vous sûr de vouloir supprimer la formule <span className="font-bold text-gray-900">"{formulaToDelete.name}"</span> ? Cette action est irréversible.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button 
                            onClick={cancelDeleteFormula}
                            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={confirmDeleteFormula}
                            className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-glass border border-gray-100/50 overflow-hidden relative">
      {/* --- HEADER --- */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md shrink-0 z-20">
          <div>
            <h2 className="text-2xl font-bold font-display text-gray-900">{t('inventory.title')}</h2>
            <p className="text-sm text-gray-500 font-medium mt-1">{t('inventory.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            {(isInventoryAdmin || userPermissions.includes('formulas')) && (
              <button 
                  onClick={() => setIsMixing(true)}
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-sm border border-purple-100"
              >
                  <FlaskConical className="w-4 h-4" /> {t('inventory.mixer')}
              </button>
            )}
            {(isInventoryAdmin || userPermissions.includes('inventory')) && (
              <button 
                  onClick={handleAddClick}
                  className="bg-farm-600 hover:bg-farm-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-farm-200 font-bold text-sm"
              >
                  <Plus className="w-4 h-4" /> {t('inventory.add_product')}
              </button>
            )}
          </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="p-3 md:p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 md:gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder={t('inventory.search')} 
                className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-farm-500 outline-none bg-white shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                className="w-full pl-10 pr-8 py-2 md:py-2.5 border border-gray-200 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-farm-500 bg-white outline-none cursor-pointer appearance-none shadow-sm font-semibold text-gray-700"
                value={activeGroup}
                onChange={(e) => setActiveGroup(e.target.value)}
              >
                <option value="all">{t('common.all_categories')}</option>
                <optgroup label="Groupes">
                  {Object.entries(categoryGroups).map(([key, group]) => (
                      <option key={key} value={key}>{group.label}</option>
                  ))}
                </optgroup>
                {categories.length > 0 && (
                  <optgroup label="Catégories">
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
      </div>

      {/* --- TABLE CONTENT (SCROLLABLE) --- */}
      <div className="flex-1 overflow-y-auto overflow-x-auto bg-white">
          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <div key={product.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${product.category === Category.RAW_MATERIALS ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{product.name}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{product.category}</div>
                  </div>
                  <div className="ml-auto flex gap-1">
                    <button 
                        onClick={() => setViewingProductId(product.id)}
                        className="p-2 text-gray-400 hover:text-farm-600"
                    >
                        <History className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => handleEditClick(product)}
                        className="p-2 text-gray-400 hover:text-farm-600"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">{t('inventory.stock')}</div>
                    <div className={`text-xs font-bold ${product.stock <= (product.lowStockThreshold || 5) ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatStock(product.stock)} {product.unit}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">{t('inventory.price')}</div>
                    <div className="text-xs font-bold text-farm-600">
                      {new Intl.NumberFormat('fr-FR').format(product.price)} F
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setRestockingProductId(product.id)}
                    className="flex-1 py-2 bg-farm-50 text-farm-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> {t('inventory.restock')}
                  </button>
                  {onTransferProduct && (
                    <button 
                      onClick={() => onTransferProduct(product.id)}
                      className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> {t('inventory.transfer')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                Aucun produit trouvé
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <table className="w-full text-left text-sm text-gray-600 min-w-[800px] hidden md:table">
            <thead className="bg-gray-50/80 backdrop-blur-sm text-gray-400 uppercase font-bold text-[10px] tracking-wider sticky top-0 z-10 font-display border-b border-gray-100">
                <tr>
                <th className="px-6 py-4">{t('inventory.product_name')}</th>
                <th className="px-6 py-4">{t('inventory.cost_price')}</th>
                <th className="px-6 py-4">{t('inventory.wholesale_price')}</th>
                <th className="px-6 py-4">{t('inventory.price')}</th>
                <th className="px-6 py-4">{t('inventory.stock')}</th>
                <th className="px-2 py-4 text-right">{t('inventory.actions')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => {
                  const isLowStock = (!product.variants || product.variants.length === 0) && ((isMainBoutique ? (product.stock || 0) : (product.boutiqueStock?.[userBoutique] || 0)) <= (product.lowStockThreshold || 5));
                  return (
                  <React.Fragment key={product.id}>
                      <tr className={`transition-colors group ${isLowStock ? 'bg-red-50/70 border-l-4 border-red-500 hover:bg-red-100/50' : 'hover:bg-gray-50/80'}`}>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-4">
                                 <div className={`p-3 rounded-xl shadow-sm ${product.category === Category.RAW_MATERIALS ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                     <Package className="w-5 h-5" />
                                 </div>
                                 <div>
                                      <div className="font-bold text-gray-900 text-base">{product.name}</div>
                                      <div className="text-xs font-medium text-gray-400 mt-0.5">{product.category}</div>
                                 </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-blue-600">
                              {(!product.variants || product.variants.length === 0) ? (
                                  product.costPrice ? new Intl.NumberFormat('fr-FR').format(product.costPrice) : '-'
                              ) : (
                                  <span className="text-gray-300">-</span>
                              )}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-amber-600">
                              {(!product.variants || product.variants.length === 0) ? (
                                  product.wholesalePrice ? new Intl.NumberFormat('fr-FR').format(product.wholesalePrice) : '-'
                              ) : (
                                  <span className="text-gray-300">-</span>
                              )}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900 font-mono text-base">
                              {(!product.variants || product.variants.length === 0) ? (
                                  <>
                                      {new Intl.NumberFormat('fr-FR').format(product.price)} <span className="text-xs text-gray-400 font-sans font-normal">FCFA</span>
                                  </>
                              ) : (
                                  <span className="text-xs text-gray-400 italic">{t('inventory.variants')}</span>
                              )}
                          </td>
                          <td className="px-6 py-4">
                              {(!product.variants || product.variants.length === 0) ? (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${(isMainBoutique ? (product.stock || 0) : (product.boutiqueStock?.[userBoutique] || 0)) <= (product.lowStockThreshold || 5) ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                      {formatStock(isMainBoutique ? (product.stock || 0) : (product.boutiqueStock?.[userBoutique] || 0))} {product.unit}
                                  </span>
                              ) : (
                                  <span className="text-xs text-gray-400">-</span>
                              )}
                          </td>
                          <td className="px-2 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   {/* Only allow restock on main item if it has no variants */}
                                   {(!product.variants || product.variants.length === 0) && (
                                       <>
                                           {isMainBoutique && (
                                               <button onClick={() => {
                                                   if (onTransferProduct) {
                                                       onTransferProduct(product.id);
                                                   } else {
                                                       onNavigate?.('transfers');
                                                   }
                                               }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all" title="Transférer">
                                                   <ArrowRightLeft className="w-4 h-4" />
                                               </button>
                                           )}
                                           {userBoutique !== 'Boutique 2' && (
                                               <button onClick={() => openRestockModal(product)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200 transition-all" title={t('inventory.restock')}>
                                                   <RefreshCw className="w-4 h-4" />
                                               </button>
                                           )}
                                       </>
                                   )}
                                  <button onClick={() => setViewingProductId(product.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all" title={t('common.view')}>
                                      <TrendingUp className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleEditClick(product)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 transition-all" title={t('common.edit')}>
                                      <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(product)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all" title={t('common.delete')}>
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </td>
                      </tr>
                      {/* Variants Sub-rows */}
                      {product.variants?.map((variant, idx) => {
                          const isVariantLowStock = (isMainBoutique ? (variant.stock || 0) : (variant.boutiqueStock?.[userBoutique] || 0)) <= (variant.lowStockThreshold !== undefined ? variant.lowStockThreshold : (product.lowStockThreshold || 5));
                          return (
                          <tr key={`${product.id}-v-${idx}`} className={`transition-colors ${isVariantLowStock ? 'bg-red-50/50 border-l-4 border-red-400/70 hover:bg-red-100/40' : 'bg-gray-50/30'}`}>
                              <td className="px-6 py-3 pl-14">
                                  <div className="flex items-center gap-3 text-gray-600">
                                      <CornerDownRight className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm font-semibold">{variant.name}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-3 font-mono text-xs text-blue-600">
                                  {variant.costPrice ? new Intl.NumberFormat('fr-FR').format(variant.costPrice) : '-'}
                              </td>
                            <td className="px-6 py-3 font-mono text-xs text-amber-600">
                                {variant.wholesalePrice ? new Intl.NumberFormat('fr-FR').format(variant.wholesalePrice) : '-'}
                            </td>
                            <td className="px-6 py-3 font-mono text-sm text-gray-700">
                                {new Intl.NumberFormat('fr-FR').format(variant.price)}
                            </td>
                            <td className="px-6 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${(isMainBoutique ? (variant.stock || 0) : (variant.boutiqueStock?.[userBoutique] || 0)) <= (variant.lowStockThreshold !== undefined ? variant.lowStockThreshold : (product.lowStockThreshold || 5)) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-gray-700 border-gray-200'}`}>
                                    {formatStock(isMainBoutique ? (variant.stock || 0) : (variant.boutiqueStock?.[userBoutique] || 0))}
                                </span>
                            </td>
                            <td className="px-2 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {isMainBoutique && (
                                        <button onClick={() => {
                                            if (onTransferProduct) {
                                                onTransferProduct(product.id);
                                            } else {
                                                onNavigate?.('transfers');
                                            }
                                        }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Transférer">
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {userBoutique !== 'Boutique 2' && (
                                        <button onClick={() => openRestockModal(product, variant.name)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title={t('inventory.restock')}>
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button onClick={() => handleEditClick(product, variant.name)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title={t('common.edit')}>
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ); })}
                </React.Fragment>
                ); })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
                Aucun produit trouvé
            </div>
          )}
        </div>

          
{/* --- SLIDE-OVER DETAILS --- */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
              <div className="p-4 md:p-5 bg-gray-900 text-white flex justify-between items-start shrink-0">
                  <div>
                      <h2 className="text-lg md:text-xl font-bold leading-tight">{viewingProduct.name}</h2>
                      <p className="opacity-70 text-[10px] md:text-xs mt-1">{viewingProduct.category}</p>
                  </div>
                  <button onClick={() => setViewingProductId(null)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50">
                 <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                        <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold">{t('inventory.stock')} {viewingProduct.variants?.length ? t('common.total') : ''}</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900">
                            {formatStock(viewingProduct.variants?.length 
                               ? viewingProduct.variants.reduce((acc, v) => acc + (v.stock || 0), 0) 
                               : viewingProduct.stock)}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-400">{viewingProduct.unit}</p>
                    </div>
                    <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                        <p className="text-[8px] md:text-[10px] text-gray-500 uppercase font-bold">{t('inventory.price')}</p>
                        <p className="text-xl md:text-2xl font-bold text-farm-600">
                            {viewingProduct.variants?.length ? '-' : viewingProduct.price}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-400">FCFA</p>
                    </div>
                 </div>

                 {viewingProduct.variants && viewingProduct.variants.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 md:mb-6">
                          <div className="p-2 md:p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                              <Tag className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                              <h3 className="font-bold text-gray-700 text-[10px] md:text-sm">{t('inventory.variants_in_stock')}</h3>
                          </div>
                          <div className="divide-y divide-gray-100">
                              {viewingProduct.variants.map((v, i) => (
                                  <div key={i} className="p-2 md:p-3 flex justify-between items-center text-[10px] md:text-sm hover:bg-gray-50 transition-colors">
                                      <span className="font-medium text-gray-800">{v.name}</span>
                                      <div className="flex items-center gap-2 md:gap-4">
                                          <span className={`px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-xs font-bold border ${(v.stock || 0) <= (v.lowStockThreshold !== undefined ? v.lowStockThreshold : (viewingProduct.lowStockThreshold || 5)) ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                              {formatStock(v.stock || 0)}
                                          </span>
                                          <span className="font-mono font-bold text-gray-900">{v.price} F</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4 md:mb-6">
                    <div className="p-2 md:p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-2">
                            <History className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                            <h3 className="font-bold text-gray-700 text-[10px] md:text-sm">{t('inventory.history')}</h3>
                        </div>
                        {viewingProduct.variants && viewingProduct.variants.length > 0 && (
                             <select 
                                className="text-xs border border-gray-200 rounded-lg p-1 bg-white outline-none focus:ring-1 focus:ring-farm-500"
                                value={historyFilterVariant}
                                onChange={(e) => setHistoryFilterVariant(e.target.value)}
                             >
                                 <option value="All">{t('common.all')}</option>
                                 {viewingProduct.variants.map(v => (
                                     <option key={v.name} value={v.name}>{v.name}</option>
                                 ))}
                             </select>
                         )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                           <thead className="bg-gray-50 text-gray-400">
                              <tr>
                                 <th className="px-3 py-2 font-medium">{t('common.date')}</th>
                                 <th className="px-3 py-2 font-medium">{t('common.type')}</th>
                                 {viewingProduct.variants && viewingProduct.variants.length > 0 && <th className="px-3 py-2 font-medium">{t('inventory.variant')}</th>}
                                 <th className="px-3 py-2 text-right font-medium">{t('inventory.quantity')}</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {viewingProduct.history?.slice().reverse()
                               .filter(h => historyFilterVariant === 'All' || h.variantName === historyFilterVariant)
                               .map(h => (
                                 <tr key={h.id}>
                                    <td className="px-3 py-2 text-gray-600">{new Date(h.date).toLocaleDateString()}</td>
                                    <td className="px-3 py-2">
                                        <div>{h.type}</div>
                                        <div className="text-[10px] text-gray-400">{h.note}</div>
                                    </td>
                                    {viewingProduct.variants && viewingProduct.variants.length > 0 && (
                                         <td className="px-3 py-2 text-gray-500 italic">{h.variantName || '-'}</td>
                                     )}
                                    <td className={`px-3 py-2 text-right font-bold ${h.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                       {h.quantity > 0 ? '+' : ''}{h.quantity}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                     <button onClick={() => handleDelete(viewingProduct)} disabled={isSubmitting} className="flex-1 py-3 flex items-center justify-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm">
                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <><Trash2 className="w-4 h-4" /> {t('common.delete')}</>}
                     </button>
                     <button onClick={() => handleEditClick(viewingProduct)} className="flex-1 py-3 flex items-center justify-center gap-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm">
                        <Edit2 className="w-4 h-4" /> {t('common.edit')}
                     </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- RESTOCK MODAL --- */}
      {restockingProductId && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
            <div className="bg-white rounded-[1.5rem] md:rounded-3xl p-4 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 border border-gray-100 max-h-[95vh] flex flex-col">
               <div className="flex justify-between items-center mb-4 md:mb-6">
                   <h3 className="text-lg md:text-2xl font-bold font-display text-gray-900 flex items-center gap-2 md:gap-3">
                       <div className="p-1.5 md:p-2 bg-green-100 rounded-lg md:rounded-xl text-green-600">
                           <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                       </div>
                       <span className="truncate">{restockForm.variantName ? `${t('inventory.restock_title')}: ${restockForm.variantName}` : t('inventory.restock_title')}</span>
                   </h3>
                   <button onClick={() => setRestockingProductId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
               </div>
               
               <div className="space-y-4 md:space-y-6 overflow-y-auto p-1">
                  {restockingProduct?.recipe && restockingProduct.recipe.length > 0 && (
                      <div className="mb-2 bg-emerald-50 border border-emerald-100/50 text-emerald-800 rounded-2xl p-4 text-xs md:text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex-1">
                              <p className="font-bold flex items-center gap-1.5 mb-1 text-emerald-950 dark:text-white">
                                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                                  Produit de Formule (Mélange)
                              </p>
                              <p className="text-emerald-800/80">Ce produit possède une recette de fabrication active. Vous pouvez le réapprovisionner par achat direct manuellement ci-dessous, ou utiliser le mélangeur pour consommer ses matières premières.</p>
                          </div>
                          <button
                              type="button"
                              onClick={() => {
                                  if (restockingProduct) {
                                      const prodId = restockingProduct.id;
                                      const prodName = restockingProduct.name;
                                      setRestockingProductId(null);
                                      setIsMixing(true);
                                      setMixerTab('production');
                                      setMixName(prodName);
                                      loadFormula(prodId);
                                  }
                              }}
                              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm hover:shadow"
                          >
                              <Factory className="w-4 h-4" />
                              Ouvrir le Mélangeur
                          </button>
                      </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-3 md:space-y-4">
                          <h4 className="font-bold text-gray-900 border-b pb-1 md:pb-2 text-sm md:text-base">{t('inventory.entry_details')}</h4>
                          <div>
                              <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">{t('inventory.date')}</label>
                              <input type="date" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" value={restockForm.date} onChange={e => setRestockForm({...restockForm, date: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">{t('inventory.added_quantity')}</label>
                              <input type="number" className="w-full p-2.5 md:p-3 border-2 border-green-500 rounded-xl text-lg md:text-xl font-bold focus:shadow-lg outline-none transition-shadow" placeholder="0" value={restockForm.quantity || ''} onChange={e => setRestockForm({...restockForm, quantity: parseFloat(e.target.value)})} autoFocus />
                          </div>
                          <div>
                              <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">{t('inventory.note')}</label>
                              <input type="text" placeholder="Ex: Livraison Fournisseur X" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" value={restockForm.note} onChange={e => setRestockForm({...restockForm, note: e.target.value})} />
                          </div>
                      </div>

                      <div className="space-y-3 md:space-y-4 bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100">
                          <h4 className="font-bold text-gray-900 border-b pb-1 md:pb-2 text-sm md:text-base">{t('inventory.price_update')}</h4>
                          <div>
                              <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">{t('inventory.buying_price_cost')}</label>
                              <input type="number" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('inventory.buying_price_cost')} value={restockForm.buyingPrice} onChange={e => setRestockForm({...restockForm, buyingPrice: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">{t('inventory.selling_price_retail')}</label>
                              <input type="number" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('inventory.selling_price_retail')} value={restockForm.sellingPrice} onChange={e => setRestockForm({...restockForm, sellingPrice: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">{t('inventory.selling_price_wholesale')}</label>
                              <input type="number" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 outline-none" placeholder={t('inventory.selling_price_wholesale')} value={restockForm.wholesalePrice} onChange={e => setRestockForm({...restockForm, wholesalePrice: e.target.value})} />
                          </div>
                      </div>
                  </div>
               </div>

               <div className="flex gap-3 md:gap-4 mt-6 md:mt-8 pt-4 border-t border-gray-100">
                  <button onClick={() => setRestockingProductId(null)} className="flex-1 py-3 md:py-4 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm md:text-base">{t('common.cancel')}</button>
                  <button onClick={handleRestockSubmit} disabled={isSubmitting} className="flex-1 py-3 md:py-4 bg-farm-600 text-white rounded-xl font-bold shadow-lg hover:bg-farm-700 hover:shadow-green-200 transition-all flex justify-center items-center gap-2 text-sm md:text-base">
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5"/> : t('inventory.validate_stock_entry')}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
          <div className={`bg-white rounded-[1.5rem] md:rounded-2xl w-full ${isEditingVariant ? 'max-w-md' : 'max-w-4xl'} shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 transition-all overflow-hidden`}>
             <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[1.5rem] md:rounded-t-2xl">
                <h3 className="font-bold text-lg md:text-xl font-display">
                    {isEditingVariant ? `${t('inventory.edit_variant')}: ${variantName}` : (isAdding ? t('inventory.new_product') : t('inventory.edit_product'))}
                </h3>
                <button onClick={() => { setIsAdding(false); setEditingId(null); setIsEditingVariant(false); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
             </div>
             
             <div className="p-4 md:p-8 overflow-y-auto space-y-6 md:space-y-8">
                {isEditingVariant ? (
                    // --- VARIANT EDIT MODE ---
                    <div className="space-y-4 md:space-y-6">
                        <div className="space-y-1 md:space-y-2">
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">{t('inventory.variant_name')}</label>
                            <input className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm md:text-base focus:ring-2 focus:ring-farm-500 outline-none" value={variantName} onChange={e => setVariantName(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="space-y-1 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">{t('inventory.price')}</label>
                                <input type="number" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm md:text-base font-bold text-gray-900 focus:ring-2 focus:ring-farm-500 outline-none" value={variantPrice} onChange={e => setVariantPrice(e.target.value)} />
                            </div>
                            <div className="space-y-1 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">{t('inventory.wholesale_price')}</label>
                                <input type="number" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm md:text-base font-bold text-amber-600 focus:ring-2 focus:ring-farm-500 outline-none" value={variantWholesalePrice} onChange={e => setVariantWholesalePrice(e.target.value)} />
                            </div>
                            {(!editForm.recipe || editForm.recipe.length === 0) && (
                                <div className="space-y-1 md:space-y-2">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">{t('inventory.cost_price')}</label>
                                    <input type="number" className="w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-sm md:text-base font-bold text-blue-600 focus:ring-2 focus:ring-farm-500 outline-none" value={variantCostPrice} onChange={e => setVariantCostPrice(e.target.value)} />
                                </div>
                            )}
                            <div className="space-y-1 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-red-600 uppercase">{t('inventory.low_stock_threshold_label') || 'Seuil Bas'}</label>
                                <input type="number" className="w-full p-2.5 md:p-3 border border-red-200 rounded-xl text-sm md:text-base font-bold text-red-900 focus:ring-2 focus:ring-red-500 outline-none" value={variantLowStockThreshold} onChange={e => setVariantLowStockThreshold(e.target.value)} placeholder="5" />
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- FULL PRODUCT EDIT MODE ---
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="md:col-span-2 space-y-1 md:space-y-2">
                                <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">{t('inventory.product_name')}</label>
                                <input className="w-full p-3 md:p-4 border border-gray-200 rounded-xl text-base md:text-lg font-bold focus:ring-2 focus:ring-farm-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Ex: Maïs Grain"/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('inventory.category')}</label>
                                <select className="w-full p-4 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-farm-500 outline-none" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value as Category})}>
                                    {(categories.length > 0 ? categories : Object.values(Category)).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('inventory.stock_unit')}</label>
                                <select className="w-full p-4 border border-gray-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-farm-500 outline-none" value={editForm.unit || ''} onChange={e => setEditForm({...editForm, unit: e.target.value})}>
                                    <option value="" disabled>{t('inventory.select_unit')}</option>
                                    <option value="kg">kg</option>
                                    <option value="sac">sac</option>
                                    <option value="pièce">pièce</option>
                                    <option value="litre">litre</option>
                                </select>
                            </div>
                            {!isAdding && (!editForm.variants || editForm.variants.length === 0) && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-blue-700 uppercase">{t('inventory.selling_price_default')}</label>
                                        <input type="number" className="w-full p-4 border border-blue-200 rounded-xl text-base font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.price ?? ''} onChange={e => setEditForm({...editForm, price: e.target.value ? parseFloat(e.target.value) : undefined})}/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-amber-700 uppercase">{t('inventory.wholesale_price')}</label>
                                        <input type="number" className="w-full p-4 border border-amber-200 rounded-xl text-base font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none" value={editForm.wholesalePrice ?? ''} onChange={e => setEditForm({...editForm, wholesalePrice: e.target.value ? parseFloat(e.target.value) : undefined})}/>
                                    </div>
                                    {(!editForm.recipe || editForm.recipe.length === 0) && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-blue-700 uppercase">{t('inventory.buying_price_default')}</label>
                                            <input type="number" className="w-full p-4 border border-blue-200 rounded-xl text-base font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.costPrice ?? ''} onChange={e => setEditForm({...editForm, costPrice: e.target.value ? parseFloat(e.target.value) : undefined})}/>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-red-600 uppercase">{t('inventory.low_stock_threshold_label')}</label>
                                        <input type="number" className="w-full p-4 border border-red-200 rounded-xl text-base font-bold text-red-900 focus:ring-2 focus:ring-red-500 outline-none" value={editForm.lowStockThreshold ?? ''} onChange={e => setEditForm({...editForm, lowStockThreshold: e.target.value ? parseFloat(e.target.value) : undefined})} placeholder="5"/>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-gray-100">
                             <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-farm-600"/> {t('inventory.variants_section')}
                                </label>
                                <span className="text-xs text-gray-400">{t('inventory.variants_help')}</span>
                             </div>
                             
                             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                                 <div className="flex items-end gap-2">
                                     <div className="flex-1 space-y-1">
                                         <label className="text-[10px] uppercase font-bold text-gray-400">{t('inventory.variant_name')}</label>
                                         <input className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-farm-500" placeholder="Ex: Sac 50kg" value={variantName} onChange={e => setVariantName(e.target.value)} />
                                     </div>
                                     <button onClick={addVariant} className="px-4 py-3 bg-farm-600 text-white rounded-xl font-bold hover:bg-farm-700 transition-colors shadow-md flex items-center gap-2"><Plus className="w-5 h-5"/> {t('inventory.add')}</button>
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {editForm.variants?.length === 0 && <div className="col-span-full text-center py-8 text-gray-400 italic border-2 border-dashed border-gray-100 rounded-xl">{t('inventory.no_variants_defined')}</div>}
                                 {editForm.variants?.map((v, i) => (
                                     <div key={i} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-farm-300 transition-all">
                                         <div>
                                             <div className="font-bold text-gray-800 text-lg">{v.name}</div>
                                             <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                                 <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">{t('inventory.retail_short')}: <strong>{v.price}</strong></span>
                                                 {v.wholesalePrice && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{t('inventory.wholesale_short')}: <strong>{v.wholesalePrice}</strong></span>}
                                                 {v.costPrice && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{t('inventory.cost_short')}: <strong>{v.costPrice}</strong></span>}
                                             </div>
                                         </div>
                                         <button onClick={() => removeVariant(i)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </>
                )}
             </div>
             
             <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-gray-50 rounded-b-2xl">
                <button onClick={() => { setIsAdding(false); setEditingId(null); setIsEditingVariant(false); }} className="px-6 py-3 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-200">{t('common.cancel')}</button>
                <button onClick={handleSave} disabled={isSubmitting} className="px-8 py-3 bg-farm-600 text-white rounded-xl font-bold shadow-lg hover:bg-farm-700 hover:shadow-farm-200 flex items-center gap-2 transition-all">
                   {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : (isEditingVariant ? t('inventory.save_variant') : t('inventory.save_product'))}
                </button>
             </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal for General Product Deletion */}
      {productToDelete && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-4 text-red-600 mb-4">
                      <div className="p-3 bg-red-100 rounded-full">
                          <Trash2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{t('inventory.delete_product_title')}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                      {t('inventory.delete_product_confirm')} <span className="font-bold text-gray-900">"{productToDelete.name}"</span> ? {t('inventory.irreversible_action')}
                  </p>
                  <div className="flex gap-3 justify-end">
                      <button 
                          onClick={cancelDeleteProduct}
                          className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                          disabled={isSubmitting}
                      >
                          {t('common.cancel')}
                      </button>
                      <button 
                          onClick={confirmDeleteProduct}
                          className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
                          disabled={isSubmitting}
                      >
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          {t('common.delete')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Stock Assignment Modal when adding first variant(s) to a product with existing stock */}
      {stockAssignmentModal?.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 text-farm-600 mb-6">
              <div className="p-3 bg-farm-100 rounded-full">
                <Tag className="w-6 h-6 text-farm-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-display">Répartition du Stock Existant</h3>
                <p className="text-xs text-gray-500 mt-1">Attribuer le stock existant aux nouvelles variantes</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
              <span className="font-bold">Stock total à répartir : </span> 
              <span className="font-mono font-bold text-base">{stockAssignmentModal.existingStock} {editForm.unit}</span>
            </div>

            <div className="space-y-4 mb-6 max-h-[250px] overflow-y-auto pr-2">
              {stockAssignmentModal.variants.map((v, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="font-bold text-gray-800 text-sm">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="w-28 p-2 text-right border border-gray-300 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-farm-500"
                      placeholder="Quantité"
                      value={stockAssignmentModal.assignedStocks[v.name] ?? ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setStockAssignmentModal({
                          ...stockAssignmentModal,
                          assignedStocks: {
                            ...stockAssignmentModal.assignedStocks,
                            [v.name]: val
                          }
                        });
                      }}
                    />
                    <span className="text-xs text-gray-500 font-medium">{editForm.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Indicator */}
            {(() => {
              const sumAssigned = Object.values(stockAssignmentModal.assignedStocks).reduce((sum, s) => sum + s, 0);
              const remaining = stockAssignmentModal.existingStock - sumAssigned;
              const isPerfect = Math.abs(remaining) < 0.0001;

              return (
                <div className="p-4 rounded-2xl border mb-6 flex justify-between items-center text-sm font-bold shadow-sm transition-colors duration-200 bg-gray-50/50 border-gray-100">
                  <div>
                    <span className="text-gray-500">Total attribué : </span>
                    <span className="font-mono text-gray-900">{sumAssigned}</span>
                  </div>
                  <div>
                    {isPerfect ? (
                      <span className="text-green-600 flex items-center gap-1">✔ Répartition exacte</span>
                    ) : (
                      <span className="text-red-600 font-mono">Reste : {remaining.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setStockAssignmentModal(null)}
                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmStockAssignment}
                className={`px-6 py-3 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 ${
                  Math.abs(Object.values(stockAssignmentModal.assignedStocks).reduce((sum, s) => sum + s, 0) - stockAssignmentModal.existingStock) < 0.0001
                    ? 'bg-farm-600 hover:bg-farm-700 shadow-farm-600/20'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={isSubmitting || Math.abs(Object.values(stockAssignmentModal.assignedStocks).reduce((sum, s) => sum + s, 0) - stockAssignmentModal.existingStock) >= 0.0001}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Valider la répartition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};