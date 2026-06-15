import React, { useState } from 'react';
import { Star, Shield, Filter, MessageSquare, CheckCircle, AlertTriangle, User, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const ReviewPanel = ({ reviews, aiSummary, pros, cons, expertReviews }) => {
  const [showAll, setShowAll] = useState(false);
  
  const sentimentData = [
    { name: 'Positive', value: 68, color: '#22c55e' },
    { name: 'Neutral', value: 18, color: '#525252' },
    { name: 'Negative', value: 14, color: '#ef4444' },
  ];

  const attributeData = [
    { name: 'Display', value: 95 },
    { name: 'Battery', value: 82 },
    { name: 'Camera', value: 90 },
    { name: 'Performance', value: 88 },
    { name: 'Value', value: 75 },
  ];

  const displayPros = pros || ["Vibrant display", "Excellent cameras", "Compact form factor", "AI features", "Long support life"];
  const displayCons = cons || ["Base storage", "Slight heating under load", "No charger in box", "Incremental upgrade"];
  const displayExpertReviews = expertReviews || [
    { pub: "GSMArena", score: "4.5/5", text: "The flagship of your dreams. Perfect ergonomics meets raw power." },
    { pub: "The Verge", score: "8/10", text: "Great features and display. Worth the investment." },
  ];
  const displayAiSummary = aiSummary || "Overall, users are highly impressed with this product's quality and performance. The consensus is positive across most review metrics.";

  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

  return (
    <div className="space-y-12">
      {/* AI Summary Header */}
      <div className="bg-neutral-900 rounded-3xl p-8 border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <MessageSquare size={100} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
               <Shield size={20} />
            </div>
            <h3 className="text-xl font-bold text-white">🤖 AI Review Intelligence</h3>
          </div>
          
          <p className="text-lg text-neutral-300 leading-relaxed mb-8 italic">
            "{displayAiSummary}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Sentiment Analysis</p>
              <div className="space-y-4">
                {sentimentData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-neutral-400">{item.name}</span>
                      <span className="text-white">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full">
                      <div className="h-2 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Attribute Ratings</p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attributeData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#737373' }} width={80} />
                    <Bar dataKey="value" fill="#a3a3a3" radius={[0, 4, 4, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-6">
          <h4 className="flex items-center space-x-2 text-green-500 font-bold mb-4">
            <CheckCircle size={18} />
            <span>Pros</span>
          </h4>
          <ul className="space-y-3">
            {displayPros.map((pro, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm text-green-400/80">
                <span className="mt-1 w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
          <h4 className="flex items-center space-x-2 text-red-500 font-bold mb-4">
            <AlertTriangle size={18} />
            <span>Cons</span>
          </h4>
          <ul className="space-y-3">
            {displayCons.map((con, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm text-red-400/80">
                <span className="mt-1 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Review List */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-white">Genuine Reviews</h3>
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full">1,203 Genuine</span>
            <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full">1,644 Filtered</span>
          </div>
        </div>

        <div className="space-y-6">
          {displayedReviews.map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 relative"
            >
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-500">
                    <User size={20} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{review.reviewer}</h5>
                    <div className="flex items-center space-x-2">
                       <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-600">{review.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {review.verified && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-md">VERIFIED</span>
                   )}
                   <span className="px-2 py-1 bg-neutral-800 text-neutral-500 text-[10px] font-bold rounded-md uppercase tracking-wider">{review.source}</span>
                   <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${review.genuine_score > 90 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                     {review.genuine_score}% Genuine
                   </span>
                </div>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {review.text}
              </p>
            </motion.div>
          ))}
        </div>

        {!showAll && reviews.length > 5 && (
          <button 
            onClick={() => setShowAll(true)}
            className="w-full mt-8 py-4 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 hover:text-white hover:border-neutral-600 transition-all font-bold"
          >
            Show All Reviews
          </button>
        )}
      </div>

      {/* Expert Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayExpertReviews.map((expert, idx) => (
          <div key={idx} className="bg-neutral-900 text-white p-6 rounded-2xl border border-neutral-800">
             <div className="flex justify-between items-center mb-4">
               <h5 className="font-bold text-lg">{expert.pub}</h5>
               <span className="text-neutral-400 font-black">{expert.score}</span>
             </div>
             <p className="text-neutral-500 text-sm italic mb-4">"{expert.text}"</p>
             <button className="flex items-center space-x-1 text-xs font-bold text-neutral-400 hover:text-white transition-colors">
               <span>Read Review</span>
               <ExternalLink size={12} />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewPanel;
