import React from 'react';
import { 
  X, FileText, CheckCircle2, ChevronRight, Link as LinkIcon, Calendar
, TrendingUp, TrendingDown, Minus, Lightbulb, AlertTriangle} from 'lucide-react';
import { ReportData } from './App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: ReportData;
  ticker: string;
  onClose: () => void;
  durationSecs?: number;
  toolRuns?: number;
  tokenCount?: number;
  documentCount?: number;
}

const AnalysisCard = ({ title, subtext, children, className = "" }: any) => (
  <div className={`bg-white rounded p-6 border border-stone-200 flex flex-col ${className}`}>
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
    </div>
    {subtext && (
      <div className="text-stone-700 text-[15px] mb-6">
        {subtext}
      </div>
    )}
    <div className="flex-1 w-full flex flex-col">
      {children}
    </div>
  </div>
);

export default function ReportTemplate({ data, ticker, onClose, durationSecs = 0, toolRuns = 0, tokenCount = 0, documentCount = 0 }: Props) {
  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-[#0b5a4b]';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isINR = data.currency === 'INR' || ticker.toUpperCase().endsWith('.NS') || ticker.toUpperCase().endsWith('.BO');
  const currencySymbol = isINR ? '₹' : '$';
  const unitSuffix = isINR ? ' Cr' : 'B';
  const findings = data.findings || [];
  
  return (
    <div className="min-h-full bg-[#F6F4F0] text-stone-900 font-sans w-full flex flex-col h-full overflow-y-auto">
      <div className="w-full border-b border-stone-200 px-[40px] py-4 flex items-center justify-between sticky top-0 z-50 bg-[#F6F4F0]">
        <div className="font-display uppercase font-bold text-stone-900 text-lg tracking-wider flex items-center gap-2">
          {ticker} Document Analysis
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="text-stone-700 hover:text-stone-900 transition-colors flex items-center justify-center p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 py-8 px-[40px] w-full max-w-[1200px] mx-auto flex flex-col gap-6">
        
        {/* Executive Summary */}
        <div className="flex flex-col gap-6">
          <AnalysisCard title="Executive Summary" className="w-full">
            <div className="bg-stone-50 p-5 rounded-xl border border-stone-100 mb-6 text-stone-800 leading-relaxed font-medium text-lg w-full">
              "{data.verdict?.summary || 'No summary available.'}"
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-10 gap-8 w-full mt-2">
              <div className="md:col-span-7 flex flex-col">
                {data.verdict?.key_takeaways && (Array.isArray(data.verdict.key_takeaways) ? data.verdict.key_takeaways.length > 0 : true) && (
                  <div className="w-full text-left flex-1">
                     <div className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">Key Takeaways</div>
                     <div className="space-y-3">
                       {Array.isArray(data.verdict.key_takeaways) ? data.verdict.key_takeaways.map((takeaway, i) => (
                          <div key={i} className="flex gap-3 text-base">
                             <CheckCircle2 className="w-5 h-5 text-[#0b5a4b] shrink-0 mt-0.5" />
                             <div className="text-stone-700 leading-relaxed">{takeaway}</div>
                          </div>
                       )) : (
                          <div className="flex gap-3 text-base">
                             <CheckCircle2 className="w-5 h-5 text-[#0b5a4b] shrink-0 mt-0.5" />
                             <div className="text-stone-700 leading-relaxed">{String(data.verdict.key_takeaways)}</div>
                          </div>
                       )}
                     </div>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-3 flex flex-col h-full text-center md:border-l md:border-stone-100 md:pl-8">
                 <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-1">Conviction Score</h4>
                 <p className="text-xs text-stone-400 mb-4">Based on analyzed filings</p>
                 <div className={`text-6xl font-display font-bold mb-1 flex-1 flex items-center justify-center ${data.verdict ? scoreColor(data.verdict.conviction_score) : 'text-stone-400'}`}>
                    {data.verdict?.conviction_score || '-'}
                 </div>
                 
                 <div className="text-xs text-stone-500 uppercase tracking-widest font-bold mb-6">out of 100</div>
                 <div className="grid grid-cols-4 gap-1 border-t border-stone-100 pt-4 mt-auto w-full">
                   <div className="flex flex-col items-center">
                     <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Docs</div>
                     <div className="text-sm font-mono text-stone-800">{documentCount}</div>
                   </div>
                   <div className="flex flex-col items-center border-l border-stone-100">
                     <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Time</div>
                     <div className="text-sm font-mono text-stone-800">{durationSecs}s</div>
                   </div>
                   <div className="flex flex-col items-center border-l border-stone-100">
                     <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Runs</div>
                     <div className="text-sm font-mono text-stone-800">{toolRuns}</div>
                   </div>
                   <div className="flex flex-col items-center border-l border-stone-100">
                     <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mb-1">Tokens</div>
                     <div className="text-sm font-mono text-stone-800">
                        {tokenCount > 0 ? (tokenCount / 1000).toFixed(1) + 'k' : '-'}
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </AnalysisCard>
        </div>

        {/* Financial Charts */}
        {data.financial_charts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <AnalysisCard title="Stock Price" subtext={`This chart shows the closing price for the past four months on the last trading date (${currencySymbol}).`}>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.financial_charts.stock_price_4m ? [...data.financial_charts.stock_price_4m] : []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e4" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dx={-10} tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Price']}
                    />
                    <Line type="linear" dataKey="price" stroke="#0b5a4b" strokeWidth={2} dot={{ r: 4, fill: '#0b5a4b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnalysisCard>
            
            <AnalysisCard 
              title="Financial Performance"
              subtext={data.financial_charts.financial_performance_4q && data.financial_charts.financial_performance_4q.length > 0 && data.financial_charts.financial_performance_4q[0].distributions !== undefined 
                ? `This chart shows the quarterly distributions (${currencySymbol}) for the past four completed quarters.` 
                : isINR 
                  ? "This chart shows the quarterly revenue and net profit for the past four completed quarters (in ₹ Crores)." 
                  : "This chart shows the revenue and net income for the past four completed quarters."}
            >
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.financial_charts.financial_performance_4q ? [...data.financial_charts.financial_performance_4q] : []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e4" />
                    <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c' }} dx={-10} tickFormatter={(value) => data.financial_charts?.financial_performance_4q?.[0]?.distributions !== undefined ? `${currencySymbol}${value}` : `${currencySymbol}${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}${unitSuffix}`} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => name === 'Distributions' ? [`${currencySymbol}${value}`, name] : [`${currencySymbol}${value.toLocaleString()}${unitSuffix}`, name]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    {data.financial_charts.financial_performance_4q && data.financial_charts.financial_performance_4q.length > 0 && data.financial_charts.financial_performance_4q[0].distributions !== undefined ? (
                      <Bar dataKey="distributions" name="Distributions" fill="#10b981" radius={[4, 4, 0, 0]} barSize={48} />
                    ) : (
                      <>
                        <Bar dataKey="revenue" name={isINR ? "Revenue (Sales)" : "Revenue"} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                        <Bar dataKey="net_income" name={isINR ? "Net Profit" : "Net Income"} fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={32} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnalysisCard>
          </div>
        )}

        {/* Deep Insights */}
        {data.deep_insights && data.deep_insights.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-display font-bold text-stone-900 uppercase tracking-wider mb-6">Deep Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.deep_insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                   <div className="flex items-start justify-between mb-4 border-b border-stone-100 pb-4">
                     <div className="flex items-center gap-3">
                       <div>
                         <div className="text-xs text-stone-500 font-bold uppercase tracking-wider">{insight.category}</div>
                         <h4 className="font-bold text-stone-900 text-lg mt-0.5 leading-tight">{insight.title}</h4>
                       </div>
                     </div>
                   </div>
                   <div className="text-stone-700 leading-relaxed text-[15px] flex-1">{insight.description}</div>
                   <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                     <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Impact Score</span>
                     <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${insight.impact_score >= 8 ? 'bg-red-50 text-red-700' : insight.impact_score >= 5 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>{insight.impact_score}/10</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Findings */}
        <div className="mt-8">
           <h2 className="text-2xl font-display font-bold text-stone-900 uppercase tracking-wider mb-6">Document Findings</h2>
           
           {findings.length === 0 ? (
             <div className="text-stone-500 italic p-8 bg-white rounded border border-stone-200 text-center">
               No specific document findings returned.
             </div>
           ) : (
             <div className="flex flex-col gap-6">
               {findings.map((finding, index) => (
                 <div key={index} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col">
                   <div className="flex items-start justify-between mb-4 border-b border-stone-100 pb-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded bg-stone-100 text-stone-600 flex items-center justify-center">
                         <FileText className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-stone-900 text-lg">{finding.documentType || finding.document_type || "Document"}</h4>
                         {finding.date && (
                           <div className="text-xs text-stone-500 font-mono flex items-center gap-1 mt-1">
                             <Calendar className="w-3 h-3" /> {finding.date}
                           </div>
                         )}
                       </div>
                     </div>
                     {(finding.sourceUrl || finding.source_url) && (
                       <a href={finding.sourceUrl || finding.source_url} target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity flex items-center justify-center p-1" title="View Source">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg" alt="PDF" className="w-8 h-8" />
                       </a>
                     )}
                   </div>
                   
                   <ul className="space-y-3 mt-2 flex-1">
                     {Array.isArray(finding.keyInsights || finding.key_insights) ? (finding.keyInsights || finding.key_insights)?.map((insight, i) => (
                       <li key={i} className="flex gap-2 text-sm text-stone-700 leading-relaxed">
                         <ChevronRight className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                         <span>{insight}</span>
                       </li>
                     )) : (finding.keyInsights || finding.key_insights) ? (
                       <li className="flex gap-2 text-sm text-stone-700 leading-relaxed">
                         <ChevronRight className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                         <span>{String(finding.keyInsights || finding.key_insights)}</span>
                       </li>
                     ) : null}
                   </ul>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
