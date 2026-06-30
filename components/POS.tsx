import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Invoice, Category, ProductVariant, Expense, Employee, Boutique, Customer, Provenderie, Payment } from '../types';
import { Search, ShoppingCart, Plus, Trash2, CheckCircle, Receipt, X, Tag, TrendingDown, TrendingUp, Save, Edit, Loader2, AlertTriangle, User, DollarSign, Printer, ArrowRight, CreditCard, Eye, EyeOff } from 'lucide-react';
import { useNotifications } from './ui/Notifications';
import { saveEmployee, saveCustomer } from '../services/db';
import { InvoiceTemplate } from './InvoiceTemplate';
import { formatStock } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface POSProps {
  products: Product[];
  employees: Employee[];
  invoices?: Invoice[];
  expenses?: Expense[];
  customers: Customer[];
  onCheckout: (invoice: Invoice, updatedStock: Product[], customer?: Customer, updatedPreviousInvoices?: Invoice[]) => void;
  onAddExpense: (expense: Expense) => void;
  onVoidLastSale: (invoiceId: string, restoredStock: Product[]) => void;
  userRole?: string;
  userPermissions?: string[];
  userBoutique?: string;
  boutiques?: Boutique[];
  provenderies?: Provenderie[];
  companyName?: string;
  userName?: string;
  currentProvenderieId?: string;
  categories?: string[];
}

const TABS = [
  { id: 'Tout', label: 'Tout', categories: [] },
  { id: 'Matieres', label: 'Matières', categories: [Category.RAW_MATERIALS] },
  { id: 'Formules', label: 'Aliments', categories: [Category.POULTRY, Category.LIVESTOCK] },
  { id: 'Materiel', label: 'Matériel', categories: [Category.EQUIPMENT, Category.OTHER] },
];

const EXPENSE_CATEGORIES = [
  { id: 'ELECTRICITE', label: 'Electricité' },
  { id: 'EAU', label: 'Eau' },
  { id: 'SALAIRE', label: 'Salaire' },
  { id: 'INTERNET', label: 'Internet' },
  { id: 'RATION', label: 'Rations Personnel' },
  { id: 'DIVERS', label: 'Divers' },
];

