import React, { useState, useEffect } from 'react';
import { Provenderie, Employee } from '../types';
import { subscribeToProvenderies, saveProvenderie, deleteProvenderie, saveEmployee } from '../services/db';
import { auth, createUserWithEmailAndPassword } from '../services/firebase';
import { Plus, Trash2, Check, ArrowLeft, Store, Loader2, ShieldCheck, User, Mail, Hash, Lock, Edit2 } from 'lucide-react';
import { useNotifications } from './ui/Notifications';

interface ProvenderieAdminProps {
  currentProvenderieId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  isInsideApp?: boolean;
}

export const ProvenderieAdmin: React.FC<ProvenderieAdminProps> = ({ currentProvenderieId, onSelect, onBack, isInsideApp = false }) => {
  const { notify } = useNotifications();
  const [provenderies, setProvenderies] = useState<Provenderie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProv, setEditingProv] = useState<Provenderie | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phones, setPhones] = useState<string[]>(['']);
  const [rc, setRC] = useState('');
  const [niu, setNIU] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Licence State
  const [licenseEnforced, setLicenseEnforced] = useState(false);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [licenseType, setLicenseType] = useState('monthly');
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProvenderies((data) => {
      setProvenderies(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async () => {
    const isNew = !editingProv;
    
    // Check required fields
    if (!newName?.trim() || !identifier?.trim()) {
      notify("Veuillez remplir le nom et l'identifiant", "error");
      return;
    }

    if (isNew && (!adminName?.trim() || !adminEmail?.trim() || !adminPassword?.trim())) {
      notify("Veuillez remplir les informations de l'administrateur", "error");
      return;
    }

    if (isNew && adminPassword.length < 6) {
      notify("Le mot de passe doit contenir au moins 6 caractères", "error");
      return;
    }
    
    setIsProcessing(true);
    try {
      if (editingProv) {
          const updatedProv: Provenderie = {
              ...editingProv,
              name: newName.trim(),
              identifier: identifier.trim().toUpperCase(),
              phones: (phones || []).filter(p => p && p.trim() !== ''),
              legalRC: (rc || '').trim(),
              legalNIU: (niu || '').trim(),
              licenseEnforced: licenseEnforced,
              licenseExpiryDate: licenseExpiryDate,
              licenseType: licenseType
          };
          await saveProvenderie(updatedProv);
          notify("Provenderie mise à jour", "success");
      } else {
          // 1. Create User in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, adminEmail.trim().toLowerCase(), adminPassword);
          const authUid = userCredential.user.uid;

          const provId = `prov-${Date.now()}`;
          const adminId = authUid; // Use Firebase Auth UID as Employee ID for better linking

          // 2. Create the Provenderie
          const newProv: Provenderie = {
            id: provId,
            name: newName.trim(),
            identifier: identifier.trim().toUpperCase(),
            primaryAdminId: adminId,
            address: '',
            phones: (phones || []).filter(p => p && p.trim() !== ''),
            legalRC: (rc || '').trim(),
            legalNIU: (niu || '').trim(),
            licenseEnforced: licenseEnforced,
            licenseExpiryDate: licenseExpiryDate,
            licenseType: licenseType,
            deleted: false
          };

          // 3. Create the Primary Admin Employee in Firestore
          const newAdmin: Employee = {
            id: adminId,
            name: adminName.trim(),
            email: adminEmail.trim().toLowerCase(),
            role: 'Admin',
            roleId: 'role-admin',
            provenderieId: provId,
            deleted: false,
            assignedBoutique: 'Toutes'
          };

          await saveProvenderie(newProv);
          await saveEmployee(newAdmin);

          notify("Provenderie et Admin créés avec succès", "success");
      }
      
      // Reset form
      setNewName('');
      setIdentifier('');
      setPhones(['']);
      setRC('');
      setNIU('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setLicenseEnforced(false);
      setLicenseExpiryDate('');
      setLicenseType('monthly');
      setIsAdding(false);
      setEditingProv(null);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        notify("Cet email est déjà utilisé", "error");
      } else {
        notify("Erreur lors de la création: " + (error.message || "Inconnue"), "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (provenderies.length <= 1) {
      notify("Impossible de supprimer la dernière provenderie", "error");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette provenderie ? Toutes les données associées seront inaccessibles.")) {
      try {
        await deleteProvenderie(id);
        notify("Provenderie supprimée", "info");
        if (currentProvenderieId === id) {
          const remaining = provenderies.filter(p => p.id !== id);
          if (remaining.length > 0) {
            onSelect(remaining[0].id);
          }
        }
      } catch (error) {
        notify("Erreur lors de la suppression", "error");
      }
    }
  };

  const openEdit = (prov: Provenderie) => {
    setEditingProv(prov);
    setNewName(prov.name || '');
    setIdentifier(prov.identifier || '');
    setPhones(prov.phones && prov.phones.length > 0 ? [...prov.phones] : ['']);
    setRC(prov.legalRC || '');
    setNIU(prov.legalNIU || '');
    setLicenseEnforced(prov.licenseEnforced || false);
    setLicenseExpiryDate(prov.licenseExpiryDate || '');
    setLicenseType(prov.licenseType || 'monthly');
    setIsAdding(true);
  };

  return (
    <div className={`${isInsideApp ? 'h-full' : 'min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4'} font-sans`}>
      <div className={`w-full ${isInsideApp ? 'h-full' : 'max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500'}`}>
        {/* Header */}
        <div className={`${isInsideApp ? 'p-6 rounded-t-[2rem]' : 'p-8'} bg-slate-900 text-white relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-farm-500/20 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-farm-500 p-3 rounded-2xl shadow-lg shadow-farm-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`${isInsideApp ? 'text-xl' : 'text-2xl'} font-black tracking-tight uppercase`}>Administration</h1>
                <p className="text-farm-300 text-xs font-bold uppercase tracking-widest opacity-80">Gestion des Provenderies</p>
              </div>
            </div>
            {!isInsideApp && (
              <button 
                onClick={onBack}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group"
              >
                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        <div className={`${isInsideApp ? 'p-6 bg-white rounded-b-[2rem] h-[calc(100%-100px)] overflow-y-auto' : 'p-8'} scrollbar-hide`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-farm-600 animate-spin" />
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-slate-900 font-black text-lg uppercase tracking-tight">Provenderies Disponibles</h2>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-farm-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-farm-200 hover:bg-farm-700 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Nouvelle
                </button>
              </div>

              {isAdding && (
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 animate-in slide-in-from-top-4 duration-300 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nom de la Provenderie</label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          autoFocus
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all"
                          placeholder="Ex: Provenderie du Nord"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Identifiant (Code)</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all"
                          placeholder="Ex: PRV-001"
                          value={identifier}
                          onChange={e => setIdentifier(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact & Légal (Facturation)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block">Numéros de téléphone (Header)</label>
                           {phones.map((phone, idx) => (
                             <div key={idx} className="flex gap-2">
                                <input 
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none"
                                  value={phone}
                                  onChange={e => {
                                      const newPhones = [...phones];
                                      newPhones[idx] = e.target.value;
                                      setPhones(newPhones);
                                  }}
                                  placeholder="677 00 00 00"
                                />
                                {phones.length > 1 && (
                                    <button onClick={() => setPhones(phones.filter((_, i) => i !== idx))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Plus className="w-4 h-4 rotate-45" /></button>
                                )}
                             </div>
                           ))}
                           <button onClick={() => setPhones([...phones, ''])} className="text-[10px] font-bold text-farm-600 uppercase flex items-center gap-1 hover:text-farm-700"><Plus className="w-3 h-3" /> Ajouter un numéro</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Registre du Commerce (RC)</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all" value={rc} onChange={e => setRC(e.target.value)} placeholder="RC/DLA/2024/B/1234" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Numéro d'Identifiant Unique (NIU)</label>
                                <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all" value={niu} onChange={e => setNIU(e.target.value)} placeholder="M012345678901A" />
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Licence Settings Section */}
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Abonnement & Licence</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Limiter l'accès (Blocage)</label>
                        <div className="flex items-center h-12">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={licenseEnforced}
                              onChange={e => setLicenseEnforced(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-farm-600"></div>
                            <span className="ml-3 text-sm font-bold text-slate-700">{licenseEnforced ? 'Restreint (Blocage Activé)' : 'Illimité (Inactif)'}</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Date d'Expiration</label>
                        <input 
                          type="date" 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all" 
                          value={licenseExpiryDate} 
                          onChange={e => setLicenseExpiryDate(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Type de Licence</label>
                        <select 
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all"
                          value={licenseType}
                          onChange={e => setLicenseType(e.target.value)}
                        >
                          <option value="monthly">Mensuelle (Monthly)</option>
                          <option value="annual">Annuelle (Annual)</option>
                          <option value="unlimited">Illimitée (Unlimited)</option>
                          <option value="demo">Démo (Demo)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {!editingProv && (
                    <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Administrateur Principal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nom Complet</label>
                            <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all"
                                placeholder="Ex: Jean Dupont"
                                value={adminName}
                                onChange={e => setAdminName(e.target.value)}
                            />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Email de Connexion</label>
                            <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="email" 
                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all"
                                placeholder="Ex: admin@provenderie.com"
                                value={adminEmail}
                                onChange={e => setAdminEmail(e.target.value)}
                            />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Mot de Passe</label>
                            <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-farm-500 outline-none transition-all"
                                placeholder="••••••••"
                                value={adminPassword}
                                onChange={e => setAdminPassword(e.target.value)}
                            />
                            </div>
                        </div>
                        </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={handleAdd}
                      disabled={isProcessing || !newName.trim() || !identifier.trim() || (!editingProv && (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()))}
                      className="flex-1 bg-farm-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-farm-200 hover:bg-farm-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 py-3"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editingProv ? 'Mettre à jour' : 'Créer la Provenderie'}
                    </button>
                    <button 
                      onClick={() => { setIsAdding(false); setEditingProv(null); }}
                      className="px-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all font-bold text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {provenderies.map((prov) => (
                  <div 
                    key={prov.id}
                    className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${currentProvenderieId === prov.id ? 'border-farm-500 bg-farm-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    onClick={() => onSelect(prov.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl transition-colors ${currentProvenderieId === prov.id ? 'bg-farm-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{prov.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {prov.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(prov);
                        }}
                        className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {currentProvenderieId === prov.id && (
                        <span className="px-3 py-1 bg-farm-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-farm-200">Active</span>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(prov.id);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button 
                  onClick={onBack}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  Continuer vers la Connexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Smart Agro Management System v2.0</p>
    </div>
  );
};
