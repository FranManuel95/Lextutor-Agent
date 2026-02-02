export type ExamLevel = 'Insuficiente' | 'Aprobado' | 'Notable' | 'Sobresaliente'

export function getExamLevel(score: number): ExamLevel {
    if (score < 5.0) return 'Insuficiente'
    if (score < 7.0) return 'Aprobado'
    if (score < 9.0) return 'Notable'
    return 'Sobresaliente'
}

export function getLevelColor(level: ExamLevel): string {
    switch (level) {
        case 'Insuficiente': return 'bg-red-500/10 text-red-500 border-red-500/20'
        case 'Aprobado': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        case 'Notable': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        case 'Sobresaliente': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    }
}
