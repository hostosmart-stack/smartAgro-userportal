import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc as firebaseSetDoc, 
  deleteDoc as firebaseDeleteDoc, 
  onSnapshot as firebaseOnSnapshot, 
  query, 
  where, 
  getDocs as firebaseGetDocs, 
  writeBatch as firebaseWriteBatch, 
  orderBy 
} from 'firebase/firestore';
import { Product, Invoice, Expense, Employee, Category, Boutique, Conversation, Customer, StockTransfer, UserRole, Provenderie } from '../types';

// --- REQUEST TRACKING ---
let localReadCount = Number(localStorage.getItem('smartAgro_stats_reads') || '0');
let localWriteCount = Number(localStorage.getItem('smartAgro_stats_writes') || '0');
let statsCallbacks: ((stats: { reads: number; writes: number }) => void)[] = [];
let syncTimeout: any = null;

const notifyStatsChanged = () => {
  statsCallbacks.forEach(cb => {
    try {
      cb({ reads: localReadCount, writes: localWriteCount });
    } catch (e) {
      console.error("Error in stats callback:", e);
    }
  });
};

export const trackReads = (count: number) => {
  if (count <= 0) return;
  localReadCount += count;
  localStorage.setItem('smartAgro_stats_reads', String(localReadCount));
  notifyStatsChanged();
  scheduleSync();
};

export const trackWrites = (count: number) => {
  if (count <= 0) return;
  localWriteCount += count;
  localStorage.setItem('smartAgro_stats_writes', String(localWriteCount));
  notifyStatsChanged();
  scheduleSync();
};

const scheduleSync = () => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncStatsToFirestore();
  }, 4000);
};

const syncStatsToFirestore = async () => {
  try {
    const statsRef = doc(db, 'request_stats', 'global');
    await firebaseSetDoc(statsRef, {
      reads: localReadCount,
      writes: localWriteCount,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Failed to sync stats to Firestore:", err);
  }
};

export const initRequestStats = async () => {
  try {
    const statsRef = doc(db, 'request_stats', 'global');
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      const data = snap.data();
      const dbReads = Number(data.reads || 0);
      const dbWrites = Number(data.writes || 0);

      const currentLocalReads = Number(localStorage.getItem('smartAgro_stats_reads') || '0');
      const currentLocalWrites = Number(localStorage.getItem('smartAgro_stats_writes') || '0');

      localReadCount = Math.max(dbReads, currentLocalReads);
      localWriteCount = Math.max(dbWrites, currentLocalWrites);
      
      localStorage.setItem('smartAgro_stats_reads', String(localReadCount));
      localStorage.setItem('smartAgro_stats_writes', String(localWriteCount));
      notifyStatsChanged();
    }
  } catch (err) {
    console.warn("Failed to load baseline request stats from DB:", err);
  }
};

export const subscribeToRequestStats = (callback: (stats: { reads: number; writes: number }) => void) => {
  statsCallbacks.push(callback);
  callback({ reads: localReadCount, writes: localWriteCount });
  return () => {
    statsCallbacks = statsCallbacks.filter(cb => cb !== callback);
  };
};

const trackSnapshotReads = (snapshot: any) => {
  const changesCount = snapshot.docChanges().length;
  trackReads(changesCount || 1);
};

// --- FIRESTORE WRAPPED OPERATIONS ---
const setDoc = (docRef: any, data: any, options?: any) => {
  if (docRef.path && !docRef.path.includes('request_stats')) {
    trackWrites(1);
  }
  return firebaseSetDoc(docRef, data, options);
};

const deleteDoc = (docRef: any) => {
  if (docRef.path && !docRef.path.includes('request_stats')) {
    trackWrites(1);
  }
  return firebaseDeleteDoc(docRef);
};

const onSnapshot = (q: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) => {
  return firebaseOnSnapshot(q, (snapshot) => {
    trackSnapshotReads(snapshot);
    onNext(snapshot);
  }, onError);
};

const getDocs = async (q: any): Promise<any> => {
  const snapshot = await firebaseGetDocs(q);
  trackReads(snapshot.size || 1);
  return snapshot;
};

const writeBatch = (firestoreDb: any) => {
  const batch = firebaseWriteBatch(firestoreDb);
  let operationCount = 0;

  return {
    set(docRef: any, data: any, options?: any) {
      if (docRef.path && !docRef.path.includes('request_stats')) {
        operationCount++;
      }
      batch.set(docRef, data, options);
      return this;
    },
    update(docRef: any, data: any) {
      if (docRef.path && !docRef.path.includes('request_stats')) {
        operationCount++;
      }
      batch.update(docRef, data);
      return this;
    },
    delete(docRef: any) {
      if (docRef.path && !docRef.path.includes('request_stats')) {
        operationCount++;
      }
      batch.delete(docRef);
      return this;
    },
    async commit() {
      trackWrites(operationCount);
      return await batch.commit();
    }
  } as any;
};

// --- FIRESTORE ERROR HANDLING ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- HELPER: REMOVE UNDEFINED ---
const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
};

