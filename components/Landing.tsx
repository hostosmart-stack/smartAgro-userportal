import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Leaf, 
  BarChart3, 
  ShieldCheck, 
  X,
  Zap,
  ChevronRight,
  Globe,
  Clock,
  Sparkles,
  Award,
  DollarSign,
  TrendingUp,
  Flame,
  Scale,
  Brain,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
  onLoginClick: () => void;
}

interface IngredientDetails {
  protein: string;
  energy: string;
  roleFr: string;
  roleEn: string;
  icon: string;
  cost: number;
}

export const Landing: React.FC<LandingProps> = ({ onLoginClick }) => {
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'security' | null>(null);
  const { t, language, setLanguage } = useLanguage();

  // Mini formulation simulator states
  const [maisRatio, setMaisRatio] = useState<number>(55);
  const [sojaRatio, setSojaRatio] = useState<number>(30);
  const concentreRatio = Math.max(0, 100 - maisRatio - sojaRatio);

  const proteinLevel = parseFloat(((maisRatio * 8.5 + sojaRatio * 44 + concentreRatio * 35) / 100).toFixed(1));
  const energyLevel = Math.round((maisRatio * 3300 + sojaRatio * 2230 + concentreRatio * 1900) / 100);
  // realistic local cost per kg (FCFA)
  const costPerKg = Math.round((maisRatio * 190 + sojaRatio * 420 + concentreRatio * 780) / 100);

  // ROI Calculator State (Tons of feed per month)
  const [targetTons, setTargetTons] = useState<number>(5);

  // Selected Ingredient Detail State
  const [selectedIngredient, setSelectedIngredient] = useState<string>('mais');

  const ingredientsDb: Record<string, IngredientDetails> = {
    mais: {
      protein: '8.5 %',
      energy: '3,300 kcal/kg',
      roleFr: 'Matière première de base en Afrique centrale et de l’Ouest. Apporte l’énergie essentielle métabolisable pour la croissance rapide.',
      roleEn: 'Primary basal energy source in Sub-Saharan Africa. Provides metabolizable energy crucial for fast muscle accretion.',
      icon: '🌽',
      cost: 190
    },
    soja: {
      protein: '44.0 %',
      energy: '2,230 kcal/kg',
      roleFr: 'Riche en acides aminés indispensables (lysine, méthionine). Indispensable au développement du tissu musculaire et squelettique.',
      roleEn: 'Exceptional structural protein payload. Rich in limiting essential amino acids (lysine, methionine) for bodyweight.',
      icon: '🌱',
      cost: 420
    },
    concentre: {
      protein: '35.0 %',
      energy: '1,900 kcal/kg',
      roleFr: 'Mélange hyper-concentré complexe de minéraux, vitamines, fer, calcium et oligo-éléments pour sécuriser le métabolisme.',
      roleEn: 'High-density micro-nutrient balancer. Packed with calcium, bio-available phosphorus, vitamins, and critical trace minerals.',
      icon: '🧪',
      cost: 780
    },
    ble: {
      protein: '15.0 %',
      energy: '1,800 kcal/kg',
      roleFr: 'Apporte du lest et des fibres digestives. Idéal pour optimiser le transit intestinal et régulariser le rythme de ponte des poules.',
      roleEn: 'Invaluable dietary fiber regulator. Boosts digestive micro-flora safety and provides consistent layer productivity.',
      icon: '🌾',
      cost: 160
    },
    poisson: {
      protein: '65.0 %',
      energy: '2,800 kcal/kg',
      roleFr: 'Protéine hautement digestible très haut de gamme. Utilisée dans les formules prémix de démarrage (0-14 jours) pour les poussins.',
      roleEn: 'Premium grade animal protein source. Maximizes start-up growth indexes and immune protection in early broilers.',
      icon: '🐟',
      cost: 850
    }
  };

  // Determine ideal formulation output
  const getRecommendation = () => {
    if (proteinLevel < 15.5) {
      return language === 'fr' ? "Aliment Finition poulet" : "Broiler Finisher Feed";
    } else if (proteinLevel >= 15.5 && proteinLevel < 19) {
      return language === 'fr' ? "Aliment Croissance & Ponte" : "Layer / Grower Feed";
    } else {
      return language === 'fr' ? "Aliment Démarrage (Starter)" : "Pre-Starter Feed";
    }
  };

  // Commercial feed vs Self-made Feed calculations:
  // Buying commercial bag is approx 18,000 FCFA per 50kg bag -> 360,000 FCFA per ton
  // Self made with optimal recipe with Smart Agro is approx 11,500 FCFA per bag -> 230,000 FCFA per ton
  // Savings: 130,000 FCFA / ton
  const commercialCost = targetTons * 360000;
  const selfMadeCost = targetTons * 230000;
  const savingsAmount = commercialCost - selfMadeCost;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 font-sans selection:bg-farm-500 selection:text-white overflow-x-hidden">
      
      {/* 1. Navbar */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-gray-100/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-farm-600 to-emerald-700 p-2.5 rounded-2xl shadow-md shadow-farm-600/10">
               <Leaf className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-black text-gray-900 tracking-tight leading-none">Smart Agro</span>
              <span className="text-[9px] font-bold text-farm-600 uppercase tracking-widest mt-0.5">{language === 'fr' ? 'La ration parfaite' : 'Next-gen rations'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant Language Switcher */}
            <div className="flex items-center bg-gray-100/80 p-0.5 rounded-xl border border-gray-200/50 text-[10px]">
              <button 
                onClick={() => setLanguage('fr')} 
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black transition-all ${language === 'fr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span>🇫🇷</span> <span>FR</span>
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-black transition-all ${language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span>🇬🇧</span> <span>EN</span>
              </button>
            </div>

            <button 
              onClick={onLoginClick}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] shadow-md shadow-slate-900/10"
            >
              {t('landing.connexion_admin')}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Header Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
         {/* Premium color ambient glows */}
         <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-gradient-to-tr from-farm-500/10 via-emerald-500/5 to-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
         <div className="absolute bottom-10 left-10 w-[250px] h-[250px] bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent rounded-full blur-[80px] pointer-events-none -z-10"></div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Promo Text Column */}
            <div className="lg:col-span-7 space-y-8 text-left">
               <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-farm-50 border border-farm-100/70 text-farm-700 text-xs font-black uppercase tracking-wider animate-bounce-slow">
                  <Sparkles className="w-3.5 h-3.5 text-farm-600" />
                  <span>{language === 'fr' ? 'Élevage intelligent & Formulation locale' : 'Smart Husbandry & On-site Mixing'}</span>
               </div>
               
               <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight font-display">
                  {language === 'fr' ? 'Prenez le contrôle' : 'Seize Full Control'} <br />
                  {language === 'fr' ? 'de votre' : 'Of Your'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-farm-600 via-emerald-600 to-blue-600">{language === 'fr' ? 'provenderie' : 'Feed Mill'}</span>
               </h1>
               
               <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl font-medium">
                  {language === 'fr' 
                    ? "Formulez des aliments équilibrés et performants à moindre coût, gérez vos points de vente et suivez vos stocks de matières premières en temps réel."
                    : "Formulate balanced, high-efficiency animal feeds at low cost, manage cash points, and monitor raw material stocks instantly with precision."}
               </p>
               
               <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                     onClick={onLoginClick}
                     className="px-6 py-4 bg-gradient-to-r from-farm-600 to-emerald-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider hover:from-farm-700 hover:to-emerald-700 transition-all shadow-lg shadow-farm-200/80 hover:shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
                  >
                     <span>{t('landing.start_now')}</span>
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-center sm:justify-start gap-2.5 text-slate-550 font-bold text-xs bg-white/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-gray-150/40">
                     <Globe className="w-4 h-4 text-emerald-600" />
                     <span>{language === 'fr' ? 'Base locale résiliente (Hors-ligne)' : 'Offline Resilient Core Sync'}</span>
                  </div>
               </div>
               
               {/* High-end numeric KPIs */}
               <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-150/40 max-w-md">
                  <div>
                     <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">35%</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{language === 'fr' ? 'Économies / sac' : 'Cost Reduction / bag'}</p>
                  </div>
                  <div>
                     <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">100%</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{language === 'fr' ? 'Autonomie' : 'Independency'}</p>
                  </div>
                  <div>
                     <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">Zero</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">{language === 'fr' ? 'Pertes d\'infos' : 'Data Leaks'}</p>
                  </div>
               </div>
            </div>

            {/* Right Column: Premium Active Formulation Simulator */}
            <div className="lg:col-span-5 w-full">
               <div className="bg-slate-950 border border-slate-900 rounded-[2rem] shadow-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
                  {/* Glass layout background pattern */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  
                  {/* Emulator Header */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4 relative z-10">
                     <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-mono text-slate-500 ml-2">nutri_sandbox.py</span>
                     </div>
                     <span className="bg-farm-500/10 text-farm-400 border border-farm-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {language === 'fr' ? 'Mélangeur en direct' : 'Live Mix Simulator'}
                     </span>
                  </div>

                  {/* Dynamic Sliders Content */}
                  <div className="my-5 space-y-5 text-left relative z-10">
                     <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{language === 'fr' ? 'Proportions de fabrication' : 'Raw Mix Feedstock %'}</span>
                           <span className="text-[10px] font-bold text-farm-400 bg-farm-500/10 px-2 py-0.5 rounded">Ration: 100%</span>
                        </div>

                        <div className="space-y-4">
                           {/* Maïs */}
                           <div>
                              <div className="flex justify-between text-xs font-bold text-slate-350 mb-1">
                                 <span>🌽 {language === 'fr' ? 'Maïs jaune (Énergie)' : 'Yellow Corn (Energy)'}</span>
                                 <span className="text-farm-450 font-mono font-bold">{maisRatio}%</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="30" 
                                 max="80" 
                                 value={maisRatio}
                                 onChange={(e) => {
                                    const nextVal = parseInt(e.target.value);
                                    if (nextVal + sojaRatio <= 100) {
                                       setMaisRatio(nextVal);
                                    } else {
                                       setMaisRatio(nextVal);
                                       setSojaRatio(100 - nextVal);
                                    }
                                 }}
                                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-farm-500"
                              />
                           </div>

                           {/* Soja */}
                           <div>
                              <div className="flex justify-between text-xs font-bold text-slate-350 mb-1">
                                 <span>🌱 {language === 'fr' ? 'Tourteau de Soja (Mat. Azotées)' : 'Soya Cake (Protein Payload)'}</span>
                                 <span className="text-emerald-450 font-mono font-bold">{sojaRatio}%</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="10" 
                                 max="45" 
                                 value={sojaRatio}
                                 onChange={(e) => {
                                    const nextVal = parseInt(e.target.value);
                                    if (maisRatio + nextVal <= 100) {
                                       setSojaRatio(nextVal);
                                    } else {
                                       setSojaRatio(nextVal);
                                       setMaisRatio(100 - nextVal);
                                    }
                                 }}
                                 className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                           </div>

                           {/* Concentrate */}
                           <div className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50">
                              <span className="text-xs text-slate-450 flex items-center gap-1.5">🧪 {language === 'fr' ? 'Concentré (Amno-Acides & Minéraux)' : 'Concentrate (Amino & Vitamins)'}</span>
                              <span className="text-xs font-black text-slate-200 font-mono bg-slate-850 px-2 rounded-lg py-0.5">{concentreRatio}%</span>
                           </div>
                        </div>
                     </div>

                     {/* Dynamic Visual Outlines */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-xl flex flex-col justify-center">
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{language === 'fr' ? 'PROTÉINES BRUTES' : 'CRUDE PROTEIN'}</span>
                           <span className="text-2xl font-black text-slate-100 font-mono">{proteinLevel}%</span>
                        </div>
                        
                        <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-xl flex flex-col justify-center">
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{language === 'fr' ? 'ÉNERGIE MÉTABOLISABLE' : 'METABOLIZABLE ENERGY'}</span>
                           <span className="text-xl font-black text-slate-100 font-mono truncate">{energyLevel} <span className="text-[10px] text-slate-500">kcal/kg</span></span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-xl flex flex-col justify-center">
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{language === 'fr' ? 'PRIX MOYEN ESTIMÉ' : 'EST. RAW INGREDIENT COST'}</span>
                           <span className="text-2xl font-black text-white font-mono">{costPerKg} <span className="text-xs text-slate-400 font-sans">FCFA/kg</span></span>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-xl flex flex-col justify-center">
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">{language === 'fr' ? 'COÛT PAR SAC (50KG)' : 'COST PER 50KG BAG'}</span>
                           <span className="text-xl font-black text-farm-400 font-mono">{costPerKg * 50} <span className="text-xs text-slate-400 font-sans">FCFA</span></span>
                        </div>
                     </div>

                     {/* Recommendation Alert Box */}
                     <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                           <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                           {language === 'fr' ? 'Type d\'aliment' : 'Ideal Formulation'}
                        </span>
                        <span className="text-[10px] font-black text-farm-400 uppercase tracking-widest bg-farm-950 px-2.5 py-1 rounded-lg border border-farm-900/50 truncate max-w-full">
                           {getRecommendation()}
                        </span>
                     </div>
                  </div>

                  {/* Emulator Footer */}
                  <div className="flex items-center justify-between border-t border-slate-900 pt-3.5 text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                     <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-farm-500" />
                        <span>{language === 'fr' ? 'REPRODUIT DES RECETTES CERTIFIÉES' : 'STANDARD COMM-GRADE FORMULATION'}</span>
                     </div>
                     <span className="text-emerald-500 font-bold">100% OK</span>
                  </div>
               </div>
            </div>

         </div>
      </section>

      {/* 3. Interactive FAQ & Feed Ingredient Dictionary */}
      <section className="bg-white py-16 border-y border-gray-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left text column */}
                <div className="lg:col-span-5 space-y-6 text-left">
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider">
                      <Brain className="w-3.5 h-3.5" />
                      <span>{language === 'fr' ? 'Dictionnaire de Nutrition' : 'Feedstock Nutri Guide'}</span>
                   </div>
                   <h2 className="text-3xl font-bold text-slate-900 font-display tracking-tight leading-tight">
                      {language === 'fr' ? 'Sachez exactement ce que mangent vos bêtes' : 'Know Exactly What Goes in the Feeder'}
                   </h2>
                   <p className="text-slate-600 leading-relaxed font-medium text-sm">
                      {language === 'fr'
                        ? "Cliquez sur les ingrédients ci-contre pour afficher leurs spécifications biochimiques réelles et comprendre pourquoi notre algorithme de rationnement de stock préconise leur combinaison."
                        : "Click the feedstocks on the right panel to show real bio-nutritional constraints and discover how our formula core balances cost vs growth index."}
                   </p>
                   
                   <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                         <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{language === 'fr' ? 'Conseil d’ingénieur' : 'Agronomist Tip'}</h4>
                         <p className="text-xs text-slate-500 leading-relaxed">
                            {language === 'fr' 
                              ? "Les poussins de démarrage nécessitent au moins 21% de protéines brutes pour éviter le retard de croissance plumet."
                              : "Young day-old chicks require at least 21% crude protein density to prevent high breeder mortality rates."}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Right Interactive Selection Column */}
                <div className="lg:col-span-7 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-150/40">
                   <div className="flex flex-wrap gap-2 mb-6">
                      {Object.keys(ingredientsDb).map((key) => (
                         <button
                           key={key}
                           onClick={() => setSelectedIngredient(key)}
                           className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${selectedIngredient === key ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                         >
                            <span>{ingredientsDb[key].icon}</span>
                            <span>{key === 'mais' ? (language === 'fr' ? 'Maïs' : 'Corn') : key === 'soja' ? (language === 'fr' ? 'Soja' : 'Soybean') : key === 'concentre' ? (language === 'fr' ? 'Concentré' : 'Concentrate') : key === 'ble' ? (language === 'fr' ? 'Son de Blé' : 'Wheat Bran') : (language === 'fr' ? 'Poisson' : 'Fishmeal')}</span>
                         </button>
                      ))}
                   </div>

                   {/* Active Detail Display */}
                   <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-150/50 shadow-inner text-left space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                         <div className="flex items-center gap-2">
                            <span className="text-2xl">{ingredientsDb[selectedIngredient].icon}</span>
                            <span className="font-black text-slate-800 uppercase tracking-widest text-sm">
                               {selectedIngredient === 'mais' ? 'Maïs' : selectedIngredient === 'soja' ? 'Tourteau de Soja' : selectedIngredient === 'concentre' ? 'Concentré 5%' : selectedIngredient === 'ble' ? 'Son de Blé fin' : 'Farine de Poisson'}
                            </span>
                         </div>
                         <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded">
                            {language === 'fr' ? 'Marché local' : 'Local Market'}
                         </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-150/20">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">{language === 'fr' ? 'PROTÉINES MOYENNES' : 'AVG CRUDE PROTEIN'}</span>
                            <span className="text-lg font-black text-slate-800 font-mono">{ingredientsDb[selectedIngredient].protein}</span>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-150/20">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">{language === 'fr' ? 'ÉNERGIE NETTE' : 'METABOLIZABLE ENERGY'}</span>
                            <span className="text-lg font-black text-slate-800 font-mono">{ingredientsDb[selectedIngredient].energy}</span>
                         </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-150/20">
                         <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">{language === 'fr' ? 'COÛT APPROXIMATIF COMPILÉ' : 'EST. MARKET UNIT COST'}</span>
                         <span className="text-base font-black text-emerald-750 font-mono">{ingredientsDb[selectedIngredient].cost} FCFA <span className="text-[10px] font-sans text-slate-400">/ kg</span></span>
                      </div>

                      <div className="space-y-1">
                         <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">{language === 'fr' ? 'RÔLE PHYSIOLOGIQUE & SYNERGIE' : 'PHYSIOLOGICAL VALUE'}</span>
                         <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {language === 'fr' ? ingredientsDb[selectedIngredient].roleFr : ingredientsDb[selectedIngredient].roleEn}
                         </p>
                      </div>
                   </div>
                </div>

            </div>
         </div>
      </section>

      {/* 4. Interactive ROI / Savings Calculator */}
      <section className="bg-slate-900 text-white py-16 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-farm-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-farm-500/10 border border-farm-550/20 text-farm-300 text-xs font-black uppercase tracking-widest">
               <DollarSign className="w-4 h-4 text-farm-450" />
               <span>{language === 'fr' ? 'Calculateur d\'Économies' : 'Premium ROI Calculator'}</span>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
               <h2 className="text-3xl font-extrabold tracking-tight font-display text-white">
                  {language === 'fr' ? 'Combien allez-vous économiser ?' : 'How Much Do You Save in Hard Cash?'}
               </h2>
               <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  {language === 'fr'
                    ? "Produire vos propres formules avec Smart Agro réduit le coût du sac de 50kg d'environ 35% comparé à l'achat d'aliments commerciaux du marché."
                    : "On-site commercial feed mixing cuts down standard layer and broiler nutrition expenditures by approximately 35% compared to pre-packaged feed brands."}
               </p>
            </div>

            {/* Slider Control Container */}
            <div className="max-w-xl mx-auto bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 text-left shadow-2xl">
               <div className="space-y-2">
                  <div className="flex justify-between items-baseline font-sans text-xs">
                     <span className="font-black text-slate-400 uppercase tracking-widest">{language === 'fr' ? 'Volume de provende mensuel' : 'Monthly Feed Demand'}</span>
                     <span className="text-xl font-bold font-mono text-farm-400">{targetTons} {language === 'fr' ? 'Tonne(s)' : 'Ton(s)'} <span className="text-[10px] text-slate-500">({targetTons * 20} sacs)</span></span>
                  </div>
                  <input 
                     type="range" 
                     min="1" 
                     max="50" 
                     value={targetTons}
                     onChange={(e) => setTargetTons(parseInt(e.target.value))}
                     className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-farm-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold pt-1">
                     <span>1 TONNE</span>
                     <span>25 TONS</span>
                     <span>50 TONS</span>
                  </div>
               </div>

               {/* Comparison results */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-center">
                  <div className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl">
                     <span className="text-[10px] text-slate-400 font-bold block mb-1">{language === 'fr' ? 'ALIMENT PRÊT-À-L\'EMPLOI' : 'COMMERCIAL MIX'}</span>
                     <span className="text-sm font-bold text-red-400 font-mono">{commercialCost.toLocaleString()} FCFA</span>
                  </div>
                  <div className="p-3 bg-slate-905 border border-slate-850/60 rounded-xl">
                     <span className="text-[10px] text-slate-400 font-bold block mb-1">{language === 'fr' ? 'ALIMENT PROPRE MIX' : 'SMART AGRO SELF-MADE'}</span>
                     <span className="text-sm font-bold text-farm-400 font-mono">{selfMadeCost.toLocaleString()} FCFA</span>
                  </div>
                  <div className="p-3 bg-farm-600/10 border border-farm-500/20 rounded-xl flex flex-col justify-center items-center">
                     <span className="text-[10px] text-farm-450 font-bold block mb-0.5">{language === 'fr' ? 'ARGENT ÉCONOMISÉ' : 'NET SAVINGS'}</span>
                     <span className="text-lg font-black text-white font-mono leading-none">{savingsAmount.toLocaleString()} FCFA</span>
                     <span className="text-[8px] font-black tracking-widest text-[#22c55e] uppercase mt-1">/ {language === 'fr' ? 'MOIS' : 'MONTH'}</span>
                  </div>
               </div>

               <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850/50 flex items-center gap-3.5">
                  <TrendingUp className="w-5 h-5 text-[#22c55e] shrink-0" />
                  <p className="text-xs text-slate-400 leading-normal font-medium">
                     {language === 'fr'
                       ? `En formulant sur place, vous conservez ${savingsAmount.toLocaleString()} FCFA de marge nette additionnelle dans votre exploitation à la fin de chaque mois.`
                       : `Formulating your own feed lets you convert ${savingsAmount.toLocaleString()} FCFA from premium brand overhead back into your monthly operating profit.`}
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* 5. Core Modules Feature Grid */}
      <section className="bg-[#FAF9F5] py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
               <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-farm-50 border border-farm-100 text-farm-700 text-xs font-black uppercase tracking-wider">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Une Solution Tout-en-Un' : 'Complete ERP Suite'}</span>
               </div>
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-display tracking-tight">{t('landing.need')}</h2>
               <p className="text-slate-550 font-medium text-sm sm:text-base leading-relaxed">{t('landing.need_desc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <FeatureCard 
                  icon={CheckCircle2}
                  title={t('landing.feat1_title')}
                  desc={t('landing.feat1_desc')}
               />
               <FeatureCard 
                  icon={BarChart3}
                  title={t('landing.feat2_title')}
                  desc={t('landing.feat2_desc')}
               />
               <FeatureCard 
                  icon={ShieldCheck}
                  title={t('landing.feat3_title')}
                  desc={t('landing.feat3_desc')}
               />
            </div>
         </div>
      </section>

      {/* 6. Success Stories / Testimonial section */}
      <section className="bg-white py-16 border-t border-gray-150/40">
         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <div className="inline-block px-3 py-1 bg-amber-50 text-amber-705 border border-amber-100 text-xs font-black uppercase tracking-widest rounded-full">
               <Award className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
               {language === 'fr' ? 'La parole à nos partenaires' : 'Partner Trust'}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
               <div className="p-6 bg-[#FAF9F5] border border-slate-150/50 rounded-2xl space-y-4 shadow-sm relative">
                  <span className="text-4xl text-farm-300 absolute top-3 right-4 font-serif">“</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold italic relative z-10">
                     {language === 'fr'
                       ? "Nous formulons environ 12 tonnes de provende pour pondeuses chaque mois à Bafoussam. Grâce à l’outil de dosage intelligent Smart Agro, nous optimisons les ratios de tourteau de soja et d’acide aminé. Notre taux de ponte est passé de 74% à 86% en l’espace de 3 semaines !"
                       : "We build layer premium rations in West Africa. Using Smart Agro's digital balancer, we stabilized protein ratios, cutting corn waste. Our overall organic laying metrics jumped from 74% to 86% inside 20 operating days."}
                  </p>
                  <div>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Dr. Jean-Pierre M.</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'fr' ? 'Nutritionniste de dinde & Propriétaire de ferme' : 'Breeder Mill Manager, Bafoussam'}</p>
                  </div>
               </div>

               <div className="p-6 bg-[#FAF9F5] border border-slate-150/50 rounded-2xl space-y-4 shadow-sm relative">
                  <span className="text-4xl text-farm-300 absolute top-3 right-4 font-serif">“</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold italic relative z-10">
                     {language === 'fr'
                       ? "La gestion financière des ventes à crédit de sacs était un cauchemar dans notre boutique de Dakar. Maintenant, les vendeurs peuvent encaisser rapidement, l’état des dettes clients se met à jour instantanément hors-ligne, et les relevés de caisse se synchronisent tout seuls dès qu’on a du réseau."
                       : "Raw materials inventory tracking and credit ledger operations was an absolute mess inside our Dakar depot. Now everything works fine even without internet during power outages, and automatically uploads to cloud backup databases when cell data returns safely."}
                  </p>
                  <div>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Mme Danielle D.</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{language === 'fr' ? 'Directrice Administratrice de Coopérative' : 'Cooperative Director, Dakar'}</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 7. Footer & Policies */}
      <footer className="bg-slate-900 text-white border-t border-slate-850 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400">
              <p className="font-medium">© {new Date().getFullYear()} Smart Agro. {t('landing.rights')}</p>
              <div className="flex gap-6 font-bold uppercase tracking-wider text-[10px]">
                  <button onClick={() => setActivePolicy('privacy')} className="hover:text-farm-405 transition-colors">{t('landing.privacy')}</button>
                  <button onClick={() => setActivePolicy('terms')} className="hover:text-farm-405 transition-colors">{t('landing.terms')}</button>
                  <button onClick={() => setActivePolicy('security')} className="hover:text-farm-405 transition-colors">{t('landing.security')}</button>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white text-slate-800 rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-farm-100 flex items-center justify-center text-farm-600 shadow-inner shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-950 tracking-tight font-display">
                                {activePolicy === 'privacy' && t('landing.privacy_title')}
                                {activePolicy === 'terms' && t('landing.terms_title')}
                                {activePolicy === 'security' && t('landing.security_title')}
                            </h3>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5 tracking-widest">Smart Agro</p>
                        </div>
                    </div>
                    <button onClick={() => setActivePolicy(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-755 transition-colors" />
                    </button>
                </div>
                <div className="p-6 md:p-8 text-sm text-gray-650 leading-relaxed bg-white overflow-y-auto max-h-[60vh]">
                    {activePolicy === 'privacy' && (
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm mb-2">1</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.p1_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.p1_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm mb-2">2</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.p2_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.p2_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm mb-2">3</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.p3_title')}</h4>
                                <p className="text-xs text-slate-500">{t('landing.p3_desc')}</p>
                            </div>
                        </div>
                    )}
                    {activePolicy === 'terms' && (
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-sm mb-2">1</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.t1_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.t1_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-sm mb-2">2</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.t2_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.t2_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm mb-2">3</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.t3_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.t3_desc')}</p>
                            </div>
                        </div>
                    )}
                    {activePolicy === 'security' && (
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-sm mb-2">1</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.s1_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.s1_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm mb-2">2</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.s2_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.s2_desc')}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold text-sm mb-2">3</div>
                                <h4 className="text-base font-bold text-gray-900">{t('landing.s3_title')}</h4>
                                <p className="text-xs text-gray-500">{t('landing.s3_desc')}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50 flex justify-end items-center gap-4">
                    <p className="text-xs text-gray-400 font-medium mr-auto hidden sm:block">
                      {t('landing.last_update')} : {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <button onClick={() => setActivePolicy(null)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md active:scale-95">
                      {t('landing.understood_close')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-gray-100/80 hover:border-farm-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.035)] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden text-left">
     {/* Subtle gradient accent */}
     <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-farm-500 via-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
     
     <div className="w-12 h-12 bg-gradient-to-tr from-farm-500/10 to-emerald-500/5 text-farm-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shrink-0">
        <Icon className="w-5.5 h-5.5" />
     </div>
     <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-farm-700 transition-colors tracking-tight font-display">{title}</h3>
     <p className="text-slate-500 leading-relaxed text-xs sm:text-sm font-medium">{desc}</p>
  </div>
);
