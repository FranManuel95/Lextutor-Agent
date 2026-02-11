'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { generateInfographicAction } from '@/app/(dashboard)/chat/actions/generate-infographic';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with @react-pdf/renderer
const InfographicModal = dynamic(
    () => import('./InfographicModal').then(mod => mod.InfographicModal),
    { ssr: false }
);

interface ReportTriggerProps {
    chatId: string;
}

export function ReportTrigger({ chatId }: ReportTriggerProps) {
    const { toast } = useToast();
    const [status, setStatus] = React.useState<'idle' | 'generating' | 'done'>('idle');
    const [data, setData] = React.useState<{ url: string, topic: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const handleGenerate = async () => {
        if (status === 'generating') return;

        setStatus('generating');
        toast({ title: "Generando Resumen Visual...", description: "Analizando conversación y diseñando infografía..." });

        try {
            const res = await generateInfographicAction(chatId);

            if (res.success && res.imageUrl && res.topic) {
                setData({ url: res.imageUrl, topic: res.topic });
                setStatus('done');
                console.log("✅ Infographic ready");
                toast({ title: "¡Examen Generado!", description: "Tu infografía está lista para descargar." });
            } else {
                setStatus('idle');
                const errMsg = res.error || "No se pudo generar el resumen.";
                toast({ title: "Error", description: errMsg, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            setStatus('idle');
            toast({ title: "Error", description: "Ocurrió un error inesperado al conectar con el servicio.", variant: "destructive" });
        }
    };

    return (
        <>
            <InfographicModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={data?.url || null}
                topic={data?.topic || "Resumen"}
            />

            {status === 'idle' && (
                <Button
                    onClick={handleGenerate}
                    className="bg-gradient-to-br from-law-gold to-yellow-600 hover:from-law-gold/90 hover:to-yellow-600/90 text-gem-onyx border-none gap-2 h-9 px-3 md:px-4 rounded-full text-xs font-bold shadow-lg shadow-law-gold/10 transition-all hover:scale-105"
                >
                    <FileText className="w-4 h-4" />
                    <span className="hidden md:inline">Generar Resumen</span>
                </Button>
            )}

            {status === 'generating' && (
                <Button
                    disabled
                    className="bg-law-gold/20 text-law-gold border border-law-gold/30 gap-2 h-9 px-3 md:px-4 rounded-full text-xs font-medium cursor-wait"
                >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden md:inline">Generando...</span>
                </Button>
            )}

            {status === 'done' && (
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 text-white hover:bg-green-700 border border-green-500 gap-2 h-9 px-3 md:px-4 rounded-full text-xs font-medium shadow-lg shadow-green-900/20 animate-in fade-in zoom-in duration-300"
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden md:inline">Resumen Generado</span>
                </Button>
            )}
        </>
    );
}
