import React from 'react';
import { X, Smartphone, ExternalLink, Download, Share } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose, isIOS }) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    window.open(window.location.origin, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-150/20 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl shrink-0">
            <Smartphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white leading-tight">
              {language === 'fr' ? "Installer l'application" : "Install Application"}
            </h3>
            <p className="text-xs font-bold text-farm-600 dark:text-farm-400 uppercase tracking-widest mt-0.5">
              Smart Agro
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
          {/* Iframe warning */}
          {window.self !== window.top && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium space-y-2">
              <p>
                {language === 'fr' 
                  ? "Vous utilisez actuellement l'application à l'intérieur d'un cadre (iframe), ce qui empêche l'installation automatique."
                  : "You are currently running the application inside a frame (iframe), which prevents automatic installation."}
              </p>
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 underline hover:no-underline cursor-pointer"
              >
                <span>{language === 'fr' ? "Ouvrir dans un nouvel onglet" : "Open in a new tab"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isIOS ? (
            /* iOS Specific Instructions */
            <div className="space-y-3">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {language === 'fr' 
                  ? "Pour installer sur votre iPhone ou iPad :" 
                  : "To install on your iPhone or iPad:"}
              </p>
              <ol className="list-decimal list-inside space-y-2.5 pl-1 leading-relaxed">
                <li>
                  {language === 'fr' 
                    ? "Ouvrez l'application dans le navigateur " 
                    : "Open the app in the "}
                  <strong className="text-slate-800 dark:text-slate-200">Safari</strong> browser.
                </li>
                <li className="flex items-start gap-1.5">
                  <span>
                    {language === 'fr' 
                      ? "Appuyez sur le bouton de " 
                      : "Tap the "}
                    <strong className="text-slate-800 dark:text-slate-200">{language === 'fr' ? "Partage" : "Share"}</strong>
                    {language === 'fr' ? " (icône de flèche sortant d'un carré " : " button (the square icon with an arrow "}
                  </span>
                  <Share className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline mt-0.5" />
                  <span>).</span>
                </li>
                <li>
                  {language === 'fr' 
                    ? "Faites défiler et sélectionnez " 
                    : "Scroll down and select "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {language === 'fr' ? '"Sur l\'écran d\'accueil"' : '"Add to Home Screen"'}
                  </strong>.
                </li>
              </ol>
            </div>
          ) : (
            /* General / Desktop / Android Instructions */
            <div className="space-y-3">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {language === 'fr' 
                  ? "Pour installer l'application sur votre appareil :" 
                  : "To install the app on your device:"}
              </p>
              <ul className="space-y-2.5 pl-1 list-none leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-black text-emerald-600 dark:text-emerald-400">1</span>
                  <span>
                    {language === 'fr' 
                      ? "Cliquez sur l'icône d'installation (" 
                      : "Click the install icon ("}
                    <Download className="w-3.5 h-3.5 inline text-emerald-600" />
                    {language === 'fr' 
                      ? ") dans la barre d'adresse de votre navigateur ou dans le menu de votre navigateur." 
                      : ") in your browser's address bar or in your browser's menu."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-black text-emerald-600 dark:text-emerald-400">2</span>
                  <span>
                    {language === 'fr' 
                      ? "Si vous ne voyez pas l'icône, ouvrez l'application dans un nouvel onglet en dehors de cet éditeur, puis réessayez." 
                      : "If you don't see the icon, open the app in a new tab outside of this preview, then try again."}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={handleOpenInNewTab}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>{language === 'fr' ? "Nouvel Onglet" : "New Tab"}</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {language === 'fr' ? "Fermer" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
