import React, { useState } from 'react';
import { 
  ShieldAlert, 
  RotateCw, 
  LogOut, 
  Clock, 
  HelpCircle,
  Building,
  KeyRound
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LicenseBlockerProps {
  provenderieName: string;
  licenseExpiryDate: string;
  licenseType: string;
  onLogout: () => void;
  onRefresh: () => void;
}

export const LicenseBlocker: React.FC<LicenseBlockerProps> = ({
  provenderieName,
  licenseExpiryDate,
  licenseType,
  onLogout,
  onRefresh
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format type name depending on language
  const getLicenseTypeName = (type: string) => {
    const isFr = language === 'fr';
    switch (type?.toLowerCase()) {
      case 'monthly':
        return isFr ? 'Mensuelle' : 'Monthly';
      case 'annual':
        return isFr ? 'Annuelle' : 'Annual';
      case 'demo':
        return isFr ? 'Démo / Essai' : 'Demo / Trial';
      case 'unlimited':
        return isFr ? 'Illimitée' : 'Unlimited';
      default:
        return type || (isFr ? 'Mensuelle' : 'Monthly');
    }
  };

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-between p-6 relative font-sans text-white overflow-y-auto selection:bg-rose-500 selection:text-white">
      {/* Decorative rich background pattern/glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Top Bar */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-rose-600/20 text-rose-500 p-2 rounded-xl border border-rose-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight uppercase">Smart Agro</span>
        </div>

        {/* Language Switcher pill */}
        <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10 text-[11px]">
          <button 
            type="button"
            onClick={() => setThemeLanguage('fr')} 
            className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-all ${language === 'fr' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}
          >
            <span>FR</span>
          </button>
          <button 
            type="button"
            onClick={() => setThemeLanguage('en')} 
            className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-all ${language === 'en' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'}`}
          >
            <span>EN</span>
          </button>
        </div>
      </div>

      {/* Main Block Box */}
      <div className="my-auto py-12 flex items-center justify-center relative z-10 w-full">
        <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] p-8 md:p-12 border border-white/15 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
          
          {/* Glowing Restricted Shield Icon */}
          <div className="mx-auto w-24 h-24 bg-rose-500/15 border border-rose-500/20 rounded-[2rem] flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/5 animate-pulse relative">
            <ShieldAlert className="w-12 h-12" />
            <div className="absolute inset-0 rounded-[2rem] border-2 border-rose-500/30 scale-105 opacity-40 animate-ping"></div>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight uppercase">
              {language === 'fr' ? "Accès Suspendu" : "Access Suspended"}
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
              {language === 'fr' 
                ? "Votre licence d'utilisation est arrivée à expiration. Pour restaurer l'accès à vos tableaux de bord, données de ventes et de stocks, veuillez renouveler votre abonnement."
                : "Your usage license has reached its expiration date. To restore access to your dashboards, sales, and stock records, please contact your administrator to renew."}
            </p>
          </div>

          {/* Details list card */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 space-y-4 text-left">
            <div className="flex justify-between items-center py-2.5 border-b border-white/5">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-farm-500" />
                {language === 'fr' ? 'Entreprise' : 'Company'}
              </span>
              <span className="text-sm font-bold text-white truncate max-w-[200px]">
                {provenderieName}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-white/5">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-farm-500" />
                {language === 'fr' ? "Date d'échéance" : "Expiry Date"}
              </span>
              <span className="text-sm font-bold text-rose-400">
                {formatDate(licenseExpiryDate)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-farm-500" />
                {language === 'fr' ? 'Type de licence' : 'Subscription Type'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-black uppercase tracking-wider">
                {getLicenseTypeName(licenseType)}
              </span>
            </div>
          </div>

          {/* Core Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch justify-center pt-2">
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="flex-1 bg-gradient-to-r from-farm-600 to-emerald-600 text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-farm-800/10 hover:from-farm-700 hover:to-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>{language === 'fr' ? 'Réessayer' : 'Check Again'}</span>
            </button>
            
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              <span>{language === 'fr' ? 'Se déconnecter' : 'Disconnect'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-6xl mx-auto text-center relative z-10 text-xs text-slate-500 font-medium flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© 2026 Smart Agro. Tous droits réservés.</p>
        <div className="flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span>{language === 'fr' ? 'Besoin d\'assistance ?' : 'Need help?'}</span>
        </div>
      </div>
    </div>
  );

  // Helper local function to override language switch triggers beautifully
  function setThemeLanguage(lang: 'fr' | 'en') {
    setLanguage(lang);
  }
};
