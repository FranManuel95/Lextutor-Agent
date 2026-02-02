import { create } from 'zustand'

export interface TutorSettings {
    area: 'laboral' | 'civil' | 'mercantil' | 'procesal' | 'otro' | 'general'
    modes: ('concise' | 'feynman' | 'quiz' | 'socratic' | 'steps' | 'citations' | 'caseMode' | 'memoryAware')[]
    detailLevel: 'brief' | 'normal' | 'extended'
    preset?: 'rapido' | 'aprender' | 'examen' | 'socratico'
}

interface AppState {
    isSending: boolean
    area: TutorSettings['area'] // Deprecated top-level area in favor of settings, but kept for compat if needed, synced
    studyMode: 'tutor' | 'examen' | 'socratic' // Legacy? We might map this to new modes
    tutorSettings: TutorSettings
    setIsSending: (isSending: boolean) => void
    setArea: (area: AppState['area']) => void
    setStudyMode: (mode: AppState['studyMode']) => void
    setTutorSettings: (settings: Partial<TutorSettings>) => void

    // Optimistic UI
    optimisticMessages: any[]
    addOptimisticMessage: (msg: any) => void
    removeOptimisticMessage: (id: string | number) => void
}

export const useAppStore = create<AppState>((set) => ({
    isSending: false,
    area: 'otro',
    studyMode: 'tutor',
    tutorSettings: {
        area: 'otro',
        modes: [],
        detailLevel: 'normal'
    },
    setIsSending: (isSending) => set({ isSending }),
    setArea: (area) => set((state) => ({
        area,
        tutorSettings: { ...state.tutorSettings, area }
    })),
    setStudyMode: (studyMode) => set({ studyMode }),
    setTutorSettings: (settings) => set((state) => ({
        tutorSettings: { ...state.tutorSettings, ...settings },
        // Sync top level area if participating
        ...(settings.area ? { area: settings.area } : {})
    })),

    // Optimistic UI
    optimisticMessages: [],
    addOptimisticMessage: (msg) => set((state) => ({
        optimisticMessages: [...state.optimisticMessages, msg]
    })),
    removeOptimisticMessage: (id) => set((state) => ({
        optimisticMessages: state.optimisticMessages.filter((m) => m.id !== id)
    })),
}))
