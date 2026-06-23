import React, { useState } from 'react';
import { Employee, Boutique, Expense, UserRole, Permission } from '../types';
import { Plus, Edit2, Trash2, Search, User, Phone, Briefcase, DollarSign, Loader2, X, Store, Wallet, Utensils, AlertTriangle, Shield, Check, Settings } from 'lucide-react';
import { saveEmployee, deleteEmployee, saveExpense, saveRole, deleteRole } from '../services/db';
import { useNotifications } from './ui/Notifications';
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';
import firebaseConfig from '../firebase-applet-config.json';

interface EmployeesProps {
  employees: Employee[];
  roles?: UserRole[];
  boutiques?: Boutique[];
  expenses?: Expense[];
  userRole?: string;
  userBoutique?: string;
  currentProvenderieId?: string;
}

export const Employees: React.FC<EmployeesProps> = ({ employees, roles = [], boutiques = [], expenses = [], userRole = 'Admin', userBoutique = 'Toutes', currentProvenderieId }) => {
  const { notify } = useNotifications();
  const { t, language } = useLanguage();

  const isSuperAdminUser = userRole.toLowerCase().trim() === 'superadmin' || 
                           userRole.toLowerCase().trim() === 'super-admin' || 
                           userRole.toLowerCase().trim() === 'system-admin' ||
                           userRole.toLowerCase().trim() === 'super administrateur' ||
                           userRole.toLowerCase().trim() === 'superadministrateur' ||
                           userRole.toLowerCase().trim() === 'super-administrateur' ||
                           userRole.toLowerCase().trim().includes('system') ||
                           (userRole.toLowerCase().trim().includes('super') && userRole.toLowerCase().trim().includes('admin'));

  const translateRoleName = (roleName: string) => {
    if (!roleName) return '';
    const norm = roleName.toLowerCase().trim();
    if (language === 'en') {
      if (norm === 'admin' || norm === 'administrator' || norm === 'administrateur') return 'Administrator';
      if (norm === 'vendeur' || norm === 'seller' || norm === 'salesperson') return 'Salesperson';
      if (norm === 'magasinier' || norm === 'storekeeper') return 'Storekeeper';
      if (norm === 'superadmin' || norm === 'super-admin' || norm === 'super-administrateur') return 'Super Admin';
      if (norm === 'caissier' || norm === 'cashier' || norm === 'cahier') return 'Cashier';
      return roleName;
    } else {
      if (norm === 'admin' || norm === 'administrator' || norm === 'administrateur') return 'Administrateur';
      if (norm === 'vendeur' || norm === 'seller' || norm === 'salesperson') return 'Vendeur';
      if (norm === 'magasinier' || norm === 'storekeeper') return 'Magasinier';
      if (norm === 'superadmin' || norm === 'super-admin' || norm === 'super-administrateur') return 'Super-administrateur';
      if (norm === 'caissier' || norm === 'cashier' || norm === 'cahier') return 'Caissier';
      return roleName;
    }
  };

  const availableRoles = [...roles];

  const hasSuperadminRole = availableRoles.some(r => r.name.toLowerCase().trim() === 'superadmin' || r.name.toLowerCase().trim() === 'super-admin');
  
  if (isSuperAdminUser && !hasSuperadminRole) {
    availableRoles.push({
      id: 'role-superadmin',
      name: 'superadmin',
      permissions: ['pos', 'invoices', 'inventory', 'formulas', 'employees', 'dashboard', 'settings', 'transfers', 'guide', 'reports'],
      provenderieId: currentProvenderieId
    });
  }

  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [creationType, setCreationType] = useState<'USER' | 'EMPLOYEE'>('USER');

  // Role Management State
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState<Partial<UserRole>>({
    name: '',
    permissions: [],
    pagePermissions: []
  });

  const availablePermissions: { id: Permission, label: string, components?: { id: string, name: string }[] }[] = [
    { 
      id: 'dashboard', 
      label: 'Tableau de bord',
      components: [
        { id: 'kpi-sales', name: 'KPI: Ventes Totales' },
        { id: 'kpi-orders', name: 'KPI: Commandes' },
        { id: 'kpi-debt', name: 'KPI: Solde Dettes Caisse' },
        { id: 'kpi-customers', name: 'KPI: Clients Actifs' },
        { id: 'boutique-status-tracker', name: 'Suivi des Ouvertures & Fermetures' },
        { id: 'chart-revenue', name: 'Pool Stats / Performance Boutiques' },
        { id: 'table-recent', name: 'Tableau: Activité Récente' }
      ]
    },
    { 
      id: 'pos', 
      label: 'Caisse (Ventes)',
      components: [
        { id: 'kpi-today', name: 'KPI: Ventes du jour' },
        { id: 'table-cart', name: 'Tableau: Panier' }
      ]
    },
    { 
      id: 'invoices', 
      label: 'Factures',
      components: [
        { id: 'kpi-debt', name: 'KPI: Dettes Totales' },
        { id: 'table-invoices', name: 'Tableau: Liste des Factures' }
      ]
    },
    { 
      id: 'inventory', 
      label: 'Stock (Inventaire)',
      components: [
        { id: 'kpi-value', name: 'KPI: Valeur du Stock' },
        { id: 'table-products', name: 'Tableau: Liste des Produits' }
      ]
    },
    { id: 'formulas', label: 'Formules (Mélanges)' },
    { id: 'transfers', label: 'Transferts' },
    { 
      id: 'settings', 
      label: 'Boutiques & Paramètres',
      components: [
        { id: 'page-boutiques', name: 'Accès à la page Boutiques' },
        { id: 'kpi-boutique-value', name: 'KPI: Valeur du Stock Boutique' },
        { id: 'kpi-boutique-products', name: 'KPI: Produits Disponibles' },
        { id: 'table-boutique-stock', name: 'Tableau: Liste des Stocks' },
        { id: 'table-boutique-transfers', name: 'Tableau: Historique des Transferts' }
      ]
    },
    { id: 'employees', label: 'Employés' },
    { 
      id: 'reports', 
      label: 'Rapports & Finance',
      components: [
        { id: 'kpi-profit', name: 'KPI: Bénéfice' },
        { id: 'table-expenses', name: 'Tableau: Dépenses' }
      ]
    },
    { id: 'guide', label: 'Guide' },
  ];

  // Payment State
  const [paymentModal, setPaymentModal] = useState<{ type: 'SALAIRE' | 'RATION', employee: Employee } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState<string>('');

  const [form, setForm] = useState<Partial<Employee>>({
    name: '',
    role: availableRoles[0]?.name || 'Vendeur',
    roleId: availableRoles[0]?.id || '',
    roleIds: availableRoles[0]?.id ? [availableRoles[0].id] : [],
    roles: availableRoles[0]?.name ? [availableRoles[0].name] : [],
    phone: '',
    email: '',
    contactPersonName: '',
    contactPersonRelationship: '',
    contactPersonPhone: '',
    username: '',
    pin: '',
    assignedBoutique: boutiques[0]?.id || '',
    salary: 0,
    ration: 0
  });

  const getEmployeeRolesString = (emp: Employee) => {
    if (emp.roles && emp.roles.length > 0) {
      return emp.roles.map(r => translateRoleName(r)).join(', ');
    }
    if (emp.roleIds && emp.roleIds.length > 0) {
      const names = emp.roleIds.map(id => availableRoles.find(r => r.id === id)?.name).filter(Boolean) as string[];
      if (names.length > 0) return names.map(r => translateRoleName(r)).join(', ');
    }
    return translateRoleName(emp.role);
  };

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = (e.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (e.role || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesBoutique = userBoutique === 'Toutes' || e.assignedBoutique === userBoutique;
    return matchesSearch && matchesBoutique;
  });

  const getBoutiqueName = (id?: string) => {
      if (!id || id === 'Toutes') return 'Toutes';
      return boutiques.find(b => b.id === id)?.name || id;
  };

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({ 
      ...emp,
      roleIds: emp.roleIds || (emp.roleId ? [emp.roleId] : []),
      roles: emp.roles || (emp.role ? emp.role.split(',').map(r => r.trim()) : [])
    });
    setIsAdding(false);
    setCreationType(emp.username ? 'USER' : 'EMPLOYEE');
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm({
      name: '',
      role: availableRoles[0]?.name || 'Vendeur',
      roleId: availableRoles[0]?.id || '',
      roleIds: availableRoles[0]?.id ? [availableRoles[0].id] : [],
      roles: availableRoles[0]?.name ? [availableRoles[0].name] : [],
      phone: '',
      email: '',
      contactPersonName: '',
      contactPersonRelationship: '',
      contactPersonPhone: '',
      username: '',
      pin: '',
      assignedBoutique: boutiques[0]?.id || '',
      salary: 0,
      ration: 0
    });
    setCreationType('USER');
  };

  const createEmployeeAccount = async (username: string, pin: string) => {
    const secondaryAppName = 'SecondaryApp';
    let secondaryApp;
    
    try {
        // Check if app already exists (cleanup might have failed)
        secondaryApp = getApps().find(app => app.name === secondaryAppName);
        if (!secondaryApp) {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        }
        
        const secondaryAuth = getAuth(secondaryApp);
        const email = `${username.trim()}@gmail.com`;
        
        await createUserWithEmailAndPassword(secondaryAuth, email, pin);
        await signOut(secondaryAuth); // Sign out immediately
        
        return true;
    } catch (error: any) {
        console.error("Error creating auth user:", error);
        if (error.code === 'auth/email-already-in-use') {
            notify("Cet identifiant est déjà utilisé", "error");
            return false;
        } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found' || error.message?.includes('not-allowed')) {
            console.warn("Firebase Auth Email/Password is disabled. Saving employee locally in Firestore database.", error);
            // Return true because the employee record will be saved to Firestore anyway,
            // and our local login fallback will sign them in using their PIN.
            return true;
        } else {
            notify("Erreur lors de la création du compte (mode de secours local activé) : " + error.message, "info");
            return true; // allow creation to succeed locally
        }
    } finally {
        if (secondaryApp) {
            try {
                await deleteApp(secondaryApp);
            } catch (e) {
                console.warn("Failed to delete secondary app", e);
            }
        }
    }
  };

  const handleSave = async () => {
    if (!form.name || isSubmitting) return;
    
    const selectedRoleIds = form.roleIds || (form.roleId ? [form.roleId] : []);
    const selectedRoleNames = form.roles || (form.role ? form.role.split(',').map(r => r.trim()) : []);

    const isTargetingSuperRole = selectedRoleNames.some(name => name.toLowerCase().trim() === 'superadmin' || name.toLowerCase().trim() === 'super-admin') ||
                                 selectedRoleIds.some(id => {
                                   const normName = (availableRoles.find(r => r.id === id)?.name || '').toLowerCase().trim();
                                   return normName === 'superadmin' || normName === 'super-admin';
                                 });

    if (isTargetingSuperRole && !isSuperAdminUser) {
        notify("Seul un superadministrateur peut attribuer ou modifier ce rôle", "error");
        return;
    }

    if (editingId) {
        const originalEmp = employees.find(e => e.id === editingId);
        if (originalEmp) {
            const origRoles = originalEmp.roles || (originalEmp.role ? originalEmp.role.split(',').map(r => r.trim()) : []);
            const origRoleIds = originalEmp.roleIds || (originalEmp.roleId ? [originalEmp.roleId] : []);
            const isOrigSuper = origRoles.some(name => name.toLowerCase().trim() === 'superadmin' || name.toLowerCase().trim() === 'super-admin') ||
                                origRoleIds.some(id => {
                                  const normName = (availableRoles.find(r => r.id === id)?.name || '').toLowerCase().trim();
                                  return normName === 'superadmin' || normName === 'super-admin';
                                });
            if (isOrigSuper && !isSuperAdminUser) {
                notify("Seul un superadministrateur peut modifier un compte superadministrateur", "error");
                return;
            }
        }
    }

    // Validate username/pin if they are a system USER
    if (creationType === 'USER') {
        if (!form.username) {
            notify("L'identifiant de connexion est requis pour un utilisateur", "error");
            return;
        }
        if (!form.pin && !editingId) {
            notify("Le code PIN est requis pour créer un utilisateur", "error");
            return;
        }
    }

    setIsSubmitting(true);
    try {
      const savedUsername = creationType === 'USER' ? form.username : '';
      const savedPin = creationType === 'USER' ? form.pin : '';
      const savedEmail = creationType === 'USER' && savedUsername ? `${savedUsername}@gmail.com` : (form.email || '');

      // Create Auth Account if new system USER with credentials
      if (creationType === 'USER' && !editingId && savedUsername && savedPin) {
          const success = await createEmployeeAccount(savedUsername, savedPin);
          if (!success) {
              setIsSubmitting(false);
              return;
          }
      }

      const defaultRoleIds = creationType === 'USER' ? (form.roleIds || (form.roleId ? [form.roleId] : [])) : [];
      const defaultRoleNames = creationType === 'USER' ? (form.roles || (form.role ? form.role.split(',').map(r => r.trim()) : [])) : [];

      const employee: Employee = {
        id: editingId || Date.now().toString(),
        name: form.name,
        role: creationType === 'USER' ? (defaultRoleNames.join(', ') || 'Vendeur') : 'Employé Simple',
        roleId: defaultRoleIds[0] || '',
        roleIds: defaultRoleIds,
        roles: defaultRoleNames,
        phone: form.phone,
        email: savedEmail,
        contactPersonName: form.contactPersonName,
        contactPersonRelationship: form.contactPersonRelationship,
        contactPersonPhone: form.contactPersonPhone,
        username: savedUsername,
        pin: savedPin,
        assignedBoutique: form.assignedBoutique || (defaultRoleNames.includes('Admin') ? 'Toutes' : boutiques[0]?.id),
        salary: Number(form.salary) || 0,
        ration: Number(form.ration) || 0,
        provenderieId: currentProvenderieId,
        ...((editingId ? {} : { updatedAt: new Date().toISOString() }))
      };
      
      await saveEmployee(employee);
      notify(editingId ? "Enregistrement modifié" : (creationType === 'USER' ? "Utilisateur système ajouté et compte créé" : "Employé ajouté avec succès"), "success");
      setIsAdding(false);
      setEditingId(null);
    } catch (e) {
      notify("Erreur lors de l'enregistrement", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setShowConfirmDelete(id);
  };

  const confirmDeleteEmployee = async () => {
    if (showConfirmDelete) {
      await deleteEmployee(showConfirmDelete);
      notify("Employé supprimé", "info");
      setShowConfirmDelete(null);
    }
  };

  const openPaymentModal = (type: 'SALAIRE' | 'RATION', emp: Employee) => {
      setPaymentModal({ type, employee: emp });
      setPaymentAmount(type === 'SALAIRE' ? (emp.salary || 0) : (emp.ration || 0));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNote(type === 'SALAIRE' ? `Salaire ${new Date().toLocaleString('default', { month: 'long' })}` : 'Ration journalière');
  };

  const handlePaymentSubmit = async () => {
      if (!paymentModal || paymentAmount <= 0) return;
      setIsSubmitting(true);
      try {
          const updatedEmp = { ...paymentModal.employee };
          if (paymentModal.type === 'SALAIRE') {
              updatedEmp.pendingSalary = (updatedEmp.pendingSalary || 0) + paymentAmount;
          } else {
              updatedEmp.pendingRation = (updatedEmp.pendingRation || 0) + paymentAmount;
          }
          await saveEmployee(updatedEmp);
          notify(`${paymentModal.type === 'SALAIRE' ? 'Salaire' : 'Ration'} autorisé pour paiement en caisse`, "success");
          setPaymentModal(null);
      } catch (e) {
          notify("Erreur lors de l'autorisation", "error");
      } finally {
          setIsSubmitting(false);
      }
  };

  const getEmployeeHistory = (empId: string) => {
      return expenses.filter(exp => exp.employeeId === empId || exp.description.includes(filteredEmployees.find(e => e.id === empId)?.name || ''))
                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const today = new Date().toISOString().split('T')[0];

  const handleAttendance = async (emp: Employee, status: 'present' | 'absent') => {
      try {
          const updatedEmp = { 
              ...emp, 
              attendance: { 
                  ...(emp.attendance || {}), 
                  [today]: status 
              } 
          };
          await saveEmployee(updatedEmp);
          notify(`Présence mise à jour pour ${emp.name}`, "success");
      } catch (e) {
          notify("Erreur lors de la mise à jour", "error");
      }
  };

  const handleSaveRole = async () => {
    if (!roleForm.name || isSubmitting) return;

    const isTargetingSuperRole = roleForm.name.toLowerCase().trim() === 'superadmin' || roleForm.name.toLowerCase().trim() === 'super-admin';
    if (isTargetingSuperRole && !isSuperAdminUser) {
        notify("Seul un superadministrateur peut créer ou modifier un rôle superadministrateur", "error");
        return;
    }

    setIsSubmitting(true);
    try {
        const role: UserRole = {
            id: editingRoleId || `role-${Date.now()}`,
            name: roleForm.name,
            permissions: roleForm.permissions || [],
            pagePermissions: roleForm.pagePermissions || [],
            deleted: false,
            provenderieId: currentProvenderieId
        };
        await saveRole(role);
        notify(editingRoleId ? "Rôle modifié" : "Rôle créé", "success");
        setIsAddingRole(false);
        setEditingRoleId(null);
    } catch (e) {
        notify("Erreur lors de l'enregistrement du rôle", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const togglePermission = (permId: Permission) => {
    const current = roleForm.permissions || [];
    const currentPages = roleForm.pagePermissions || [];
    
    if (current.includes(permId)) {
        setRoleForm({ 
            ...roleForm, 
            permissions: current.filter(p => p !== permId),
            pagePermissions: currentPages.filter(p => p.pageId !== permId)
        });
    } else {
        const newPagePerm = {
            pageId: permId,
            enabled: true,
            components: availablePermissions.find(ap => ap.id === permId)?.components?.map(c => ({
                id: c.id,
                name: c.name,
                visible: true
            })) || []
        };
        setRoleForm({ 
            ...roleForm, 
            permissions: [...current, permId],
            pagePermissions: [...currentPages, newPagePerm]
        });
    }
  };

  const toggleComponentVisibility = (permId: Permission, componentId: string) => {
    const currentPages = [...(roleForm.pagePermissions || [])];
    const pageIdx = currentPages.findIndex(p => p.pageId === permId);
    
    if (pageIdx > -1) {
        const components = [...currentPages[pageIdx].components];
        const compIdx = components.findIndex(c => c.id === componentId);
        if (compIdx > -1) {
            components[compIdx] = { ...components[compIdx], visible: !components[compIdx].visible };
            currentPages[pageIdx] = { ...currentPages[pageIdx], components };
            setRoleForm({ ...roleForm, pagePermissions: currentPages });
        }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight">{t('employees.title')}</h2>
           <p className="text-gray-500 mt-1 font-medium">{t('employees.subtitle')}</p>
        </div>
        <div className="flex gap-2">
            {userRole === 'Admin' && (
                <button 
                    onClick={() => setActiveTab(activeTab === 'employees' ? 'roles' : 'employees')}
                    className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold text-sm border ${activeTab === 'roles' ? 'bg-farm-50 border-farm-200 text-farm-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <Shield className="w-4 h-4" /> {activeTab === 'employees' ? 'Gérer les Rôles' : 'Gérer les Employés'}
                </button>
            )}
            {activeTab === 'employees' ? (
                <button 
                    onClick={handleAddClick}
                    className="bg-farm-600 hover:bg-farm-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-farm-200 font-bold text-sm"
                >
                    <Plus className="w-4 h-4" /> {t('employees.add_employee')}
                </button>
            ) : (
                <button 
                    onClick={() => { setIsAddingRole(true); setEditingRoleId(null); setRoleForm({ name: '', permissions: [] }); }}
                    className="bg-farm-600 hover:bg-farm-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-farm-200 font-bold text-sm"
                >
                    <Plus className="w-4 h-4" /> Ajouter un Rôle
                </button>
            )}
        </div>
      </div>

      {activeTab === 'employees' ? (
      <div className="bg-white rounded-3xl shadow-glass border border-gray-100/50 overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder={t('employees.search')}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-500 outline-none bg-white shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>

         {/* Mobile View: Cards */}
         <div className="md:hidden divide-y divide-gray-50">
            {filteredEmployees.map((emp, idx) => (
                <div key={emp.id || `emp-card-${idx}`} className="p-4 bg-white active:bg-gray-50 transition-colors" onClick={() => setViewingEmployee(emp)}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-farm-100 flex items-center justify-center text-farm-700 font-bold text-sm">
                                {emp.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-sm">{emp.name}</span>
                                <span className="text-[10px] text-gray-500">{getEmployeeRolesString(emp)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); openPaymentModal('SALAIRE', emp); }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                                <Wallet className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); openPaymentModal('RATION', emp); }}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            >
                                <Utensils className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-gray-50 p-2 rounded-lg">
                            <span className="text-gray-400 uppercase font-bold block mb-0.5">Boutique</span>
                            <span className="text-gray-700 font-bold">{getBoutiqueName(emp.assignedBoutique)}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg text-right">
                            <span className="text-gray-400 uppercase font-bold block mb-0.5">Salaire</span>
                            <span className="text-gray-900 font-bold">{emp.salary ? new Intl.NumberFormat('fr-FR').format(emp.salary) + ' F' : '-'}</span>
                        </div>
                    </div>

                    {(!((emp.role || '').toLowerCase().trim() === 'superadmin' || (emp.roleId && availableRoles.find(r => r.id === emp.roleId)?.name.toLowerCase().trim() === 'superadmin')) || isSuperAdminUser) && (
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleEditClick(emp); }} 
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-100"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }} 
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            ))}
            {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                    {t('common.none')}
                </div>
            )}
         </div>

         {/* Desktop View: Table */}
         <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 min-w-[800px]">
                <thead className="bg-gray-50/80 backdrop-blur-sm text-gray-400 uppercase font-bold text-[10px] tracking-wider font-display border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">{t('employees.name')}</th>
                        <th className="px-6 py-4">{t('employees.role')}</th>
                        <th className="px-6 py-4">{t('employees.boutique')}</th>
                        <th className="px-6 py-4">{t('employees.contact')}</th>
                        <th className="px-6 py-4">{t('employees.salary')}</th>
                        <th className="px-6 py-4 text-right">{t('employees.actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map((emp, idx) => (
                        <tr key={emp.id || `emp-row-${idx}`} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => setViewingEmployee(emp)}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-farm-100 flex items-center justify-center text-farm-700 font-bold text-xs">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{emp.name}</span>
                                        {emp.email && <span className="text-xs text-gray-500">{emp.email}</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                                    {getEmployeeRolesString(emp)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                                    {getBoutiqueName(emp.assignedBoutique)}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium">
                                <div>{emp.phone || '-'}</div>
                                {emp.contactPersonName && (
                                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {emp.contactPersonName}
                                        {emp.contactPersonPhone && <span className="text-gray-300">({emp.contactPersonPhone})</span>}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 font-mono font-medium text-gray-900">
                                <div>{emp.salary ? new Intl.NumberFormat('fr-FR').format(emp.salary) + ' FCFA' : '-'}</div>
                                {emp.ration && <div className="text-xs text-gray-500">Ration: {emp.ration} F</div>}
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => openPaymentModal('SALAIRE', emp)}
                                        title={t('employees.pay_salary')}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-200 transition-all"
                                    >
                                        <Wallet className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => openPaymentModal('RATION', emp)}
                                        title={t('employees.give_ration')}
                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-200 transition-all"
                                    >
                                        <Utensils className="w-4 h-4" />
                                    </button>
                                    {(!((emp.role || '').toLowerCase().trim() === 'superadmin' || (emp.roleId && availableRoles.find(r => r.id === emp.roleId)?.name.toLowerCase().trim() === 'superadmin')) || isSuperAdminUser) && (
                                        <>
                                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                            <button onClick={() => handleEditClick(emp)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(emp.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                {t('common.none')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles
              .filter(r => {
                const isSuper = r.name.toLowerCase().trim() === 'superadmin' || r.name.toLowerCase().trim() === 'super-admin';
                return isSuperAdminUser || !isSuper;
              })
              .map((role, idx) => (
                <div key={role.id || `role-${idx}`} className="bg-white rounded-3xl shadow-glass border border-gray-100/50 p-6 flex flex-col hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-farm-50 rounded-2xl text-farm-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => { setEditingRoleId(role.id); setRoleForm(role); setIsAddingRole(true); }}
                                className="p-2 text-gray-400 hover:text-farm-600 hover:bg-farm-50 rounded-xl transition-all"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => deleteRole(role.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{translateRoleName(role.name)}</h3>
                    <div className="flex flex-wrap gap-2 mt-auto">
                        {(role.permissions || []).map((p, pIdx) => (
                            <span key={p ? `${p}-${pIdx}` : `perm-${pIdx}`} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-wider">
                                {availablePermissions.find(ap => ap.id === p)?.label || p}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Employee Details Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col animate-in zoom-in-95 border border-gray-100 overflow-hidden max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-farm-100 flex items-center justify-center text-farm-700 font-bold text-2xl shadow-inner">
                            {viewingEmployee.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl font-display text-gray-900">{viewingEmployee.name}</h3>
                            <div className="flex gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">{getEmployeeRolesString(viewingEmployee)}</span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">{getBoutiqueName(viewingEmployee.assignedBoutique)}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setViewingEmployee(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Salaire Mensuel</p>
                            <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat('fr-FR').format(viewingEmployee.salary || 0)} <span className="text-sm text-gray-500 font-normal">FCFA</span></p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Ration Journalière</p>
                            <p className="text-xl font-bold text-gray-900">{new Intl.NumberFormat('fr-FR').format(viewingEmployee.ration || 0)} <span className="text-sm text-gray-500 font-normal">FCFA</span></p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Contact</p>
                            <p className="text-sm font-bold text-gray-900">{viewingEmployee.phone || 'Non renseigné'}</p>
                            <p className="text-xs text-gray-500 truncate">{viewingEmployee.email || 'Pas d\'email'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-full md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">{t('profile.emergency_contact')}</p>
                                <p className="text-sm font-bold text-gray-900">{viewingEmployee.contactPersonName || 'Non renseigné'}</p>
                                <p className="text-xs text-gray-500">{viewingEmployee.contactPersonRelationship || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Identifiants Connexion</p>
                                {viewingEmployee.username ? (
                                    <>
                                        <p className="text-sm font-bold text-gray-900">ID: {viewingEmployee.username}</p>
                                        <p className="text-xs text-gray-500">PIN: ****</p>
                                    </>
                                ) : (
                                    <p className="text-xs font-bold text-amber-600 mt-1 italic font-medium">Aucun (Employé de Terrain)</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-gray-400"/> Historique des Paiements</h4>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {getEmployeeHistory(viewingEmployee.id).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Aucun paiement enregistré.</td>
                                    </tr>
                                ) : (
                                    getEmployeeHistory(viewingEmployee.id).map((exp, idx) => (
                                        <tr key={exp.id || `exp-${idx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-600">{new Date(exp.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${exp.category === 'SALAIRE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-900">{exp.description}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">{new Intl.NumberFormat('fr-FR').format(exp.amount)} F</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in-95 border border-gray-100">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                 <h3 className="font-bold text-lg font-display flex items-center gap-2">
                    {paymentModal.type === 'SALAIRE' ? <Wallet className="w-5 h-5 text-green-600"/> : <Utensils className="w-5 h-5 text-orange-600"/>}
                    {paymentModal.type === 'SALAIRE' ? t('employees.pay_salary') : t('employees.give_ration')}
                 </h3>
                 <button onClick={() => setPaymentModal(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 font-bold uppercase">Employé</p>
                    <p className="font-bold text-gray-900 text-lg">{paymentModal.employee.name}</p>
                    {paymentModal.type === 'SALAIRE' && (
                        <p className="text-xs text-gray-500 mt-1">Salaire de base: {new Intl.NumberFormat('fr-FR').format(paymentModal.employee.salary || 0)} FCFA</p>
                    )}
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Montant (FCFA)</label>
                    <input 
                        type="number" 
                        className="w-full p-3 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-farm-500" 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(parseFloat(e.target.value))} 
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Note / Description</label>
                    <input 
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none" 
                        value={paymentNote} 
                        onChange={e => setPaymentNote(e.target.value)} 
                        placeholder="Ex: Avance sur salaire..."
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                    <input 
                        type="date" 
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none" 
                        value={paymentDate} 
                        onChange={e => setPaymentDate(e.target.value)} 
                    />
                 </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
                 <button onClick={() => setPaymentModal(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">{t('common.cancel')}</button>
                 <button 
                    onClick={handlePaymentSubmit} 
                    disabled={isSubmitting || paymentAmount <= 0} 
                    className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all ${paymentModal.type === 'SALAIRE' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                 >
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : 'Confirmer'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 border border-gray-100 max-h-[90vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
                 <h3 className="font-bold text-lg font-display">{isAdding ? t('employees.add_employee') : t('employees.edit')}</h3>
                 <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User className="w-3 h-3"/> Nom Complet</label>
                    <input className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-500 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Jean Kouassi"/>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Shield className="w-3 h-3"/> Type d'enregistrement</label>
                     <div className="grid grid-cols-2 gap-2">
                         <button
                             type="button"
                             onClick={() => setCreationType('USER')}
                             className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 ${creationType === 'USER' ? 'border-farm-500 bg-farm-50/50 text-farm-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                         >
                             <Shield className="w-4 h-4 text-farm-500" />
                             <span>Utilisateur Système</span>
                             <span className="text-[10px] font-normal text-gray-400 whitespace-normal text-center">Accès de connexion (codes)</span>
                         </button>
                         <button
                             type="button"
                             onClick={() => setCreationType('EMPLOYEE')}
                             className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-2 ${creationType === 'EMPLOYEE' ? 'border-farm-500 bg-farm-50/50 text-farm-700' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
                         >
                             <User className="w-4 h-4 text-farm-400" />
                             <span>Employé Simple</span>
                             <span className="text-[10px] font-normal text-gray-400 whitespace-normal text-center">Pas d'accès (payroll seul)</span>
                         </button>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    {creationType === 'USER' && (
                    <div className="space-y-1">
                                                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> Rôles (Sélectionnez plusieurs)</label>
                         <div className="w-full border border-gray-200 rounded-xl p-3 bg-white max-h-36 overflow-y-auto space-y-1.5 shadow-sm text-sm">
                             {availableRoles
                               .filter(r => {
                                 const isSuperRole = r.name.toLowerCase().trim() === 'superadmin' || r.name.toLowerCase().trim() === 'super-admin';
                                 return isSuperAdminUser || !isSuperRole;
                               })
                               .map((r, idx) => {
                                 const selectedRoleIds = form.roleIds || (form.roleId ? [form.roleId] : []);
                                 const isChecked = selectedRoleIds.includes(r.id);
                                 return (
                                   <label key={r.id || `avail-role-${idx}`} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-xs font-medium text-gray-700">
                                       <input 
                                           type="checkbox" 
                                           checked={isChecked}
                                           onChange={() => {
                                               let newRoleIds = [...selectedRoleIds];
                                               if (isChecked) {
                                                   newRoleIds = newRoleIds.filter(id => id !== r.id);
                                               } else {
                                                   newRoleIds.push(r.id);
                                               }
                                               const selectedRoleObjs = availableRoles.filter(roleObj => newRoleIds.includes(roleObj.id));
                                               const newRoleNames = selectedRoleObjs.map(roleObj => roleObj.name);
                                               setForm({
                                                   ...form,
                                                   roleIds: newRoleIds,
                                                   roles: newRoleNames,
                                                   roleId: newRoleIds[0] || '',
                                                   role: newRoleNames.join(', ') || ''
                                               });
                                           }}
                                           className="rounded border-gray-300 text-farm-600 focus:ring-farm-500 h-4 w-4"
                                       />
                                       <span>{translateRoleName(r.name)}</span>
                                   </label>
                                 );
                               })}
                         </div>
                         {(() => {
                              const selectedRoleIds = form.roleIds || (form.roleId ? [form.roleId] : []);
                              const selectedRoleObjs = availableRoles.filter(r => selectedRoleIds.includes(r.id));
                              const setPerms = new Set<Permission>();
                              selectedRoleObjs.forEach(r => r.permissions?.forEach(p => setPerms.add(p)));
                              const aggregatedPermissions = Array.from(setPerms);
                              
                              return aggregatedPermissions.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                      <span className="text-[9px] text-gray-400 w-full mb-1">Permissions cumulées :</span>
                                      {aggregatedPermissions.map((p, idx) => (
                                          <span key={p ? `${p}-${idx}` : `agg-perm-${idx}`} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded uppercase animate-in fade-in zoom-in-95">
                                              {availablePermissions.find(ap => ap.id === p)?.label || p}
                                          </span>
                                      ))}
                                  </div>
                              );
                          })()}
                    </div>
                    )}
                    {creationType === 'EMPLOYEE' && (
                     <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> Poste / Rôle</label>
                          <select 
                              className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none" 
                              value={form.roleId || ''} 
                              onChange={e => {
                                  const rId = e.target.value;
                                  const rObj = availableRoles.find(role => role.id === rId);
                                  setForm({
                                      ...form,
                                      roleId: rId,
                                      role: rObj ? rObj.name : 'Employé Simple',
                                      roleIds: rId ? [rId] : [],
                                      roles: rObj ? [rObj.name] : []
                                  });
                              }}
                          >
                              <option value="">Sélectionner un rôle de la DB...</option>
                              {availableRoles
                                .filter(r => {
                                  const isSuperRole = r.name.toLowerCase().trim() === 'superadmin' || r.name.toLowerCase().trim() === 'super-admin';
                                  return isSuperAdminUser || !isSuperRole;
                                })
                                .map((r, idx) => (
                                  <option key={r.id || `role-sel-opt-${idx}`} value={r.id}>
                                      {translateRoleName(r.name)}
                                  </option>
                                ))
                              }
                          </select>
                     </div>
                     )}
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Store className="w-3 h-3"/> Boutique</label>
                        <select className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none" value={form.assignedBoutique} onChange={e => setForm({...form, assignedBoutique: e.target.value as any})}>
                            <option value="Toutes">Toutes (Admin)</option>
                            {boutiques.map((b, idx) => (
                                <option key={b.id || `boutique-opt-${idx}`} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Phone className="w-3 h-3"/> Téléphone</label>
                        <input className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0102030405"/>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><User className="w-3 h-3"/> Email (Optionnel)</label>
                        <input type="email" className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemple.com"/>
                    </div>
                 </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase border-b border-gray-200 pb-2">{t('profile.emergency_contact')}</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-500 uppercase">{t('profile.contact_name')}</label>
                             <input className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.contactPersonName || ''} onChange={e => setForm({...form, contactPersonName: e.target.value})} placeholder="Nom du contact"/>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-500 uppercase">{t('profile.relation')}</label>
                             <input className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.contactPersonRelationship || ''} onChange={e => setForm({...form, contactPersonRelationship: e.target.value})} placeholder="Ex: Père, Mère..."/>
                          </div>
                          <div className="space-y-1 col-span-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase">{t('profile.phone')}</label>
                             <input className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none" value={form.contactPersonPhone || ''} onChange={e => setForm({...form, contactPersonPhone: e.target.value})} placeholder="0102030405"/>
                          </div>
                      </div>
                  </div>

                  {creationType === 'USER' && (
                     <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-xs font-bold text-blue-900 uppercase border-b border-blue-200 pb-2">Identifiants de Connexion</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-blue-700 uppercase">{t('login.username')}</label>
                               <input className="w-full p-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.username || ''} onChange={e => setForm({...form, username: e.target.value})} placeholder="Ex: jean.k"/>
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-blue-700 uppercase">Code PIN / Mot de passe</label>
                               <input type="text" className="w-full p-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={form.pin || ''} onChange={e => setForm({...form, pin: e.target.value})} placeholder="****"/>
                            </div>
                        </div>
                     </div>
                  )}

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Salaire Mensuel</label>
                       <input type="number" className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold outline-none" value={form.salary} onChange={e => setForm({...form, salary: parseFloat(e.target.value)})} placeholder="0"/>
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Utensils className="w-3 h-3"/> Ration Journalière</label>
                       <input type="number" className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold outline-none" value={form.ration} onChange={e => setForm({...form, ration: parseFloat(e.target.value)})} placeholder="0"/>
                    </div>
                 </div>
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
                 <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">{t('common.cancel')}</button>
                 <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 bg-farm-600 text-white rounded-xl font-bold shadow-lg hover:bg-farm-700 flex items-center gap-2 transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : t('common.save')}
                 </button>
              </div>
           </div>
        </div>
      )}
      
      {/* Role Add/Edit Modal */}
      {isAddingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col animate-in zoom-in-95 border border-gray-100 max-h-[90vh]">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
                      <h3 className="font-bold text-lg font-display">{editingRoleId ? 'Modifier le Rôle' : 'Ajouter un Rôle'}</h3>
                      <button onClick={() => setIsAddingRole(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Nom du Rôle</label>
                          <input 
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-farm-500 outline-none" 
                            value={roleForm.name} 
                            onChange={e => setRoleForm({...roleForm, name: e.target.value})} 
                            placeholder="Ex: Vendeur, Magasinier..."
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                              <Shield className="w-3 h-3" /> Permissions & Accès Granulaires
                          </label>
                          <div className="space-y-4">
                              {availablePermissions.map(perm => (
                                  <div key={perm.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                                      <button
                                        onClick={() => togglePermission(perm.id)}
                                        className={`w-full flex items-center justify-between p-4 transition-all text-left ${roleForm.permissions?.includes(perm.id) ? 'bg-farm-50 text-farm-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                                      >
                                          <div className="flex items-center gap-3">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roleForm.permissions?.includes(perm.id) ? 'bg-farm-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                  <Check className={`w-4 h-4 ${roleForm.permissions?.includes(perm.id) ? 'opacity-100' : 'opacity-0'}`} />
                                              </div>
                                              <span className="font-bold">{perm.label}</span>
                                          </div>
                                          <Settings className={`w-4 h-4 transition-transform ${roleForm.permissions?.includes(perm.id) ? 'rotate-0' : 'rotate-90 opacity-0'}`} />
                                      </button>
                                      
                                      {roleForm.permissions?.includes(perm.id) && perm.components && (
                                          <div className="p-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {perm.components.map((comp, compIdx) => {
                                                  const pagePerms = roleForm.pagePermissions;
                                                   let pagePerm: any = null;
                                                   if (Array.isArray(pagePerms)) {
                                                       pagePerm = pagePerms.find(p => p.pageId === perm.id);
                                                   } else if (pagePerms && typeof pagePerms === 'object') {
                                                       pagePerm = pagePerms[perm.id as any];
                                                   }
                                                   const isVisible = (pagePerm && Array.isArray(pagePerm.components))
                                                       ? (pagePerm.components.find((c: any) => c.id === comp.id)?.visible ?? true)
                                                       : true;
                                                  return (
                                                      <button
                                                          key={comp.id || `comp-${compIdx}`}
                                                          onClick={() => toggleComponentVisibility(perm.id, comp.id)}
                                                          className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${isVisible ? 'bg-white border-farm-200 text-farm-600 shadow-sm' : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                                                      >
                                                          <div className={`w-3 h-3 rounded-full ${isVisible ? 'bg-farm-500' : 'bg-gray-300'}`} />
                                                          {comp.name}
                                                      </button>
                                                  );
                                              })}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
                      <button onClick={() => setIsAddingRole(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-white rounded-xl transition-colors">{t('common.cancel')}</button>
                      <button onClick={handleSaveRole} disabled={isSubmitting || !roleForm.name} className="px-6 py-2.5 bg-farm-600 text-white rounded-xl font-bold shadow-lg hover:bg-farm-700 flex items-center gap-2 transition-all">
                          {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : t('common.save')}
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
                      <h3 className="text-xl font-bold text-gray-900">{t('employees.confirm_delete')}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">{t('employees.confirm_delete_msg')}</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowConfirmDelete(null)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">{t('common.cancel')}</button>
                      <button onClick={confirmDeleteEmployee} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">{t('common.delete')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
