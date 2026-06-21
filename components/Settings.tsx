import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Palette, Building, Save, CheckCircle2, Moon, Sun, Monitor, Database, Server, Eye, KeyRound, Clock, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useNotifications } from './ui/Notifications';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeToRequestStats } from '../services/db';
import { Provenderie } from '../types';

interface SettingsProps {
  onSettingsChange: (settings: AppSettings) => void;
  currentSettings: AppSettings;
  currentProvenderie?: Provenderie;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  colorTheme: 'farm' | 'ocean' | 'sunset' | 'berry' | 'royal';
  companyName: string;
  language: 'fr' | 'en';
}

export const Settings: React.FC<SettingsProps> = ({ onSettingsChange, currentSettings, currentProvenderie }) => {
  const { notify } = useNotifications();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AppSettings>(currentSettings);
  const [stats, setStats] = useState({ reads: 0, writes: 0 });

  useEffect(() => {
    const unsub = subscribeToRequestStats(setStats);
    return () => unsub();
  }, []);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSettingsChange(settings);
    localStorage.setItem('smartAgro_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('settingsChanged'));
    notify(t('settings.saved'), "success");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-y-auto custom-scrollbar px-4 pt-4">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6 dark:border-gray-800 shrink-0">
        <div className="p-3 bg-gray-100 rounded-xl dark:bg-gray-800">
          <SettingsIcon className="w-8 h-8 text-gray-700 dark:text-gray-200" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-5 h-5 text-farm-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('settings.company_identity')}</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.company_name')}</label>
              <input 
                type="text" 
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                placeholder="Ex: Ste DJATSA ET FILS SARL"
              />
              <p className="text-xs text-gray-400 mt-2">{t('settings.company_name_desc')}</p>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <span className="font-bold text-lg">Aa</span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">{t('settings.language')}</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
                <button 
                    onClick={() => setSettings({...settings, language: 'fr'})}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${settings.language === 'fr' ? 'border-farm-500 bg-farm-50 text-farm-700 dark:bg-farm-900/20 dark:text-farm-300' : 'border-gray-100 text-gray-500 hover:border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                >
                    <span className="text-2xl">🇫🇷</span>
                    <span className="font-bold">Français</span>
                </button>
                <button 
                    onClick={() => setSettings({...settings, language: 'en'})}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${settings.language === 'en' ? 'border-farm-500 bg-farm-50 text-farm-700 dark:bg-farm-900/20 dark:text-farm-300' : 'border-gray-100 text-gray-500 hover:border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}
                >
                    <span className="text-2xl">🇬🇧</span>
                    <span className="font-bold">English</span>
                </button>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('settings.appearance')}</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.color_theme')}</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <button 
                  onClick={() => setSettings({...settings, colorTheme: 'farm'})}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.colorTheme === 'farm' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-green-600 shadow-sm"></div>
                  <span className="text-[10px] font-medium dark:text-gray-300">Nature</span>
                </button>
                <button 
                  onClick={() => setSettings({...settings, colorTheme: 'ocean'})}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.colorTheme === 'ocean' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 shadow-sm"></div>
                  <span className="text-[10px] font-medium dark:text-gray-300">Océan</span>
                </button>
                <button 
                  onClick={() => setSettings({...settings, colorTheme: 'sunset'})}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.colorTheme === 'sunset' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-orange-600 shadow-sm"></div>
                  <span className="text-[10px] font-medium dark:text-gray-300">Sunset</span>
                </button>
                <button 
                  onClick={() => setSettings({...settings, colorTheme: 'berry'})}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.colorTheme === 'berry' ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-fuchsia-600 shadow-sm"></div>
                  <span className="text-[10px] font-medium dark:text-gray-300">Berry</span>
                </button>
                <button 
                  onClick={() => setSettings({...settings, colorTheme: 'royal'})}
                  className={`p-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.colorTheme === 'royal' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 shadow-sm"></div>
                  <span className="text-[10px] font-medium dark:text-gray-300">Royal</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('settings.display_mode')}</label>
              <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                <button 
                  onClick={() => setSettings({...settings, theme: 'light'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'light' ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <Sun className="w-4 h-4" /> {t('settings.light')}
                </button>
                <button 
                  onClick={() => setSettings({...settings, theme: 'dark'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <Moon className="w-4 h-4" /> {t('settings.dark')}
                </button>
                <button 
                  onClick={() => setSettings({...settings, theme: 'system'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === 'system' ? 'bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <Monitor className="w-4 h-4" /> {t('settings.auto')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Requests Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 font-sans">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              {settings.language === 'en' ? 'Database & Requests' : 'Base de données & Requêtes'}
            </h3>
          </div>

          <div className="space-y-6">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {settings.language === 'en' 
                ? 'Monitors live billing operations counters for read and write requests performed across the agricultural database.'
                : "Affiche en temps réel le décompte des opérations de lecture et d'écriture de facturation de votre base de données."}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    {settings.language === 'en' ? 'Reads' : 'Lectures'}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight animate-pulse">
                  {stats.reads.toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Server className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                    {settings.language === 'en' ? 'Writes' : 'Écritures'}
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono tracking-tight">
                  {stats.writes.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {settings.language === 'en' 
                  ? 'Auto-syncing changes with live cloud database' 
                  : 'Synchronisation automatique active avec le cloud'}
              </span>
            </div>
          </div>
        </div>

        {/* Licence & Abonnement Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 font-sans">
          <div className="flex items-center gap-3 mb-6">
            <KeyRound className="w-5 h-5 text-farm-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              {settings.language === 'en' ? 'License & Subscription' : 'Licence & Abonnement'}
            </h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {settings.language === 'en'
                ? 'Check your organization access license status, type, and expiration details.'
                : "Consultez l'état d'activation, le type d'abonnement et la date de validité de votre logiciel."}
            </p>

            <div className="divide-y divide-gray-150 dark:divide-slate-700/60 text-sm">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-505 dark:text-gray-400">
                  {settings.language === 'en' ? 'Restricted Control' : 'Restriction active'}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  currentProvenderie?.licenseEnforced 
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-950/40'
                }`}>
                  {currentProvenderie?.licenseEnforced 
                    ? (settings.language === 'en' ? 'Enforced' : 'Restreint (Actif)') 
                    : (settings.language === 'en' ? 'Unrestricted' : 'Illimité (Inactif)')
                  }
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-505 dark:text-gray-400">
                  {settings.language === 'en' ? 'License Type' : 'Type d\'abonnement'}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {(() => {
                    const type = currentProvenderie?.licenseType || 'monthly';
                    const isEn = settings.language === 'en';
                    switch (type.toLowerCase()) {
                      case 'monthly': return isEn ? 'Monthly' : 'Mensuelle';
                      case 'annual': return isEn ? 'Annual' : 'Annuelle';
                      case 'demo': return isEn ? 'Demo' : 'Démo';
                      case 'unlimited': return isEn ? 'Unlimited' : 'Illimitée';
                      default: return type;
                    }
                  })()}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-550 dark:text-gray-400">
                  {settings.language === 'en' ? 'Expiration Date' : 'Date d\'échéance'}
                </span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                  {currentProvenderie?.licenseExpiryDate 
                    ? new Date(currentProvenderie.licenseExpiryDate).toLocaleDateString(settings.language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : (settings.language === 'en' ? 'Never' : 'Jamais')
                  }
                </span>
              </div>

              <div className="py-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {settings.language === 'en' ? 'Remaining time' : 'Temps restant'}
                </span>
                <div>
                  {currentProvenderie?.licenseEnforced ? (
                    (() => {
                      if (!currentProvenderie || !currentProvenderie.licenseExpiryDate) return <span className="text-xs font-bold text-gray-400">-</span>;
                      try {
                        const expiry = new Date(currentProvenderie.licenseExpiryDate);
                        expiry.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const diffTime = expiry.getTime() - today.getTime();
                        const rDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (rDays <= 0) {
                          return (
                            <span className="flex items-center gap-1 text-xs font-black text-rose-500 uppercase">
                              <ShieldAlert className="w-4 h-4" />
                              {settings.language === 'en' ? 'Expired' : 'Expiré'}
                            </span>
                          );
                        } else if (rDays <= 10) {
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-black text-amber-500 animate-pulse bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {settings.language === 'en' ? `${rDays} days left` : `${rDays} j restants`}
                            </span>
                          );
                        } else {
                          return (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-4 h-4" />
                              {settings.language === 'en' ? `${rDays} days left` : `${rDays} jours restants`}
                            </span>
                          );
                        }
                      } catch {
                        return <span className="text-xs font-bold text-gray-400">-</span>;
                      }
                    })()
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      <ShieldCheck className="w-4 h-4" />
                      {settings.language === 'en' ? 'Permanent' : 'Permanent'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-farm-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-farm-700 transition-all shadow-lg hover:shadow-xl transform active:scale-95"
        >
          <Save className="w-5 h-5" />
          {t('settings.save')}
        </button>
      </div>
    </div>
  );
};
