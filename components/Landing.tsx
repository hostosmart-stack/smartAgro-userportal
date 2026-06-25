import React, { useState } from 'react';
import { 
  Leaf, 
  CheckCircle2, 
  BarChart3, 
  ShieldCheck, 
  X,
  Sparkles,
  Globe,
  ChevronRight,
  TrendingUp,
  Award,
  Smartphone,
  Activity,
  Zap,
  Layers,
  Store,
  Users
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
  onLoginClick: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLoginClick }) => {
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'security' | null>(null);
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 font-sans selection:bg-farm-500 selection:text-white overflow-x-hidden">
      
      {/* 1. Header & Navigation */}
      <div className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto shrink-0">
        <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-150/20 dark:border-slate-800/80 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] py-3 px-4 sm:px-6 md:px-8 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-farm-600 to-emerald-700 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-sm">
               <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black text-gray-950 tracking-tight leading-none">Smart Agro</span>
              <span className="text-[8px] sm:text-[9px] font-bold text-farm-600 uppercase tracking-widest mt-0.5 sm:mt-1">
                {language === 'fr' ? 'Gestion Agricole & Provenderie' : 'Feed Mill & Farm Management'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Minimalist Language Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[9px] sm:text-[10px]">
              <button 
                onClick={() => setLanguage('fr')} 
                className={`px-2 py-1 rounded font-black transition-all ${language === 'fr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                FR
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-2 py-1 rounded font-black transition-all ${language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                EN
              </button>
            </div>

            <button 
              onClick={onLoginClick}
              className="px-3.5 sm:px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm cursor-pointer"
            >
              {language === 'fr' ? 'Système' : 'System Access'}
            </button>
          </div>
        </nav>
      </div>

      {/* 2. Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
         {/* Cozy ambient gradient shapes behind */}
         <div className="absolute top-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-tr from-farm-500/5 to-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10"></div>
         
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-left">
            
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
               <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-farm-50 border border-farm-100 text-farm-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-farm-600" />
                  <span>{language === 'fr' ? 'Plateforme Professionnelle Intégrée' : 'Integrated Enterprise Grade Platform'}</span>
               </div>
               
               <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-slate-950 leading-[1.1] tracking-tight">
                  {language === 'fr' ? 'Simplifiez la gestion de votre' : 'Streamline the Management of Your'} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-farm-600 via-emerald-600 to-emerald-800">
                    {language === 'fr' ? 'provenderie et boutique' : 'Feed Mill & Agri-Store'}
                  </span>
               </h1>
               
               <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl font-medium">
                  {language === 'fr' 
                    ? "La solution tout-en-un conçue pour piloter sereinement les stocks de vos matières premières, vos recettes de nutrition animale, vos ventes en caisse enregistreuse et vos employés."
                    : "The all-in-one software blueprint architected to track your raw ingredient stocks, configure safe feed recipes, reconcile point of sale cash drawers, and orchestrate employee logs."}
               </p>
               
               <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                     onClick={onLoginClick}
                     className="px-5 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-farm-600 to-emerald-600 hover:from-farm-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                     <span>{language === 'fr' ? 'Accéder à la plateforme' : 'Launch System Dashboard'}</span>
                     <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 font-bold text-[10px] sm:text-xs bg-white/60 p-2.5 sm:p-3 rounded-xl border border-gray-150">
                     <Globe className="w-4 h-4 text-emerald-600" />
                     <span>{language === 'fr' ? 'Fonctionne en ligne & hors-ligne' : 'Works online & offline'}</span>
                  </div>
               </div>
               
               {/* Minimal Highlights Grid */}
               <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 max-w-lg">
                  <div>
                     <p className="text-xl sm:text-2xl font-black text-slate-900">35%</p>
                     <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                       {language === 'fr' ? 'Moins de pertes' : 'Waste Reduction'}
                     </p>
                  </div>
                  <div>
                     <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
                     <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                       {language === 'fr' ? 'Sécurisé' : 'Data Security'}
                     </p>
                  </div>
                  <div>
                     <p className="text-xl sm:text-2xl font-black text-slate-900">1-Clic</p>
                     <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                       {language === 'fr' ? 'Facturation' : 'Instant Bills'}
                     </p>
                  </div>
               </div>
            </div>

            {/* Right Side: 4 Premium Animal Pillars Grid */}
            <div className="lg:col-span-5 w-full">
               <div className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 text-left relative overflow-hidden shadow-2xl">
                  {/* Glass layout background pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-5 relative z-10">
                     <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                        {language === 'fr' ? 'Élevages Pris en Charge' : 'Supported Livestock'}
                     </span>
                     <span className="bg-farm-500/10 text-farm-400 border border-farm-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Rations 100% OK
                     </span>
                  </div>

                  {/* 2x2 Grid of premium photos */}
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                     {/* 1. Fish */}
                     <div className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-800 bg-slate-950 transition-all hover:scale-[1.03] hover:border-farm-500 shadow-md">
                        <img 
                           src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=400" 
                           alt="Fish"
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                           <span className="text-[8px] font-black tracking-widest text-farm-400 uppercase bg-farm-950/80 px-2 py-0.5 rounded border border-farm-900/30">
                              {language === 'fr' ? 'Pisciculture' : 'Aquaculture'}
                           </span>
                           <h4 className="text-[11px] font-black text-white uppercase tracking-wider mt-1 truncate">
                              {language === 'fr' ? 'Poisson & Alvins' : 'Fish & Fingerlings'}
                           </h4>
                        </div>
                     </div>

                     {/* 2. Fowl */}
                     <div className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-800 bg-slate-950 transition-all hover:scale-[1.03] hover:border-farm-500 shadow-md">
                        <img 
                           src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=400" 
                           alt="Fowl"
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                           <span className="text-[8px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/30">
                              {language === 'fr' ? 'Aviculture' : 'Poultry'}
                           </span>
                           <h4 className="text-[11px] font-black text-white uppercase tracking-wider mt-1 truncate">
                              {language === 'fr' ? 'Pondeuses & Poules' : 'Layers & Broilers'}
                           </h4>
                        </div>
                     </div>

                     {/* 3. Rabbit */}
                     <div className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-800 bg-slate-950 transition-all hover:scale-[1.03] hover:border-farm-500 shadow-md">
                        <img 
                           src="https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=400" 
                           alt="Rabbit"
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                           <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900/30">
                              {language === 'fr' ? 'Cuniculture' : 'Cuniculture'}
                           </span>
                           <h4 className="text-[11px] font-black text-white uppercase tracking-wider mt-1 truncate">
                              {language === 'fr' ? 'Lapereaux & Adultes' : 'Rabbits & Breeding'}
                           </h4>
                        </div>
                     </div>

                     {/* 4. Pig */}
                     <div className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-800 bg-slate-950 transition-all hover:scale-[1.03] hover:border-farm-500 shadow-md">
                        <img 
                           src="https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=400" 
                           alt="Pig"
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                           <span className="text-[8px] font-black tracking-widest text-[#38bdf8] uppercase bg-[#082f49]/80 px-2 py-0.5 rounded border border-[#0369a1]/30">
                              {language === 'fr' ? 'Porciculture' : 'Pig Breeding'}
                           </span>
                           <h4 className="text-[11px] font-black text-white uppercase tracking-wider mt-1 truncate">
                              {language === 'fr' ? 'Porcs & Porcelets' : 'Pigs & Piglets'}
                           </h4>
                        </div>
                     </div>
                  </div>

                  {/* Footnote */}
                  <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest text-center pt-4 border-t border-slate-850 mt-4 relative z-10">
                     {language === 'fr' ? 'Formules de nutrition adaptées aux normes tropicales' : 'Optimized for Sub-Saharan Husbandry Constraints'}
                  </p>
               </div>
            </div>

         </div>
      </section>

      {/* 3. Core Operational Advantages Block */}
      <section className="bg-white py-16 sm:py-20 border-y border-gray-150/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            
            <div className="max-w-3xl mx-auto space-y-4">
               <div className="inline-flex items-center gap-1 bg-[#FAF9F5] border border-farm-200/50 text-farm-700 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">
                  <Award className="w-3.5 h-3.5" />
                  {language === 'fr' ? 'Pourquoi choisir Smart Agro ?' : 'Proven Business Advantages'}
               </div>
               <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {language === 'fr' ? 'Une maîtrise totale de votre commerce agricole' : 'Rigorous Controls For High Performance'}
               </h2>
               <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base leading-relaxed">
                  {language === 'fr'
                    ? "Finis les erreurs d'inventaire, le gaspillage de matières premières et la confusion en caisse. Gérez tout au même endroit."
                    : "No more inventory discrepancies, raw material wastes, or cash point calculation mistakes. Orchestrate everything in one secure hub."}
               </p>
            </div>

            {/* Grid of Advantages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
               
               {/* Advantage Item 1 */}
               <div className="p-5 sm:p-6 bg-[#FAF9F5] border border-gray-150/65 rounded-2xl hover:shadow-lg transition-all space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-farm-100 flex items-center justify-center text-farm-600">
                     <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950">
                     {language === 'fr' ? 'Gestion de Stock en Sacs et Silos' : 'Precision Silo & Bag Inventory'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                     {language === 'fr' 
                       ? "Suivez vos céréales (maïs, son, soja, prémix) au kilogramme près, recevez des alertes automatiques et évitez les ruptures de fabrication."
                       : "Monitor cereal, soy, and supplement stocks to the single kilogram block. Tap alerts to keep your mill fabrication loops active without interruption."}
                  </p>
               </div>

               {/* Advantage Item 2 */}
               <div className="p-5 sm:p-6 bg-[#FAF9F5] border border-gray-150/65 rounded-2xl hover:shadow-lg transition-all space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] flex items-center justify-center text-blue-600">
                     <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950">
                     {language === 'fr' ? 'Formules de Ration Optimisées' : 'Optimized Rations Formulas'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                     {language === 'fr' 
                       ? "Enregistrez vos recettes nutritionnelles pour porcs, volailles ou bétail. Ajustez les proportions d'acides aminés et de protéines."
                       : "Establish bio-nutritional food recipes for pigs, layers, and broilers. Safeguard crude protein constraints on local, economic feeds."}
                  </p>
               </div>

               {/* Advantage Item 3 */}
               <div className="p-5 sm:p-6 bg-[#FAF9F5] border border-gray-150/65 rounded-2xl hover:shadow-lg transition-all space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center text-amber-600">
                     <Store className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950">
                     {language === 'fr' ? 'Caisse & Ventes Multi-Points' : 'Fast POS & Multi-Store Ledger'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                     {language === 'fr' 
                       ? "Vendez vos sacs d'aliment et prémix rapidement. Enregistrez les règlements des clients, suivez et contrôlez les dettes."
                       : "Process physical bag payments off-grid in remote outposts. Track client micro-credits, deposits, and outstanding debts smoothly."}
                  </p>
               </div>

               {/* Advantage Item 4 */}
               <div className="p-5 sm:p-6 bg-[#FAF9F5] border border-gray-150/65 rounded-2xl hover:shadow-lg transition-all space-y-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-950">
                     {language === 'fr' ? 'Contrôle des Employés & Caisses' : 'Employee Access Controls'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                     {language === 'fr' 
                       ? "Affectez vos caissiers ou magasiniers à une boutique spécifique. Accordez des permissions d'action restreintes et sécurisées."
                       : "Pin cashier personnel to explicit brick-and-mortar depots. Grant roles with clean limits on inventory or financial tools."}
                  </p>
               </div>

            </div>

         </div>
      </section>



      {/* 5. Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] sm:text-xs text-slate-400">
              <p className="font-semibold">© {new Date().getFullYear()} Smart Agro. {t('landing.rights')}</p>
              <div className="flex gap-6 font-bold uppercase tracking-wider text-[10px]">
                  <button onClick={() => setActivePolicy('privacy')} className="hover:text-farm-400 transition-colors">{t('landing.privacy')}</button>
                  <button onClick={() => setActivePolicy('terms')} className="hover:text-farm-400 transition-colors">{t('landing.terms')}</button>
                  <button onClick={() => setActivePolicy('security')} className="hover:text-farm-400 transition-colors">{t('landing.security')}</button>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-8 p-6 bg-slate-950/60 rounded-2xl border border-slate-850/60 text-[10px] text-slate-500 leading-relaxed text-justify">
              <p>
                  <strong>{t('landing.decl_title')}</strong> {t('landing.decl_text')}
              </p>
          </div>
      </footer>

      {/* Policy Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white text-slate-800 rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-farm-100 flex items-center justify-center text-farm-600 shadow-inner shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-955 tracking-tight font-display">
                                {activePolicy === 'privacy' && t('landing.privacy_title')}
                                {activePolicy === 'terms' && t('landing.terms_title')}
                                {activePolicy === 'security' && t('landing.security_title')}
                            </h3>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5 tracking-widest">Smart Agro</p>
                        </div>
                    </div>
                    <button onClick={() => setActivePolicy(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-700" />
                    </button>
                </div>
                <div className="p-6 text-xs sm:text-sm text-gray-600 leading-relaxed bg-white overflow-y-auto max-h-[60vh]">
                    {activePolicy === 'privacy' && (
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs mb-2">1</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.p1_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.p1_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs mb-2">2</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.p2_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.p2_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs mb-2">3</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.p3_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.p3_desc')}</p>
                            </div>
                        </div>
                    )}
                    {activePolicy === 'terms' && (
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xs mb-2">1</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.t1_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.t1_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs mb-2">2</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.t2_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.t2_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs mb-2">3</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.t3_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.t3_desc')}</p>
                            </div>
                        </div>
                    )}
                    {activePolicy === 'security' && (
                        <div className="grid md:grid-cols-3 gap-6 text-left">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs mb-2">1</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.s1_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.s1_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs mb-2">2</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.s2_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.s2_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold text-xs mb-2">3</div>
                                <h4 className="text-sm font-bold text-gray-900">{t('landing.s3_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.s3_desc')}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end items-center gap-4">
                    <p className="text-[10px] text-slate-400 font-medium mr-auto hidden sm:block">
                      {t('landing.last_update')} : {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <button onClick={() => setActivePolicy(null)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all active:scale-95">
                      {t('landing.understood_close')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