// --- HELPER: WRITE TO FIRESTORE ---

const writeToFirestore = async (
  collectionName: string, 
  entity: any, 
  operation: 'upsert' | 'delete'
) => {
  const docRef = doc(db, collectionName, entity.id);
  if (operation === 'upsert') {
    const now = new Date().toISOString();
    // Fire and forget for offline-first UX
    const cleanEntity = removeUndefined({ ...entity, updatedAt: now });
    setDoc(docRef, cleanEntity, { merge: true }).catch(err => {
      console.error(`Error writing to ${collectionName}:`, err);
    });
  } else {
    // Fire and forget
    deleteDoc(docRef).catch(err => {
      console.error(`Error deleting from ${collectionName}:`, err);
    });
  }
};

// --- PROVENDERIES ---

export const subscribeToProvenderies = (callback: (provenderies: Provenderie[]) => void) => {
  const path = 'provenderies';
  const q = query(collection(db, path));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const provenderies = snapshot.docs.map(doc => doc.data() as Provenderie);
    callback(provenderies);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveProvenderie = async (provenderie: Provenderie) => {
  await writeToFirestore('provenderies', provenderie, 'upsert');
};

export const deleteProvenderie = async (id: string) => {
  await writeToFirestore('provenderies', { id }, 'delete');
};

// --- CUSTOMERS ---

export const subscribeToCustomers = (provenderieId: string, callback: (customers: Customer[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'customers';
  const q = query(collection(db, path), where('provenderieId', '==', provenderieId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map(doc => doc.data() as Customer);
    callback(customers);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveCustomer = async (customer: Customer) => {
  await writeToFirestore('customers', customer, 'upsert');
};

export const deleteCustomer = async (id: string) => {
  await writeToFirestore('customers', { id }, 'delete');
};

// --- PRODUCTS ---

export const subscribeToProducts = (provenderieId: string, callback: (products: Product[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'products';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const products = snapshot.docs
      .map(doc => doc.data() as Product)
      .filter(p => !p.deleted);
    callback(products);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveProduct = async (product: Product) => {
  await writeToFirestore('products', { ...product, deleted: false }, 'upsert');
};

export const deleteProduct = async (id: string) => {
  await writeToFirestore('products', { id, deleted: true }, 'upsert');
};

// --- INVOICES ---

export const subscribeToInvoices = (provenderieId: string, callback: (invoices: Invoice[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'invoices';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs
      .map(doc => doc.data() as Invoice)
      .filter(i => !i.deleted)
      .sort((a, b) => b.date.localeCompare(a.date));
    callback(invoices);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveInvoice = async (invoice: Invoice) => {
  await writeToFirestore('invoices', { ...invoice, deleted: false }, 'upsert');
};

export const deleteInvoice = async (id: string) => {
  await writeToFirestore('invoices', { id, deleted: true }, 'upsert');
};

// --- EXPENSES ---

export const subscribeToExpenses = (provenderieId: string, callback: (expenses: Expense[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'expenses';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs
      .map(doc => doc.data() as Expense)
      .filter(e => !e.deleted)
      .sort((a, b) => b.date.localeCompare(a.date));
    callback(expenses);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveExpense = async (expense: Expense) => {
  await writeToFirestore('expenses', { ...expense, deleted: false }, 'upsert');
};

export const deleteExpense = async (id: string) => {
  await writeToFirestore('expenses', { id, deleted: true }, 'upsert');
};

// --- EMPLOYEES ---

export const subscribeToEmployees = (provenderieId: string, callback: (employees: Employee[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'employees';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const employees = snapshot.docs
      .map(doc => doc.data() as Employee)
      .filter(e => !e.deleted);
    callback(employees);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveEmployee = async (employee: Employee) => {
  await writeToFirestore('employees', { ...employee, deleted: false }, 'upsert');
};

export const deleteEmployee = async (id: string) => {
  await writeToFirestore('employees', { id, deleted: true }, 'upsert');
};

export const subscribeToCurrentEmployee = (email: string, callback: (employee: Employee | null) => void) => {
  if (!email) return () => {};
  const path = 'employees';
  const q = query(
    collection(db, path),
    where('email', '==', email)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const validDocs = snapshot.docs
      .map(doc => doc.data() as Employee)
      .filter(e => !e.deleted);
    if (validDocs.length > 0) {
      callback(validDocs[0]);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

// --- ROLES ---

export const subscribeToRoles = (provenderieId: string, callback: (roles: UserRole[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'roles';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const roles = snapshot.docs
      .map(doc => doc.data() as UserRole)
      .filter(r => !r.deleted);
    callback(roles);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveRole = async (role: UserRole) => {
  await writeToFirestore('roles', { ...role, deleted: false }, 'upsert');
};

export const deleteRole = async (id: string) => {
  await writeToFirestore('roles', { id, deleted: true }, 'upsert');
};

// --- BOUTIQUES ---

export const subscribeToBoutiques = (provenderieId: string, callback: (boutiques: Boutique[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'boutiques';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const boutiques = snapshot.docs
      .map(doc => doc.data() as Boutique)
      .filter(b => !b.deleted);
    callback(boutiques);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveBoutique = async (boutique: Boutique) => {
  await writeToFirestore('boutiques', { ...boutique, deleted: false }, 'upsert');
};

export const deleteBoutique = async (id: string) => {
  await writeToFirestore('boutiques', { id, deleted: true }, 'upsert');
};

export const updateBoutiqueStatus = async (id: string, status: 'active' | 'inactive') => {
  await writeToFirestore('boutiques', { id, status }, 'upsert');
};

export const toggleBoutiqueOpenStatus = async (
  id: string,
  openStatus: 'OPEN' | 'CLOSED',
  userEmail?: string,
  userName?: string
) => {
  const now = new Date().toISOString();
  const updateData: any = { id, openStatus };
  
  if (openStatus === 'OPEN') {
    updateData.lastOpenedAt = now;
    updateData.openedBy = userName || userEmail || 'Inconnu';
  } else {
    updateData.lastClosedAt = now;
    updateData.closedBy = userName || userEmail || 'Inconnu';
  }
  
  await writeToFirestore('boutiques', updateData, 'upsert');
};

export const setEmployeeOnlineStatus = async (
  employeeId: string,
  isOnline: boolean,
  actionEmail?: string
) => {
  const { doc, getDoc, getDocs, collection, query, where } = await import('firebase/firestore');
  const { db } = await import('./firebase');

  const now = new Date().toISOString();

  // 1. Fetch current employee's data
  const empRef = doc(db, 'employees', employeeId);
  const empSnap = await getDoc(empRef);
  if (!empSnap.exists()) return;
  const currentEmployee = empSnap.data() as Employee;
  if (currentEmployee.deleted) return;

  // 2. Update the employee's online status
  await writeToFirestore('employees', { 
    id: employeeId, 
    isOnline, 
    lastActive: now 
  }, 'upsert');

  const assignedBoutiqueIdOrName = currentEmployee.assignedBoutique;
  if (!assignedBoutiqueIdOrName || assignedBoutiqueIdOrName === 'Toutes') return;

  // 3. Find the exact matching Boutique
  const boutiquesSnap = await getDocs(
    query(
      collection(db, 'boutiques'),
      where('provenderieId', '==', currentEmployee.provenderieId || '')
    )
  );
  const boutiquesList = boutiquesSnap.docs.map(d => d.data() as Boutique).filter(b => !b.deleted);
  const matchedBoutique = boutiquesList.find(b => 
    b.id === assignedBoutiqueIdOrName || 
    b.name === assignedBoutiqueIdOrName
  );

  if (!matchedBoutique) return;

  if (isOnline) {
    // "afer login one employee login into a boutique let the status be ouvert"
    if (matchedBoutique.openStatus !== 'OPEN') {
      await toggleBoutiqueOpenStatus(
        matchedBoutique.id, 
        'OPEN', 
        actionEmail || currentEmployee.email || '', 
        currentEmployee.name
      );
    }
  } else {
    // "when the user logs out let the status of the boutique be fermer"
    if (matchedBoutique.openStatus !== 'CLOSED') {
      await toggleBoutiqueOpenStatus(
        matchedBoutique.id, 
        'CLOSED', 
        actionEmail || currentEmployee.email || '', 
        currentEmployee.name
      );
    }
  }
};

// --- TRANSACTIONS ---

export const processSaleTransaction = (invoice: Invoice, updatedProducts: Product[], customer?: Customer) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. Save Invoice
  const invRef = doc(db, 'invoices', invoice.id);
  const cleanInvoice = removeUndefined({ ...invoice, updatedAt: now, deleted: false });
  batch.set(invRef, cleanInvoice, { merge: true });

  // 2. Update Products
  for (const p of updatedProducts) {
    const pRef = doc(db, 'products', p.id);
    const cleanProduct = removeUndefined({ ...p, updatedAt: now, deleted: false });
    batch.set(pRef, cleanProduct, { merge: true });
  }

  // 3. Update Customer
  if (customer) {
      const cRef = doc(db, 'customers', customer.id);
      const updatedCustomer = {
          ...customer,
          advanceBalance: customer.advanceBalance - invoice.advanceUsed + invoice.newAdvanceCreated,
          outstandingDebt: customer.outstandingDebt + invoice.remainingDebt
      };
      batch.set(cRef, removeUndefined(updatedCustomer), { merge: true });
  }

  batch.commit().catch(console.error);
  return Promise.resolve();
};

export const processPaymentRecovery = (invoice: Invoice, customer?: Customer) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. Save Invoice
  const invRef = doc(db, 'invoices', invoice.id);
  const cleanInvoice = removeUndefined({ ...invoice, updatedAt: now, deleted: false });
  batch.set(invRef, cleanInvoice, { merge: true });

  // 2. Update Customer Debt if applicable
  if (customer) {
    const cRef = doc(db, 'customers', customer.id);
    // The customer's total outstanding debt should be updated.
    // We calculate the debt reduction based on the payment added.
    // However, it's safer to just recalculate or pass the new debt.
    // Since we have the invoice's remainingDebt, we can't easily know the total customer debt 
    // without knowing all their invoices.
    // But usually, we just subtract the payment amount from the customer's total debt.
    
    // Get the last payment amount
    const lastPayment = invoice.paymentHistory?.[invoice.paymentHistory.length - 1];
    if (lastPayment) {
        batch.set(cRef, { 
            outstandingDebt: Math.max(0, customer.outstandingDebt - lastPayment.amount),
            updatedAt: now 
        }, { merge: true });
    }
  }

  return batch.commit();
};

export const voidSaleTransaction = (invoiceId: string, restoredProducts: Product[]) => {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. Delete Invoice
  const invRef = doc(db, 'invoices', invoiceId);
  batch.set(invRef, { deleted: true, updatedAt: now }, { merge: true });

  // 2. Restore Products
  for (const p of restoredProducts) {
    const pRef = doc(db, 'products', p.id);
    const cleanProduct = removeUndefined({ ...p, updatedAt: now, deleted: false });
    batch.set(pRef, cleanProduct, { merge: true });
  }

  batch.commit().catch(console.error);
  return Promise.resolve();
};

// --- TRANSFERS ---

export const subscribeToTransfers = (provenderieId: string, callback: (transfers: StockTransfer[]) => void) => {
  if (!provenderieId) return () => {};
  const path = 'transfers';
  // Use simple query to avoid index requirements
  const q = query(
    collection(db, path), 
    where('provenderieId', '==', provenderieId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const transfers = snapshot.docs
      .map(doc => doc.data() as StockTransfer)
      .filter(t => !t.deleted)
      .sort((a, b) => b.date.localeCompare(a.date));
    callback(transfers);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
  return unsubscribe;
};

export const saveTransfer = async (transfer: StockTransfer) => {
  await writeToFirestore('transfers', { ...transfer, deleted: false }, 'upsert');
};

export const deleteTransfer = async (id: string) => {
  await writeToFirestore('transfers', { id, deleted: true }, 'upsert');
};

// --- CONVERSATIONS ---

export const subscribeToConversations = (callback: (conversations: Conversation[]) => void) => {
  const q = query(collection(db, 'conversations'), orderBy('updatedAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => doc.data() as Conversation).filter(c => !c.deleted);
    callback(conversations);
  }, (error) => {
    console.error("Error subscribing to conversations:", error);
  });
  return unsubscribe;
};

export const saveConversation = async (conversation: Conversation) => {
  await writeToFirestore('conversations', { ...conversation, deleted: false }, 'upsert');
};

export const deleteConversation = async (id: string) => {
  await writeToFirestore('conversations', { id, deleted: true }, 'upsert');
};

// --- SEEDING & FIXING ---

export const clearAllFormulas = async () => {
  try {
    const q = query(collection(db, 'products'), where('deleted', '!=', true));
    const snapshot = await getDocs(q);
    const formulas = snapshot.docs.map(doc => doc.data() as Product).filter(p => p.category === Category.POULTRY || p.category === Category.LIVESTOCK);

    if (formulas.length > 0) {
      console.log(`Deleting ${formulas.length} formulas...`);
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      for (const f of formulas) {
        const pRef = doc(db, 'products', f.id);
        batch.set(pRef, { deleted: true, updatedAt: now }, { merge: true });
      }
      await batch.commit();
      console.log("Formulas deleted.");
    }
  } catch (error) {
    console.error("Error clearing formulas:", error);
  }
};

