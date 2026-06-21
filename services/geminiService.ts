import { GoogleGenAI } from "@google/genai";
import { Product, Invoice, Boutique, Employee, Expense } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

interface AppContext {
  products: Product[];
  invoices: Invoice[];
  boutiques: Boutique[];
  employees: Employee[];
  expenses: Expense[];
}

export const askFarmAdvisor = async (
  question: string,
  context: AppContext
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Service IA indisponible : Clé API manquante.";

  // --- AGGREGATED DATA FOR REPORTS ---
  const salesByBoutique = context.invoices.reduce((acc, inv) => {
    const b = inv.boutique || 'Inconnu';
    acc[b] = (acc[b] || 0) + inv.total;
    return acc;
  }, {} as Record<string, number>);

  const expensesByCategory = context.expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const topProducts = context.invoices.flatMap(i => i.items || []).reduce((acc, item) => {
    acc[item.name] = (acc[item.name] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const aggregatedContext = `
  -- STATISTIQUES GLOBALES --
  Ventes par Boutique: ${JSON.stringify(salesByBoutique)}
  Dépenses par Catégorie: ${JSON.stringify(expensesByCategory)}
  Top 5 Produits (Qté): ${JSON.stringify(Object.entries(topProducts).sort((a, b) => b[1] - a[1]).slice(0, 5))}
  `;

  // Limit context size to prevent payload issues
  const inventorySummary = context.products
    .slice(0, 50)
    .map(p => `- ${p.name} (${p.stock} ${p.unit} disponible, prix: ${p.price} FCFA)`)
    .join('\n');

  const recentSales = context.invoices
    .slice(0, 10)
    .map(i => `- Facture ${i.id.slice(-4)}: ${i.total} FCFA (${i.status}) le ${new Date(i.date).toLocaleDateString('fr-FR')}`)
    .join('\n');

  const boutiquesSummary = context.boutiques
    .map(b => `- ${b.name} (${b.status === 'active' ? 'Active' : 'Inactive'})`)
    .join('\n');

  const employeesSummary = context.employees
    .map(e => `- ${e.name} (${e.role})`)
    .join('\n');

  const systemPrompt = `Tu es un expert consultant agricole et assistant de gestion pour 'Ste DJATSA ET FILS SARL' en Afrique.
  Tu aides le gérant du magasin à gérer son stock, analyser ses ventes, et réponds aux questions techniques des éleveurs locaux.
  
  Voici le contexte actuel de l'entreprise :
  
  -- INVENTAIRE (Aperçu top 50) --
  ${inventorySummary || 'Aucun produit'}
  
  -- DERNIÈRES VENTES (Aperçu top 10) --
  ${recentSales || 'Aucune vente récente'}
  
  -- BOUTIQUES --
  ${boutiquesSummary || 'Aucune boutique'}
  
  -- EMPLOYÉS --
  ${employeesSummary || 'Aucun employé'}

  ${aggregatedContext}
  
  Règles :
  1. Réponds toujours en Français.
  2. Sois concis, professionnel et pratique.
  3. Si on te pose des questions sur les ventes, les employés ou les boutiques, utilise les données fournies ci-dessus.
  4. Adapte tes conseils au contexte africain (climat tropical, races locales ou importées comme Cobb/Ross, matériaux disponibles).
  5. Utilise le FCFA comme devise.
  6. Si on te demande des conseils d'élevage (ex: "Combien d'abreuvoirs pour 500 sujets?"), donne une réponse technique précise et recommande les produits du stock.
  7. **GÉNÉRATION DE RAPPORTS** : Si l'utilisateur demande explicitement un "rapport", une "analyse graphique", ou des "statistiques visuelles", tu DOIS générer une réponse au format JSON STRICT (sans markdown, sans texte avant/après).
     Structure du JSON attendu :
     {
       "type": "REPORT",
       "title": "Titre du Rapport",
       "category": "INVENTAIRE" | "VENTES" | "FINANCE" | "TECHNIQUE" | "AUTRE",
       "sections": [
         { "id": "sec1", "type": "text", "title": "Introduction", "content": "Analyse textuelle..." },
         { "id": "chart1", "type": "chart", "title": "Ventes par Boutique", "chartType": "bar", "data": [{ "name": "Boutique A", "value": 1000 }, { "name": "Boutique B", "value": 1500 }] },
         { "id": "chart2", "type": "chart", "title": "Répartition des Dépenses", "chartType": "pie", "data": [{ "name": "Loyer", "value": 500 }, { "name": "Salaires", "value": 300 }] }
       ]
     }
     Utilise les données agrégées fournies pour remplir les graphiques.
  `;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: question,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      return response.text || "Je n'ai pas pu générer de réponse.";
    } catch (error: any) {
      attempts++;
      console.error(`Gemini API Error (Attempt ${attempts}/${maxAttempts}):`, error);
      
      // Check for specific error types if needed, but for now retry on all
      if (attempts >= maxAttempts) {
        return "Désolé, le service est momentanément indisponible. Veuillez réessayer plus tard.";
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
    }
  }
  
  return "Erreur inattendue.";
};
