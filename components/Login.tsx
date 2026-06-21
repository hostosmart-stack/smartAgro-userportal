import React, { useState } from 'react';
import { signInWithEmailAndPassword } from '../services/firebase';
import { auth } from '../services/firebase';
import { Leaf, Loader2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onBack: () => void;
  onLoginSuccess?: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onBack, onLoginSuccess }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      const inputName = username.trim();
      const inputPassword = password;
      
      // Fetch all employees in Firestore first to check credentials locally
      const employeesSnap = await getDocs(collection(db, 'employees'));
      const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const matchedEmployee = employeesList.find((emp: any) => 
        !emp.deleted && 
        (
          (emp.name && emp.name.toLowerCase() === inputName.toLowerCase()) ||
          (emp.username && emp.username.toLowerCase() === inputName.toLowerCase()) ||
          (emp.email && emp.email.toLowerCase() === inputName.toLowerCase())
        ) && 
        (
          String(emp.pin) === String(inputPassword) || 
          String(emp.password) === String(inputPassword)
        )
      );

      if (matchedEmployee) {
        // Construct their virtual or registered email for Firebase Auth
        const email = matchedEmployee.email || (matchedEmployee.username ? `${matchedEmployee.username}@gmail.com` : `${matchedEmployee.name.replace(/\s+/g, '').toLowerCase()}@gmail.com`);
        
        // Synchronize in the background with Firebase Auth to establish a session
        let authUserObj: any = null;
        try {
          const authResult = await signInWithEmailAndPassword(auth, email, inputPassword);
          authUserObj = {
            email: authResult.user.email,
            uid: authResult.user.uid,
            displayName: authResult.user.displayName || matchedEmployee.name
          };
        } catch (authError: any) {
          console.error("Firebase Auth login background sync failed:", authError);
          // If the user doesn't exist in Auth backend yet but exists in Firestore, heal by auto-registering
          if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-verified') {
            try {
              console.log("Healing credentials: auto-registering Firebase Auth user...");
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              const createResult = await createUserWithEmailAndPassword(auth, email, inputPassword);
              authUserObj = {
                email: createResult.user.email,
                uid: createResult.user.uid,
                displayName: createResult.user.displayName || matchedEmployee.name
              };
            } catch (createErr) {
              console.error("Credentials auto-registration background sync failed:", createErr);
            }
          }
        }

        // Final local fallback user object
        const finalUser = authUserObj || {
          email: email,
          uid: matchedEmployee.id || 'employee_' + Date.now(),
          displayName: matchedEmployee.name
        };

        // Cache session locally in localStorage so it is instantly available offline or on cold startup
        localStorage.setItem('smartAgro_local_user', JSON.stringify(finalUser));

        if (onLoginSuccess) {
          onLoginSuccess(finalUser);
          return;
        }
      } else {
        // Fallback for default admin setup
        const isDefaultAdmin = (inputName.toLowerCase() === 'admin' || inputName.toLowerCase() === 'danielledjofang2003') && inputPassword === '123456';
        if (isDefaultAdmin) {
          const defaultAdminEmail = 'danielledjofang2003@gmail.com';
          const defaultAdminPassword = '123456';
          
          let adminUserObj: any = null;
          try {
            const authResult = await signInWithEmailAndPassword(auth, defaultAdminEmail, defaultAdminPassword);
            adminUserObj = {
              email: authResult.user.email,
              uid: authResult.user.uid,
              displayName: authResult.user.displayName || 'Administrateur Général'
            };
          } catch (authErr: any) {
            console.warn("Default admin Auth background login unsuccessful, checking registration...", authErr);
            if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
              try {
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                const createResult = await createUserWithEmailAndPassword(auth, defaultAdminEmail, defaultAdminPassword);
                adminUserObj = {
                  email: createResult.user.email,
                  uid: createResult.user.uid,
                  displayName: createResult.user.displayName || 'Administrateur Général'
                };
              } catch (createErr) {
                console.error("Admin user background auto-register fallback failure:", createErr);
              }
            }
          }

          const finalUser = adminUserObj || {
            email: defaultAdminEmail,
            uid: 'superadmin_bypass',
            displayName: 'Administrateur Général'
          };

          localStorage.setItem('smartAgro_local_user', JSON.stringify(finalUser));

          if (onLoginSuccess) {
            onLoginSuccess(finalUser);
            return;
          }
        }

        setError("Identifiants incorrects (Nom/Username ou Mot de passe invalide).");
      }
    } catch (globalErr: any) {
      console.error("Global login operation failed:", globalErr);
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="p-6">
         <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> {t('login.back')}
         </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
         <div className="w-full max-w-md">
            <div className="text-center mb-10">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-600 text-white shadow-xl shadow-farm-200 mb-6">
                  <Leaf className="w-8 h-8" />
               </div>
               <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('login.welcome')}</h2>
               <p className="text-gray-500 mt-2">{t('login.subtitle')}</p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
               <form onSubmit={handleLogin} className="space-y-6">
                  {error && (
                     <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                        {error}
                     </div>
                  )}
                  
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-700 ml-1">{t('login.username')}</label>
                     <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-farm-500 outline-none transition-all font-medium"
                        placeholder="Ex: jean.k"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-700 ml-1">{t('login.password')}</label>
                     <input 
                        type="password" 
                        required
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-farm-500 outline-none transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                     />
                  </div>

                  <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full py-4 bg-farm-600 text-white rounded-xl font-bold text-lg hover:bg-farm-700 transition-all shadow-lg hover:shadow-xl shadow-farm-200 disabled:opacity-70 flex items-center justify-center"
                  >
                     {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('login.login')}
                  </button>
               </form>

               <div className="mt-8 text-center">
                  <p className="text-sm text-gray-400">
                     {t('login.no_account')} <a href="#" className="text-farm-600 font-bold hover:underline">{t('login.contact_support')}</a>
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
