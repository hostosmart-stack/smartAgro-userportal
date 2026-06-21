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
  Bot
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface GuideProps {
  userRole?: string;
}

interface FeatureGuide {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  steps: {
    titleFr: string;
    titleEn: string;
    textFr: string;
    textEn: string;
  }[];
}

export const Guide: React.FC<GuideProps> = ({ userRole = 'Admin' }) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Exact real features present in the application
  const appFeatures: FeatureGuide[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      titleFr: "Tableau de Bord & Hub Agricole",
      titleEn: "Dashboard & Agricultural Hub",
      descFr: "Vue d'ensemble en temps réel des performances de votre provenderie.",
      descEn: "Real-time overhead snapshot of your livestock shop performance.",
      steps: [
        {
          titleFr: "Indicateurs Clés",
          titleEn: "Key Metrics",
          textFr: "Consultez le chiffre d'affaires quotidien des ventes, le nombre de transactions validées, les dépenses d'exploitation cumulées et le solde net de la caisse active.",
          textEn: "Inspect daily shop revenue, matched transaction counts, cumulated operational expenses, and active drawer net float."
        },
        {
          titleFr: "Le Hub d'Activités",
          titleEn: "The Activities Hub",
          textFr: "Basculez entre les catégories d'activités (Magasin, Facturation, Comptabilité, Administration) pour filtrer dynamiquement les options de votre menu latéral.",
          textEn: "Toggle between agricultural workspace divisions (Shop, Invoicing, Accounting, Administration) to instantly adapt your sidebar menu."
        },
        {
          titleFr: "Performance des Produits",
          titleEn: "Product Analytics",
          textFr: "Analysez le récapitulatif graphique complet des ventes pour ajuster l'approvisionnement de vos références les plus demandées.",
          textEn: "Analyze elegant product sales summary charts to adjust order volumes on high-demand stock items."
        }
      ]
    },
    {
      id: 'pos',
      icon: ShoppingCart,
      titleFr: "Caisse & Ventes (POS)",
      titleEn: "Counter Sales & POS",
      descFr: "Interface de vente rapide pour enregistrer les transactions de vos clients.",
      descEn: "Fast-selling terminal to checkout walk-in clients.",
      steps: [
        {
          titleFr: "Saisie du Panier",
          titleEn: "Cart Selection",
          textFr: "Cliquez sur les articles pour les ajouter au panier. Utilisez les contrôles '+' et '-' pour modifier les quantités ou entrez une remise personnalisée directement.",
          textEn: "Click products in the catalog to add them to the cart. Adjust counts with '+' and '-' buttons or apply unique checkout discounts."
        },
        {
          titleFr: "Types de Règlements",
          titleEn: "Payment Structures",
          textFr: "Sélectionnez le mode de règlement : Vente directe immédiate (Espèces / Mobile Money), Crédit Intégral (Dette) ou Paiement Partiel (Acompte avec solde à crédit).",
          textEn: "Configure billing logic: Direct instant cash checkout, Mobile money transfer, Full Customer Credit (Debt), or Partial payment (Down-payment + Credit balance)."
        },
        {
          titleFr: "Facturation Standard",
          titleEn: "Standard Invoicing",
          textFr: "Associez obligatoirement un client enregistré pour tout achat à crédit afin d'assurer un suivi comptable précis et de permettre les recouvrements futurs.",
          textEn: "Always select a registered customer profile for partial or full credit orders to guarantee precise invoice logging and future debt recovery."
        }
      ]
    },
    {
      id: 'inventory',
      icon: Package,
      titleFr: "Stock & Inventaire",
      titleEn: "Inventory & Storage",
      descFr: "Suivi rigoureux de vos sacs d'aliments et intrants agricoles.",
      descEn: "Accurate tracking of animal feed sacks and agronomic items.",
      steps: [
        {
          titleFr: "Gestion des Fiches",
          titleEn: "Product Sheets",
          textFr: "Enregistrez vos produits en spécifiant leur nom, prix d'achat gros, prix de vente détail, et boutique d'affectation physique correspondante.",
          textEn: "Register items with accurate references, purchase costs, wholesale prices, retail prices, and local store designations."
        },
        {
          titleFr: "Alertes de Stock Bas",
          titleEn: "Low-Stock Alerts",
          textFr: "Définissez un seuil d'alerte critique. L'application affiche automatiquement un témoin orange (stock faible) ou rouge (rupture) pour anticiper vos commandes de maïs ou soja.",
          textEn: "Assign a target warning threshold. The app automatically flags items in orange (low) or red (empty) to avoid unexpected shortages of poultry feed."
        },
        {
          titleFr: "Ajustements d'Écart",
          titleEn: "Inventory Adjustments",
          textFr: "En cas de perte, casse ou écart d'inventaire physique lors du comptage, utilisez la fonction 'Ajuster' pour corriger précisément la quantité directement en stock.",
          textEn: "If bags break or mismatch during physical counts, click 'Adjust' to realign software records with floor counts."
        }
      ]
    },
    {
      id: 'transfers',
      icon: ArrowRightLeft,
      titleFr: "Transferts de Stock",
      titleEn: "Inter-Shop Transfers",
      descFr: "Approvisionnez vos boutiques secondaires en toute sécurité depuis le dépôt central.",
      descEn: "Securely ship livestock products from depots to secondary outlets.",
      steps: [
        {
          titleFr: "Créer un Transfert",
          titleEn: "Create Transfer",
          textFr: "Sélectionnez le produit à transférer, déterminez le magasin d'origine doté du stock suffisant, ainsi que la boutique de destination.",
          textEn: "Select target products, locate the origin branch with active count, and choose the destination boutique."
        },
        {
          titleFr: "Mise à Jour Automatique",
          titleEn: "Automated Adjustments",
          textFr: "L'application soustrait instantanément les sacs de la boutique d'origine et les ajoute à la boutique destinataire au moment de la validation.",
          textEn: "The application automatically subtracts sacks from origin balances and appends them to destination balances after validation."
        },
        {
          titleFr: "Traçabilité Absolue",
          titleEn: "Complete Traceability",
          textFr: "Chaque transfert enregistre l'auteur du mouvement, assurant un historique transparent pour éliminer les pertes de marchandises entre dépôts.",
          textEn: "Every stock movement records the active operator's credentials, building a transparent historical audit log."
        }
      ]
    },
    {
      id: 'invoices',
      icon: FileText,
      titleFr: "Factures & Pièces Jointes",
      titleEn: "Invoices & Archives",
      descFr: "Historique universel et impression des justificatifs de commande.",
      descEn: "Universal ledger of transactions & printable order bills.",
      steps: [
        {
          titleFr: "Recherche et Filtres",
          titleEn: "Search & Filter",
          textFr: "Retrouvez n'importe quelle facture instantanément en saisissant le nom du client, le numéro de facture ou en filtrant par statut de règlement.",
          textEn: "Find specific transactions instantly by typing the buyer's name, document number, or filtering by payment status."
        },
        {
          titleFr: "Aperçu et Impression",
          titleEn: "Print Previews",
          textFr: "Affichez l'aperçu complet de chaque facture et imprimez-la de manière optimisée en format A4 classique ou en reçu de caisse thermique (80mm).",
          textEn: "Review validated checkout summaries and trigger native browser print layouts on conventional A4 sheets or mini receipts."
        },
        {
          titleFr: "Annulation de Transaction",
          titleEn: "Void Transactions",
          textFr: "En tant qu'administrateur, vous pouvez annuler une transaction erronée. Le système recréditera alors automatiquement le stock correspondant.",
          textEn: "Authorized administrators can void incorrect orders. The system automatically rolls back product counts to protect inventory."
        }
      ]
    },
    {
      id: 'accounting',
      icon: Calculator,
      titleFr: "Comptabilité & Crédits",
      titleEn: "Accounting & Credits",
      descFr: "Saisie des charges courantes et recouvrement des créances d'éleveurs.",
      descEn: "Overhead expense records and recovery of farmer balances.",
      steps: [
        {
          titleFr: "Enregistrement des Charges",
          titleEn: "Log Shop Expenses",
          textFr: "Enregistrez toutes vos charges d'exploitation (achat de carburant, électricité, salaires de manutention, loyer du magasin) pour calculer votre résultat net réel.",
          textEn: "Document daily expenses (generator fuel, electric meters, loading wages, shop space rent) to track clean net earnings."
        },
        {
          titleFr: "Recouvrement de Dettes",
          titleEn: "Credit Collections",
          textFr: "Consultez l'état d'endettement par éleveur. Enregistrez un versement total ou partiel de remboursement. L'encaissement met à jour la caisse réelle.",
          textEn: "View exact outstanding balances per farmer. Process full or partial debt repayments. Received cash directly increases active drawer totals."
        },
        {
          titleFr: "Suivi Budgétaire",
          titleEn: "Budget Monitoring",
          textFr: "Comparez vos rentrées brutes et vos sorties d'argent à l'aide des ventilations de dépenses par catégorie.",
          textEn: "Compare global cash inflows with outgoing expenses using visual category distribution charts."
        }
      ]
    },
    {
      id: 'employees',
      icon: Users,
      titleFr: "Gestion du Personnel",
      titleEn: "Employee Management",
      descFr: "Enregistrement de votre équipe et attribution des droits de sécurité.",
      descEn: "Staff list registration and custom security setup.",
      steps: [
        {
          titleFr: "Rôles et Droits",
          titleEn: "Role Security",
          textFr: "Définissez un rôle précis pour chaque collaborateur : Administrateur, Comptable ou Vendeur simple d'exploitation.",
          textEn: "Assign specific roles to your staff: Full Administrator, Office Accountant, or Restricted Sales Assistant."
        },
        {
          titleFr: "Codes PIN Personnels",
          titleEn: "6-Digit Terminal PINs",
          textFr: "Attribuez un code PIN unique à 6 chiffres à chaque employé. Ce code remplace l'e-mail traditionnel afin de simplifier la connexion hors-ligne.",
          textEn: "Configure a unique 6-digit PIN code for every employee, replacing complex email forms for swift offline-friendly login."
        },
        {
          titleFr: "Strict Rationnement",
          titleEn: "Shop Localization",
          textFr: "Associez chaque vendeur à sa boutique géographique. Il ne verra et ne pourra manipuler que le stock disponible de sa boutique attribuée.",
          textEn: "Link sales staff strictly to their designated store location. They can only check out items physically allocated to their workspace."
        }
      ]
    },
    {
      id: 'ai',
      icon: Bot,
      titleFr: "Assistant IA Expert",
      titleEn: "Expert AI Copilot",
      descFr: "Conseil vétérinaire autonome et optimisation de fabrication d'aliments.",
      descEn: "On-demand veterinary advice and feed formula optimizations.",
      steps: [
        {
          titleFr: "Formulation Précise",
          titleEn: "Feed Optimization",
          textFr: "Demandez à l'IA d'adapter les ratios de protéines brutes, de maïs ou de soja pour vos poulets de chair ou poules pondeuses selon les matières premières locales.",
          textEn: "Ask the AI to recalculate protein targets or replace scarce raw ingredients (like soy) with affordable, nutrient-rich solutions."
        },
        {
          titleFr: "Symptômes Vétérinaires",
          titleEn: "Veterinary Support",
          textFr: "Décrivez les symptômes observés dans votre poulailler (ex: baisse de ponte, fatigue) pour recevoir des recommandations d'hygiène ou d'ajustement diététique.",
          textEn: "Explain physical animal symptoms in detail to receive instant hygiene checklists, biosecurity plans, and custom mineral dosage advice."
        },
        {
          titleFr: "Mélanges Economiques",
          titleEn: "Cost-Friendly Blends",
          textFr: "Obtenez des conseils agronomiques précis pour réduire le coût de production de vos provendes sans compromettre le taux de ponte ou la croissance des bêtes.",
          textEn: "Get certified agronomic tips to minimize manufacturing costs of feed without affecting livestock growth or egg lay rates."
        }
      ]
    }
  ];

  // Verified real operational FAQs
  const faqItems = [
    {
      qFr: "Comment corriger un stock erroné ?",
      qEn: "How do I fix a mismatch in product stock levels?",
      aFr: "Pour préserver votre flux de travail, la caisse POS autorise les ventes même si le stock affiche zéro. Pour rétablir les vraies valeurs mesurées en rayon, un administrateur doit aller sur l'onglet Inventaire, sélectionner le produit concerné, cliquer sur 'Ajuster' et saisir le décompte réel mesuré sur les étagères.",
      aEn: "To keep transaction lines moving at peak hours, the POS registers sales even if system stock shows zero. To resolve this, an Admin can head to the Inventory tab, click 'Adjust' on the corresponding item, and input the actual physical count on shelves."
    },
    {
      qFr: "Pourquoi certaines ventes n'apparaissent-elles pas dans le tiroir-caisse du jour ?",
      qEn: "Why do some transactions not increase today's cash balance?",
      aFr: "Si vous validez une facture entièrement 'À Crédit', aucun flux physique n'entre immédiatement en caisse. La transaction augmente uniquement le compte client. La caisse ne sera créditée que lorsque le paiement du crédit sera saisi dans Comptabilité > Versement Crédit Client.",
      aEn: "When registering a 100% credit invoice, no physical cash enters your drawer. The transaction increases client receivables. The register updates only when a credit payment is actively posted in Accounting > Debt Reimbursements."
    },
    {
      qFr: "Comment réinitialiser le mot de passe ou code PIN d'un vendeur ?",
      qEn: "How do I reset a seller's password or terminal PIN?",
      aFr: "Pour simplifier l'utilisation hors-ligne, les employés se connectent exclusivement à l'aide de leur nom et de leur code PIN à 6 chiffres. Un gérant ou Administrateur général peut ouvrir l'onglet Personnel (Employees), modifier la fiche de l'employé et saisir un nouveau code PIN ou mot de passe temporaire.",
      aEn: "For easy offline validation, staff sign in using only their name and custom 6-digit PIN. An Administrator can access the Personnel (Employees) list, click edit on the staff profile, and overwrite the active passcode or password."
    },
    {
      qFr: "Comment configurer l'impression de reçus sur imprimante thermique standard ?",
      qEn: "How do I optimize receipt prints on narrow thermal printers?",
      aFr: "L'impression utilise les options système de votre navigateur web. Lorsque l'aperçu avant impression s'ouvre, cliquez sur 'Plus de paramètres', réglez le format sur '80mm' (ou adapté), décochez l'option d'impression 'En-têtes et pieds de page' et assurez-vous que l'échelle est configurée sur 'Adapter au papier' pour un résultat net.",
      aEn: "Receipt layouts run natively through your web browser's print engine. When the pop-up triggers, click 'More Settings', select the paper width (e.g. 80mm or receipt roll), check that scale is set to fit margins, and untick 'headers and footers' for clean results."
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-505 to-emerald-600 bg-emerald-600 rounded-2xl shadow-sm text-white">
            <Book className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2">
              {isFr ? "Guide de l'Utilisateur" : "User Handbook"}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
                {isFr ? "Officiel" : "Official Guide"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed font-semibold">
              {isFr 
                ? "Découvrez comment naviguer et maîtriser l'ensemble des modules d'exploitation de votre application Smart Agro."
                : "Explore how to easily navigate, operate, and master all workspaces configured inside Smart Agro."}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end text-left md:text-right shrink-0">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isFr ? "Assistance & Procédures de Caisse" : "Standard Cashier Procedures"}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
              {isFr ? "Français (FR 🇫🇷)" : "English (EN 🇬🇧)"}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH AND DIRECT NAVIGATION */}
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isFr ? "Saisissez un module (ex: caisse, stock, employé)..." : "Search a workspace (e.g. checkout, stock, pin)..."}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>

        {searchQuery ? (
          /* SEARCH RESULTS LAYOUT */
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-550 uppercase tracking-wider">
                {isFr ? `Résultats pour "${searchQuery}"` : `Results for "${searchQuery}"`}
              </h3>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] font-black text-emerald-650 hover:text-emerald-800 dark:hover:text-emerald-300 uppercase tracking-wider"
              >
                {isFr ? "Effacer" : "Clear search"}
              </button>
            </div>

            {filteredFeatures.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">{isFr ? "Aucun module ne correspond à votre recherche" : "No matching feature folders found"}</p>
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
          /* SPLIT MULTI-VIEW BROWSER */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* TABS SIDEBAR */}
            <div className="lg:col-span-3 space-y-2">
              {appFeatures.map((feat) => {
                const FeatIcon = feat.icon;
                const isActive = activeTab === feat.id;

                return (
                  <button
                    key={feat.id}
                    onClick={() => setActiveTab(feat.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border outline-none font-bold text-xs uppercase tracking-wider text-left ${
                      isActive 
                        ? 'bg-gradient-to-r from-slate-900 to-slate-800 dark:from-emerald-950 dark:to-teal-900/60 text-white border-transparent shadow-sm font-black translate-x-1' 
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FeatIcon className={`w-4.5 h-4.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{isFr ? feat.titleFr : feat.titleEn}</span>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5 opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>

            {/* DETAILS ACCORDION BLOCK */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* PRIMARY STEPS SHEET */}
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-950 rounded-xl text-emerald-600">
                      {React.createElement(activeGuide.icon, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-50 tracking-tight uppercase">
                        {isFr ? activeGuide.titleFr : activeGuide.titleEn}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold leading-relaxed">
                        {isFr ? activeGuide.descFr : activeGuide.descEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* STEPS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="space-y-2 relative p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/10">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                          {isFr ? step.titleFr : step.titleEn}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                        {isFr ? step.textFr : step.textEn}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* REFINED SYSTEM FAQS */}
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                      {isFr ? "Foires Aux Questions de Boutique" : "Cashier Q&A Desk"}
                    </h3>
                    <p className="text-[10px] text-slate-550 dark:text-slate-450 font-semibold">
                      {isFr ? "Procédures immédiates pour résoudre les anomalies d'inventaires et réglages de tickets." : "Standard administrative solutions for day-to-day work concerns."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {faqItems.map((faq, idx) => {
                    const isExpanded = expandedFAQ === idx;
                    return (
                      <div 
                        key={idx}
                        className="border border-slate-200/50 dark:border-slate-800/60 rounded-xl overflow-hidden transition-all duration-200 bg-white dark:bg-slate-950/20"
                      >
                        <button
                          onClick={() => setExpandedFAQ(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-150/40 dark:hover:bg-slate-950/60 text-left outline-none transition-colors"
                        >
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 pr-4 leading-normal">
                            {isFr ? faq.qFr : faq.qEn}
                          </h4>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold animate-in slide-in-from-top-2 duration-200">
                            {isFr ? faq.aFr : faq.aEn}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
