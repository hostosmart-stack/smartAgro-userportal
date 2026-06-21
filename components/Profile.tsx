import React, { useMemo, useState } from 'react';
import { User, Mail, Building, Activity, Eye, EyeOff, Wallet, Edit2, Save, X } from 'lucide-react';
import { Invoice, Expense, Employee } from '../types';
import { saveEmployee } from '../services/db';
import { useNotifications } from './ui/Notifications';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileProps {
  userRole: string;
  userName: string;
  userEmail?: string;
  userBoutique?: string;
  contactPersonName?: string;
  contactPersonRelationship?: string;
  invoices: Invoice[];
  expenses: Expense[];
  currentEmployee?: Employee;
}

export const Profile: React.FC<ProfileProps> = ({ userRole, userName, userEmail, userBoutique, contactPersonName, contactPersonRelationship, invoices, expenses, currentEmployee }) => {
  const { notify } = useNotifications();
  const { t } = useLanguage();
  const [showSalary, setShowSalary] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
      name: contactPersonName || '',
      relationship: contactPersonRelationship || '',
      phone: currentEmployee?.contactPersonPhone || ''
  });
  
  // --- STATISTICS ---
  const mySalaryExpenses = useMemo(() => {
    // Filter expenses that are likely salary payments for this user
    // This is a heuristic based on description containing the name
    return expenses.filter(e => 
      (e.category === 'SALAIRE' || e.category === 'RATION') && 
      (e.description || '').toLowerCase().includes((userName || '').toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, userName]);

  const totalSalaryReceived = useMemo(() => mySalaryExpenses.reduce((acc, curr) => acc + curr.amount, 0), [mySalaryExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const handleSaveContact = async () => {
      if (!currentEmployee) return;
      
      try {
          const updatedEmployee: Employee = {
              ...currentEmployee,
              contactPersonName: contactForm.name,
              contactPersonRelationship: contactForm.relationship,
              contactPersonPhone: contactForm.phone
          };
          
          await saveEmployee(updatedEmployee);
          notify(t('profile.contact_updated'), "success");
          setIsEditingContact(false);
      } catch (e) {
          notify("Erreur lors de la mise à jour", "error");
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-y-auto custom-scrollbar px-4 pt-4">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6 dark:border-gray-800 shrink-0">
        <div className="p-3 bg-[var(--color-farm-100)] rounded-xl dark:bg-[var(--color-farm-900)]/30">
          <User className="w-8 h-8 text-[var(--color-farm-600)] dark:text-[var(--color-farm-400)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: INFO --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--color-farm-400)] to-[var(--color-farm-600)] flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-[var(--color-farm-50)] dark:ring-[var(--color-farm-900)]/50 mb-4">
              {userName.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{userRole}</p>
            
            <div className="w-full mt-6 space-y-3">
               <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 text-left">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase font-bold">{t('profile.email')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userEmail || t('common.not_provided')}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 text-left">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 uppercase font-bold">{t('profile.boutique')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userBoutique || t('common.all')}</p>
                  </div>
               </div>
               
               {/* Contact Person Section */}
               <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 text-left relative group">
                  <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <p className="text-xs text-gray-400 uppercase font-bold flex-1">{t('profile.emergency_contact')}</p>
                      {!isEditingContact ? (
                          <button onClick={() => setIsEditingContact(true)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                              <Edit2 className="w-3 h-3 text-gray-500" />
                          </button>
                      ) : (
                          <div className="flex gap-1">
                              <button onClick={handleSaveContact} className="p-1 hover:bg-green-100 text-green-600 rounded-full transition-colors">
                                  <Save className="w-3 h-3" />
                              </button>
                              <button onClick={() => setIsEditingContact(false)} className="p-1 hover:bg-red-100 text-red-600 rounded-full transition-colors">
                                  <X className="w-3 h-3" />
                              </button>
                          </div>
                      )}
                  </div>
                  
                  {isEditingContact ? (
                      <div className="space-y-2 animate-in fade-in">
                          <input 
                              className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-farm-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              placeholder={t('profile.contact_name')}
                              value={contactForm.name}
                              onChange={e => setContactForm({...contactForm, name: e.target.value})}
                          />
                          <input 
                              className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-farm-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              placeholder={t('profile.relation')}
                              value={contactForm.relationship}
                              onChange={e => setContactForm({...contactForm, relationship: e.target.value})}
                          />
                          <input 
                              className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-farm-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              placeholder={t('profile.phone')}
                              value={contactForm.phone}
                              onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                          />
                      </div>
                  ) : (
                      <div className="pl-8">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contactForm.name || t('common.not_provided')}</p>
                          {contactForm.relationship && <p className="text-xs text-gray-500 dark:text-gray-400">{contactForm.relationship}</p>}
                          {contactForm.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{contactForm.phone}</p>}
                      </div>
                  )}
               </div>
            </div>
          </div>

          {/* --- SALARY CARD --- */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[var(--color-farm-600)] dark:text-[var(--color-farm-400)]" />
                  {t('profile.salary_advances')}
                </h3>
                <button onClick={() => setShowSalary(!showSalary)} className="text-gray-400 hover:text-[var(--color-farm-600)] transition-colors">
                  {showSalary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
             </div>
             
             {showSalary ? (
               <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                 <div className="p-4 bg-[var(--color-farm-50)] dark:bg-[var(--color-farm-900)]/20 rounded-xl border border-[var(--color-farm-100)] dark:border-[var(--color-farm-800)] text-center">
                    <p className="text-xs text-[var(--color-farm-600)] dark:text-[var(--color-farm-400)] font-bold uppercase mb-1">{t('profile.total_received')}</p>
                    <p className="text-2xl font-bold text-[var(--color-farm-700)] dark:text-[var(--color-farm-300)]">{formatCurrency(totalSalaryReceived)}</p>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {mySalaryExpenses.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">{t('profile.no_salary_history')}</p>
                    ) : (
                      mySalaryExpenses.map(pay => (
                        <div key={pay.id} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg">
                           <span className="text-gray-500 dark:text-gray-400">{new Date(pay.date).toLocaleDateString()}</span>
                           <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(pay.amount)}</span>
                        </div>
                      ))
                    )}
                 </div>
               </div>
             ) : (
               <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => setShowSalary(true)}>
                  <p className="text-sm">{t('profile.click_to_show')}</p>
               </div>
             )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: STATS & ACTIVITY --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('profile.performance')}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.active')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('profile.account_operational')}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
