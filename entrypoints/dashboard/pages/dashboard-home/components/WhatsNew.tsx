import React from 'react';
import { Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WhatsNew: React.FC = () => {
  const updates = [
    {
      icon: <Globe className="h-4 w-4 text-primary" />,
      title: "Zero-Link™ Engine Alpha",
      description: "Detect Amazon's hidden relationship signals with 99.9% accuracy.",
      tag: "NEW"
    },
    {
      icon: <Shield className="h-4 w-4 text-emerald-500" />,
      title: "Privacy Fortress™ v2",
      description: "Enhanced proxy rotation and anti-fingerprinting protocols enabled.",
      tag: "IMPROVED"
    },
    {
      icon: <Zap className="h-4 w-4 text-blue-500" />,
      title: "Elite OS Dashboard",
      description: "Complete UI overhaul for maximum seller performance and clarity.",
      tag: "FEATURE"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-3xl border border-primary/20 p-6 relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary shadow-[0_0_20px_-5px_rgba(255,107,0,0.4)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
               <h3 className="text-lg font-black text-white tracking-tight">What's New</h3>
               <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Elite Edge OS Updates</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl px-3 group/btn">
            Full Changelog <ArrowRight className="ml-1.5 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="space-y-4">
          {updates.map((update, idx) => (
            <div key={idx} className="flex gap-4 p-3 rounded-2xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 group/item">
              <div className="mt-1">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-primary/30 transition-all">
                  {update.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">{update.title}</h4>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                    {update.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed truncate">{update.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-500 font-medium">You are running version <span className="text-white font-bold">Elite Edge 1.0.0 (Beta)</span></p>
        </div>
      </div>
    </div>
  );
};
