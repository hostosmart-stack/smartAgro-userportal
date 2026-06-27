import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, User, signOut } from './services/firebase';
import { auth } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { POS } from './components/POS';
import { Invoices } from './components/Invoices';
import { Assistant } from './components/Assistant';
import { Analytics } from './components/Analytics';
import { Accounting } from './components/Accounting';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Employees } from './components/Employees';
import { Boutiques } from './components/Boutiques';
import { Product, Invoice, Expense, Employee, Boutique, Customer, UserRole, Permission, Provenderie, Conversation } from './types';
import { Loader2, AlertTriangle, Menu, Leaf, X, KeyRound, ChevronRight, Clock } from 'lucide-react';
import { NotificationProvider, useNotifications } from './components/ui/Notifications';
import { 
  subscribeToProducts, 
  subscribeToInvoices, 
  subscribeToExpenses, 
  subscribeToEmployees,
  subscribeToCurrentEmployee,
  subscribeToBoutiques,
  subscribeToCustomers,
  subscribeToTransfers,
  subscribeToRoles,
  subscribeToProvenderies,
  subscribeToConversations,
  saveInvoice, 
  saveExpense,
  saveRole,
  processSaleTransaction,
  voidSaleTransaction,
  initRequestStats
} from './services/db';

import { Settings, AppSettings } from './components/Settings';
import { Guide } from './components/Guide';
import { Profile } from './components/Profile';
import { Transfers } from './components/Transfers';
import { StockTransfer } from './types';

import { ProvenderieAdmin } from './components/ProvenderieAdmin';
import { Hub, AppCategory } from './components/Hub';
import { LicenseBlocker } from './components/LicenseBlocker';
import { useLanguage } from './contexts/LanguageContext';