export const POS: React.FC<POSProps> = ({ products, employees, invoices = [], expenses = [], customers, onCheckout, onAddExpense, onVoidLastSale, userRole = 'Admin', userPermissions = [], userBoutique = 'Toutes', boutiques = [], provenderies = [], companyName, userName, currentProvenderieId, categories = [] }) => {
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

  useEffect(() => {
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Tout');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const dynamicTabs = useMemo(() => {
    if (!categories || categories.length === 0) return TABS;
    const tabs = [{ id: 'Tout', label: 'Tout', categories: [] }];
    categories.forEach(cat => {
      tabs.push({ id: cat, label: cat, categories: [cat as any] });
    });
    return tabs;
  }, [categories]);
  
  const currentProvenderie = provenderies.find(p => p.id === currentProvenderieId);
  
  // Checkout States
  const [customerName, setCustomerName] = useState('Client Comptoir');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState<Invoice | null>(null);
  const [showConfirmCheckout, setShowConfirmCheckout] = useState(false);
  const [serviceCost, setServiceCost] = useState<string>('');
  const [isWholesale, setIsWholesale] = useState(false);
  const [isRegisteredMode, setIsRegisteredMode] = useState(false);
  const [useAdvance, setUseAdvance] = useState(true);
  const [payDebt, setPayDebt] = useState(false);
  const [excessAction, setExcessAction] = useState<'reimburse' | 'advance'>('advance');
  
  // Customer Modal
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });
  
  // Initialize boutique based on user assignment
  const initialBoutique = (userBoutique && userBoutique !== 'Toutes') ? userBoutique : (boutiques[0]?.id || 'Boutique 1');
  const [selectedBoutique, setSelectedBoutique] = useState<string>(initialBoutique);
  
  const isPOSAdmin = userRole === 'Admin' || 
                    userRole.toLowerCase().trim() === 'superadmin' || 
                    userRole.toLowerCase().trim() === 'system-admin' || 
                    userRole.toLowerCase().trim().includes('administrateur');
  const canSelectBoutique = isPOSAdmin || (userRole === 'Gérant' && userBoutique === 'Toutes');

  // Quantity Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qtyInput, setQtyInput] = useState<string>('1');
  const [selectedUnit, setSelectedUnit] = useState<string>('Détail');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [customPrice, setCustomPrice] = useState<string>('');

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsIncludeAvance, setStatsIncludeAvance] = useState<boolean>(false);
  const [statsIncludeDebt, setStatsIncludeDebt] = useState<boolean>(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');
  const [expenseForm, setExpenseForm] = useState({ 
    amount: '', 
    motif: '', 
    category: 'DIVERS',
    employeeId: ''
  });

  // Check for draft cart on mount
  useEffect(() => {
    const draft = localStorage.getItem('cart_draft');
    if (draft) {
        try {
            const parsed = JSON.parse(draft);
            setCart(parsed);
            localStorage.removeItem('cart_draft');
            notify("Panier chargé", "success");
        } catch (e) {
            console.error("Error parsing draft cart", e);
        }
    }
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomerForm.name) {
        notify("Le nom est obligatoire", "error");
        return;
    }
    const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: newCustomerForm.name,
        phone: newCustomerForm.phone,
        email: newCustomerForm.email,
        address: newCustomerForm.address,
        boutique: userBoutique,
        advanceBalance: 0,
        outstandingDebt: 0,
        history: [],
        provenderieId: currentProvenderieId
    };
    try {
        await saveCustomer(newCustomer);
        notify("Client ajouté", "success");
        setSelectedCustomer(newCustomer);
        setCustomerName(newCustomer.name);
        setCustomerSearchTerm('');
        setIsAddingCustomer(false);
        setNewCustomerForm({ name: '', phone: '', email: '', address: '' });
    } catch (e) {
        notify("Erreur lors de l'ajout", "error");
    }
  };

  // Totals
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalServiceCost = parseFloat(serviceCost) || 0;
  const cartTotal = cartSubtotal + totalServiceCost;
  const currentAdvanceUsed = (selectedCustomer && useAdvance) ? Math.min(cartTotal, selectedCustomer.advanceBalance) : 0;
  
  const debtRemains = !!(selectedCustomer && selectedCustomer.outstandingDebt > 0 && (!payDebt || (parseFloat(amountPaidInput) || 0) < cartTotal + selectedCustomer.outstandingDebt));

  // Sync payDebt and useAdvance states when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer.outstandingDebt > 0) {
        setPayDebt(true);
        setUseAdvance(false);
      } else {
        setPayDebt(false);
        setUseAdvance(true);
      }
    } else {
      setPayDebt(false);
      setUseAdvance(false);
    }
  }, [selectedCustomer]);

  // Prevent holding advance if debt remains
  useEffect(() => {
    if (debtRemains && excessAction === 'advance') {
      setExcessAction('reimburse');
    }
  }, [debtRemains, excessAction]);

  useEffect(() => {
    if (cartTotal > 0 && !showReceipt) {
        const debtToAdd = (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt) ? selectedCustomer.outstandingDebt : 0;
        const toPay = cartTotal + debtToAdd - currentAdvanceUsed;
        setAmountPaidInput(Math.max(0, toPay).toString());
    }
  }, [cartTotal, showReceipt, currentAdvanceUsed, payDebt, selectedCustomer]);

  // Update cart prices and units when wholesale mode changes
  useEffect(() => {
    setCart(prevCart => prevCart.map(item => {
        const originalProduct = products.find(p => p.id === item.id);
        if (!originalProduct) return item;
        
        const multiplier = getMultiplier(item.unit || 'Détail');
        let newPrice = item.price;
        let newUnit = item.unit;
        
        if (isWholesale) {
            if (item.unit === 'Détail') newUnit = 'Gros';
            
            if (item.selectedVariant) {
                const originalVariant = originalProduct.variants?.find(v => v.name === item.selectedVariant?.name);
                if (originalVariant) {
                    newPrice = (originalVariant.wholesalePrice || originalVariant.price) * multiplier;
                }
            } else {
                newPrice = (originalProduct.wholesalePrice || originalProduct.price) * multiplier;
            }
        } else {
            if (item.unit === 'Gros') newUnit = 'Détail';

            if (item.selectedVariant) {
                const originalVariant = originalProduct.variants?.find(v => v.name === item.selectedVariant?.name);
                if (originalVariant) {
                    newPrice = originalVariant.price * multiplier;
                }
            } else {
                newPrice = originalProduct.price * multiplier;
            }
        }
        
        return { ...item, price: newPrice, unit: newUnit };
    }));
  }, [isWholesale, products]);

  const balanceDue = Math.max(0, (cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0)) - currentAdvanceUsed - (parseFloat(amountPaidInput) || 0));

  const getMultiplier = (unit: string) => {
      if (unit === 'Sac 50kg') return 50;
      if (unit === 'Sac 40kg') return 40;
      if (unit === 'Sac 25kg') return 25;
      return 1;
  };

  const handleProductClick = (product: Product) => {
    const totalStock = (product.variants && product.variants.length > 0) 
        ? product.variants.reduce((acc, v) => acc + (selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutique] || 0)), 0)
        : (selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (product.stock || 0) : (product.boutiqueStock?.[selectedBoutique] || 0));

    if (totalStock <= 0) return;
    
    setSelectedProduct(product);
    setQtyInput('1');
    setSelectedUnit('Détail');
    
    // Default to first variant if exists
    if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
    } else {
        setSelectedVariant(null);
    }
    setCustomPrice('');
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    const rawQuantity = parseFloat(qtyInput);
    if (isNaN(rawQuantity) || rawQuantity <= 0) {
      notify("Quantité invalide", "error");
      return;
    }
    
    // Round to max 2 decimal places
    const quantity = Math.round(rawQuantity * 100) / 100;

    const finalUnit = (selectedUnit === 'Détail' && isWholesale) ? 'Gros' : selectedUnit;
    const multiplier = getMultiplier(finalUnit);
    const totalQty = quantity * multiplier;

    // Determine price and stock limit
    let finalPrice = isWholesale ? (selectedProduct.wholesalePrice || selectedProduct.price) : selectedProduct.price;
    let maxStock = selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (selectedProduct.stock || 0) : (selectedProduct.boutiqueStock?.[selectedBoutique] || 0);
    
    if (selectedVariant) {
        finalPrice = isWholesale ? (selectedVariant.wholesalePrice || selectedVariant.price) : selectedVariant.price;
        maxStock = selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (selectedVariant.stock || 0) : (selectedVariant.boutiqueStock?.[selectedBoutique] || 0);
    }

    // Adjust price for bulk units if needed
    if (!customPrice) {
        finalPrice = finalPrice * multiplier;
    } else {
        finalPrice = parseFloat(customPrice);
        
        // Validation: Custom price must not be below the wholesale price
        let minPricePerUnit = selectedProduct.wholesalePrice || selectedProduct.price;
        if (selectedVariant) {
            minPricePerUnit = selectedVariant.wholesalePrice || selectedVariant.price;
        }
        const minPrice = minPricePerUnit * multiplier;
        
        if (finalPrice < minPrice) {
            notify(`Le prix ne peut pas être inférieur au prix de gros (${minPrice} F)`, "error");
            return;
        }
    }

    if (totalQty > maxStock) {
      notify(`Stock insuffisant (Requis: ${totalQty}, Dispo: ${maxStock})`, "error");
      return;
    }

    setCart(prev => {
      // Check if same product, same variant, same unit, same price exists
      const existingIndex = prev.findIndex(item => 
          item.id === selectedProduct.id && 
          item.unit === finalUnit && 
          item.price === finalPrice &&
          item.selectedVariant?.name === selectedVariant?.name
      );

      if (existingIndex >= 0) {
        const currentQty = prev[existingIndex].quantity;
        const currentTotalQty = currentQty * multiplier;
        
        if (currentTotalQty + totalQty > maxStock) {
           notify("Stock max atteint dans le panier", "error");
           return prev;
        }
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: currentQty + quantity };
        return newCart;
      }
      return [...prev, { 
          ...selectedProduct, 
          price: finalPrice, 
          quantity, 
          unit: finalUnit,
          category: selectedProduct.category,
          selectedVariant: selectedVariant || undefined
      }];
    });
    setSelectedProduct(null);
  };

  const handleProcessSale = async () => {
    if (cart.length === 0 || isProcessing) return;
    
    // Check if we should show confirmation first
    if (!showConfirmCheckout) {
        setShowConfirmCheckout(true);
        return;
    }

    setIsProcessing(true);
    setShowConfirmCheckout(false);

    try {
        const rawAmountPaid = parseFloat(amountPaidInput) || 0;
        const total = cartTotal;
        
        let advanceUsed = 0;
        let newAdvanceCreated = 0;
        let remainingDebt = 0;
        let reimbursement = 0;
        let debtPaid = 0;

        if (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt) {
            // We are paying off the basket AND the customer's outstanding debt
            if (rawAmountPaid >= total) {
                // Basket is fully paid
                const excess = rawAmountPaid - total;
                debtPaid = Math.min(excess, selectedCustomer.outstandingDebt);
                const remainingExcess = excess - debtPaid;

                if (remainingExcess > 0) {
                    if (excessAction === 'advance') {
                        newAdvanceCreated = remainingExcess;
                        reimbursement = 0;
                    } else {
                        newAdvanceCreated = 0;
                        reimbursement = remainingExcess;
                    }
                }
                
                // Since db.ts updates customer debt as: customer.outstandingDebt + invoice.remainingDebt,
                // we set remainingDebt to -debtPaid, which will reduce customer.outstandingDebt by debtPaid!
                remainingDebt = -debtPaid;
            } else {
                // Basket is partially paid, old debt remains untouched, and we add new debt
                remainingDebt = total - rawAmountPaid;
            }
        } else {
            // Normal calculation when not paying off old debt or no old debt exists
            if (selectedCustomer && useAdvance) {
                advanceUsed = Math.min(total, selectedCustomer.advanceBalance);
            }

            const amountToPay = total - advanceUsed;
            const amountPaid = rawAmountPaid;

            if (amountPaid > amountToPay) {
                if (excessAction === 'advance') {
                    newAdvanceCreated = amountPaid - amountToPay;
                    reimbursement = 0;
                } else {
                    newAdvanceCreated = 0;
                    reimbursement = amountPaid - amountToPay;
                }
            } else if (amountPaid < amountToPay) {
                remainingDebt = amountToPay - amountPaid;
            }
        }

        // Requirement: If advance or debt is involved, full customer registration is mandatory
        if ((advanceUsed > 0 || newAdvanceCreated > 0 || remainingDebt !== 0 || debtPaid > 0) && !selectedCustomer) {
            notify("Enregistrement complet du client obligatoire pour avance ou dette", "error");
            setIsProcessing(false);
            return;
        }

        let status: 'PAYÉ' | 'PARTIEL' | 'IMPAYÉ';
        if (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt) {
            status = rawAmountPaid >= total ? 'PAYÉ' : (rawAmountPaid > 0 ? 'PARTIEL' : 'IMPAYÉ');
        } else {
            status = (rawAmountPaid + advanceUsed) >= total ? 'PAYÉ' : ((rawAmountPaid + advanceUsed) > 0 ? 'PARTIEL' : 'IMPAYÉ');
        }

        const newInvoice: Invoice = {
            id: `FAC-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString(),
            customerName: customerName || 'Client Comptoir',
            boutique: selectedBoutique || (boutiques[0]?.id || 'Boutique 1'),
            items: cart.map(item => {
                const mappedItem: any = {
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    category: item.category || 'Non catégorisé',
                    unit: item.unit || 'Détail',
                    costPrice: item.selectedVariant?.costPrice || item.costPrice || 0,
                    stock: item.stock || 0
                };
                if (item.selectedVariant) {
                    mappedItem.selectedVariant = item.selectedVariant;
                }
                return mappedItem;
            }),
            total: total,
            serviceCost: totalServiceCost,
            amountPaid: rawAmountPaid,
            advanceUsed: advanceUsed,
            reimbursement: reimbursement,
            newAdvanceCreated: newAdvanceCreated,
            remainingDebt: remainingDebt,
            debtPaid: debtPaid,
            status: status,
            isWholesale: isWholesale,
            sellerName: userName,
        };
        
        if (invoiceDescription) {
            newInvoice.description = invoiceDescription;
        }

        const updatedProducts = products.map(p => {
            const cartItemsForProduct = cart.filter(c => c.id === p.id);
            if (cartItemsForProduct.length > 0) {
                let updatedP = { ...p };
                
                cartItemsForProduct.forEach(item => {
                    const multiplier = getMultiplier(item.unit);
                    const qtyToDeduct = item.quantity * multiplier;

                    if (item.selectedVariant) {
                        // Deduct from specific variant
                        const variantIndex = updatedP.variants?.findIndex(v => v.name === item.selectedVariant?.name);
                        if (variantIndex !== undefined && variantIndex >= 0 && updatedP.variants) {
                            const newVariants = [...updatedP.variants];
                            if (selectedBoutique === (boutiques[0]?.id || 'Boutique 1')) {
                                newVariants[variantIndex] = {
                                    ...newVariants[variantIndex],
                                    stock: Math.max(0, (newVariants[variantIndex].stock || 0) - qtyToDeduct)
                                };
                            } else {
                                const currentBoutiqueStock = newVariants[variantIndex].boutiqueStock?.[selectedBoutique] || 0;
                                newVariants[variantIndex] = {
                                    ...newVariants[variantIndex],
                                    boutiqueStock: {
                                        ...(newVariants[variantIndex].boutiqueStock || {}),
                                        [selectedBoutique]: Math.max(0, currentBoutiqueStock - qtyToDeduct)
                                    }
                                };
                            }
                            updatedP.variants = newVariants;
                        }
                    } else {
                        // Fallback: Deduct from boutique stock
                        if (selectedBoutique === (boutiques[0]?.id || 'Boutique 1')) {
                            updatedP.stock = Math.max(0, (updatedP.stock || 0) - qtyToDeduct);
                        } else {
                            const currentBoutiqueStock = updatedP.boutiqueStock?.[selectedBoutique] || 0;
                            updatedP.boutiqueStock = {
                                ...(updatedP.boutiqueStock || {}),
                                [selectedBoutique]: Math.max(0, currentBoutiqueStock - qtyToDeduct)
                            };
                        }
                    }
                });
                return updatedP;
            }
            return p;
        });

        const updatedPreviousInvoices: Invoice[] = [];
        if (selectedCustomer && debtPaid > 0) {
            // Find all unpaid or partial invoices for this customer by checking actual remaining debt
            const customerInvoices = (invoices || [])
                .filter(inv => {
                    if (inv.deleted) return false;
                    const nameMatch = (inv.customerName || '').toLowerCase().trim() === (selectedCustomer.name || '').toLowerCase().trim();
                    if (!nameMatch) return false;
                    const prevInvRemaining = inv.remainingDebt !== undefined 
                        ? inv.remainingDebt 
                        : Math.max(0, inv.total - (inv.amountPaid || 0) - (inv.advanceUsed || 0));
                    return prevInvRemaining > 0;
                })
                // Sort by date ascending (oldest first) to pay off oldest debts first
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let remainingRepayment = debtPaid;

            for (const prevInv of customerInvoices) {
                if (remainingRepayment <= 0) break;

                // How much is left to pay on this invoice?
                const prevInvRemaining = prevInv.remainingDebt !== undefined 
                    ? prevInv.remainingDebt 
                    : Math.max(0, prevInv.total - (prevInv.amountPaid || 0) - (prevInv.advanceUsed || 0));

                if (prevInvRemaining <= 0) continue;

                const paymentForThisInv = Math.min(remainingRepayment, prevInvRemaining);
                remainingRepayment -= paymentForThisInv;

                const newAmountPaid = (prevInv.amountPaid || 0) + paymentForThisInv;
                const newRemainingDebt = Math.max(0, prevInvRemaining - paymentForThisInv);
                const newStatus = (newAmountPaid + (prevInv.advanceUsed || 0)) >= prevInv.total - 0.01 ? 'PAYÉ' : 'PARTIEL';

                const paymentRecord: Payment = {
                    id: Date.now().toString() + '-' + Math.random().toString().slice(2, 6),
                    date: new Date().toISOString(),
                    amount: paymentForThisInv,
                    note: `Remboursement via Caisse (${newInvoice.id})`
                };

                updatedPreviousInvoices.push({
                    ...prevInv,
                    provenderieId: prevInv.provenderieId || currentProvenderieId,
                    amountPaid: newAmountPaid,
                    remainingDebt: newRemainingDebt,
                    status: newStatus,
                    paymentHistory: [...(prevInv.paymentHistory || []), paymentRecord]
                });
            }
        }

        await onCheckout(newInvoice, updatedProducts, selectedCustomer || undefined, updatedPreviousInvoices);
        setShowReceipt(newInvoice);
        setCart([]);
        setCustomerName('Client Comptoir');
        setInvoiceDescription('');
        setAmountPaidInput('');
        setServiceCost('');
        setIsWholesale(false);
        setSelectedCustomer(null);
        setUseAdvance(true);
        setExcessAction('advance');
        notify("Vente validée !", "success");
    } catch(e) {
        notify("Erreur vente", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleEditLastSale = () => {
    if (!showReceipt) return;
    const restoredProducts = products.map(p => {
        const itemsToRestore = (showReceipt.items || []).filter(item => item.id === p.id);
        if (itemsToRestore.length > 0) {
            let updatedP = { ...p };
            itemsToRestore.forEach(item => {
                const multiplier = getMultiplier(item.unit);
                const qtyToAddBack = item.quantity * multiplier;
                
                if (item.selectedVariant) {
                    const variantIndex = updatedP.variants?.findIndex(v => v.name === item.selectedVariant?.name);
                    if (variantIndex !== undefined && variantIndex >= 0 && updatedP.variants) {
                        const newVariants = [...updatedP.variants];
                        const boutique = showReceipt.boutique || (boutiques[0]?.id || 'Boutique 1');
                        if (boutique === (boutiques[0]?.id || 'Boutique 1')) {
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
                    const boutique = showReceipt.boutique || (boutiques[0]?.id || 'Boutique 1');
                    if (boutique === (boutiques[0]?.id || 'Boutique 1')) {
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
    });
    onVoidLastSale(showReceipt.id, restoredProducts);
    
    // Re-populate cart
    // Note: This is a simplification. Ideally we map InvoiceItem back to CartItem
    const restoredCart: CartItem[] = (showReceipt.items || []).map(item => {
        const originalProduct = products.find(p => p.id === item.id);
        return {
            ...originalProduct!,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit
        };
    });

    setCart(restoredCart);
    setCustomerName(showReceipt.customerName || '');
    setAmountPaidInput(showReceipt.total.toString()); // Assuming full payment for simplicity or store logic
    setShowReceipt(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesTab = activeTab === 'Tout' || 
      dynamicTabs.find(t => t.id === activeTab)?.categories.includes(product.category);
      
    // Check if product has stock > 0 in the selected boutique
    const hasVariants = product.variants && product.variants.length > 0;
    const totalStock = hasVariants
        ? product.variants!.reduce((acc, v) => acc + (selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutique] || 0)), 0)
        : (selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (product.stock || 0) : (product.boutiqueStock?.[selectedBoutique] || 0));
    
    const hasStock = totalStock > 0;

    return matchesSearch && matchesTab && hasStock;
  });

  // Render Receipt
  if (showReceipt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300 print:hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-600"/> 
                        </div>
                        Vente Validée avec Succès
                    </h3>
                    <p className="text-gray-500 text-sm mt-1 ml-11">Facture <span className="font-mono font-bold text-gray-700">#{showReceipt.id}</span></p>
                </div>
                <button onClick={() => setShowReceipt(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex justify-center">
                 <div className="w-full max-w-[210mm]">
                    <InvoiceTemplate invoice={showReceipt} boutique={boutiques.find(b => b.id === showReceipt.boutique)} provenderie={currentProvenderie} companyName={companyName} />
                 </div>
            </div>

            <div className="p-6 border-t bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-3 w-full sm:w-auto">
                    {(isPOSAdmin || userPermissions.includes('reports')) && (
                        <button onClick={() => { 
                            if (window.confirm("Êtes-vous sûr de vouloir annuler cette vente ?")) {
                                 onVoidLastSale(showReceipt.id, products);
                                 setShowReceipt(null);
                                 setCart([]);
                                 notify("Vente annulée", "info");
                            }
                        }} className="flex-1 sm:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 border border-red-100 transition-colors">
                            Annuler Vente
                        </button>
                    )}
                    {(isPOSAdmin || userPermissions.includes('invoices')) && (
                        <button onClick={handleEditLastSale} className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 border border-gray-200 transition-colors">
                            Modifier
                        </button>
                    )}
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 flex items-center justify-center gap-2 transition-all">
                        <Printer className="w-4 h-4"/> Imprimer
                    </button>
                    <button onClick={() => { setShowReceipt(null); setShowPreviewModal(false); }} className="flex-1 sm:flex-none px-8 py-3 bg-[var(--color-farm-600)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-farm-200)] hover:bg-[var(--color-farm-700)] hover:shadow-[var(--color-farm-300)] flex items-center justify-center gap-2 transition-all">
                        Nouvelle Vente <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
        
        {/* Hidden Print Content */}
        <div className="print-only">
            <InvoiceTemplate invoice={showReceipt} boutique={boutiques.find(b => b.id === showReceipt.boutique)} provenderie={currentProvenderie} companyName={companyName} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative overflow-y-auto lg:overflow-hidden p-1">
      
      {/* Mobile Navigation Tabs */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 sticky top-0 z-40 shrink-0 rounded-2xl overflow-hidden p-1 shadow-sm">
          <button 
            onClick={() => setMobileTab('products')}
            className={`flex-1 py-3 font-black text-xs uppercase tracking-wider transition-all rounded-xl ${mobileTab === 'products' ? 'bg-farm-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'}`}
          >
            Produits
          </button>
          <button 
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-3 font-black text-xs uppercase tracking-wider transition-all rounded-xl flex items-center justify-center gap-2 ${mobileTab === 'cart' ? 'bg-farm-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'}`}
          >
            Panier ({cart.length})
          </button>
      </div>

      {/* Product Selection Area */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#121824] rounded-[2.5rem] border border-white/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden min-h-[500px] lg:min-h-0 ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div>
                  <h2 className="text-2xl font-display font-black text-slate-850 dark:text-slate-100 tracking-tight leading-none uppercase">
                      Point de Vente (POS)
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Caisse principale active</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 {/* Shared Annotation Toggle Switcher */}
                 <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs hover:border-emerald-500/50 transition-all shrink-0">
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

                 <select 
                     className={`bg-farm-50 dark:bg-farm-950/25 border border-farm-200/30 dark:border-farm-800/65 text-farm-800 dark:text-farm-400 text-xs font-black px-4 py-2 rounded-2xl outline-none hover:bg-farm-100 dark:hover:bg-farm-900/30 transition-all ${canSelectBoutique ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                     value={selectedBoutique}
                     onChange={e => setSelectedBoutique(e.target.value)}
                     disabled={!canSelectBoutique}
                 >
                     {boutiques
                       .filter(b => userBoutique === 'Toutes' || b.id === userBoutique || b.name === userBoutique)
                       .map(b => (
                         <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                 </select>
              </div>
          </div>

          {/* Annotations for POS */}
          {showAnnotations && (
            <div className="mb-4 p-5 bg-emerald-50/40 border border-emerald-500/20 rounded-2xl flex flex-col md:flex-row gap-6 text-left animate-in fade-in duration-300 shadow-3xs">
              <div className="flex items-start gap-4 flex-1">
                <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                  8
                </span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                    Panier de Caisse Tactile & Recherche Rapide
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Sélectionnez ou recherchez des articles pour alimenter le panier de caisse. Double-cliquez pour ajuster les quantités ou appliquer des remises.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 flex-1 border-t md:border-t-0 md:border-l border-slate-200/65 pt-4 md:pt-0 md:pl-6">
                <span className="w-6 h-6 rounded-full bg-[#137333] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                  9
                </span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                    Règlements Multi-moyens & Dettes Clients
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Validez la vente en spécifiant l'acompte payé (espèces, Mobile Money, etc.) et suivez automatiquement le solde débiteur restant dû.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Scanner ou rechercher un produit, un ingrédient..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-farm-500 outline-none text-slate-800 dark:text-slate-100 text-sm font-bold shadow-inner placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
                onClick={() => setShowStatsModal(true)} 
                className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:-translate-y-0.5 transition-all whitespace-nowrap shadow-sm"
            >
                <TrendingUp className="w-4 h-4 text-farm-500" /> Stats
            </button>
            <button 
                onClick={() => setShowExpenseModal(true)} 
                className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:-translate-y-0.5 transition-all whitespace-nowrap shadow-sm"
            >
                <TrendingDown className="w-4 h-4 text-rose-500" /> Sortie
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {dynamicTabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-farm-500 text-white shadow-lg shadow-farm-500/20 translate-y-[-1px]' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-250/50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 dark:bg-slate-950/20 premium-scrollbar">
          {isWholesale && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 text-amber-700 dark:text-amber-400 p-4 mb-5 rounded-r shadow-sm flex items-start gap-3.5 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                      <p className="font-extrabold text-xs uppercase tracking-wider">MODE PRIX DE GROS ACTIF</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vérifiez les prix avant de valider.</p>
                  </div>
              </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const hasVariants = product.variants && product.variants.length > 0;
              const totalStock = hasVariants 
                  ? product.variants!.reduce((acc, v) => acc + (selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutique] || 0)), 0) 
                  : (selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (product.stock || 0) : (product.boutiqueStock?.[selectedBoutique] || 0));

              return (
              <button 
                key={product.id}
                onClick={() => handleProductClick(product)}
                disabled={totalStock <= 0}
                className={`text-left p-4 rounded-[1.75rem] border border-slate-200/65 dark:border-slate-800/80 transition-all duration-300 flex flex-col h-full bg-white dark:bg-slate-900 group relative overflow-hidden shadow-sm hover:border-farm-400/50 dark:hover:border-farm-500/50 hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 ${totalStock <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex justify-between items-center mb-3">
                   <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                     product.category === Category.RAW_MATERIALS 
                       ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/20' 
                       : 'bg-farm-50 dark:bg-farm-950/20 text-farm-600 dark:text-farm-400 border border-farm-200/20'
                   }`}>
                     {product.category === Category.RAW_MATERIALS ? 'Matière' : 'Aliment'}
                   </span>
                   <span className={`text-[10px] font-extrabold tracking-tight px-2 py-0.5 rounded-md ${
                     totalStock < 10 
                       ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' 
                       : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                   }`}>
                     {formatStock(totalStock)}
                   </span>
                </div>
                
                <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-snug tracking-tight mb-2 line-clamp-2 group-hover:text-farm-500 dark:group-hover:text-farm-400 transition-colors h-10">
                  {product.name || 'Produit sans nom'}
                </h3>
                
                {hasVariants ? (
                    <div className="mt-2 space-y-1.5 w-full overflow-y-auto max-h-24 scrollbar-hide">
                        {product.variants!.map((v, idx) => {
                            const vStock = selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutique] || 0);
                            return (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-slate-50/60 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60 transition-colors group/variant hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[55%]">{v.name}</span>
                                    <div className="flex gap-2 items-center shrink-0">
                                        <span className={`font-black uppercase tracking-tight ${vStock > 0 ? 'text-slate-400 dark:text-slate-500' : 'text-rose-400'}`}>{vStock} kg</span>
                                        <span className="font-black text-slate-900 dark:text-slate-100">{new Intl.NumberFormat('fr-FR').format(v.price)} F</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 w-full">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Prix Unitaire</span>
                        <div className="font-black text-farm-500 dark:text-farm-400 text-base tabular-nums">
                            {new Intl.NumberFormat('fr-FR').format(product.price)} <span className="text-[11px] font-extrabold">F</span>
                        </div>
                    </div>
                )}
              </button>
            )})}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className={`w-full lg:w-[450px] lg:h-full bg-white dark:bg-[#121824] rounded-[2.5rem] border border-slate-200/85 dark:border-slate-800/80 flex flex-col min-h-[400px] lg:min-h-0 shrink-0 lg:shrink relative z-20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-none ${mobileTab === 'products' ? 'hidden lg:flex' : 'flex'}`}>
         <div className="p-4 sm:p-5 bg-slate-900 dark:bg-slate-950 text-white shrink-0 relative z-30 border-b border-slate-800/60 shadow-lg">
             <div className="flex flex-wrap xs:flex-nowrap gap-2 justify-between items-center mb-4">
                 <div className="flex items-center gap-0.5 xs:gap-1 bg-white/10 p-0.5 xs:p-1 rounded-xl border border-white/10">
                    <button 
                        onClick={() => { setSelectedCustomer(null); setCustomerName('Client Comptoir'); setIsRegisteredMode(false); }}
                        className={`px-1.5 xs:px-3 py-1 xs:py-1.5 rounded-lg text-[8px] xs:text-[9px] font-black uppercase tracking-wider transition-all ${!isRegisteredMode && !selectedCustomer ? 'bg-white text-slate-900 shadow-md' : 'text-white/60 hover:text-white'} cursor-pointer`}
                    >
                        Comptoir
                    </button>
                    <button 
                        onClick={() => { setIsRegisteredMode(true); setIsSearchFocused(true); }}
                        className={`px-1.5 xs:px-3 py-1 xs:py-1.5 rounded-lg text-[8px] xs:text-[9px] font-black uppercase tracking-wider transition-all ${isRegisteredMode || selectedCustomer ? 'bg-farm-500 text-white shadow-md' : 'text-white/60 hover:text-white'} cursor-pointer`}
                    >
                        Enregistré
                    </button>
                 </div>
                 <div className="flex items-center gap-1.5 xs:gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input type="checkbox" checked={isWholesale} onChange={e => setIsWholesale(e.target.checked)} className="w-3.5 h-3.5 rounded-md border-white/20 bg-white/10 text-farm-500 focus:ring-0 focus:ring-offset-0 transition-colors" />
                        <span className="text-[8px] xs:text-[9px] font-black uppercase tracking-wider text-white/60 group-hover:text-white transition-colors">Gros</span>
                    </label>
                    <span className="bg-white/10 px-1.5 xs:px-2.5 py-0.5 xs:py-1 rounded-lg text-[8px] xs:text-[9px] font-black tracking-wider uppercase text-white/80">{cart.length} Art.</span>
                 </div>
             </div>

             {!selectedCustomer ? (
                 <div className="space-y-2">
                     {isRegisteredMode ? (
                            <div className="relative" onFocus={() => setIsSearchFocused(true)} onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                    <input 
                                        className="w-full bg-white border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-black placeholder-slate-400 outline-none focus:ring-2 focus:ring-farm-400/50 transition-all shadow-inner" 
                                        placeholder="Chercher un client..." 
                                        value={customerSearchTerm} 
                                        onChange={e => setCustomerSearchTerm(e.target.value)} 
                                    />
                                </div>
                                {isSearchFocused && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] mt-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200 ring-1 ring-black/5">
                                        <div className="p-1.5 border-b border-slate-50 bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-widest px-3 flex justify-between items-center sticky top-0 z-10">
                                            <span>Clients Enregistrés</span>
                                            <Plus className="w-3 h-3 text-farm-500 cursor-pointer" onClick={() => setIsAddingCustomer(true)} />
                                        </div>
                                        {customers.filter(c => {
                                            const term = customerSearchTerm.toLowerCase().trim();
                                            const matchesBoutique = userBoutique === 'Toutes' || c.boutique === userBoutique || (c.boutique === 'Maison Mère' && userBoutique === 'Boutique 1');
                                            return matchesBoutique && (term === '' || 
                                                   c.name.toLowerCase().includes(term) || 
                                                   (c.phone && c.phone.includes(term)));
                                        }).length > 0 ? (
                                            customers.filter(c => {
                                                const term = customerSearchTerm.toLowerCase().trim();
                                                const matchesBoutique = userBoutique === 'Toutes' || c.boutique === userBoutique || (c.boutique === 'Maison Mère' && userBoutique === 'Boutique 1');
                                                return matchesBoutique && (term === '' || 
                                                       c.name.toLowerCase().includes(term) || 
                                                       (c.phone && c.phone.includes(term)));
                                            }).map(c => (
                                                <button 
                                                    key={c.id} 
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setSelectedCustomer(c); 
                                                        setCustomerName(c.name); 
                                                        setCustomerSearchTerm(''); 
                                                        setIsSearchFocused(false);
                                                    }} 
                                                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[11px] text-slate-900 group-hover:text-farm-600 transition-colors">{c.name}</span>
                                                        <span className="text-[8px] text-slate-500 font-medium">{c.phone || 'Sans tel'}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        {c.advanceBalance > 0 && <div className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Avance: {new Intl.NumberFormat('fr-FR').format(c.advanceBalance)} F</div>}
                                                        {c.outstandingDebt > 0 && <div className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">Dette: {new Intl.NumberFormat('fr-FR').format(c.outstandingDebt)} F</div>}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-[9px] text-slate-400 italic">Aucun client trouvé</div>
                                        )}
                                        <button 
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (customerSearchTerm) {
                                                    setNewCustomerForm(prev => ({ ...prev, name: customerSearchTerm }));
                                                }
                                                setIsAddingCustomer(true);
                                            }}
                                            className="w-full p-2 bg-farm-50 text-farm-600 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-farm-100 transition-colors border-t border-slate-100 sticky bottom-0"
                                        >
                                            <Plus className="w-2.5 h-2.5" /> Créer Nouveau Client
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                                <input 
                                    className="w-full bg-white border border-white/20 rounded-xl pl-9 pr-3 py-2 text-xs text-black placeholder-slate-400 outline-none focus:ring-2 focus:ring-farm-400/50 transition-all shadow-inner" 
                                    placeholder="Nom du client (Comptoir)..." 
                                    value={customerName === 'Client Comptoir' ? '' : customerName} 
                                    onChange={e => setCustomerName(e.target.value || 'Client Comptoir')} 
                                />
                            </div>
                        )}
                     </div>
                 ) : (
                    <div className="bg-white p-2 rounded-xl flex items-center justify-between animate-in zoom-in-95 duration-200 shadow-lg border border-farm-200">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-farm-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                {selectedCustomer.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-slate-900 leading-none">{selectedCustomer.name}</span>
                                <span className="text-[8px] text-slate-500 font-medium tracking-tighter">{selectedCustomer.phone || 'Sans téléphone'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedCustomer.outstandingDebt > 0 ? (
                                <label className="flex items-center gap-1 cursor-pointer bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 animate-pulse">
                                    <input type="checkbox" checked={payDebt} onChange={e => setPayDebt(e.target.checked)} className="w-2.5 h-2.5 rounded border-rose-200 bg-white text-rose-500 focus:ring-0 cursor-pointer" />
                                    <span className="text-[8px] text-rose-600 font-black uppercase tracking-tighter">Rembourser Dette ({new Intl.NumberFormat('fr-FR').format(selectedCustomer.outstandingDebt)} F)</span>
                                </label>
                            ) : (
                                selectedCustomer.advanceBalance > 0 && (
                                    <label className="flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                        <input type="checkbox" checked={useAdvance} onChange={e => setUseAdvance(e.target.checked)} className="w-2.5 h-2.5 rounded border-emerald-200 bg-white text-emerald-500 focus:ring-0" />
                                        <span className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter">Utiliser Avance</span>
                                    </label>
                                )
                            )}
                            <button onClick={() => { setSelectedCustomer(null); setCustomerName('Client Comptoir'); }} className="p-1 hover:bg-slate-100 rounded transition-colors">
                                <X className="w-3 h-3 text-slate-400 hover:text-rose-500" />
                            </button>
                        </div>
                    </div>
                 )}
             </div>

         <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-slate-50/50 premium-scrollbar">
             {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                    <ShoppingCart className="w-12 h-12 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Panier Vide</p>
                </div>
             )}
             {cart.map((item, idx) => (
                 <div key={`${item.id}-${idx}`} className="bg-white dark:bg-slate-900 py-2.5 px-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group animate-in slide-in-from-right-4 duration-200">
                     <div className="flex justify-between items-start mb-1">
                         <div className="flex flex-col">
                             <span className="font-black text-[11px] text-slate-900 leading-tight">{item.name}</span>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none">{item.selectedVariant?.name || item.unit}</span>
                                {isWholesale && <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">Prix Gros</span>}
                             </div>
                         </div>
                         <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                            <Trash2 className="w-3.5 h-3.5"/>
                         </button>
                     </div>
                     
                     <div className="flex items-center justify-between">
                         <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                             <button onClick={() => {
                                 const newCart = [...cart];
                                 if (newCart[idx].quantity > 1) {
                                     newCart[idx].quantity -= 1;
                                     setCart(newCart);
                                 }
                             }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors font-black">-</button>
                             <span className="w-7 text-center text-[11px] font-black text-slate-900">{item.quantity}</span>
                             <button onClick={() => {
                                 const newCart = [...cart];
                                 newCart[idx].quantity += 1;
                                 setCart(newCart);
                             }} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors font-black">+</button>
                         </div>
                         <div className="text-right">
                             <div className="text-[9px] text-slate-400 font-bold line-through decoration-slate-300 leading-none mb-0.5">
                                {new Intl.NumberFormat('fr-FR').format((item.selectedVariant ? (isWholesale ? (item.selectedVariant.wholesalePrice || item.selectedVariant.price) : item.selectedVariant.price) : (isWholesale ? (item.wholesalePrice || item.price) : item.price)))} F
                             </div>
                             <div className="text-[11px] font-black text-slate-900 leading-none">
                                 {new Intl.NumberFormat('fr-FR').format((item.selectedVariant ? (isWholesale ? (item.selectedVariant.wholesalePrice || item.selectedVariant.price) : item.selectedVariant.price) : (isWholesale ? (item.wholesalePrice || item.price) : item.price)) * item.quantity)} F
                             </div>
                         </div>
                     </div>
                 </div>
             ))}
         </div>

         <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] dark:shadow-none shrink-0 space-y-3 relative z-30">
             <div className="flex items-center justify-between text-[11px] font-bold">
                 <span className="text-slate-400 uppercase tracking-widest">Sous-total</span>
                 <span className="text-slate-900 dark:text-slate-100 tabular-nums">{new Intl.NumberFormat('fr-FR').format(cartSubtotal)} F</span>
             </div>
             <div className="flex items-center justify-between text-[11px] font-bold">
                 <span className="text-slate-400 uppercase tracking-widest">Frais Service</span>
                 <input type="number" className="bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/65 rounded px-2 py-1 text-[11px] font-black text-slate-900 dark:text-slate-100 outline-none w-20 text-right focus:ring-1 focus:ring-farm-500" value={serviceCost} onChange={e => setServiceCost(e.target.value)} placeholder="0" />
             </div>
             
             <div className="h-px bg-slate-50 my-1"></div>

             <div className="flex justify-between items-center">
                 <span className="text-slate-400 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">Total Net</span>
                 <span className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tighter tabular-nums">
                     {new Intl.NumberFormat('fr-FR').format(cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0))} F
                 </span>
             </div>
             {selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt && (
                 <div className="text-[9px] text-slate-500 font-bold text-right leading-none">
                     (Panier: {new Intl.NumberFormat('fr-FR').format(cartTotal)} F + Dette: {new Intl.NumberFormat('fr-FR').format(selectedCustomer.outstandingDebt)} F)
                 </div>
             )}
             
             <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-slate-50 dark:bg-slate-800/20 p-2.5 rounded-2xl border border-slate-150/50 dark:border-slate-800/60">
                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Montant Versé</span>
                    <input 
                        type="number" 
                        className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-755 rounded-xl px-2.5 py-1.5 font-black text-xs text-slate-900 dark:text-slate-100 outline-none w-full focus:ring-2 focus:ring-farm-500/30 transition-all shadow-inner" 
                        value={amountPaidInput} 
                        onChange={e => setAmountPaidInput(e.target.value)} 
                        placeholder="0" 
                    />
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-800 dark:border-slate-850 flex flex-col justify-center items-end">
                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Reste à Payer</span>
                    <div className="flex flex-col items-end">
                        <span className={`text-sm font-black tracking-tighter ${balanceDue > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {new Intl.NumberFormat('fr-FR').format(balanceDue)} F
                        </span>
                        {balanceDue > 0 && !selectedCustomer && (
                            <span className="text-[7px] font-black text-rose-600 uppercase tracking-tighter animate-pulse">Client Requis</span>
                        )}
                    </div>
                </div>
             </div>

             {(parseFloat(amountPaidInput) || 0) > (cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0) - currentAdvanceUsed) && (
                <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-xl border border-emerald-100 mt-2 animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-emerald-600 uppercase">Excédent</span>
                        <span className="text-xs font-black text-emerald-700">
                            {new Intl.NumberFormat('fr-FR').format((parseFloat(amountPaidInput) || 0) - (cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0) - currentAdvanceUsed))} F
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setExcessAction('reimburse')} className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-all ${excessAction === 'reimburse' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-600 border border-emerald-200'}`}>Rendre</button>
                        {!debtRemains && (
                            <button onClick={() => setExcessAction('advance')} className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-all ${excessAction === 'advance' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 border border-blue-200'}`}>Avance</button>
                        )}
                    </div>
                </div>
             )}

             <button 
                onClick={handleProcessSale} 
                disabled={cart.length === 0 || isProcessing} 
                className={`w-full py-3.5 mt-2 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isWholesale ? 'bg-amber-600 shadow-amber-200' : 'bg-farm-600 shadow-farm-200'}`}
             >
                 {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : (isWholesale ? 'Confirmer Gros' : 'Valider Vente')}
             </button>
         </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white dark:bg-[#121824] rounded-[2.5rem] shadow-2xl p-7 w-full max-w-md border border-slate-150/50 dark:border-slate-800 animate-in zoom-in-95">
               <div className="flex justify-between items-start mb-6">
                   <h3 className="font-black text-2xl leading-none uppercase tracking-tight text-slate-850 dark:text-slate-100 font-display">{selectedProduct.name}</h3>
                   <button onClick={() => setSelectedProduct(null)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
               </div>
               
               <div className="space-y-5 mb-6">
                   {/* Variant Selection - First Step */}
                   {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Variante</label>
                           <select 
                                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-farm-500 shadow-sm transition-all" 
                                value={selectedVariant?.name || ''} 
                                onChange={e => {
                                    const v = selectedProduct.variants?.find(v => v.name === e.target.value);
                                    setSelectedVariant(v || null);
                                }}
                           >
                               {selectedProduct.variants.map(v => (
                                   <option key={v.name} value={v.name}>
                                       {v.name} (Stock: {selectedBoutique === (boutiques[0]?.id || 'Boutique 1') ? (v.stock || 0) : (v.boutiqueStock?.[selectedBoutique] || 0)})
                                   </option>
                               ))}
                           </select>
                       </div>
                   )}

                   <div>
                       <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Conditionnement</label>
                       <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-farm-500 shadow-sm transition-all" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                           <option value="Détail">{isWholesale ? 'Gros (Unité par défaut)' : 'Détail (Unité par défaut)'}</option>
                           {/* Only show bulk units for Raw Materials and Feed */}
                           {(selectedProduct.category === Category.RAW_MATERIALS || selectedProduct.category === Category.POULTRY || selectedProduct.category === Category.LIVESTOCK) && (
                               <>
                                   <option value="Sac 25kg">Sac 25kg</option>
                                   <option value="Sac 40kg">Sac 40kg</option>
                                   <option value="Sac 50kg">Sac 50kg</option>
                               </>
                           )}
                       </select>
                   </div>
                   
                   <div>
                       <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Prix Unitaire Personnalisé</label>
                       <input 
                            type="number" 
                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-farm-500 shadow-inner" 
                            value={customPrice} 
                            onChange={e => setCustomPrice(e.target.value)} 
                            placeholder={((selectedVariant ? (isWholesale ? (selectedVariant.wholesalePrice || selectedVariant.price) : selectedVariant.price) : (isWholesale ? (selectedProduct.wholesalePrice || selectedProduct.price) : selectedProduct.price)) * getMultiplier(selectedUnit)).toString()} 
                       />
                       {((selectedVariant && selectedVariant.wholesalePrice) || (!selectedVariant && selectedProduct.wholesalePrice)) && (
                           <p className="text-xs text-green-600 mt-1 font-medium">Prix de gros suggéré: {(selectedVariant ? selectedVariant.wholesalePrice : selectedProduct.wholesalePrice)! * getMultiplier(selectedUnit)} F</p>
                       )}
                   </div>

                   <div className="flex items-center gap-3">
                       <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Quantité</label>
                            <input type="number" autoFocus className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-farm-500 rounded-2xl text-2xl font-black text-center text-slate-900 dark:text-slate-100 outline-none focus:shadow-xl transition-all" value={qtyInput} onChange={e => setQtyInput(e.target.value)} />
                       </div>
                       <div className="flex items-end pb-3">
                            <span className="text-sm font-bold text-gray-400">{(selectedUnit === 'Détail' || selectedUnit === 'Gros') ? selectedProduct.unit : 'Unités'}</span>
                       </div>
                   </div>
               </div>

               <button onClick={confirmAddToCart} className="w-full py-4 bg-farm-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-farm-600 hover:shadow-xl transition-all duration-300">
                    Ajouter au Panier
               </button>
           </div>
        </div>
      )}

      {/* Confirm Checkout Modal */}
      {showConfirmCheckout && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                  <div className="p-4 md:p-8">
                      <div className="flex justify-between items-start mb-4 md:mb-8">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-farm-600 text-white rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-farm-200 rotate-3">
                              <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                          <div className="text-right">
                              <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total à Encaisser</p>
                              <p className="text-2xl md:text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                                {new Intl.NumberFormat('fr-FR').format(cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0))} <span className="text-sm md:text-lg text-slate-400">F</span>
                              </p>
                              {selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt && (
                                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                                      (Panier: {new Intl.NumberFormat('fr-FR').format(cartTotal)} F + Dette: {new Intl.NumberFormat('fr-FR').format(selectedCustomer.outstandingDebt)} F)
                                  </p>
                              )}
                          </div>
                      </div>

                      <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                          <div className="p-4 md:p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 space-y-3 md:space-y-4">
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm">
                                      <User className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                                    </div>
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</span>
                                  </div>
                                  <span className="text-xs md:text-sm font-black text-slate-900">{customerName || 'Client Comptoir'}</span>
                              </div>
                              <div className="h-px bg-slate-200/50 w-full"></div>
                              <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm">
                                      <CreditCard className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant Versé</span>
                                  </div>
                                  <span className="text-base md:text-lg font-black text-emerald-600 tabular-nums">
                                    {new Intl.NumberFormat('fr-FR').format(parseFloat(amountPaidInput) || 0)} F
                                  </span>
                              </div>

                              {(parseFloat(amountPaidInput) || 0) > (cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0) - (selectedCustomer && useAdvance ? Math.min(cartTotal, selectedCustomer.advanceBalance) : 0)) && (
                                <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-slate-200 space-y-2 md:space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Trop-perçu</span>
                                    <span className="text-xs md:text-sm font-black text-slate-900 tabular-nums">
                                      {new Intl.NumberFormat('fr-FR').format((parseFloat(amountPaidInput) || 0) - (cartTotal + (selectedCustomer && selectedCustomer.outstandingDebt > 0 && payDebt ? selectedCustomer.outstandingDebt : 0) - (selectedCustomer && useAdvance ? Math.min(cartTotal, selectedCustomer.advanceBalance) : 0)))} F
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center bg-white p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-100">
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</span>
                                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-1 rounded-full ${excessAction === 'reimburse' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {excessAction === 'reimburse' ? 'Rendre la monnaie' : 'Créer une avance'}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>

                          {(!serviceCost || parseFloat(serviceCost) === 0) && (
                              <div className="p-4 md:p-5 bg-rose-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-rose-100 flex items-start gap-3 md:gap-4 animate-pulse">
                                  <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-500 text-white rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                                  </div>
                                  <div>
                                      <p className="text-[8px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Attention : Frais de Service</p>
                                      <p className="text-[10px] md:text-xs text-rose-500 font-bold leading-relaxed">
                                          Aucun frais de service ou de livraison n'a été saisi. Êtes-vous sûr de continuer ?
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="flex gap-3 md:gap-4">
                          <button 
                            onClick={() => setShowConfirmCheckout(false)} 
                            className="flex-1 py-4 md:py-5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                          >
                            Modifier
                          </button>
                          <button 
                            onClick={handleProcessSale} 
                            className="flex-[2] py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3"
                          >
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /> Confirmer
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (() => {
          const todayInvoices = invoices.filter(i => i.boutique === selectedBoutique && new Date(i.date).toDateString() === new Date().toDateString());
          
          const totalVentes = todayInvoices.reduce((acc, i) => {
              let val = i.total;
              if (!statsIncludeDebt) {
                  const debt = i.remainingDebt !== undefined ? i.remainingDebt : Math.max(0, i.total - (i.amountPaid || 0) - (i.advanceUsed || 0));
                  val -= debt;
              }
              return acc + val;
          }, 0);

          const totalEspeces = todayInvoices.reduce((acc, i) => {
              const base = i.amountPaid - (i.reimbursement || 0);
              if (statsIncludeAvance) {
                  return acc + base + (i.advanceUsed || 0);
              } else {
                  return acc + base - (i.newAdvanceCreated || 0);
              }
          }, 0);

          const totalSorties = expenses
              .filter(e => e.boutique === selectedBoutique && new Date(e.date).toDateString() === new Date().toDateString())
              .reduce((acc, e) => acc + e.amount, 0);

          const soldeCaisse = Math.max(0, totalEspeces - totalSorties);

          const categoryDataMap = {};
          todayInvoices.forEach(inv => {
              inv.items.forEach(item => {
                  const cat = item.category || 'Non catégorisé';
                  let itemRevenue = item.price * item.quantity;
                  if (!statsIncludeDebt) {
                      const ratio = inv.total > 0 ? (inv.total - (inv.remainingDebt || 0)) / inv.total : 0;
                      itemRevenue *= ratio;
                  }
                  categoryDataMap[cat] = (categoryDataMap[cat] || 0) + itemRevenue;
              });
          });
          const categoryChartData = Object.entries(categoryDataMap).map(([name, value]) => ({
              name,
              Montant: value
          }));

          return (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
                 <div className="bg-white dark:bg-[#121824] rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-slate-150/50 dark:border-slate-800/80 max-h-[95vh] overflow-y-auto">
                     <div className="flex justify-between items-center mb-4 md:mb-6">
                        <h3 className="font-bold text-lg md:text-2xl flex items-center gap-2 md:gap-3 text-gray-900 font-display">
                            <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg md:rounded-xl text-blue-600">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6"/> 
                            </div>
                            Aperçu Caisse
                        </h3>
                        <button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
                     </div>
                     
                     <div className="space-y-4 md:space-y-6">
                         <div className="bg-gray-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100">
                            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1">Boutique</p>
                            <p className="font-bold text-gray-900 text-base md:text-lg">{boutiques.find(b => b.id === selectedBoutique)?.name || selectedBoutique}</p>
                            <p className="text-[10px] md:text-xs text-gray-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                         </div>

                         {/* Toggles */}
                         <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                             <label className="flex items-center gap-2 cursor-pointer select-none">
                                 <input 
                                     type="checkbox" 
                                     checked={statsIncludeDebt} 
                                     onChange={e => setStatsIncludeDebt(e.target.checked)} 
                                     className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0" 
                                 />
                                 <span className="text-xs font-bold text-gray-700">Inclure dettes</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer select-none">
                                 <input 
                                     type="checkbox" 
                                     checked={statsIncludeAvance} 
                                     onChange={e => setStatsIncludeAvance(e.target.checked)} 
                                     className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0" 
                                 />
                                 <span className="text-xs font-bold text-gray-700">Inclure avances</span>
                             </label>
                         </div>

                         <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-emerald-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-emerald-100">
                                <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase mb-1">Total Ventes</p>
                                <p className="text-lg md:text-2xl font-bold text-emerald-700">
                                    {new Intl.NumberFormat('fr-FR').format(totalVentes)} F
                                </p>
                                <p className="text-[10px] md:text-xs text-emerald-500 mt-1">
                                    {todayInvoices.length} trans.
                                </p>
                            </div>
                            <div className="bg-blue-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-blue-100">
                                <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase mb-1">Espèces</p>
                                <p className="text-lg md:text-2xl font-bold text-blue-700">
                                    {new Intl.NumberFormat('fr-FR').format(totalEspeces)} F
                                </p>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-red-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-red-100">
                                <p className="text-[10px] md:text-xs font-bold text-red-600 uppercase mb-1">Total Sorties</p>
                                <p className="text-lg md:text-2xl font-bold text-red-700">
                                    {new Intl.NumberFormat('fr-FR').format(totalSorties)} F
                                </p>
                            </div>
                            <div className="bg-gray-900 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-800 text-white">
                                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-1">Solde</p>
                                <p className="text-lg md:text-2xl font-bold text-white">
                                    {new Intl.NumberFormat('fr-FR').format(soldeCaisse)} F
                                </p>
                            </div>
                         </div>

                         {categoryChartData.length > 0 && (
                             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                 <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-3">Ventes par Catégorie</p>
                                 <div className="h-[150px] w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <BarChart data={categoryChartData}>
                                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                             <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                             <YAxis tick={{ fontSize: 9, fill: '#6B7280' }} width={30} axisLine={false} tickLine={false} />
                                             <Tooltip formatter={(value) => `${value.toLocaleString()} F`} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                                             <Bar dataKey="Montant" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                         </BarChart>
                                     </ResponsiveContainer>
                                 </div>
                             </div>
                         )}
                     </div>
                 </div>
              </div>
          );
      })()}


      {/* Expense Modal */}
      {showExpenseModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 md:p-4 animate-in fade-in">
             <div className="bg-white dark:bg-[#121824] rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-slate-150/50 dark:border-slate-800/80 max-h-[95vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="font-bold text-lg md:text-2xl flex items-center gap-2 md:gap-3 text-gray-900 font-display">
                        <div className="p-1.5 md:p-2 bg-red-100 rounded-lg md:rounded-xl text-red-600">
                            <TrendingDown className="w-5 h-5 md:w-6 md:h-6"/> 
                        </div>
                        Sortie Caisse
                    </h3>
                    <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400"/></button>
                 </div>
                 
                 <div className="space-y-4 md:space-y-5 mb-6 md:mb-8">
                     <div>
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">Catégorie</label>
                        <select className="w-full p-3 md:p-4 border border-gray-200 rounded-xl text-sm md:text-base bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value, employeeId: '', amount: ''})}>
                            {EXPENSE_CATEGORIES.filter(cat => (selectedBoutique === boutiques[0]?.id) ? true : cat.id !== 'SALAIRE').map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                     </div>

                     {expenseForm.category !== 'SALAIRE' && expenseForm.category !== 'RATION' && (
                         <div>
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">
                                {expenseForm.category === 'DIVERS' ? 'Motif *' : 'Détails / Commentaire (Optionnel)'}
                            </label>
                            <textarea 
                                className="w-full p-3 md:p-4 border border-gray-200 rounded-xl text-sm md:text-base focus:ring-2 focus:ring-red-500 outline-none transition-all" 
                                rows={2} 
                                placeholder={expenseForm.category === 'DIVERS' ? "Ex: Achat balais, Réparation serrure..." : "Saisir des notes optionnelles..."} 
                                value={expenseForm.motif} 
                                onChange={e => setExpenseForm({...expenseForm, motif: e.target.value})} 
                            />
                         </div>
                     )}

                     {(expenseForm.category === 'RATION' || expenseForm.category === 'SALAIRE') && (
                         <div>
                            <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">Employé</label>
                            <select className="w-full p-3 md:p-4 border border-gray-200 rounded-xl text-sm md:text-base bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all" value={expenseForm.employeeId} onChange={e => {
                                const empId = e.target.value;
                                const emp = employees.find(emp => emp.id === empId);
                                let amount = '';
                                if (emp) {
                                    if (expenseForm.category === 'SALAIRE') amount = (emp.pendingSalary || 0).toString();
                                    if (expenseForm.category === 'RATION') amount = (emp.pendingRation || 0).toString();
                                }
                                setExpenseForm({...expenseForm, employeeId: empId, amount});
                            }}>
                                <option value="">Sélectionner un employé</option>
                                {employees
                                    .filter(emp => expenseForm.category === 'SALAIRE' ? (emp.pendingSalary || 0) > 0 : (emp.pendingRation || 0) > 0)
                                    .map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                         </div>
                     )}

                     <div>
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1 md:mb-2">Montant</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className={`w-full p-3 md:p-4 border border-gray-200 rounded-xl font-bold text-lg md:text-xl outline-none focus:ring-2 focus:ring-red-500 transition-all ${(expenseForm.category === 'SALAIRE' || expenseForm.category === 'RATION') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} 
                                placeholder="0 FCFA" 
                                value={expenseForm.amount} 
                                readOnly={expenseForm.category === 'SALAIRE' || expenseForm.category === 'RATION'}
                                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                            />
                        </div>
                     </div>
                 </div>

                 <div className="flex gap-3 md:gap-4">
                     <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 md:py-4 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm md:text-base">Annuler</button>
                     <button onClick={() => { 
                         const amount = parseFloat(expenseForm.amount);
                         const selectedBoutiqueName = boutiques.find(b => b.id === selectedBoutique)?.name || '';

                         // Validation
                         if (isNaN(amount) || amount <= 0) {
                             notify("Veuillez saisir un montant de sortie valide supérieur à 0", "error");
                             return;
                         }

                         if (expenseForm.category === 'DIVERS' && !expenseForm.motif) {
                             notify("Le motif est requis pour Divers", "error");
                             return;
                         }
                         if ((expenseForm.category === 'RATION' || expenseForm.category === 'SALAIRE') && !expenseForm.employeeId) {
                             notify("Veuillez sélectionner un employé", "error");
                             return;
                         }

                         // Check cash balance
                         const currentCash = invoices
                            .filter(i => i.boutique === selectedBoutique && !i.deleted)
                            .reduce((acc, i) => acc + (i.amountPaid - (i.reimbursement || 0)), 0) - 
                            expenses
                            .filter(e => e.boutique === selectedBoutique && !e.deleted)
                            .reduce((acc, e) => acc + e.amount, 0);

                         if (amount > currentCash) {
                             // Let it register so they can still operate even with unrecorded float or negative cash, but notify nicely
                             notify(`Attention : Le solde théorique de caisse est insuffisant (${new Intl.NumberFormat('fr-FR').format(currentCash)} F)`, "info");
                         }

                         const expenseDescription = (expenseForm.category === 'SALAIRE' || expenseForm.category === 'RATION')
                             ? `${expenseForm.category} - ${employees.find(e => e.id === expenseForm.employeeId)?.name || 'Inconnu'}`
                             : (expenseForm.category === 'DIVERS' ? expenseForm.motif : `${expenseForm.category}${expenseForm.motif ? ' - ' + expenseForm.motif : ''}`);

                         onAddExpense({ 
                             id: Date.now().toString(), 
                             date: new Date().toISOString(), 
                             amount, 
                             description: expenseDescription, 
                             category: expenseForm.category as any,
                             employeeId: expenseForm.employeeId || undefined,
                             boutique: selectedBoutique,
                             provenderieId: currentProvenderieId
                         });
                         
                         if (expenseForm.category === 'SALAIRE' || expenseForm.category === 'RATION') {
                             const emp = employees.find(e => e.id === expenseForm.employeeId);
                             if (emp) {
                                 const updatedEmp = { ...emp };
                                 if (expenseForm.category === 'SALAIRE') {
                                     updatedEmp.pendingSalary = Math.max(0, (updatedEmp.pendingSalary || 0) - amount);
                                 } else {
                                     updatedEmp.pendingRation = Math.max(0, (updatedEmp.pendingRation || 0) - amount);
                                 }
                                 saveEmployee(updatedEmp);
                             }
                         }

                         setShowExpenseModal(false);
                         setExpenseForm({ amount: '', motif: '', category: 'DIVERS', employeeId: '' });
                         notify("Sortie enregistrée", "success");
                     }} className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 hover:shadow-red-200 transition-all flex items-center justify-center gap-2">
                        Valider la Sortie
                     </button>
                 </div>
             </div>
          </div>
      )}
      {/* Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-farm-500 p-2 rounded-xl shadow-lg shadow-farm-200">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Nouveau Client</h3>
              </div>
              <button onClick={() => setIsAddingCustomer(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Nom Complet *</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 focus:border-farm-500 outline-none transition-all"
                  placeholder="Ex: Jean Dupont"
                  value={newCustomerForm.name}
                  onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Téléphone</label>
                <input 
                  type="tel" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 focus:border-farm-500 outline-none transition-all"
                  placeholder="Ex: 6XX XXX XXX"
                  value={newCustomerForm.phone}
                  onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Email (Optionnel)</label>
                <input 
                  type="email" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 focus:border-farm-500 outline-none transition-all"
                  placeholder="Ex: client@email.com"
                  value={newCustomerForm.email}
                  onChange={e => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Adresse (Optionnel)</label>
                <textarea 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 focus:border-farm-500 outline-none transition-all resize-none h-20"
                  placeholder="Ex: Douala, Akwa"
                  value={newCustomerForm.address}
                  onChange={e => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsAddingCustomer(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddCustomer}
                className="flex-[2] py-3.5 bg-farm-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-farm-200 hover:bg-farm-700 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Enregistrer le Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Button */}
      {mobileTab === 'products' && cart.length > 0 && (
          <button 
            onClick={() => setMobileTab('cart')}
            className="lg:hidden fixed bottom-6 right-6 z-50 bg-farm-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-in zoom-in duration-300 hover:scale-110 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="bg-white text-farm-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm">
                {cart.length}
            </span>
          </button>
      )}
    </div>
  );
};
