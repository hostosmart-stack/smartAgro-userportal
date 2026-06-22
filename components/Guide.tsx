import React, { useState } from 'react';
import { 
  Book, 
  HelpCircle, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Search, 
  Sprout, 
  ArrowRight, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  LayoutDashboard,
  Package,
  FileText,
  Calculator,
  ArrowRightLeft,
  Settings as SettingsIcon,
  Bot,
  Sparkles,
  Info
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface GuideProps {
  userRole?: string;
}

interface StepDetail {
  titleFr: string;
  titleEn: string;
  textFr: string;
  textEn: string;
  tipFr?: string;
  tipEn?: string;
}

interface FeatureGuide {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  steps: StepDetail[];
}

export const Guide: React.FC<GuideProps> = ({ userRole = 'Admin' }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Highly detailed, step-by-step guides for each app module
  const appFeatures: FeatureGuide[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      titleFr: "Tableau de Bord & Hub Agricole",
      titleEn: "Dashboard & Agricultural Hub",
      descFr: "Pilotez l'activité globale de votre provenderie en temps réel grâce à une interface décisionnelle unifiée.",
      descEn: "Steer your overall livestock store operations in real-time through a unified management interface.",
      steps: [
        {
          titleFr: "1. Analyse des Indicateurs Financiers",
          titleEn: "1. Financial KPI Analysis",
          textFr: "Dès votre connexion, visualisez le Chiffre d'Affaires du jour brut, la Caisse Nette (fonds physiques réels dans le tiroir-caisse), le cumul des dépenses opérationnelles saisies, et le nombre total de ventes réalisées.",
          textEn: "As soon as you log in, inspect current-day Gross Revenue, Net Drawer Balance (real physical vault cash), cumulated operating expenses, and total sales count.",
          tipFr: "La caisse nette est recalculée dynamiquement : Ventes au comptant + Acomptes + Encasements de dettes - Dépenses.",
          tipEn: "Net drawer balance is dynamically updated: Cash Sales + Cash Advances + Debt Recoveries - Documented Expenses."
        },
        {
          titleFr: "2. Utilisation du Hub Divisionnaire (Départements)",
          titleEn: "2. Workspace Division (Hub Switcher)",
          textFr: "Utilisez le sélecteur horizontal pour basculer entre 'Ventes', 'Magasin de Stock', 'Comptabilité' et 'Administration'. Ce choix adapte instantanément le menu latéral pour afficher uniquement les options pertinentes à vos tâches.",
          textEn: "Use the top slider to toggle between 'Sales', 'Store Inventory', 'Accounting', and 'Administration'. This instantly recalibrates the sidebar menu to show only relevant tools.",
          tipFr: "Cela évite l'encombrement visuel et permet aux vendeurs d'avoir un écran de caisse épuré et ultra-rapide.",
          tipEn: "This avoids terminal clutter and allows specialized cashiers to focus strictly on swift, error-free checkout."
        },
        {
          titleFr: "3. Suivi des Alertes Critiques de Stock",
          titleEn: "3. Quick Critical Alerts Monitoring",
          textFr: "Le tableau de bord remonte immédiatement les articles en rupture ou en stock bas. Cliquez sur l'une des alertes pour être automatiquement redirigé vers l'ajustement rapide sans naviguer manuellement.",
          textEn: "The dashboard automatically reports run-out and low-stock warnings. Click any alert card to immediately transition to fast readjustment options.",
          tipFr: "Vérifiez régulièrement l'état graphique des ventes de provendes pour ajuster votre plan de fabrication.",
          tipEn: "Check feed production charts frequently to align raw material orders with actual farm consumption trends."
        }
      ]
    },
    {
      id: 'pos',
      icon: ShoppingCart,
      titleFr: "Point de Vente (POS) & Caisse",
      titleEn: "Point of Sale (POS) & Billing",
      descFr: "Enregistrez les commandes de provendes et intrants avec encaissement rapide et gestion des acomptes.",
      descEn: "Process direct agronomic seed, feed bag, and medicine sales with split-payment and credit options.",
      steps: [
        {
          titleFr: "1. Sélection et Composition du Panier",
          titleEn: "1. Product Selection & Cart Adjustment",
          textFr: "Dans l'écran de caisse, cliquez sur un produit pour l'ajouter au panier. Si le produit possède des variantes (ex: Sac de 50Kg, Sac de 25Kg), sélectionnez la variante souhaitée dans le menu contextuel. Modifiez les quantités avec '+' et '-' ou saisissez-les directement.",
          textEn: "Inside the POS screen, tap a product to add it to the cart. If the product has size/weight variations (e.g., 50Kg Bag, 25Kg Bag), pick the target size. Easily adjust quantities using the '+' and '-' indicators.",
          tipFr: "Vous pouvez appliquer une remise en pourcentage directement sur un article en éditant sa case dédiée dans le panier.",
          tipEn: "You can apply precise percentage discounts directly onto a cart item by editing its targeted field."
        },
        {
          titleFr: "2. Configuration du Mode de Règlement",
          titleEn: "2. Choosing the Payment Mode",
          textFr: "Choisissez la modalité financière de la vente : 'Comptant' (Espèces ou Mobile Money), 'Crédit Intégral' (si le client emporte la marchandise pour payer plus tard), ou 'Acompte' (paiement partiel immédiat, le reste est inscrit à sa dette).",
          textEn: "Select payment configurations: 'Cash/Momo' (full payment), 'Full Credit' (the farmer carries the feed and pays later), or 'Deposit/Acompte' (partial cash upfront, rest is saved as outstanding debt).",
          tipFr: "Toutes les ventes à crédit requièrent obligatoirement la sélection d'un client enregistré.",
          tipEn: "All partial or fully credited transactions strictly require selecting a registered customer before checkout."
        },
        {
          titleFr: "3. Recherche ou Création Rapide de Client",
          titleEn: "3. Farmer Profile Linkage",
          textFr: "Associez un client à la facture. S'il n'existe pas encore, cliquez sur le bouton de création rapide pour enregistrer son Nom, son Téléphone et l'adresse de son exploitation avicole ou porcine directement depuis la caisse.",
          textEn: "Attach a farmer to the invoice. If they are new, hit the quick registration shortcut to record their Name, Mobile Number, and farm location without leaving the checkout screen.",
          tipFr: "Renseigner l'adresse permet de faciliter les livraisons de provendes groupées.",
          tipEn: "Registering exact farm addresses is extremely helpful when scheduling bulk feed deliveries."
        },
        {
          titleFr: "4. Enregistrement et Impression du Ticket",
          titleEn: "4. Saving & Auto-printing Receipts",
          textFr: "Cliquez sur 'Valider la vente'. Le système enregistre l'opération en base et ouvre instantanément le reçu. Vous pouvez ainsi imprimer le ticket sur une imprimante thermique (format 80mm compact) ou standard (format A4 de bureau).",
          textEn: "Click 'Process checkout'. The tool logs the invoice securely and opens the print preview. You can generate compact thermal receipts (80mm) or formal A4 delivery papers.",
          tipFr: "Pensez à décocher 'En-têtes et pieds de page' dans la boîte d'impression pour un ticket propre.",
          tipEn: "Remember to untick 'Headers and footers' in your web browser print prompt for a highly professional receipt look."
        }
      ]
    },
    {
      id: 'inventory',
      icon: Package,
      titleFr: "Gestion des Stocks & Variantes",
      titleEn: "Inventory & Feed Variations",
      descFr: "Suivez méthodiquement l'état de chaque sac d'aliments et gérez des variantes de conditionnement complexes.",
      descEn: "Track feed inventory units, raw grains, and easily oversee product weights or sizes.",
      steps: [
        {
          titleFr: "1. Enregistrement d'un Produit de Provende",
          titleEn: "1. Creating a Product Sheet",
          textFr: "Allez dans l'onglet Stock et cliquez sur 'Nouveau Produit'. Renseignez le nom (ex: Aliment Démarrage Poulet), la catégorie (Aliments, Médicaments, Concentrés), l'unité de mesure (Sac, Kg, Flacon), le prix d'achat et le prix de vente.",
          textEn: "Navigate to the Stock tab and click 'New Product'. Write the title (e.g., Broiler Starter Feed), select a Category, choose measuring units (Bag, Kg, Bottle), and input cost plus retail prices.",
          tipFr: "Renseigner un prix d'achat exact est indispensable pour calculer automatiquement vos marges bénéficiaires réelles.",
          tipEn: "Entering accurate purchase costs is critical to generate precise real profit margin statistics inside your analytics."
        },
        {
          titleFr: "2. Création de Variantes de Conditionnement",
          titleEn: "2. Setting up Multi-Size Packaging",
          textFr: "Certains produits se vendent sous différentes formes (ex: sac de 50 Kg à 19 000 FCFA et sac de 25 Kg à 10 000 FCFA). Cochez 'Activer les variantes' pour ajouter autant de formats que nécessaire, chacun ayant ses propres prix, coût d'achat et stock réel.",
          textEn: "Some feeds ship in multiple bags (e.g. 50kg bag and 25kg bag). Toggle 'Enable variants' to add custom weights, each maintaining independent buying prices, public retail rates, and specific stock counts.",
          tipFr: "Lors de la saisie en caisse, le vendeur aura simplement à cliquer sur le produit puis sélectionner le format vendu.",
          tipEn: "During billing, the cashier simply clicks the product card and chooses the precise weight package sold."
        },
        {
          titleFr: "3. Ajustement de Stock et Rapprochements",
          titleEn: "3. Direct Quantity Adjustments",
          textFr: "En cas d'écart constaté (ex: sac éventré, souris, ou don), ou lors d'un inventaire de fin de mois, utilisez le bouton 'Ajuster' sur la fiche produit ou variante. Entrez la quantité réelle pour mettre à jour instantanément la base de données.",
          textEn: "If physical feed counts mismatch (e.g., broken bag, rodent loss), click 'Adjust' on the product or variant row. Directly enter the newly verified quantity to instantly overwrite system balances.",
          tipFr: "Chaque ajustement de stock est horodaté et associé à l'administrateur connecté pour un contrôle d'audit optimal.",
          tipEn: "Every stock override logs the active administrator's timestamp to prevent unauthorized feed shrinkage or theft."
        }
      ]
    },
    {
      id: 'transfers',
      icon: ArrowRightLeft,
      titleFr: "Transferts de Stock Multi-Boutiques",
      titleEn: "Inter-Boutique Stock Transfers",
      descFr: "Déplacez du stock en toute sécurité du dépôt principal vers vos boutiques annexes.",
      descEn: "Log transactions shifting products from central warehouses to secondary sales shops.",
      steps: [
        {
          titleFr: "1. Initialisation de l'Envoi",
          titleEn: "1. Initiating the stock dispatch",
          textFr: "Sélectionnez le produit ou la variante à transférer. Choisissez la boutique d'origine (qui doit posséder un stock physique suffisant) et la boutique à réapprovisionner (ex: Dépôt Principal vers Annexe Marché).",
          textEn: "Select the product package or variant. Choose your source boutique (which must have enough active stock) and the destination shop (e.g., Primary Depot to Market Annex).",
          tipFr: "Les gérants peuvent créer des transferts pour éviter que les vendeurs de l'annexe ne se retrouvent sans marchandises.",
          tipEn: "Admins create transfers to keep localized shops fully stocked with feed during high-demand animal rearing cycles."
        },
        {
          titleFr: "2. Détermination de la Quantité et Traçabilité",
          titleEn: "2. Specifying Sacks Volume",
          textFr: "Indiquez le nombre exact d'unités à déplacer. Saisissez éventuellement une note explicative (ex: 'Réapprovisionnement suite à forte demande de ponte') pour l'équipe de réception.",
          textEn: "Enter the precise number of sacks or items to move. Optionally type a brief comment (e.g., 'Replenishment for poultry farming startup customers') to guide the warehouse helpers.",
          tipFr: "Le transfert est validé et appliqué automatiquement en temps réel pour éviter les disparitions anormales.",
          tipEn: "Transfers execute in real-time, instantly shifting item ownership to prevent inventory from disappearing in transit."
        }
      ]
    },
    {
      id: 'invoices',
      icon: FileText,
      titleFr: "Registre des Factures & Annulations",
      titleEn: "Invoice Ledger & Transactions Management",
      descFr: "Consultez l'historique complet, réimprimez les récapitulatifs de vente et gérez les annulations exceptionnelles.",
      descEn: "Consult historical invoice sales records, reprint customer copies, and void incorrect bills.",
      steps: [
        {
          titleFr: "1. Recherche Multi-Critères de Ventes",
          titleEn: "1. Comprehensive Invoice Search",
          textFr: "Accédez à l'onglet Factures pour voir toutes les ventes. Utilisez la barre de recherche pour filtrer instantanément par Nom d'éleveur, Numéro de pièce (ex: FAC-2026-...) ou filtrez selon le statut (Payé, Crédit, Acompte).",
          textEn: "Open the Invoices list. Run standard searches by typing the farmer name or document ID (e.g. FAC-2026-...). Filter active listings by Payment status (Paid, Outstanding Credit, Partial).",
          tipFr: "Vous pouvez également filtrer par boutique pour auditer précisément une succursale.",
          tipEn: "You can additionally filter results by boutique location to evaluate and review secondary shop performances."
        },
        {
          titleFr: "2. Consultation des Détails et Réimpression",
          titleEn: "2. Reading details & Printing Duplicates",
          textFr: "Cliquez sur l'icône de l'œil d'une facture pour ouvrir son volet de détails complet : liste des sacs achetés, prix unitaires, remises accordées, mode de paiement choisi et nom du vendeur qui a saisi l'opération. Cliquez sur 'Imprimer' pour éditer un duplicata.",
          textEn: "Click the view eye icon on any invoice row to expand deep transaction reports. Inspect bag types sold, units, active discounts, payment structures, and cashier signature. Trigger duplications instantly.",
          tipFr: "Pratique pour fournir un double de facture à un éleveur qui a égaré son reçu.",
          tipEn: "This allows you to quickly hand a second receipt copy to cooperative managers or farmers for their accounts."
        },
        {
          titleFr: "3. Annulation de Facture Errante (Void)",
          titleEn: "3. Voiding Incorrect Transactions",
          textFr: "En tant qu'administrateur, si une vente a été saisie par erreur, cliquez sur 'Annuler la transaction' dans les options. La facture passera au statut 'Annulée' et le système réinjectera automatiquement les sacs vendus dans le stock de la boutique concernée.",
          textEn: "As an Administrator, if a cashier makes an error, click 'Void' in the options drawer. The invoice turns to 'Void' status, and the stock quantities are returned to the boutique storage automatically.",
          tipFr: "Seul l'administrateur possède les droits de sécurité requis pour annuler des transactions et corriger la caisse.",
          tipEn: "Only users granted Administrator permissions have the authorization to perform transaction rollbacks."
        }
      ]
    },
    {
      id: 'accounting',
      icon: Calculator,
      titleFr: "Suivi des Charges & Recouvrements",
      titleEn: "Expenses & Credit Recoveries Ledger",
      descFr: "Maîtrisez vos charges d'exploitation et collectez les paiements des éleveurs débiteurs.",
      descEn: "Manage utility wages, rent bills, and process payments for animal feed credits.",
      steps: [
        {
          titleFr: "1. Enregistrement des Charges de Provenderie",
          titleEn: "1. Recording Farm Shop Expenses",
          textFr: "Enregistrez chaque dépense opérationnelle (achat de carburant pour groupe électrogène, électricité Eneo, loyer, salaire des manutentionnaires pour déchargement du maïs). Saisissez le montant, choisissez la catégorie correspondante et validez.",
          textEn: "Register operational expenses (diesel for the feed mixer generator, water/electricity utilities, store rent, manual loading wages). Input values, select a category, and save the transaction.",
          tipFr: "Saisir rigoureusement vos charges est crucial pour obtenir un calcul fiable de votre bénéfice net.",
          tipEn: "Keeping track of all expenses is vital to accurately monitor your net agricultural business profit."
        },
        {
          titleFr: "2. Suivi des Créances Éleveurs et Restes à Payer",
          titleEn: "2. Overseeing Outstanding Customer Credit",
          textFr: "Ouvrez la section 'Crédits Clients' pour visualiser la balance globale de dettes par éleveur. Vous y verrez d'un coup d'œil le montant de la dette actuelle de chaque client de votre provenderie.",
          textEn: "Access the 'Client Credits' tab to see a complete debtor roster. Review current outstanding balances and contact information for each local farmer at a glance.",
          tipFr: "Les éleveurs ayant des impayés importants sont marqués clairement pour suspendre l'attribution de nouveaux crédits d'aliments.",
          tipEn: "Farmers with heavy unpaid notes are clearly styled to prevent further feed bag allocations on credit."
        },
        {
          titleFr: "3. Enregistrement de Règlements de Dettes",
          titleEn: "3. Recording Debt Reimbursements",
          textFr: "Lorsqu'un éleveur vient rembourser sa dette (ex: après vente de sa bande de poulets de chair), cliquez sur 'Enregistrer un versement', tapez le montant versé, le mode de paiement et validez. La dette du client diminue et l'argent est injecté dans le tiroir-caisse.",
          textEn: "When a farmer comes to repay their credit (e.g., following broiler flock market sales), click 'Post Payment', enter the amount and validate. The student/farmer debt balances drop, and cash enters the active register.",
          tipFr: "Le système met automatiquement à jour l'historique de paiement du client pour éviter les litiges.",
          tipEn: "The database updates the client ledger instantly to guarantee dispute-free debt accounting."
        }
      ]
    },
    {
      id: 'employees',
      icon: Users,
      titleFr: "Personnel, Rôles & Sécurité",
      titleEn: "Staff list, Roles & Security Permissions",
      descFr: "Créez des fiches d'employés, configurez des codes de caisse (PIN) et limitez l'accès selon les rôles.",
      descEn: "Define user permissions, allocate cashier PIN keys, and enforce localized shop barriers.",
      steps: [
        {
          titleFr: "1. Création d'un Compte Collaborateur",
          titleEn: "1. Registering an Employee Profile",
          textFr: "Ajoutez un nouvel employé dans la base. Renseignez son nom complet, son numéro de téléphone, son adresse e-mail professionnelle ou personnelle et la boutique d'affectation par défaut.",
          textEn: "Add a new employee to your database. Record their full name, active cell phone number, email address, and default boutique location assignment.",
          tipFr: "Vous pouvez également ajouter les informations d'un contact d'urgence en bas de formulaire pour plus de sécurité.",
          tipEn: "You can also specify an emergency contact person and relationship at the bottom of the card for security."
        },
        {
          titleFr: "2. Attribution des Permissions par Rôles",
          titleEn: "2. Selecting Role Permission Templates",
          textFr: "Attribuez un rôle de sécurité standardisé : 'Admin' (Accès complet à tous les rapports, inventaires et paramètres), 'Vendeur' (Accès restreint à la Caisse POS, Facturation standard et Transferts simples) ou 'Magasinier' (Accès exclusif à l'inventaire et formules d'aliments).",
          textEn: "Assign standardized security permissions: 'Admin' (full platform clearance, analytics, settings), 'Vendeur/Cashier' (only checkout billing terminal, invoices ledger, transfers input), or 'Magasinier' (restricted stocks & recipe formulations views).",
          tipFr: "Les restrictions de rôles protègent les données comptables confidentielles de votre point de vente.",
          tipEn: "Enforcing role limits safeguards sensitive financial statistics and raw pricing data from unauthorized eyes."
        },
        {
          titleFr: "3. Configuration du code PIN de Connexion",
          titleEn: "3. Configuring 6-Digit PIN Codes",
          textFr: "Pour simplifier l'usage quotidien sans mot de passe fastidieux sur tablette de caisse, affectez un code PIN unique à 6 chiffres à chaque employé. Ce code lui permet de se connecter en un instant depuis l'écran de verrouillage.",
          textEn: "To simplify computer or tablet interactions for operators, configure a unique 6-digit login PIN. This allows cashiers to sign in securely and rapidly.",
          tipFr: "Veillez à ce que chaque employé garde son code secret pour maintenir la responsabilité de ses opérations de caisse.",
          tipEn: "Instruct employees to keep their PINs private since activities are audited under their user profile."
        },
        {
          titleFr: "4. Restriction Géographique par Boutique",
          titleEn: "4. Restricting Warehouse/Shop Access",
          textFr: "Si vous configurez la boutique d'affectation sur une boutique spécifique (ex: 'Boutique 2'), l'employé ne verra en caisse ou en stock que les articles géographiquement présents dans ce magasin. Il ne pourra pas interférer avec les ventes des autres points de vente.",
          textEn: "If an employee's location is targeted to a single shop (e.g., 'Boutique 2'), they can only look up inventory levels and make sales from that branch. They cannot view or modify items housed in other outlets.",
          tipFr: "Attribuez la valeur 'Toutes' uniquement aux gérants et administrateurs généraux du réseau de provenderies.",
          tipEn: "Assign the 'Toutes/All' location value only to store general managers or regional supervisors."
        }
      ]
    },
    {
      id: 'ai',
      icon: Bot,
      titleFr: "Assistant IA & Formulation",
      titleEn: "Agronomic AI Nutritionist Copilot",
      descFr: "Profitez d'un consultant vétérinaire de poche et optimisez vos recettes de provende.",
      descEn: "Access a pocket animal feed expert to adjust nutrition targets and reduce production expenses.",
      steps: [
        {
          titleFr: "1. Diagnostic Vétérinaire & Biosécurité",
          titleEn: "1. Biosecurity & Symptoms Diagnostics",
          textFr: "Posez des questions sur l'élevage au copilote IA. Décrivez avec précision les comportements observés chez les bêtes (ex: 'Symptômes de chute de ponte chez les pondeuses de 30 semaines') pour recevoir des plans de traitement d'hygiène.",
          textEn: "Ask animal health questions directly. Describe livestock symptoms or anomalies (e.g. drop in egg output in 35-week layers) to receive sanitary protocols, mineral supplements guidance, or biological prevention checklists.",
          tipFr: "L'IA vous guide également sur le respect du calendrier de vaccination des oiseaux.",
          tipEn: "The vet AI is highly competent in advising on immunization schedules for chickens or swine breeds."
        },
        {
          titleFr: "2. Formulation d'Aliments à Moindre Coût",
          titleEn: "2. Formulation and Feed Cost Optimization",
          textFr: "Utilisez l'intelligence artificielle pour concevoir vos recettes de démarrage, croissance ou finition. Demandez-lui d'équilibrer l'apport en Protéines Brutes, Calcium et Énergie Métabolisable en fonction des matières premières disponibles localement (maïs, tourteau de palmiste, concentrés).",
          textEn: "Use the Assistant to design custom recipes. Ask it to balance crude proteins, calcium rates, and energy values using locally sourced raw ingredients (yellow maize, soybean flour, cotton cakes, fishmeal).",
          tipFr: "Indiquez les prix locaux des matières premières pour que l'IA vous calcule le mélange le moins cher possible au kilo.",
          tipEn: "Input standard local ingredient cost rates so the AI computes alternative formulas to maximize savings per ton."
        }
      ]
    }
  ];

  const filteredFeatures = appFeatures.filter(f => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = isFr ? f.titleFr.toLowerCase() : f.titleEn.toLowerCase();
    const desc = isFr ? f.descFr.toLowerCase() : f.descEn.toLowerCase();
    return title.includes(query) || desc.includes(query);
  });

  const activeGuide = appFeatures.find(f => f.id === activeTab) || appFeatures[0];

  return (
    <div id="manual_user_guide" className="w-full h-full overflow-y-auto pr-1 space-y-8 animate-in fade-in duration-300 pb-20 px-4 md:px-0 max-w-7xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-6 pt-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md text-white">
            <Book className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-555 tracking-tight flex items-center gap-2">
              {isFr ? "Guide de l'Utilisateur" : "User Handbook"}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
                {isFr ? "Officiel" : "Official"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed font-semibold">
              {isFr 
                ? "Maîtrisez pas à pas le fonctionnement opérationnel complet de votre provenderie Smart Agro."
                : "Step-by-step master guide covering every single feature of the Smart Agro management panel."}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end text-left md:text-right shrink-0">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isFr ? "Procédures d'Exploitation Agricole" : "Shop Operating Standards"}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
              {isFr ? "Français (FR 🇫🇷)" : "English (EN 🇬🇧)"}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH AND NAVIGATION */}
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFr ? "Rechercher une fonctionnalité (ex: caisse, stock, variantes, IA)..." : "Search manual sections (e.g. checkout, stock, variants, AI)..."}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>

        {searchQuery ? (
          /* SEARCH RESULTS LAYOUT */
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-500 uppercase tracking-wider">
                {isFr ? `Résultats pour "${searchQuery}"` : `Results for "${searchQuery}"`}
              </h3>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-300 uppercase tracking-wider"
              >
                {isFr ? "Réinitialiser" : "Reset filter"}
              </button>
            </div>

            {filteredFeatures.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">{isFr ? "Aucun module ne correspond à votre recherche" : "No matching chapters found"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeatures.map((feat) => {
                  const FeatIcon = feat.icon;
                  return (
                    <button 
                      key={feat.id}
                      onClick={() => {
                        setActiveTab(feat.id);
                        setSearchQuery('');
                      }}
                      className="p-4 bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-950/40 dark:hover:bg-slate-950/60 text-left rounded-xl border border-slate-100 dark:border-slate-800/80 block w-full transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-emerald-600">
                          <FeatIcon className="w-4.5 h-4.5" />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                          {isFr ? feat.titleFr : feat.titleEn}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-semibold line-clamp-2">
                        {isFr ? feat.descFr : feat.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* SPLIT MULTI-VIEW BROWSER - PREMIUM INTERACTIVE MANUAL WORKFLOW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* TABS SIDEBAR / MENU LAYOUT */}
            <div className="lg:col-span-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800/80 pb-2 mb-2">
                {isFr ? "SOMMAIRE DU GUIDE" : "HANDBOOK CHAPTERS"}
              </div>
              {appFeatures.map((feat) => {
                const FeatIcon = feat.icon;
                const isActive = activeTab === feat.id;

                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveTab(feat.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border outline-none text-left ${
                      isActive 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-md font-black translate-x-1' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                        <FeatIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold tracking-wide uppercase">
                        {isFr ? feat.titleFr : feat.titleEn}
                      </span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 opacity-100 text-white' : 'opacity-0 text-slate-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* DETAILS ACCORDION BLOCK (STEP-BY-STEP FLOW) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* PRIMARY STEPS SHEET */}
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl text-emerald-600 shadow-sm border border-emerald-500/10 shrink-0">
                      {React.createElement(activeGuide.icon, { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-650 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        {isFr ? "Détails du Programme" : "Module Walkthrough"}
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight uppercase mt-0.5">
                        {isFr ? activeGuide.titleFr : activeGuide.titleEn}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                        {isFr ? activeGuide.descFr : activeGuide.descEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* STEPS TIMELINE WORKFLOW */}
                <div className="space-y-6 pt-2">
                  {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="relative pl-8 sm:pl-10 pb-2 border-l border-slate-100 dark:border-slate-800/80 last:border-0">
                      {/* Step Number Dot Icon */}
                      <span className="absolute -left-3.5 top-0.5 flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-900 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-full ring-4 ring-slate-100 dark:ring-slate-950/80 shadow-sm">
                        {idx + 1}
                      </span>
                      
                      <div className="space-y-1.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                          {isFr ? step.titleFr : step.titleEn}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
                          {isFr ? step.textFr : step.textEn}
                        </p>

                        {/* Optional PRO TIP Block */}
                        {(step.tipFr || step.tipEn) && (
                          <div className="mt-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">
                                {isFr ? "CONSEIL D'EXPERT" : "EXPERT PRO TIP"}
                              </div>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-450 leading-normal font-semibold">
                                {isFr ? step.tipFr : step.tipEn}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
