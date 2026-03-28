'use client';

import { useState } from 'react';
import { CampaignConfig } from '@/lib/ar/tracking-types';
import Modal from '../ui/Modal';

interface ChallengeIntroProps {
  config: CampaignConfig;
  onStart: () => void;
}

export default function ChallengeIntro({ config, onStart }: ChallengeIntroProps) {
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full max-w-2xl flex flex-col items-start gap-12">
        {/* Brand Header */}
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] font-medium opacity-60">Campaña {config.brand}</span>
          <h1 className="text-5xl sm:text-7xl font-black uppercase italic tracking-tighter leading-none">
            {config.campaignName}
          </h1>
        </div>

        {/* Campaign Description & Prize */}
        <div className="space-y-6">
          <p className="text-xl sm:text-2xl font-light leading-relaxed opacity-80 border-l-2 border-white/20 pl-6">
            {config.campaignDescription}
          </p>
          <div className="bg-white text-black p-6 flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Premio</span>
            <p className="text-xl font-bold uppercase italic tracking-tight">{config.prize}</p>
          </div>
        </div>

        {/* Challenge Brief */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight italic underline decoration-white/20 underline-offset-8">
            {config.challengeTitle}
          </h2>
          <p className="text-lg opacity-60">
            {config.challengeDescription}
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full space-y-8 pt-8">
          <div className="flex items-start gap-4 p-4 border border-white/10 hover:border-white/30 transition-colors group">
            <div className="relative flex items-center h-5 pt-0.5">
              <input
                id="terms"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="w-5 h-5 bg-transparent border-2 border-white/20 checked:bg-white checked:border-white focus:ring-0 cursor-pointer transition-all appearance-none checked:after:content-['✓'] checked:after:text-black checked:after:text-sm checked:after:absolute checked:after:left-1 checked:after:top-[-2px] checked:after:font-bold"
              />
            </div>
            <label htmlFor="terms" className="text-sm cursor-pointer select-none">
              Acepto los{' '}
              <button 
                onClick={() => setShowTerms(true)}
                className="font-bold underline underline-offset-2 hover:text-white/70 transition-colors"
                type="button"
              >
                términos y condiciones
              </button>
              {' '}de la experiencia de realidad aumentada.
            </label>
          </div>

          <button
            disabled={!accepted}
            onClick={onStart}
            className={`
              w-full py-6 text-center text-xl font-black uppercase tracking-[0.2em] transition-all
              ${accepted 
                ? 'bg-white text-black hover:invert focus:scale-95' 
                : 'bg-white/10 text-white/20 cursor-not-allowed border border-white/5'}
            `}
          >
            Empezar
          </button>
        </div>
      </div>

      <Modal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title="Términos y Condiciones"
      >
        {config.termsAndConditions}
      </Modal>

      {/* Background Decor */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 border border-white/5 rounded-full pointer-events-none" />
      <div className="fixed -top-32 -left-32 w-64 h-64 border border-white/5 rounded-full pointer-events-none" />
    </div>
  );
}
