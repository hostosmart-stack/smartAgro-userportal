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
  Award,
  ShoppingCart
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
  onLoginClick: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onLoginClick }) => {
  const [activePolicy, setActivePolicy] = useState<'privacy' | 'terms' | 'security' | null>(null);
  const { t, language, setLanguage } = useLanguage();

  // Mini formulation simulator states
  const [maisRatio, setMaisRatio] = useState<number>(60);
  const [sojaRatio, setSojaRatio] = useState<number>(25);
  const concentreRatio = Math.max(0, 100 - maisRatio - sojaRatio);

  const proteinLevel = parseFloat(((maisRatio * 8.5 + sojaRatio * 44 + concentreRatio * 35) / 100).toFixed(1));
  const costPerKg = Math.round((maisRatio * 190 + sojaRatio * 420 + concentreRatio * 750) / 100);

  // Determine ideal formulation output
  const getRecommendation = () => {
    if (proteinLevel < 15) {
      return language === 'fr' ? "Aliment Finition" : "Finisher Feed";
    } else if (proteinLevel >= 15 && proteinLevel < 19) {
      return language === 'fr' ? "Aliment Pondeuses" : "Layer Feed";
    } else {
      return language === 'fr' ? "Aliment Démarrage" : "Starter Feed";
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-farm-500 selection:text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-farm-600 p-2 rounded-lg">
               <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Smart Agro</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher pill */}
            <div className="flex items-center bg-gray-100 p-1 rounded-full border border-gray-200/60 text-[11px]">
              <button 
                onClick={() => setLanguage('fr')} 
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold transition-all ${language === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <span>🇫🇷</span> <span>FR</span>
              </button>
              <button 
                onClick={() => setLanguage('en')} 
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold transition-all ${language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <span>🇬🇧</span> <span>EN</span>
              </button>
            </div>

            <button 
              onClick={onLoginClick}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-all hover:scale-105"
            >
              {t('landing.connexion_admin')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative">
         {/* Circular abstract backdrop glow */}
         <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-farm-500/10 via-emerald-500/5 to-blue-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

         <div className="flex flex-col lg:flex-row items-center gap-16 relative">
            {/* Left text column */}
            <div className="flex-1 space-y-8 animate-in slide-in-from-bottom-10 duration-700">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-farm-50 border border-farm-100 text-farm-700 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-farm-600 animate-pulse" />
                  {t('landing.solution_provenderies')}
               </div>
               
               <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                  {t('landing.title_main')} <br className="hidden sm:block" />
                  {t('landing.title_main_bold')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-farm-600 via-emerald-600 to-blue-600 drop-shadow-sm">
                     {t('landing.title_sub')}
                  </span>
               </h1>
               
               <p className="text-xl text-gray-600 leading-relaxed max-w-lg font-medium">
                  {t('landing.desc')}
               </p>
               
               <div className="flex flex-col sm:flex-row gap-6 pt-4 items-stretch sm:items-center">
                  <button 
                     onClick={onLoginClick}
                     className="px-8 py-4 bg-gradient-to-r from-farm-600 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-farm-700 hover:to-emerald-700 transition-all shadow-lg shadow-farm-200 flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                  >
                     {t('landing.start_now')}
                     <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center justify-center sm:justify-start gap-2.5 text-gray-400 font-bold text-sm">
                     <Globe className="w-4 h-4 text-farm-600" />
                     <span>{t('landing.sync_desc')}</span>
                  </div>
               </div>
               
               <div className="flex gap-8 pt-8 border-t border-gray-100">
                  <div>
                     <p className="text-3xl font-bold text-gray-900">500+</p>
                     <p className="text-sm text-gray-500 font-medium">{t('landing.happy_clients')}</p>
                  </div>
                  <div>
                     <p className="text-3xl font-bold text-gray-900">100%</p>
                     <p className="text-sm text-gray-500 font-medium">{t('landing.availability')}</p>
                  </div>
               </div>
            </div>

            {/* Right column: Beautiful Interactive Formulation Simulator */}
            <div className="flex-1 relative animate-in zoom-in-95 duration-1000 delay-200 w-full">
               <div className="absolute inset-0 bg-gradient-to-tr from-farm-500/20 via-emerald-500/10 to-blue-500/20 rounded-full blur-[100px] opacity-45 pointer-events-none -z-10"></div>
               
               <div className="relative z-10 w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-6 sm:p-8 flex flex-col justify-between overflow-hidden group hover:border-farm-500/30 transition-all duration-500">
                  <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  
                  {/* Header of Simulator */}
                  <div className="flex items-center justify-between relative z-10 w-full border-b border-slate-800 pb-4">
                     <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                           <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                           <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 ml-2">smartmixer.preview.sh</span>
                     </div>
                     <div className="bg-farm-500/20 text-farm-400 border border-farm-500/30 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {language === 'fr' ? 'Émulateur dynamique' : 'Dynamic Emulator'}
                     </div>
                  </div>

                  {/* Simulator Sliders & Outputs */}
                  <div className="my-6 relative z-10 space-y-6 text-left">
                     <div className="bg-slate-950/60 border border-slate-800/60 p-5 rounded-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === 'fr' ? 'Rationnement Matières %' : 'Raw Materials Ratio %'}</span>
                           <span className="text-xs font-bold text-farm-400 bg-farm-500/10 px-2 py-0.5 rounded border border-farm-500/20">Total: 100%</span>
                        </div>
                        
                        <div className="space-y-4">
                           {/* Maïs */}
                           <div>
                              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                                 <span className="flex items-center gap-1.5">🌽 {language === 'fr' ? 'Maïs (Énergie)' : 'Corn (Energy)'}</span>
                                 <span className="text-farm-400 font-mono font-bold">{maisRatio}%</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="20" 
                                 max="75" 
                                 value={maisRatio} 
                                 onChange={(e) => {
                                    const nextValue = parseInt(e.target.value);
                                    if (nextValue + sojaRatio <= 100) {
                                       setMaisRatio(nextValue);
                                    } else {
                                       setMaisRatio(nextValue);
                                       setSojaRatio(100 - nextValue);
                                    }
                                 }}
                                 className="w-full h-1.5 bg-slate-805 rounded-lg appearance-none cursor-pointer accent-farm-500" 
                              />
                           </div>

                           {/* Soja */}
                           <div>
                              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                                 <span className="flex items-center gap-1.5">🌱 {language === 'fr' ? 'Soja (Protéines)' : 'Soybean (Protein)'}</span>
                                 <span className="text-farm-400 font-mono font-bold">{sojaRatio}%</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="10" 
                                 max="50" 
                                 value={sojaRatio} 
                                 onChange={(e) => {
                                    const nextValue = parseInt(e.target.value);
                                    if (maisRatio + nextValue <= 100) {
                                       setSojaRatio(nextValue);
                                    } else {
                                       setSojaRatio(nextValue);
                                       setMaisRatio(100 - nextValue);
                                    }
                                 }}
                                 className="w-full h-1.5 bg-slate-805 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                              />
                           </div>

                           {/* Concentré (computed dynamically) */}
                           <div className="bg-slate-905 p-3 rounded-xl border border-slate-800/40 flex justify-between items-center">
                              <span className="text-xs text-slate-400 flex items-center gap-1.5">🧪 {language === 'fr' ? 'Concentré (Minéraux)' : 'Concentrate (Minerals)'}</span>
                              <span className="text-xs font-black text-slate-200 font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-750">{concentreRatio}%</span>
                           </div>
                        </div>
                     </div>

                     {/* Live Nutrition Outputs */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl flex flex-col justify-center">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">{language === 'fr' ? 'PROTÉINES BRUTES' : 'CRUDE PROTEIN'}</p>
                           <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-slate-100 font-mono tracking-tight">{proteinLevel}%</span>
                              <span className="text-[9px] font-bold text-farm-400 uppercase tracking-wider bg-farm-500/10 px-1.5 py-0.5 rounded border border-farm-500/20">
                                 {proteinLevel >= 19 ? 'Ultra' : proteinLevel >= 15 ? 'Optimum' : 'Eco'}
                              </span>
                           </div>
                        </div>
                        
                        <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-2xl flex flex-col justify-center">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">{language === 'fr' ? 'COÛT ESTIMÉ' : 'ESTIMATED COST'}</p>
                           <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-100 font-mono tracking-tight">{costPerKg}</span>
                              <span className="text-[10px] font-bold text-slate-500">FCFA</span>
                           </div>
                        </div>
                     </div>

                     {/* Recommendation Badge */}
                     <div className="bg-slate-955 border border-slate-800/40 p-3.5 rounded-2xl flex flex-col sm:flex-row gap-2 items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="flex relative h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                           </span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {language === 'fr' ? 'Formule recommandée' : 'Target formulation'}
                           </span>
                        </div>
                        <span className="text-[11px] font-black text-farm-400 uppercase tracking-widest bg-farm-950 border border-farm-900/40 px-3.5 py-1 rounded-xl shadow-inner">
                           {getRecommendation()}
                        </span>
                     </div>
                  </div>

                  {/* Simulator Footer */}
                  <div className="flex items-center justify-between relative z-10 w-full border-t border-slate-800 pt-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                     <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-farm-500" />
                        <span>{language === 'fr' ? 'SIMULATEUR DE FORMULATION' : 'FORMULATION SANDBOX'}</span>
                     </div>
                     <span className="text-emerald-500 font-bold">{language === 'fr' ? 'GÉNÉRATEUR' : 'PREMIX GENERATOR'}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-24 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.need')}</h2>
               <p className="text-gray-500">{t('landing.need_desc')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
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
      </div>

      {/* Footer & Privacy */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} Smart Agro. {t('landing.rights')}</p>
              <div className="flex gap-6">
                  <button onClick={() => setActivePolicy('privacy')} className="hover:text-farm-600 transition-colors">{t('landing.privacy')}</button>
                  <button onClick={() => setActivePolicy('terms')} className="hover:text-farm-600 transition-colors">{t('landing.terms')}</button>
                  <button onClick={() => setActivePolicy('security')} className="hover:text-farm-600 transition-colors">{t('landing.security')}</button>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-8 p-6 bg-gray-50 rounded-2xl text-xs text-gray-400 leading-relaxed text-justify">
              <p>
                  <strong>{t('landing.decl_title')}</strong> {t('landing.decl_text')}
              </p>
          </div>
      </footer>

      {/* Policy Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
                <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-farm-100 flex items-center justify-center text-farm-600 shadow-inner">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
                                {activePolicy === 'privacy' && t('landing.privacy_title')}
                                {activePolicy === 'terms' && t('landing.terms_title')}
                                {activePolicy === 'security' && t('landing.security_title')}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-widest">Smart Agro</p>
                        </div>
                    </div>
                    <button onClick={() => setActivePolicy(null)} className="p-3 hover:bg-gray-100 rounded-full transition-colors group">
                        <X className="w-6 h-6 text-gray-400 group-hover:text-gray-700 transition-colors" />
                    </button>
                </div>
                <div className="p-8 md:p-12 text-base text-gray-600 leading-relaxed bg-white">
                    {activePolicy === 'privacy' && (
                        <div className="grid md:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg mb-6">1</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.p1_title')}</h4>
                                <p>{t('landing.p1_desc')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-lg mb-6">2</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.p2_title')}</h4>
                                <p>{t('landing.p2_desc')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg mb-6">3</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.p3_title')}</h4>
                                <p>{t('landing.p3_desc')}</p>
                            </div>
                        </div>
                    )}
                    {activePolicy === 'terms' && (
                        <div className="grid md:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-lg mb-6">1</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.t1_title')}</h4>
                                <p>{t('landing.t1_desc')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-lg mb-6">2</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.t2_title')}</h4>
                                <p>{t('landing.t2_desc')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg mb-6">3</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.t3_title')}</h4>
                                <p>{t('landing.t3_desc')}</p>
                            </div>
                        </div>
                    )}
                    {activePolicy === 'security' && (
                        <div className="grid md:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold text-lg mb-6">1</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.s1_title')}</h4>
                                <p>{t('landing.s1_desc')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-lg mb-6">2</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.s2_title')}</h4>
                                <p>{t('landing.s2_desc')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold text-lg mb-6">3</div>
                                <h4 className="text-xl font-bold text-gray-900">{t('landing.s3_title')}</h4>
                                <p>{t('landing.s3_desc')}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50 flex justify-end items-center gap-4">
                    <p className="text-xs text-gray-400 font-medium mr-auto hidden sm:block">
                      {t('landing.last_update')} : {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <button onClick={() => setActivePolicy(null)} className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
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
  <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-gray-100 hover:border-farm-100 hover:shadow-[0_20px_40px_rgba(0,0,0,0.035)] hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden">
     {/* Hover gradient border accent */}
     <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-farm-500 via-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
     
     <div className="w-12 h-12 bg-gradient-to-tr from-farm-500/10 to-emerald-500/5 text-farm-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5.5 h-5.5 animate-none" />
     </div>
     <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-farm-700 transition-colors">{title}</h3>
     <p className="text-gray-500 leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);