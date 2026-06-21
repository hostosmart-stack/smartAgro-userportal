import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader2, Sparkles, Trash2, Copy, Download, 
  Printer, Check, MessageSquare, Plus, History, X, FileText, 
  Pin, PieChart as PieChartIcon, BarChart as BarChartIcon, 
  Layout, ChevronRight, Maximize2, Minimize2, Edit3, Save, 
  Share2, Filter, FilePlus, ChevronLeft, Zap
} from 'lucide-react';
import { askFarmAdvisor } from '../services/geminiService';
import { Product, Invoice, Boutique, Employee, Expense, Conversation, Message, Report } from '../types';
import { subscribeToConversations, saveConversation, deleteConversation } from '../services/db';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface AssistantProps {
  products: Product[];
  invoices: Invoice[];
  boutiques: Boutique[];
  employees: Employee[];
  expenses: Expense[];
  userRole?: string;
  userBoutique?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Assistant: React.FC<AssistantProps> = ({ products, invoices, boutiques, employees, expenses, userRole = 'Admin', userBoutique = 'Toutes' }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportsPanel, setShowReportsPanel] = useState(true);
  const [editingSection, setEditingSection] = useState<{ reportId: string, sectionId: string, content: string } | null>(null);
  const [isFullScreenReport, setIsFullScreenReport] = useState(false);
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('ALL');

  // Logic Effects (Persistence & Subscriptions)
  useEffect(() => {
    const saved = localStorage.getItem('assistant_reports');
    if (saved) try { setReports(JSON.parse(saved)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('assistant_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    const unsubscribe = subscribeToConversations(setConversations);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    } else if (conversations.length === 0 && !currentConversationId) {
      startNewChat();
    }
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      const conv = conversations.find(c => c.id === currentConversationId);
      if (conv) setMessages(conv.messages);
    }
  }, [currentConversationId, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, loading]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const initialMessage: Message = { 
      role: 'assistant', 
      content: 'Bonjour ! Je suis votre **IA Smart Agro**. Comment puis-je optimiser votre production aujourd\'hui ?',
      timestamp: Date.now()
    };
    const newConv: Conversation = {
      id: newId,
      title: 'Nouvelle analyse',
      messages: [initialMessage],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveConversation(newConv);
    setCurrentConversationId(newId);
    setShowHistory(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !currentConversationId) return;

    const userMsgContent = input.trim();
    const userMsg: Message = { role: 'user', content: userMsgContent, timestamp: Date.now() };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Filter data based on userBoutique for AI analysis
      const filteredInvoices = userBoutique === 'Toutes' ? invoices : invoices.filter(inv => inv.boutique === userBoutique);
      const filteredExpenses = userBoutique === 'Toutes' ? expenses : expenses.filter(exp => exp.boutique === userBoutique);
      const filteredEmployees = userBoutique === 'Toutes' ? employees : employees.filter(emp => emp.assignedBoutique === userBoutique);
      
      const filteredProducts = products.map(p => {
          if (userBoutique === 'Toutes' || userBoutique === 'Boutique 1') return p;
          return {
              ...p,
              stock: p.boutiqueStock?.[userBoutique] || 0,
              variants: p.variants?.map(v => ({
                  ...v,
                  stock: v.boutiqueStock?.[userBoutique] || 0
              }))
          };
      });

      const responseContent = await askFarmAdvisor(userMsgContent, { 
          products: filteredProducts, 
          invoices: filteredInvoices, 
          boutiques: userBoutique === 'Toutes' ? boutiques : boutiques.filter(b => b.id === userBoutique), 
          employees: filteredEmployees, 
          expenses: filteredExpenses 
      });
      
      // Attempt to parse JSON Report
      let isReport = false;
      try {
        // 1. Try to find JSON within markdown code blocks first
        const codeBlockMatch = responseContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        let jsonString = '';
        
        if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1];
        } else {
            // 2. Fallback: Find the first outer-most JSON object
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            jsonString = jsonMatch ? jsonMatch[0] : responseContent;
        }

        // Clean up any potential trailing commas or comments if necessary (basic cleanup)
        // For now, rely on clean output or robust parsing
        const jsonResponse = JSON.parse(jsonString);

        if (jsonResponse.type === 'REPORT') {
            isReport = true;
            const newReport: Report = {
                id: Date.now().toString(),
                title: jsonResponse.title || 'Nouveau Rapport',
                category: jsonResponse.category || 'AUTRE',
                date: new Date().toISOString(),
                sections: jsonResponse.sections || [],
                isPinned: false
            };
            setReports(prev => [newReport, ...prev]);
            setSelectedReport(newReport);
            setShowReportsPanel(true);

            const assistantMsg: Message = { 
                role: 'assistant', 
                content: `📊 J'ai généré un nouveau rapport : **${newReport.title}**. \n\nVous pouvez le consulter dans le panneau d'analyses.`, 
                timestamp: Date.now() 
            };
            const finalMessages = [...updatedMessages, assistantMsg];
            setMessages(finalMessages);
            
            const currentConv = conversations.find(c => c.id === currentConversationId);
            if (currentConv) {
                await saveConversation({
                    ...currentConv,
                    messages: finalMessages,
                    updatedAt: Date.now()
                });
            }
        }
      } catch (e) {
        // Not a JSON report, ignore and treat as text
        console.log("Failed to parse potential report JSON", e);
      }

      if (!isReport) {
        const assistantMsg: Message = { role: 'assistant', content: responseContent, timestamp: Date.now() };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);

        const currentConv = conversations.find(c => c.id === currentConversationId);
        if (currentConv) {
            let title = currentConv.title;
            if (messages.length <= 1) {
               title = userMsgContent.slice(0, 30) + (userMsgContent.length > 30 ? '...' : '');
            }
            await saveConversation({
                ...currentConv,
                title,
                messages: finalMessages,
                updatedAt: Date.now()
            });
        }
      }

    } catch (error) {
      console.error("Error asking advisor:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur s'est produite lors de la communication avec l'assistant.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette conversation ?')) {
      await deleteConversation(id);
      if (currentConversationId === id) {
        startNewChat();
      }
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleConvertToReport = (content: string) => {
    const newReport: Report = {
        id: Date.now().toString(),
        title: 'Rapport Converti',
        category: 'AUTRE',
        date: new Date().toISOString(),
        sections: [{
            id: 'sec1',
            type: 'text',
            title: 'Contenu',
            content: content
        }],
        isPinned: false
    };
    setReports(prev => [newReport, ...prev]);
    setSelectedReport(newReport);
    setShowReportsPanel(true);
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce rapport ?')) {
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReport?.id === id) setSelectedReport(null);
    }
  };

  const handlePinReport = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, isPinned: !r.isPinned } : r));
  };

  const handleDownloadReport = (report: Report) => {
    let htmlContent = `
        <html>
        <head>
            <title>${report.title}</title>
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; font-size: 24px; }
                .meta { color: #6b7280; margin-bottom: 40px; font-size: 14px; }
                .section { margin-bottom: 32px; break-inside: avoid; }
                h2 { color: #111827; font-size: 18px; margin-bottom: 12px; font-weight: 600; }
                .chart-placeholder { background: #f9fafb; border: 1px dashed #e5e7eb; padding: 24px; text-align: center; color: #6b7280; border-radius: 8px; font-size: 14px; }
                p { margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
                th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; color: #374151; }
                td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <h1>${report.title}</h1>
            <div class="meta">
                Généré le ${new Date(report.date).toLocaleDateString()} par Smart Agro IA<br/>
                Catégorie: ${report.category || 'Général'}
            </div>
    `;

    report.sections.forEach(section => {
        htmlContent += `<div class="section">`;
        if (section.title) htmlContent += `<h2>${section.title}</h2>`;
        
        if (section.type === 'text' && section.content) {
            // Simple markdown to HTML conversion for print
            const formattedContent = section.content
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
                .replace(/\n/gim, '<br />');
            htmlContent += `<p>${formattedContent}</p>`;
        } else if (section.type === 'chart') {
            htmlContent += `<div class="chart-placeholder">[Graphique: ${section.chartType} - Voir application pour détails]</div>`;
            if (section.data) {
                htmlContent += `<table><thead><tr><th>Nom</th><th style="text-align:right">Valeur</th></tr></thead><tbody>`;
                section.data.forEach(d => {
                    htmlContent += `<tr><td>${d.name}</td><td style="text-align:right">${d.value}</td></tr>`;
                });
                htmlContent += `</tbody></table>`;
            }
        }
        htmlContent += `</div>`;
    });

    htmlContent += `<script>window.onload = function() { window.print(); }</script></body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full max-w-[1600px] mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative font-sans">
      
      {/* --- SIDEBAR HISTORY --- */}
      <aside className={`absolute lg:relative z-40 h-full bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 ${showHistory ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 overflow-hidden'}`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-farm-600)] flex items-center justify-center shadow-sm shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-base tracking-tight truncate">Historique</span>
          </div>
          <button onClick={() => setShowHistory(false)} className="lg:hidden p-1 hover:bg-gray-200 rounded-md">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="p-3">
          <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-[var(--color-farm-50)] hover:border-[var(--color-farm-200)] hover:text-[var(--color-farm-700)] transition-all shadow-sm font-medium text-sm">
            <Plus className="w-4 h-4" /> Nouvelle Analyse
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setCurrentConversationId(conv.id)}
              className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${currentConversationId === conv.id ? 'bg-[var(--color-farm-50)] border border-[var(--color-farm-100)] text-[var(--color-farm-900)]' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <MessageSquare className={`w-4 h-4 shrink-0 ${currentConversationId === conv.id ? 'text-[var(--color-farm-600)]' : 'text-gray-400'}`} />
              <div className="truncate flex-1">
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-[10px] opacity-70">{new Date(conv.updatedAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all absolute right-2"
                title="Supprimer la conversation"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header Navigation */}
        <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" title={showHistory ? "Masquer l'historique" : "Afficher l'historique"}>
              <History className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Assistant DJATSA <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowReportsPanel(!showReportsPanel)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showReportsPanel ? 'bg-[var(--color-farm-50)] text-[var(--color-farm-700)] border border-[var(--color-farm-200)]' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
             >
               <Layout className="w-4 h-4" /> <span className="hidden md:block">Analyses</span>
             </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gray-800' : 'bg-[var(--color-farm-600)]'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                
                <div className={`relative group p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                  ? 'bg-white text-gray-800 rounded-tr-none border-gray-200' 
                  : 'bg-white text-gray-800 rounded-tl-none border-gray-200'
                }`}>
                  <div className="prose prose-sm max-w-none prose-p:mb-2 last:prose-p:mb-0 text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {/* Message Actions */}
                  {msg.role === 'assistant' && (
                    <div className="absolute -bottom-3 right-2 flex items-center gap-1 bg-white border border-gray-200 shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedIndex(idx); setTimeout(() => setCopiedIndex(null), 2000); }} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-[var(--color-farm-600)] transition-colors" title="Copier">
                        {copiedIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={() => handleConvertToReport(msg.content)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-[var(--color-farm-600)] transition-colors" title="Créer un rapport">
                        <FilePlus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 ml-2">
               <div className="w-8 h-8 rounded-full bg-[var(--color-farm-50)] flex items-center justify-center">
                 <Loader2 className="w-4 h-4 text-[var(--color-farm-600)] animate-spin" />
               </div>
               <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                 <span className="text-xs font-medium text-gray-500">Analyse en cours...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto relative">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 focus-within:bg-white focus-within:border-[var(--color-farm-500)] focus-within:ring-1 focus-within:ring-[var(--color-farm-500)] transition-all duration-200">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez votre question ou demandez une analyse..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-700 text-sm px-3 py-3 max-h-32 overflow-y-auto"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`p-2.5 rounded-lg transition-all duration-200 shrink-0 ${input.trim() ? 'bg-[var(--color-farm-600)] text-white hover:bg-[var(--color-farm-700)] shadow-sm' : 'bg-gray-200 text-gray-400'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2">L'IA peut faire des erreurs. Vérifiez les informations critiques.</p>
          </div>
        </div>
      </main>

      {/* --- DASHBOARD REPORTS PANEL --- */}
      {showReportsPanel && (
        <aside className="w-96 bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300 z-30">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[var(--color-farm-600)]" /> Analyses
              </h3>
              <button onClick={() => setShowReportsPanel(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar no-scrollbar">
              {['ALL', 'VENTES', 'STOCK', 'FINANCE'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setReportCategoryFilter(filter)}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all border ${reportCategoryFilter === filter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {reports.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">Aucun rapport</p>
                <p className="text-xs text-gray-400 mt-1">Les rapports générés apparaîtront ici.</p>
              </div>
            ) : (
              reports.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1).map(report => (
                <div 
                  key={report.id}
                  onClick={() => { setSelectedReport(report); setIsFullScreenReport(true); }}
                  className={`group p-4 rounded-xl border bg-white transition-all duration-200 cursor-pointer hover:shadow-md ${selectedReport?.id === report.id ? 'border-[var(--color-farm-500)] ring-1 ring-[var(--color-farm-500)]' : 'border-gray-100 hover:border-[var(--color-farm-200)]'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(report.date).toLocaleDateString()}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePinReport(report.id); }}
                            className={`p-1 rounded hover:bg-gray-100 ${report.isPinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                            title={report.isPinned ? "Désépingler" : "Épingler"}
                        >
                            <Pin className="w-3 h-3" fill={report.isPinned ? "currentColor" : "none"} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"
                            title="Supprimer"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-[var(--color-farm-700)]">{report.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                     <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">{report.category || 'AUTRE'}</span>
                     <span>• {report.sections.length} sections</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* --- FULL SCREEN REPORT (DASHBOARD MODE) --- */}
      {isFullScreenReport && selectedReport && (
        <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col animate-in zoom-in-95 duration-300">
          <nav className="h-16 px-6 border-b bg-white flex items-center justify-between shadow-sm">
            <button onClick={() => setIsFullScreenReport(false)} className="flex items-center gap-2 text-gray-600 font-medium hover:text-[var(--color-farm-600)] transition-colors">
              <ChevronLeft className="w-5 h-5" /> Retour
            </button>
            <div className="flex items-center gap-2">
               <button onClick={() => handleDownloadReport(selectedReport)} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-farm-600)] text-white rounded-lg font-medium shadow-sm hover:bg-[var(--color-farm-700)] transition-all text-sm">
                 <Download className="w-4 h-4" /> Exporter PDF
               </button>
               <button onClick={() => setIsFullScreenReport(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-all">
                 <X className="w-5 h-5" />
               </button>
            </div>
          </nav>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
              <header className="text-center space-y-2 mb-8">
                <span className="px-3 py-1 bg-[var(--color-farm-50)] text-[var(--color-farm-700)] rounded-full text-[10px] font-bold uppercase tracking-widest border border-[var(--color-farm-100)]">Rapport d'Analyse</span>
                <h1 className="text-3xl font-bold text-gray-900">{selectedReport.title}</h1>
                <p className="text-gray-500 text-sm">Généré le {new Date(selectedReport.date).toLocaleString('fr-FR')}</p>
              </header>

              <div className="grid grid-cols-1 gap-6">
                {selectedReport.sections.map((section) => (
                  <div key={section.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                      {section.type === 'chart' ? <BarChartIcon className="w-4 h-4 text-[var(--color-farm-600)]" /> : <FileText className="w-4 h-4 text-[var(--color-farm-600)]" />}
                      {section.title}
                    </h3>
                    
                    {section.type === 'text' && (
                      <>
                        {editingSection?.sectionId === section.id ? (
                            <div className="space-y-3">
                                <textarea 
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-farm-500)] outline-none min-h-[150px] font-sans"
                                    value={editingSection.content}
                                    onChange={(e) => setEditingSection({...editingSection, content: e.target.value})}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingSection(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                                    <button 
                                        onClick={() => {
                                            if (!editingSection) return;
                                            setReports(prev => prev.map(r => {
                                                if (r.id === editingSection.reportId) {
                                                    return {
                                                        ...r,
                                                        sections: r.sections.map(s => s.id === editingSection.sectionId ? { ...s, content: editingSection.content } : s)
                                                    };
                                                }
                                                return r;
                                            }));
                                            if (selectedReport?.id === editingSection.reportId) {
                                                setSelectedReport(prev => prev ? {
                                                    ...prev,
                                                    sections: prev.sections.map(s => s.id === editingSection.sectionId ? { ...s, content: editingSection.content } : s)
                                                } : null);
                                            }
                                            setEditingSection(null);
                                        }} 
                                        className="px-3 py-1.5 bg-[var(--color-farm-600)] text-white rounded-lg text-sm hover:bg-[var(--color-farm-700)] transition-colors flex items-center gap-1"
                                    >
                                        <Save className="w-3 h-3" /> Enregistrer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                                    <ReactMarkdown>{section.content || ''}</ReactMarkdown>
                                </div>
                                <button 
                                    onClick={() => setEditingSection({ reportId: selectedReport.id, sectionId: section.id, content: section.content || '' })}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[var(--color-farm-600)] transition-all"
                                    title="Éditer cette section"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                      </>
                    )}

                    {section.type === 'chart' && (
                      <div className="h-[350px] w-full bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <ResponsiveContainer width="100%" height="100%">
                          {section.chartType === 'pie' ? (
                            <PieChart>
                              <Pie data={section.data} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                {section.data?.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                          ) : (
                            <BarChart data={section.data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};