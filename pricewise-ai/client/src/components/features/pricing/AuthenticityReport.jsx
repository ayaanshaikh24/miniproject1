import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const AuthenticityReport = ({ signals, retailerBreakdown }) => {
  const displaySignals = signals || [
    { label: "Authorized Retailer Status", status: "pass", text: "Verified official distribution partner." },
    { label: "Price Anomaly Detection", status: "pass", text: "Price is within 5% of standard market value." },
    { label: "Seller History & Feedback", status: "warning", text: "Mixed reports for some marketplace sellers." },
    { label: "Product Traceability", status: "pass", text: "Global SKU matches official database." },
    { label: "Review Pattern Analysis", status: "pass", text: "Verified purchase reviews show consistent metadata." },
  ];

  const displayBreakdown = retailerBreakdown || [
    { r: "Amazon", s: "Appario Retail", v: "Official" },
    { r: "Flipkart", s: "RetailNet", v: "Verified" },
    { r: "Meesho", s: "Multiple", v: "Caution" },
    { r: "Reliance", s: "Reliance Retail", v: "Official" },
  ];

  return (
    <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
           <ShieldCheck size={40} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-white">Authenticity Report</h3>
            <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Genuine</span>
          </div>
          <p className="text-neutral-500">98% match confidence across identified signals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          {displaySignals.map((s, idx) => (
            <div key={idx} className="flex items-start space-x-4">
              <div className="mt-1">
                {s.status === 'pass' ? (
                  <CheckCircle2 color="#22c55e" size={20} />
                ) : (
                  <AlertCircle color="#f59e0b" size={20} />
                )}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{s.label}</p>
                <p className="text-neutral-500 text-xs">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800">
           <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
             <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Retailer Breakdown</span>
             <Info size={14} className="text-neutral-600" />
           </div>
           <table className="w-full text-left">
             <tbody className="divide-y divide-neutral-800">
               {displayBreakdown.map((row, idx) => (
                 <tr key={idx} className="text-sm">
                   <td className="px-6 py-3 font-bold text-neutral-300">{row.r}</td>
                   <td className="px-6 py-3 text-neutral-500">{row.s}</td>
                   <td className="px-6 py-3 text-right">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${
                       row.v === 'Official' ? 'text-blue-400' : 
                       row.v === 'Verified' ? 'text-green-500' : 'text-amber-500'
                     }`}>{row.v}</span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default AuthenticityReport;
