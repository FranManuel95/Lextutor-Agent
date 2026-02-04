'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { InfographicPDF } from './InfographicPDF';

// Dynamic import for PDFDownloadLink to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button disabled className="gap-2">Cargando PDF...</Button>,
    }
);

interface InfographicModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    topic: string;
}

export function InfographicModal({ isOpen, onClose, imageUrl, topic }: InfographicModalProps) {
    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] h-[90vh] bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-0 overflow-hidden flex flex-col shadow-2xl">

                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <PDFDownloadLink
                        document={<InfographicPDF imageUrl={imageUrl} topic={topic} />}
                        fileName={`Resumen_${topic.replace(/\s+/g, '_')}.pdf`}
                    >
                        {({ blob, url, loading, error }) => (
                            <Button
                                size="sm"
                                className="bg-law-gold text-slate-900 hover:bg-law-gold/80 font-bold shadow-lg gap-2"
                                disabled={loading}
                            >
                                <Download className="w-4 h-4" />
                                {loading ? 'Preparando...' : 'Descargar PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>

                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onClose}
                        className="bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Main Content (Image Preview) */}
                <div className="flex-1 w-full h-full flex items-center justify-center p-8 overflow-y-auto">
                    <div className="relative w-full max-w-3xl aspect-[9/16] bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Realistic Mockup Effect */}
                        <img
                            src={imageUrl}
                            alt={`Infografía de ${topic}`}
                            className="w-full h-full object-contain"
                        />
                        {/* Optional: Add a subtle 'paper' texture overlay if desired, but image is enough */}
                    </div>
                </div>

                {/* Footer Brand */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                    <p className="text-white/40 text-xs tracking-widest uppercase font-serif">Estudiante Elite • LexTutor AI</p>
                </div>

            </DialogContent>
        </Dialog>
    );
}
