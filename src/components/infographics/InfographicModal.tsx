'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SimpleErrorBoundary } from '@/components/ui/simple-error-boundary';

// Imports removed as part of migration to jsPDF
// Imports removed as part of migration to jsPDF

interface InfographicModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    topic: string;
}

export function InfographicModal({ isOpen, onClose, imageUrl, topic }: InfographicModalProps) {
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!imageUrl) return;

        // Convert Base64 to Blob URL for better performance/memory
        fetch(imageUrl)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
            })
            .catch(err => console.error("Error creating blob:", err));

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [imageUrl]);

    const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

    const handleDownloadPDF = async () => {
        if (!blobUrl) return;
        setIsGeneratingPDF(true);
        try {
            // Get image dimensions first
            const img = new Image();
            img.src = blobUrl;
            await new Promise((resolve) => { img.onload = resolve; });

            // Import jsPDF dynamically
            const jsPDF = (await import('jspdf')).default;

            // Create PDF with exact image dimensions
            const pdf = new jsPDF({
                orientation: img.width > img.height ? 'l' : 'p',
                unit: 'px',
                format: [img.width, img.height + 40] // Add 40px for footer
            });

            pdf.addImage(blobUrl, 'PNG', 0, 0, img.width, img.height);

            // Add footer
            pdf.setFontSize(Math.max(10, img.width / 50)); // Scale font relative to width
            pdf.setTextColor(100);
            pdf.text(
                `Generado por LexTutor AI - ${new Date().toLocaleDateString()}`,
                img.width / 2,
                img.height + 25,
                { align: 'center' }
            );

            pdf.save(`Resumen_${topic.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar PDF. Por favor intenta descargar la imagen.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (!imageUrl) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] h-[90vh] bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-0 overflow-hidden flex flex-col shadow-2xl">
                <div className="sr-only">
                    <h2 id="dialog-title">Vista previa de Infografía</h2>
                    <p id="dialog-desc">Muestra la infografía generada para descargar.</p>
                </div>
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">

                    {/* Descargar Imagen Directa */}
                    {blobUrl && (
                        <Button
                            asChild
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg gap-2"
                        >
                            <a href={blobUrl} download={`Infografia_${topic.replace(/\s+/g, '_')}.png`}>
                                <div className="w-4 h-4 bg-current mask-image" />
                                <Download className="w-4 h-4" />
                                <span className="hidden md:inline">Descargar Imagen</span>
                            </a>
                        </Button>
                    )}

                    {/* Descargar PDF (jsPDF) */}
                    <Button
                        size="sm"
                        onClick={handleDownloadPDF}
                        disabled={!blobUrl || isGeneratingPDF}
                        className="bg-law-gold text-slate-900 hover:bg-law-gold/80 font-bold shadow-lg gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden md:inline">
                            {isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                        </span>
                    </Button>

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
                <div className="flex-1 w-full h-full flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
                    {/* Container constrained by height first to avoid vertical clipping */}
                    <div className="relative h-full max-h-full w-auto max-w-full aspect-[9/16] bg-white/5 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex items-center justify-center">
                        {/* Realistic Mockup Effect */}
                        <img
                            src={imageUrl}
                            alt={`Infografía de ${topic}`}
                            className="max-w-full max-h-full object-contain shadow-md"
                        />
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
