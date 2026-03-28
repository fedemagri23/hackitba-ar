'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white text-black w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-black/10">
        <div className="p-6 border-b border-black/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold uppercase tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto style-scrollbar">
          <div className="prose prose-sm prose-gray max-w-none whitespace-pre-wrap leading-relaxed">
            {children}
          </div>
        </div>
        <div className="p-6 border-t border-black/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-black text-white font-bold uppercase tracking-widest text-sm hover:invert transition-all active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
