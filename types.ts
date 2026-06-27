export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  boutique?: string;
  advanceBalance: number;
  outstandingDebt: number;
  history?: Invoice[];
  provenderieId?: string;
}

export enum Category {
  RAW_MATERIALS = 'Matières Premières',
  POULTRY = 'Volailles & Aliments Complets',
  LIVESTOCK = 'Bétail (Porcs/Bovins)',
  EQUIPMENT = 'Matériel & Abreuvoirs',
  MEDICINE = 'Santé Animale',
  OTHER = 'Divers'
}

export interface StockMovement {
  id: string;
  date: string;
  type: 'ACHAT' | 'VENTE' | 'AJUSTEMENT' | 'PRODUCTION';
  quantity: number;
  note?: string; // Supplier name or reason
  unitCost?: number; // Cost price per unit at the time of movement
  variantName?: string; // If movement is for a specific variant
}

export interface ProductVariant {
  name: string; // e.g., 'Sec', 'Humide', 'Premium'
  price: number; // Specific selling price for this variant
  wholesalePrice?: number;
  costPrice?: number;
  stock?: number;
  boutiqueStock?: { [key: string]: number };
}

export interface ProductIngredient {
  productId: string;
  quantity: number; // Amount used per unit of the final product (or per batch?)
  // Let's assume this is the recipe for the *current stock* or a standard batch? 
  // Actually, usually a recipe is "per 1 unit" or "per batch". 
  // Given the mixer creates a specific quantity, maybe we just store the "last used recipe" or "standard recipe"?
  // Let's store it as "ingredients per 1 unit" or just "ingredients" and we infer it's the composition.
  // The user said "reuse previously created formules".
  // Let's store the list of ingredients used to create it.
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number; // Base Selling Price (Default)
  wholesalePrice?: number; // Wholesale Price
  costPrice?: number; // Buying Price (Coût d'achat)
  stock: number;
  boutiqueStock?: { [key: string]: number };
  unit: string; // e.g., 'sac', 'kg', 'unité'
  description?: string;
  tags?: string[]; // Deprecated in favor of variants, but kept for legacy
  variants?: ProductVariant[]; // New: List of variants with specific prices
  history?: StockMovement[];
  recipe?: { productId: string; variantName?: string; weight: number }[]; // For formulas: ingredients used
  lowStockThreshold?: number;
  provenderieId?: string;
  deleted?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant; // The specific variant chosen during sale
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Invoice {
  id: string;
  date: string; // ISO string
  customerName: string;
  items: CartItem[];
  total: number;
  serviceCost?: number; // Cost for services (e.g. delivery, processing)
  amountPaid: number; // Amount actually received
  advanceUsed: number;
  reimbursement: number;
  newAdvanceCreated: number;
  remainingDebt: number;
  description?: string; // Note for the invoice (e.g. "Formule Finition")
  status: 'PAYÉ' | 'PARTIEL' | 'IMPAYÉ';
  isWholesale?: boolean;
  paymentHistory?: Payment[];
  boutique?: string;
  sellerName?: string;
  provenderieId?: string;
  deleted?: boolean;
}

export interface TransferItem {
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unit?: string;
  validated?: boolean;
}

export interface Provenderie {
  id: string;
  name: string;
  identifier: string; // Short code like "PRV-001"
  primaryAdminId?: string; // ID of the primary admin employee
  address?: string;
  phone?: string;
  phones?: string[]; // Multiple contact numbers for header
  legalRC?: string; // Registre du Commerce
  legalNIU?: string; // Numéro d'Identifiant Unique
  logo?: string;
  licenseEnforced?: boolean;
  licenseExpiryDate?: string;
  licenseType?: string;
  categories?: string[];
  deleted?: boolean;
}

export interface StockTransfer {
  id: string;
  reference: string;
  date: string;
  sourceBoutique: string;
  destinationBoutique: string;
  items: TransferItem[];
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'PARTIAL';
  createdBy: string;
  notes?: string;
  provenderieId?: string;
  deleted?: boolean;
}

export interface SalesData {
  name: string;
  sales: number;
}

export interface Expense {
  id: string;
  date: string;
  category: 'LOYER' | 'SALAIRE' | 'ELECTRICITE' | 'TRANSPORT' | 'MARKETING' | 'RATION' | 'AUTRE';
  amount: number;
  description: string;
  boutique?: string;
  employeeId?: string;
  provenderieId?: string;
  deleted?: boolean;
}

export interface Boutique {
  id: string;
  name: string;
  location?: string;
  address?: string; // Specific location/address for the boutique header
  managerId?: string; // ID of the employee managing this boutique
  status: 'active' | 'inactive';
  openStatus?: 'OPEN' | 'CLOSED';
  lastOpenedAt?: string;
  lastClosedAt?: string;
  openedBy?: string;
  closedBy?: string;
  provenderieId?: string;
  deleted?: boolean;
}

export type Permission = 
  | 'pos' 
  | 'invoices' 
  | 'inventory' 
  | 'formulas' 
  | 'employees' 
  | 'dashboard' 
  | 'settings' 
  | 'transfers' 
  | 'guide'
  | 'reports';

export interface ComponentPermission {
  id: string;
  name: string;
  visible: boolean;
}

export interface PagePermission {
  pageId: Permission;
  enabled: boolean;
  components: ComponentPermission[];
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[]; // Keep for legacy/simple checks
  pagePermissions?: PagePermission[]; // New granular permissions
  provenderieId?: string;
  deleted?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string; // Keep for display/legacy
  roleId?: string; // New: Link to UserRole
  roleIds?: string[];
  roles?: string[];
  phone?: string;
  email?: string;
  
  // Contact Person
  contactPersonName?: string;
  contactPersonRelationship?: string;
  contactPersonPhone?: string;
  
  // Login
  username?: string;
  pin?: string;

  assignedBoutique?: string; // Now a string ID or Name, not a fixed union
  isOnline?: boolean;
  lastActive?: string;
  salary?: number;
  ration?: number; // Daily ration allowance
  pendingSalary?: number;
  pendingRation?: number;
  attendance?: Record<string, 'present' | 'absent'>;
  provenderieId?: string;
  deleted?: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface ReportSection {
  id: string;
  type: 'text' | 'chart';
  title?: string;
  content?: string;
  chartType?: 'bar' | 'pie' | 'line' | 'area';
  data?: ChartData[];
  config?: {
    dataKey?: string;
    nameKey?: string;
    colors?: string[];
  };
}

export interface Report {
  id: string;
  title: string;
  date: string;
  category?: 'INVENTAIRE' | 'VENTES' | 'FINANCE' | 'TECHNIQUE' | 'AUTRE';
  sections: ReportSection[];
  isPinned?: boolean;
}
