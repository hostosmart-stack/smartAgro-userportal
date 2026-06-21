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

            {/* Right mock terminal card column */}
            <div className="flex-1 relative animate-in zoom-in-95 duration-1000 delay-200 w-full">
               <div className="absolute inset-0 bg-farm-500/10 rounded-full blur-[80px] opacity-40"></div>
               
               <div className="relative z-10 w-full aspect-square bg-gradient-to-br from-slate-50 to-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-[10px] border-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_2px,transparent_2px),linear-gradient(to_bottom,#808080_2px,transparent_2px)] bg-[size:32px_32px]"></div>
                  
                  <div className="flex items-center justify-between relative z-10 w-full border-b border-gray-100 pb-5">
                     <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                           <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                           <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                           <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-300 ml-3">v3.core.production.env</span>
                     </div>
                     <div className="bg-farm-500/10 text-farm-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        {t('landing.live_system')}
                     </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center relative w-full my-6">
                     <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-farm-500/15 to-emerald-500/5 flex items-center justify-center animate-pulse">
                        <div className="w-32 h-32 rounded-full bg-white border border-slate-50 shadow-2xl flex items-center justify-center">
                           <Award className="w-12 h-12 text-farm-600" />
                        </div>
                     </div>

                     {/* Floating notification alert */}
                     <div className="absolute top-2 -left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-50 hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center gap-3">
                           <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                              <ShoppingCart className="w-4 h-4" />
                           </div>
                           <div className="text-left">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('landing.stock_alert')}</div>
                              <div className="text-xs font-black text-slate-800">{t('landing.feed_alert')}</div>
                           </div>
                        </div>
                     </div>

                     {/* Floating analytics alert */}
                     <div className="absolute bottom-2 -right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-50 hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center gap-3">
                           <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                              <BarChart3 className="w-4 h-4" />
                           </div>
                           <div className="text-left">
                              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Performance</div>
                              <div className="text-xs font-black text-slate-800">{t('landing.sales_increase')}</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between relative z-10 w-full border-t border-gray-100 pt-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-farm-600" />
                        <span>{t('landing.synchronized')}</span>
                     </div>
                     <span>{t('landing.secured_engine')}</span>
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
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
     <div className="w-12 h-12 bg-farm-50 rounded-xl flex items-center justify-center text-farm-600 mb-6">
        <Icon className="w-6 h-6" />
     </div>
     <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
     <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);