// Inner App Component to use hooks safely
const InnerApp = () => {
  const { language, setLanguage } = useLanguage();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('smartAgro_sidebarWidth');
    return saved ? parseInt(saved, 10) : 256;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('smartAgro_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      colorTheme: 'farm',
      companyName: 'Smart Agro',
      language: 'fr'
    };
  });

  // App State
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeCategory, setActiveCategory] = useState<AppCategory>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [provenderies, setProvenderies] = useState<Provenderie[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentProvenderieId, setCurrentProvenderieId] = useState<string>(() => {
    return localStorage.getItem('smartAgro_currentProvenderieId') || '';
  });
  const [preSelectedTransferProduct, setPreSelectedTransferProduct] = useState<string | null>(null);
  const [dismissLicenseBanner, setDismissLicenseBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const currentProvenderie = provenderies.find(p => p.id === currentProvenderieId);

  const userEmail = user?.email || '';
  const employeeRole = (currentEmployee?.role || '').toLowerCase().trim();
  const isSuperAdminUser = userEmail === 'danielledjofang2003@gmail.com' ||
                           employeeRole === 'admin' ||
                           employeeRole.includes('super') ||
                           employeeRole.includes('administrateur') ||
                           (user !== null && user.uid === 'superadmin_bypass') ||
                           (userEmail !== '' && (userEmail.startsWith('admin') || userEmail.startsWith('super')));

  // Synchronize state with Browser History for Back Button support
  const isPopStateRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && 'currentView' in state) {
        isPopStateRef.current = true;
        setCurrentView(state.currentView);
        setActiveCategory(state.activeCategory || null);
        setTimeout(() => {
          isPopStateRef.current = false;
        }, 50);
      } else {
        isPopStateRef.current = true;
        setCurrentView('dashboard');
        setActiveCategory(null);
        setTimeout(() => {
          isPopStateRef.current = false;
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);

    if (!window.history.state || !('currentView' in window.history.state)) {
      window.history.replaceState({ currentView, activeCategory }, '');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (isPopStateRef.current) return;

    const currentState = window.history.state;
    if (!currentState || currentState.currentView !== currentView || currentState.activeCategory !== activeCategory) {
      window.history.pushState({ currentView, activeCategory }, '');
    }
  }, [currentView, activeCategory, user]);

  const categories = useMemo(() => {
    return currentProvenderie?.categories || settings.customCategories || [
      'Matières Premières',
      'Volailles & Aliments Complets',
      'Bétail (Porcs/Bovins)',
      'Matériel & Abreuvoirs',
      'Santé Animale',
      'Divers'
    ];
  }, [settings.customCategories, currentProvenderie]);

  // Sync settings with current provenderie name
  const companyName = currentProvenderie?.name || settings.companyName;
  
  const { notify } = useNotifications();

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

  // Synchronize settings with localStorage events
  useEffect(() => {
    const handleSettingsChange = () => {
      const saved = localStorage.getItem('smartAgro_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    window.addEventListener('storage', handleSettingsChange);
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
      window.removeEventListener('storage', handleSettingsChange);
    };
  }, []);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Reset classes
    root.classList.remove('light', 'dark', 'theme-farm', 'theme-ocean', 'theme-sunset', 'theme-berry', 'theme-royal');
    
    // Apply mode
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }

    // Apply color theme
    root.classList.add(`theme-${settings.colorTheme}`);
    
  }, [settings]);

  // Auth Listener
  useEffect(() => {
    // Check if we have a local session active on startup
    const savedLocalUser = localStorage.getItem('smartAgro_local_user');
    if (savedLocalUser) {
      try {
        setUser(JSON.parse(savedLocalUser));
        setAuthLoading(false);
      } catch (e) {
        console.error("Failed to parse local user profile:", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userObj = {
          email: currentUser.email,
          uid: currentUser.uid,
          displayName: currentUser.displayName || undefined
        };
        setUser(userObj as any);
        localStorage.setItem('smartAgro_local_user', JSON.stringify(userObj));
      } else {
        // If there's no active local user bypass, clear the user state
        const localActive = localStorage.getItem('smartAgro_local_user');
        if (!localActive) {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize Request Stats baseline on app startup
  useEffect(() => {
    initRequestStats();
  }, []);

  // Synchronize currentEmployee globally when user changes
  useEffect(() => {
    if (!user || !user.email) {
      setCurrentEmployee(null);
      return;
    }

    const unsubscribe = subscribeToCurrentEmployee(user.email, (emp) => {
      setCurrentEmployee(emp);
      if (emp && emp.provenderieId) {
        setCurrentProvenderieId(emp.provenderieId);
        localStorage.setItem('smartAgro_currentProvenderieId', emp.provenderieId);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Seed default roles into database if the roles collection is empty for the current provenderie
  useEffect(() => {
    if (!currentProvenderieId || !rolesLoaded || roles.length > 0) return;

    const defaultSystemRoles = [
      {
        id: `system-admin-${currentProvenderieId}`,
        name: 'Admin',
        permissions: ['pos', 'invoices', 'inventory', 'formulas', 'employees', 'dashboard', 'settings', 'transfers', 'guide', 'reports'] as Permission[],
        pagePermissions: [
          { pageId: 'dashboard' as Permission, enabled: true, components: [] },
          { pageId: 'inventory' as Permission, enabled: true, components: [] },
          { pageId: 'transfers' as Permission, enabled: true, components: [] },
          { pageId: 'pos' as Permission, enabled: true, components: [] },
          { pageId: 'analytics' as Permission, enabled: true, components: [] },
          { pageId: 'accounting' as Permission, enabled: true, components: [] },
          { pageId: 'invoices' as Permission, enabled: true, components: [] },
          { pageId: 'employees' as Permission, enabled: true, components: [] },
          { pageId: 'boutiques' as Permission, enabled: true, components: [] },
          { pageId: 'advisor' as Permission, enabled: true, components: [] },
          { pageId: 'settings' as Permission, enabled: true, components: [] },
          { pageId: 'guide' as Permission, enabled: true, components: [] },
          { pageId: 'reports' as Permission, enabled: true, components: [] },
          { pageId: 'formulas' as Permission, enabled: true, components: [] }
        ],
        provenderieId: currentProvenderieId
      },
      {
        id: `system-caissier-${currentProvenderieId}`,
        name: 'Caissier',
        permissions: ['pos', 'invoices', 'dashboard', 'reports'] as Permission[],
        pagePermissions: [
          { pageId: 'dashboard' as Permission, enabled: true, components: [] },
          { pageId: 'pos' as Permission, enabled: true, components: [] },
          { pageId: 'invoices' as Permission, enabled: true, components: [] },
          { pageId: 'reports' as Permission, enabled: true, components: [] }
        ],
        provenderieId: currentProvenderieId
      },
      {
        id: `system-vendeur-${currentProvenderieId}`,
        name: 'Vendeur',
        permissions: ['pos', 'dashboard'] as Permission[],
        pagePermissions: [
          { pageId: 'dashboard' as Permission, enabled: true, components: [] },
          { pageId: 'pos' as Permission, enabled: true, components: [] }
        ],
        provenderieId: currentProvenderieId
      },
      {
        id: `system-magasinier-${currentProvenderieId}`,
        name: 'Magasinier',
        permissions: ['inventory', 'transfers', 'formulas', 'dashboard'] as Permission[],
        pagePermissions: [
          { pageId: 'dashboard' as Permission, enabled: true, components: [] },
          { pageId: 'inventory' as Permission, enabled: true, components: [] },
          { pageId: 'transfers' as Permission, enabled: true, components: [] },
          { pageId: 'formulas' as Permission, enabled: true, components: [] }
        ],
        provenderieId: currentProvenderieId
      }
    ];

    defaultSystemRoles.forEach(roleObj => {
      saveRole(roleObj).catch((err) => console.error("Error seeding default role:", err));
    });
  }, [currentProvenderieId, rolesLoaded, roles]);

  // Data Subscriptions (Firestore Listeners)
  useEffect(() => {
    if (!user) return;

    const unsubProducts = subscribeToProducts(currentProvenderieId, setProducts, isSuperAdminUser);
    const unsubInvoices = subscribeToInvoices(currentProvenderieId, setInvoices, isSuperAdminUser);
    const unsubExpenses = subscribeToExpenses(currentProvenderieId, setExpenses, isSuperAdminUser);
    const unsubEmployees = subscribeToEmployees(currentProvenderieId, setEmployees, isSuperAdminUser);
    const unsubBoutiques = subscribeToBoutiques(currentProvenderieId, setBoutiques, isSuperAdminUser);
    const unsubCustomers = subscribeToCustomers(currentProvenderieId, setCustomers, isSuperAdminUser);
    const unsubTransfers = subscribeToTransfers(currentProvenderieId, setTransfers, isSuperAdminUser);
    const unsubRoles = subscribeToRoles(currentProvenderieId, (fetchedRoles) => {
      setRoles(fetchedRoles);
      setRolesLoaded(true);
    });
    
    // Provenderies subscription is global for administrators
    const unsubProvenderies = subscribeToProvenderies((data) => {
      setProvenderies(data);
      if (data.length > 0 && !currentProvenderieId) {
        const savedId = localStorage.getItem('smartAgro_currentProvenderieId');
        if (savedId && data.some(p => p.id === savedId)) {
          setCurrentProvenderieId(savedId);
        } else {
          setCurrentProvenderieId(data[0].id);
          localStorage.setItem('smartAgro_currentProvenderieId', data[0].id);
        }
      }
    });
    
    const unsubConversations = subscribeToConversations(setConversations);

    return () => { 
      unsubProducts(); 
      unsubInvoices(); 
      unsubExpenses(); 
      unsubEmployees(); 
      unsubBoutiques(); 
      unsubCustomers();
      unsubTransfers();
      unsubRoles();
      unsubProvenderies();
      unsubConversations();
    };
  }, [user, currentProvenderieId, isSuperAdminUser]);

  const handleCheckout = async (newInvoice: Invoice, updatedStock: Product[], customer?: Customer, updatedPreviousInvoices?: Invoice[]) => {
    try {
      const invoiceWithProvenderie = { ...newInvoice, provenderieId: currentProvenderieId };
      const changedProducts = updatedStock.filter(p => 
        (newInvoice.items || []).some(item => item.id === p.id)
      ).map(p => ({ ...p, provenderieId: p.provenderieId || currentProvenderieId }));
      
      await processSaleTransaction(invoiceWithProvenderie, changedProducts, customer, updatedPreviousInvoices);
      // Notifications handled in POS component for specific UI feedback
    } catch (error) {
      console.error("Error processing sale:", error);
      notify("Erreur critique lors de la vente", "error");
    }
  };

  const handleVoidLastSale = async (invoiceId: string, restoredStock: Product[]) => {
    try {
       const inv = invoices.find(i => i.id === invoiceId);
       let productsToUpdate = restoredStock;
       if (inv) {
           productsToUpdate = restoredStock.filter(p => (inv.items || []).some(i => i.id === p.id));
       }
       await voidSaleTransaction(invoiceId, productsToUpdate);
       notify("Vente annulée et stock restauré", "info");
    } catch (error) {
      console.error("Error voiding sale:", error);
      notify("Erreur lors de l'annulation", "error");
    }
  };

  const handleAddExpense = async (newExpense: Expense) => {
    try {
      await saveExpense(newExpense);
      notify("Dépense enregistrée", "success");
    } catch (e) {
      notify("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    try {
      await saveInvoice(updatedInvoice);
      notify("Facture mise à jour", "success");
    } catch (e) {
      notify("Erreur de mise à jour", "error");
    }
  };

  const defaultSystemRolesObj: UserRole[] = [
    {
      id: 'system-admin',
      name: 'Admin',
      permissions: ['pos', 'invoices', 'inventory', 'formulas', 'employees', 'dashboard', 'settings', 'transfers', 'guide', 'reports']
    },
    {
      id: 'system-caissier',
      name: 'Caissier',
      permissions: ['pos', 'invoices', 'dashboard', 'reports']
    },
    {
      id: 'system-vendeur',
      name: 'Vendeur',
      permissions: ['pos', 'dashboard']
    },
    {
      id: 'system-magasinier',
      name: 'Magasinier',
      permissions: ['inventory', 'transfers', 'formulas', 'dashboard']
    }
  ];

  const allAvailableRoles = [
    ...roles,
    ...defaultSystemRolesObj.filter(dsr => !roles.some(r => r.name.toLowerCase().trim() === dsr.name.toLowerCase().trim()))
  ];

  const userRoleObj = allAvailableRoles.find(r => r.id === currentEmployee?.roleId) || 
                      allAvailableRoles.find(r => r.name.toLowerCase().trim() === (currentEmployee?.role || '').toLowerCase().trim()) || 
                      allAvailableRoles.find(r => r.name === 'Admin') ||
                      defaultSystemRolesObj[0];

  const userRole = userRoleObj?.name || 'Admin'; 

  const getUserPermissions = (roleObj: any): string[] => {
    if (!roleObj) return [];
    
    const normName = (roleObj.name || '').toLowerCase().trim();
    const isSuperOrAdmin = normName === 'superadmin' || 
                           normName === 'admin' || 
                           normName === 'system-admin' ||
                           normName === 'super administrateur' ||
                           normName === 'superadministrateur' ||
                           normName === 'super-administrateur' ||
                           normName === 'administrateur' ||
                           normName.includes('system') ||
                           (normName.includes('super') && normName.includes('admin')) ||
                           normName.includes('administrateur');
    
    const allViews: string[] = ['dashboard', 'inventory', 'transfers', 'pos', 'analytics', 'accounting', 'invoices', 'employees', 'boutiques', 'advisor', 'settings', 'guide', 'reports', 'formulas'];

    const pagePerms = roleObj.pagePermissions;
    if (pagePerms) {
      if (Array.isArray(pagePerms)) {
        return allViews.filter(view => {
          const found = pagePerms.find((p: any) => p.pageId === view);
          if (found !== undefined) return found.enabled !== false;
          
          let parentPerm = view;
          if (view === 'analytics' || view === 'accounting') parentPerm = 'reports';
          if (view === 'boutiques') parentPerm = 'settings';
          if (view === 'formulas') parentPerm = 'inventory';

          if (parentPerm !== view) {
            const parentFound = pagePerms.find((p: any) => p.pageId === parentPerm);
            if (parentFound !== undefined) return parentFound.enabled !== false;
          }

          return isSuperOrAdmin;
        });
      } else if (typeof pagePerms === 'object') {
        return allViews.filter(view => {
          if (view in pagePerms) {
            return !!pagePerms[view];
          }

          let parentPerm = view;
          if (view === 'analytics' || view === 'accounting') parentPerm = 'reports';
          if (view === 'boutiques') parentPerm = 'settings';
          if (view === 'formulas') parentPerm = 'inventory';

          if (parentPerm in pagePerms) {
            return !!pagePerms[parentPerm];
          }

          return isSuperOrAdmin;
        });
      }
    }

    if (roleObj.permissions && Array.isArray(roleObj.permissions)) {
      return roleObj.permissions as string[];
    }

    return isSuperOrAdmin ? allViews : ['dashboard', 'guide'];
  };

  const userPermissions = getUserPermissions(userRoleObj) as any[];
  const userBoutique = currentEmployee?.assignedBoutique || 'Toutes';

  const handleLogout = async () => {
    if (user && currentEmployee) {
      try {
        const { setEmployeeOnlineStatus } = await import('./services/db');
        await setEmployeeOnlineStatus(currentEmployee.id, false, user.email || '');
      } catch (e) {
        console.warn("Failed to set employee offline on logout:", e);
      }
    }
    localStorage.removeItem('smartAgro_local_user');
    await signOut(auth).catch(err => console.warn("Sign out failed", err));
    setUser(null);
  };

  // Synchronize employee online status on login/logout
  useEffect(() => {
    if (user && currentEmployee) {
      if (currentEmployee.isOnline !== true) {
        import('./services/db').then(({ setEmployeeOnlineStatus }) => {
          setEmployeeOnlineStatus(currentEmployee.id, true, user.email || '');
        });
      }
    }

    const handleBeforeUnload = () => {
      if (user && currentEmployee) {
        import('./services/db').then(({ setEmployeeOnlineStatus }) => {
          setEmployeeOnlineStatus(currentEmployee.id, false, user.email || '');
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, currentEmployee]);

  // License Enforcement Check
  const isLicenseExpiredCheck = () => {
    if (!currentProvenderie || !currentProvenderie.licenseEnforced) return false;
    const norm = (userRole || '').toLowerCase().trim();
    const isSuper = norm === 'superadmin' || 
                    norm === 'super-admin' || 
                    norm === 'system-admin' || 
                    norm === 'super administrateur' || 
                    norm === 'superadministrateur' || 
                    norm === 'super-administrateur' || 
                    (norm.includes('super') && norm.includes('admin'));
    if (isSuper) return false; // Superadmins bypass blocking to correct settings
    
    const expiryDateStr = currentProvenderie.licenseExpiryDate;
    if (!expiryDateStr) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    return today.getTime() >= expiry.getTime();
  };
  
  const isLicenseExpired = isLicenseExpiredCheck();

  // License Remaining Day Count
  const getLicenseRemainingDays = () => {
    if (!currentProvenderie || !currentProvenderie.licenseExpiryDate) return null;
    try {
      const expiry = new Date(currentProvenderie.licenseExpiryDate);
      expiry.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const remainingDays = getLicenseRemainingDays();
  const isLicenseEndingSoon = 
    currentProvenderie?.licenseEnforced && 
    remainingDays !== null && 
    remainingDays > 0 && 
    remainingDays <= 10;

  // Link Boutique status to cashier login
  useEffect(() => {
    if (user && currentEmployee?.assignedBoutique && currentEmployee.assignedBoutique !== 'Toutes') {
      const boutique = boutiques.find(b => b.id === currentEmployee.assignedBoutique || b.name === currentEmployee.assignedBoutique);
      if (boutique && boutique.status !== 'active') {
        import('./services/db').then(({ updateBoutiqueStatus }) => {
          updateBoutiqueStatus(boutique.id, 'active');
        });
      }
    }
    
    // We don't easily set it to inactive on logout here because currentEmployee is gone.
    // But we can handle it in the logout function or use a beforeunload listener.
  }, [user, currentEmployee, boutiques]);

  const filteredProducts = products.filter(p => !currentProvenderieId || p.provenderieId === currentProvenderieId || !p.provenderieId);
  const filteredInvoices = invoices.filter(i => !currentProvenderieId || i.provenderieId === currentProvenderieId || !i.provenderieId);
  const filteredBoutiques = boutiques.filter(b => !currentProvenderieId || b.provenderieId === currentProvenderieId || !b.provenderieId);
  const filteredEmployees = employees.filter(e => !currentProvenderieId || e.provenderieId === currentProvenderieId || !e.provenderieId);
  const filteredExpenses = expenses.filter(e => !currentProvenderieId || e.provenderieId === currentProvenderieId || !e.provenderieId);
  const filteredTransfers = transfers.filter(t => !currentProvenderieId || t.provenderieId === currentProvenderieId || !t.provenderieId);
  const filteredCustomers = customers.filter(c => !currentProvenderieId || c.provenderieId === currentProvenderieId || !c.provenderieId);
  const filteredRoles = roles.filter(r => !currentProvenderieId || r.provenderieId === currentProvenderieId || !r.provenderieId);

  const renderContent = () => {
    // If no category selected, show the Hub (unless in specific non-dashboard views like profile/settings)
    if (!activeCategory && ['dashboard', 'inventory', 'transfers', 'pos', 'analytics', 'accounting', 'invoices', 'employees', 'boutiques', 'advisor'].includes(currentView)) {
      return <Hub 
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          // Navigate to the first relevant view for that category
          if (cat === 'magasin') setCurrentView('inventory');
          else if (cat === 'facturation') setCurrentView('invoices');
          else if (cat === 'comptabilite') setCurrentView('analytics');
          else if (cat === 'administration') setCurrentView('employees');
        }} 
        userName={currentEmployee?.name || 'Administrateur'} 
        userRole={userRole}
        userPermissions={userPermissions}
        onLogout={handleLogout}
        isLicenseEndingSoon={isLicenseEndingSoon}
        remainingDays={remainingDays}
        licenseExpiryDate={currentProvenderie?.licenseExpiryDate}
        onNavigateToSettings={() => setCurrentView('settings')}
        dismissLicenseBanner={dismissLicenseBanner}
        setDismissLicenseBanner={setDismissLicenseBanner}
      />;
    }

    // Permission mapping for views
    const viewPermissions: Record<string, string> = {
      'dashboard': 'dashboard',
      'inventory': 'inventory',
      'transfers': 'transfers',
      'pos': 'pos',
      'analytics': 'reports',
      'accounting': 'reports',
      'invoices': 'invoices',
      'employees': 'employees',
      'boutiques': 'settings',
      'advisor': 'dashboard',
      'settings': 'settings',
      'guide': 'guide'
    };

    const requiredPermission = viewPermissions[currentView] as Permission;
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

    let hasPermission = isSuperOrAdmin || 
                        userPermissions.includes(currentView) || 
                        (requiredPermission && userPermissions.includes(requiredPermission as any));

    if (!hasPermission) {
      // Find first allowed view
      const allowedViews = Object.keys(viewPermissions).filter(v => {
        const reqPerm = viewPermissions[v];
        return isSuperOrAdmin || userPermissions.includes(v) || (reqPerm && userPermissions.includes(reqPerm as any));
      });
      if (allowedViews.length > 0 && currentView !== allowedViews[0]) {
        setTimeout(() => setCurrentView(allowedViews[0]), 0);
      }
      return <div className="flex items-center justify-center h-full text-gray-500">Accès non autorisé</div>;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard products={filteredProducts} invoices={filteredInvoices} boutiques={filteredBoutiques} transfers={filteredTransfers} expenses={filteredExpenses} onNavigate={setCurrentView} userRole={userRole} userBoutique={userBoutique} userRoleObj={userRoleObj} userName={currentEmployee?.name || 'Administrateur'} userEmail={currentEmployee?.email || ''} parentActiveCategory={activeCategory} categories={categories} />;
      case 'inventory': return <Inventory products={filteredProducts} userRole={userRole} userPermissions={userPermissions} userBoutique={userBoutique} boutiques={filteredBoutiques} onNavigate={setCurrentView} onTransferProduct={(id) => { setPreSelectedTransferProduct(id); setCurrentView('transfers'); }} currentProvenderieId={currentProvenderieId} categories={categories} />;
      case 'transfers': return <Transfers products={filteredProducts} transfers={filteredTransfers} boutiques={filteredBoutiques} userRole={userRole} userBoutique={userBoutique} userName={currentEmployee?.name || 'Administrateur'} preSelectedProductId={preSelectedTransferProduct} onClearPreSelection={() => setPreSelectedTransferProduct(null)} currentProvenderieId={currentProvenderieId} />;
      case 'pos': return <POS products={filteredProducts} employees={filteredEmployees} invoices={filteredInvoices} expenses={filteredExpenses} customers={filteredCustomers} onCheckout={handleCheckout} onAddExpense={handleAddExpense} onVoidLastSale={handleVoidLastSale} userBoutique={userBoutique} userRole={userRole} userPermissions={userPermissions} boutiques={filteredBoutiques} companyName={companyName} userName={currentEmployee?.name || 'Administrateur'} currentProvenderieId={currentProvenderieId} provenderies={provenderies} categories={categories} />;
      case 'analytics': return <Analytics products={filteredProducts} invoices={filteredInvoices} boutiques={filteredBoutiques} userRole={userRole} userBoutique={userBoutique} categories={categories} />;
      case 'accounting': return <Accounting invoices={filteredInvoices} products={filteredProducts} expenses={filteredExpenses} transfers={filteredTransfers} setExpenses={setExpenses} onUpdateInvoice={handleUpdateInvoice} boutiques={filteredBoutiques} userRole={userRole} userBoutique={userBoutique} customers={filteredCustomers} currentProvenderieId={currentProvenderieId} employees={filteredEmployees} />;
      case 'invoices': return <Invoices invoices={filteredInvoices} products={filteredProducts} setProducts={setProducts} onUpdateInvoice={handleUpdateInvoice} boutiques={filteredBoutiques} companyName={companyName} userRole={userRole} userPermissions={userPermissions} userBoutique={userBoutique} customers={filteredCustomers} currentProvenderieId={currentProvenderieId} provenderies={provenderies} />;
      case 'employees': return <Employees employees={filteredEmployees} roles={filteredRoles} boutiques={filteredBoutiques} expenses={filteredExpenses} userRole={userRole} userBoutique={userBoutique} currentProvenderieId={currentProvenderieId} />;
      case 'boutiques': return <Boutiques products={filteredProducts} boutiques={filteredBoutiques} userRole={userRole} userBoutique={userBoutique} transfers={filteredTransfers} currentProvenderieId={currentProvenderieId} userRoleObj={userRoleObj} categories={categories} />;
      case 'advisor': return <Assistant products={filteredProducts} invoices={filteredInvoices} boutiques={filteredBoutiques} employees={filteredEmployees} expenses={filteredExpenses} userRole={userRole} userBoutique={userBoutique} />;
      case 'settings': return <Settings currentSettings={settings} onSettingsChange={setSettings} currentProvenderie={currentProvenderie} />;
      case 'guide': return <Guide userRole={userRole} />;
      case 'profile': return <Profile 
        userRole={userRole} 
        userName={currentEmployee?.name || 'Administrateur'} 
        userEmail={currentEmployee?.email} 
        userBoutique={userBoutique} 
        contactPersonName={currentEmployee?.contactPersonName}
        contactPersonRelationship={currentEmployee?.contactPersonRelationship}
        invoices={invoices} 
        expenses={expenses}
        currentEmployee={currentEmployee}
      />;
      default: return <Dashboard products={products} invoices={invoices} boutiques={boutiques} transfers={transfers} expenses={expenses} onNavigate={setCurrentView} parentActiveCategory={activeCategory} categories={categories} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-farm-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (showLogin) return <Login onBack={() => setShowLogin(false)} onLoginSuccess={(localUser) => {
      setUser(localUser);
      setShowLogin(false);
    }} />;
    return <Landing onLoginClick={() => setShowLogin(true)} />;
  }

  if (isLicenseExpired) {
    return (
      <LicenseBlocker 
        provenderieName={currentProvenderie?.name || 'Smart Agro'} 
        licenseExpiryDate={currentProvenderie?.licenseExpiryDate || ''} 
        licenseType={currentProvenderie?.licenseType || 'monthly'} 
        onLogout={handleLogout}
        onRefresh={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="h-screen bg-[#F5F4F0] flex font-sans selection:bg-farm-500 selection:text-white overflow-hidden relative">
      {!isOnline && (
        <div className={`fixed ${isMobile ? 'top-16' : 'top-0'} left-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 text-center z-[55] flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300`}>
          <AlertTriangle className="w-3 h-3" />
          Mode hors ligne : Vos modifications seront synchronisées au retour de la connexion.
        </div>
      )}
      
      {/* Mobile Header */}
      {isMobile && activeCategory && (
        <div className="fixed top-4 left-4 right-4 z-[60] shrink-0">
          <header className="h-16 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl text-white flex items-center justify-between px-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/[0.08] relative overflow-hidden">
            {/* Top lighting glow effect */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
            
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {mobileSidebarOpen ? (
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="fixed top-[27px] left-[32px] z-[80] p-2.5 bg-[#121824]/60 backdrop-blur-md hover:bg-slate-800 rounded-xl transition-all active:scale-95 border border-white/10 flex items-center justify-center cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-slate-100 animate-in spin-in-180 duration-300" />
                </button>
              ) : (
                <button 
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2.5 bg-white/[0.06] hover:bg-white/15 rounded-xl transition-all active:scale-95 border border-white/[0.04] flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-slate-100" />
                </button>
              )}
              
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-[0_2px_10px_rgba(16,185,129,0.2)] shrink-0">
                  <Leaf className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h1 className="font-display font-black text-xs sm:text-sm tracking-tight text-white leading-none truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                    {companyName}
                  </h1>
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-widest text-emerald-400 mt-0.5 truncate">
                    {language === 'fr' ? 'Smart Agro' : 'Smart Agro'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Profile Avatar with status indicator ring */}
              <button 
                onClick={() => setCurrentView('profile')}
                className="relative group focus:outline-none cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] transition-transform duration-200 active:scale-90 shadow-md">
                  <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white text-xs font-black uppercase tracking-wider">
                    {(currentEmployee?.name || 'A').charAt(0)}
                  </div>
                </div>
                {/* Active connection pulse dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                </span>
              </button>
            </div>
          </header>
        </div>
      )}

      {activeCategory && (
        <Sidebar 
          currentView={currentView} 
          setView={(view) => {
            setCurrentView(view);
            if (isMobile) setMobileSidebarOpen(false);
          }} 
          userRole={userRole} 
          userPermissions={userPermissions}
          userName={currentEmployee?.name || 'Administrateur'} 
          isCollapsed={isMobile ? false : isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          companyName={companyName}
          isMobile={isMobile}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          provenderies={provenderies}
          currentProvenderieId={currentProvenderieId}
          onProvenderieChange={(id) => {
            setCurrentProvenderieId(id);
            localStorage.setItem('smartAgro_currentProvenderieId', id);
          }}
          activeCategory={activeCategory}
          onExitCategory={() => {
            setActiveCategory(null);
            setCurrentView('dashboard');
          }}
          onLogout={handleLogout}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
        />
      )}
      <main 
        className={`flex-1 transition-all duration-300 h-full overflow-hidden flex flex-col relative ${
          isMobile 
            ? `ml-0 px-4 pb-4 ${activeCategory ? 'pt-24' : 'pt-4'}` 
            : 'p-6'
        }`}
        style={isMobile ? undefined : {
          marginLeft: !activeCategory ? '0px' : (isSidebarCollapsed ? '80px' : `${sidebarWidth}px`)
        }}
      >
        <div className="h-full max-w-[1600px] mx-auto flex flex-col w-full">
          {isLicenseEndingSoon && !dismissLicenseBanner && activeCategory && (
            <div className="mb-4 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25 dark:border-amber-500/15 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Decorative side accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500"></div>
              
              <div className="flex items-start gap-3 pl-1">
                <div className="p-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl mt-0.5 border border-amber-500/10">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                    {language === 'fr' 
                      ? 'Votre abonnement expire bientôt !' 
                      : 'Your subscription is expiring soon!'}
                  </h4>
                  <p className="text-xs text-amber-950/70 dark:text-gray-300/80 mt-0.5">
                    {language === 'fr'
                      ? `Il ne vous reste plus que ${remainingDays} jour${remainingDays > 1 ? 's' : ''} avant l'expiration le ${currentProvenderie?.licenseExpiryDate ? new Date(currentProvenderie.licenseExpiryDate).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}. Renouvelez-le pour conserver l'accès.`
                      : `Only ${remainingDays} day${remainingDays > 1 ? 's' : ''} remaining until expiration on ${currentProvenderie?.licenseExpiryDate ? new Date(currentProvenderie.licenseExpiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}. Renew now to avoid lock-outs.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto self-end sm:self-center pl-1 sm:pl-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentView('settings')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>{language === 'fr' ? 'Consulter' : 'Manage'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDismissLicenseBanner(true)}
                  className="p-2 hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-300 text-slate-400 dark:text-slate-500 rounded-xl transition-all cursor-pointer"
                  title={language === 'fr' ? 'Ignorer pour cette session' : 'Ignore for this session'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

import { LanguageProvider } from './contexts/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <InnerApp />
      </NotificationProvider>
    </LanguageProvider>
  );
}
