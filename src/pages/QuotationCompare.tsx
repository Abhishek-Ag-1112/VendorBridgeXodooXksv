import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData, RFQ, Quotation } from '../context/DataContext';
import { 
  Scale, 
  Star, 
  Clock, 
  Check, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles,
  Send,
  X,
  Bot,
  Loader2
} from 'lucide-react';

export const QuotationCompare: React.FC = () => {
  const { rfqs, quotations, vendors, createPOFromQuotation } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfqId');

  const [selectedRfqId, setSelectedRfqId] = useState(rfqId || '');
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [rfqQuotes, setRfqQuotes] = useState<Quotation[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Handle updates when RFQ list or URL params change
  useEffect(() => {
    const currentId = rfqId || selectedRfqId;
    if (currentId) {
      const foundRfq = rfqs.find(r => r.id === currentId);
      if (foundRfq) {
        setRfq(foundRfq);
        // Find all quotations submitted for this RFQ
        const relatedQuotes = quotations.filter(q => q.rfqId === currentId);
        setRfqQuotes(relatedQuotes);
      } else {
        setRfq(null);
        setRfqQuotes([]);
      }
    }
  }, [rfqId, selectedRfqId, rfqs, quotations]);

  // Find lowest price for a specific line item across all quotes
  const getLowestItemPrice = (itemId: string) => {
    if (rfqQuotes.length === 0) return 0;
    const prices = rfqQuotes.map(q => {
      const item = q.items.find(i => i.itemId === itemId);
      return item ? item.unitPrice : Infinity;
    });
    return Math.min(...prices);
  };

  // Find lowest total bid price across all quotes
  const getLowestTotal = () => {
    if (rfqQuotes.length === 0) return 0;
    const totals = rfqQuotes.map(q => {
      return q.items.reduce((sum, qi) => {
        const rfqItem = rfq?.items.find(ri => ri.id === qi.itemId);
        const qty = rfqItem ? rfqItem.qty : 0;
        return sum + (qty * qi.unitPrice);
      }, 0);
    });
    return Math.min(...totals);
  };

  // Find fastest delivery timeline across all quotes
  const getFastestDelivery = () => {
    if (rfqQuotes.length === 0) return 0;
    return Math.min(...rfqQuotes.map(q => q.deliveryTimelineDays));
  };

  // Select Quote & create PO
  const handleSelectVendor = async (quoteId: string) => {
    if (!rfq) return;
    setIsSubmitting(true);
    try {
      await createPOFromQuotation(rfq.id, quoteId);
      setSuccessMsg('Purchase Order generated successfully. Routing for Manager approval!');
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg('');
        navigate('/purchase-orders');
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  // AI Advisor Panel states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I am your AI Procurement Advisor. Ask me to compare these quotations, calculate pricing indexes, analyze delivery terms, or recommend the best supplier choice.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Streaming call to Groq Llama 3.1 API
  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiThinking) return;

    const userQuestion = aiInput;
    setAiInput('');
    
    // Add user message to chat history
    const newHistory = [...chatHistory, { role: 'user' as const, content: userQuestion }];
    setChatHistory(newHistory);
    setIsAiThinking(true);

    // Add a placeholder message for AI streaming response
    setChatHistory(prev => [...prev, { role: 'assistant' as const, content: '' }]);

    try {
      // Structure the data to pass to the model
      const formattedData = {
        rfq: rfq ? {
          title: rfq.title,
          description: rfq.description,
          items: rfq.items
        } : null,
        quotations: rfqQuotes.map(q => ({
          supplierName: q.vendorName,
          deliveryTimelineDays: q.deliveryTimelineDays,
          items: q.items.map(qi => {
            const item = rfq?.items.find(ri => ri.id === qi.itemId);
            return {
              itemName: item ? item.name : 'Unknown',
              quantity: item ? item.qty : 0,
              unitPrice: qi.unitPrice,
              totalLinePrice: (item ? item.qty : 0) * qi.unitPrice
            };
          }),
          totalBidAmount: q.items.reduce((sum, qi) => {
            const item = rfq?.items.find(ri => ri.id === qi.itemId);
            return sum + ((item ? item.qty : 0) * qi.unitPrice);
          }, 0),
          notes: q.notes
        }))
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are a procurement advisor. Analyze these vendor quotations and give a concise recommendation.' },
            { role: 'user', content: `Question: ${userQuestion}\n\nQuotations Data: ${JSON.stringify(formattedData, null, 2)}` }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) {
        throw new Error('Response stream reader is not available');
      }

      setIsAiThinking(false); // remove thinking state once streaming chunks start

      let done = false;
      let accumulatedResponse = '';
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: !done });
        
        buffer += chunk;
        let boundary = buffer.indexOf('\n');
        
        while (boundary !== -1) {
          const line = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 1);
          boundary = buffer.indexOf('\n');
          
          if (line === '') continue;
          if (line.includes('[DONE]')) continue;
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6);
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices[0]?.delta?.content || '';
              if (delta) {
                accumulatedResponse += delta;
                setChatHistory(prev => {
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
              // ignore incomplete JSON chunks
            }
          }
        }
      }

    } catch (err: any) {
      console.error('Groq API Error:', err);
      setIsAiThinking(false);
      setChatHistory(prev => {
        const updated = [...prev];
        const errorMessage = `⚠️ Error calling AI Advisor: ${err.message || 'Connection failed. Please check your API configuration.'}`;
        
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && updated[updated.length - 1].content === '') {
          updated[updated.length - 1] = { role: 'assistant', content: errorMessage };
        } else {
          updated.push({ role: 'assistant', content: errorMessage });
        }
        return updated;
      });
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isAiOpen) {
      const container = document.getElementById('chat-history-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [chatHistory, isAiOpen]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter RFQs suitable for comparison
  const compareableRfqs = rfqs.filter(r => r.status === 'pending_responses' || r.status === 'comparison');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-outfit text-xl font-extrabold text-slate-900">Commercial Quote Comparison</h2>
        <p className="text-xs text-slate-500">Analyze commercial bids, highlight lowest costs, and generate purchase contracts</p>
      </div>

      {/* Selector if no RFQ parameter in URL */}
      {!rfqId && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium">
          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Select RFQ to Compare</label>
          <select
            value={selectedRfqId}
            onChange={(e) => setSelectedRfqId(e.target.value)}
            className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary"
          >
            <option value="">-- Choose an RFQ --</option>
            {compareableRfqs.map(r => (
              <option key={r.id} value={r.id}>{r.title} ({quotations.filter(q => q.rfqId === r.id).length} bids)</option>
            ))}
          </select>
        </div>
      )}

      {rfq ? (
        <div className="space-y-6">
          {/* RFQ Header metadata */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase bg-blue-50 px-2 py-0.5 border border-blue-100 rounded">
                Active RFQ
              </span>
              <h3 className="font-outfit text-base font-bold text-slate-900 mt-1.5">{rfq.title}</h3>
              <p className="text-xs text-slate-500">{rfq.description}</p>
            </div>
            <div className="text-left md:text-right font-medium">
              <span className="block text-[10px] text-slate-400 uppercase">Bids Received</span>
              <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{rfqQuotes.length} Supplier Quotes</span>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 text-xs font-semibold text-success bg-success-light border border-success/20 rounded-lg flex items-center space-x-2 animate-fade-in">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {rfqQuotes.length > 0 ? (
            // Side-by-side comparison matrix
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-premium">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-4 min-w-[200px]">Commercial Metrics</th>
                    {rfqQuotes.map((q) => {
                      const rating = vendors.find(v => v.id === q.vendorId)?.rating || 5.0;
                      return (
                        <th key={q.id} className="p-4 min-w-[220px] border-l border-slate-100 text-center">
                          <div className="text-sm font-extrabold text-slate-900">{q.vendorName}</div>
                          <div className="flex items-center justify-center space-x-1 mt-1 text-[10px] text-amber-500 font-bold">
                            <Star className="h-3 w-3 fill-amber-500" />
                            <span>{rating.toFixed(1)} / 5.0</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {/* Delivery Timeline row */}
                  <tr className="hover:bg-slate-50/20">
                    <td className="p-4 font-bold text-slate-700">Delivery Timeline</td>
                    {rfqQuotes.map((q) => {
                      const isFastest = q.deliveryTimelineDays === getFastestDelivery();
                      return (
                        <td key={q.id} className={`p-4 text-center border-l border-slate-100 ${isFastest ? 'bg-success-light text-success font-extrabold' : 'text-slate-600'}`}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{q.deliveryTimelineDays} Days</span>
                          </div>
                          {isFastest && <span className="text-[8px] uppercase tracking-wider block mt-0.5">Fastest Delivery</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Line Item Pricing rows */}
                  {rfq.items.map((item) => {
                    const lowestPrice = getLowestItemPrice(item.id);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/20">
                        <td className="p-4 font-medium">
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <span className="block text-[10px] text-slate-400 font-medium">Qty: {item.qty} units</span>
                        </td>
                        {rfqQuotes.map((q) => {
                          const itemQuote = q.items.find(qi => qi.itemId === item.id);
                          const price = itemQuote ? itemQuote.unitPrice : 0;
                          const isLowest = price === lowestPrice;
                          return (
                            <td 
                              key={q.id} 
                              className={`p-4 text-center border-l border-slate-100 font-mono ${
                                isLowest ? 'bg-success-light text-success font-bold' : 'text-slate-600'
                              }`}
                            >
                              <div>{formatCurrency(price)} / unit</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Total: {formatCurrency(price * item.qty)}</div>
                              {isLowest && <span className="text-[8px] uppercase font-bold tracking-wider block mt-0.5">Lowest Price</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Total Bid Summary Row */}
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="p-4 text-slate-700 uppercase tracking-wider text-[10px]">Total Contract Value</td>
                    {rfqQuotes.map((q) => {
                      const total = q.items.reduce((sum, qi) => {
                        const rfqItem = rfq.items.find(ri => ri.id === qi.itemId);
                        const qty = rfqItem ? rfqItem.qty : 0;
                        return sum + (qty * qi.unitPrice);
                      }, 0);
                      const isLowestTotal = total === getLowestTotal();
                      return (
                        <td 
                          key={q.id} 
                          className={`p-4 text-center border-l border-slate-100 font-mono text-sm ${
                            isLowestTotal ? 'bg-success-light text-success font-extrabold' : 'text-slate-700'
                          }`}
                        >
                          <div>{formatCurrency(total)}</div>
                          {isLowestTotal && <span className="text-[8px] uppercase tracking-wider block mt-0.5 text-success">Best Deal (Lowest Bid)</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Vendor remarks notes row */}
                  <tr className="hover:bg-slate-50/20">
                    <td className="p-4 font-bold text-slate-700">Vendor Comments</td>
                    {rfqQuotes.map((q) => (
                      <td key={q.id} className="p-4 text-center border-l border-slate-100 text-slate-500 italic max-w-xs leading-relaxed">
                        {q.notes || '--'}
                      </td>
                    ))}
                  </tr>

                  {/* Select CTA buttons row */}
                  <tr className="bg-white border-t border-slate-100">
                    <td className="p-4 font-bold text-slate-700">Actions</td>
                    {rfqQuotes.map((q) => (
                      <td key={q.id} className="p-4 text-center border-l border-slate-100">
                        <button
                          onClick={() => handleSelectVendor(q.id)}
                          disabled={isSubmitting || rfq.status === 'po_created'}
                          className={`w-full flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition-all ${
                            rfq.status === 'po_created' 
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                              : 'bg-primary hover:bg-primary-hover shadow-primary/20'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          <span>{rfq.status === 'po_created' ? 'PO Generated' : 'Award Contract'}</span>
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            // No quotes submitted yet view
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-premium">
              <AlertTriangle className="h-10 w-10 mx-auto text-warning mb-3" />
              <p className="text-sm text-slate-500 font-semibold">No bidding quotations submitted yet.</p>
              <p className="text-xs text-slate-400 mt-1">Please log in as one of the assigned Vendors to submit price bids on this RFQ first.</p>
            </div>
          )}
        </div>
      ) : (
        // Initial dashboard view asking to select RFQ
        selectedRfqId === '' && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-premium">
            <Scale className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400 font-semibold">Please select a Request for Quotation (RFQ) from the selector above to analyze pricing matrices.</p>
          </div>
        )
      )}

      {/* Floating AI Procurement Panel */}
      {rfq && rfqQuotes.length > 0 && (
        <>
          {/* Floating Button */}
          {!isAiOpen && (
            <button
              onClick={() => setIsAiOpen(true)}
              className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-hover hover:to-indigo-700 text-white px-4.5 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 no-print"
            >
              <Sparkles className="h-4.5 w-4.5 animate-pulse text-yellow-300 animate-duration-1000" />
              <span className="text-xs font-bold font-outfit uppercase tracking-wider">Ask Procurement AI</span>
            </button>
          )}

          {/* Expandable Chat Drawer */}
          {isAiOpen && (
            <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up no-print">
              {/* Header */}
              <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-outfit tracking-wide">Procurement Advisor</h4>
                    <span className="text-[9px] text-slate-400 block font-semibold">Powered by Llama 3.1</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Chat Messages Log */}
              <div 
                id="chat-history-container"
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
              >
                {chatHistory.map((msg, index) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div 
                      key={index} 
                      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isAssistant ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-primary text-white'
                        }`}>
                          {isAssistant ? <Bot className="h-3.5 w-3.5" /> : 'U'}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs shadow-sm whitespace-pre-wrap leading-relaxed ${
                          isAssistant 
                            ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none' 
                            : 'bg-primary text-white rounded-tr-none'
                        }`}>
                          {msg.content === '' && isAiThinking ? (
                            <span className="italic text-slate-400 flex items-center">
                              <Loader2 className="h-3 w-3 animate-spin mr-1.5 text-primary" />
                              Analyzing data...
                            </span>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Loader block */}
                {isAiThinking && chatHistory[chatHistory.length - 1]?.content !== '' && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2 bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-[10px] font-bold text-slate-400 animate-pulse uppercase">AI is drafting advice...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleAskAi} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
                <input
                  type="text"
                  required
                  placeholder="Ask a question about these quotes..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isAiThinking}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isAiThinking || !aiInput.trim()}
                  className="p-2 bg-primary hover:bg-primary-hover disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
