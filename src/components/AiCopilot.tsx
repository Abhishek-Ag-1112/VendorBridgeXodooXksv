import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Send, Bot, X, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiCopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiCopilot: React.FC<AiCopilotProps> = ({ isOpen, onClose }) => {
  const { vendors, rfqs, quotations, purchaseOrders, invoices, activityLogs } = useData();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your VendorBridge AI Co-pilot. I have loaded the live ERP state and can answer questions about your vendors, active RFQs, purchase orders, spend analytics, or give general procurement advice. Ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    // Prepare state JSON context
    const stateContext = {
      totalVendors: vendors.length,
      vendors: vendors.map(v => ({
        id: v.id,
        name: v.name,
        contact: v.contactName,
        email: v.email,
        rating: v.rating.toFixed(1),
        categories: v.category,
        status: v.status
      })),
      rfqs: rfqs.map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        deadline: r.deadline,
        itemsCount: r.items.length,
        invitedVendors: r.assignedVendorIds.length
      })),
      quotations: quotations.map(q => ({
        id: q.id,
        rfqId: q.rfqId,
        vendor: q.vendorName,
        deliveryDays: q.deliveryTimelineDays,
        itemsCount: q.items.length
      })),
      purchaseOrders: purchaseOrders.map(p => ({
        id: p.id,
        poNumber: p.poNumber,
        vendorName: vendors.find(v => v.id === p.vendorId)?.name || 'Unknown',
        amount: p.totalAmount,
        status: p.status,
        createdAt: p.createdAt
      })),
      invoices: invoices.map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        amount: i.totalAmount,
        status: i.status,
        dueDate: i.dueDate
      })),
      recentLogs: activityLogs.slice(0, 5).map(l => ({
        action: l.action,
        user: l.user,
        timestamp: l.timestamp
      }))
    };

    // Construct System Prompt
    const systemPrompt = `You are a procurement assistant for VendorBridge. Here is the current system state: ${JSON.stringify(stateContext)}. Answer questions about vendors, RFQs, POs, and give procurement advice. Please be concise and professional.`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userText }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('No reader available');

      // Append placeholder assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      setLoading(false);

      let accumulatedResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the last incomplete line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine === 'data: [DONE]') continue;
          if (cleanLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(cleanLine.substring(6));
              const token = json.choices[0]?.delta?.content || '';
              if (token) {
                accumulatedResponse += token;
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      role: 'assistant',
                      content: accumulatedResponse
                    };
                  }
                  return updated;
                });
              }
            } catch (err) {
              // Ignore partial parsing errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error communicating with the AI server. Please verify your connection and try again.' }
      ]);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-left">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="font-outfit text-xs font-bold text-slate-800 tracking-wide uppercase">AI Co-pilot</h3>
            <span className="text-[9px] font-bold text-success uppercase tracking-widest block -mt-0.5">Live State Loaded</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start gap-2.5 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {m.role === 'user' ? 'U' : <Bot className="h-4 w-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none'
              }`}>
                {m.content ? (
                  <div className="whitespace-pre-line">{m.content}</div>
                ) : (
                  <div className="flex items-center space-x-1 py-1">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 text-slate-700 shadow-sm rounded-2xl rounded-tl-none">
                <div className="flex items-center space-x-1 py-1">
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Type a message or query app state..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 p-1 rounded-md bg-primary text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
