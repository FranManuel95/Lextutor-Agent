/**
 * Lightweight i18n dictionaries. No framework — just typed strings keyed by
 * locale. Add new keys incrementally as strings come out of components.
 *
 * Why not next-intl / react-intl: those add runtime weight and build config
 * we don't need today. The app is Spanish-first, so "es" is authoritative
 * and "en" covers only the most visible surfaces. Expand when a second
 * locale is actually shipped to users.
 */

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

type Dictionary = {
  // Common
  loading: string;
  retry: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  close: string;

  // Nav
  progress: string;
  chat: string;
  quiz: string;
  exam: string;
  exams: string;
  leaderboard: string;

  // Progress page
  myProgress: string;
  totalQuestions: string;
  currentStreak: string;
  primaryArea: string;
  averageScore: string;
  examsCompleted: string;
  lastStudy: string;
  days: string;
  keepPracticing: string;

  // Leaderboard
  ranking: string;
  rankByScore: string;
  rankByStreak: string;

  // Admin
  dashboard: string;
  ragManagement: string;
  users: string;
  reports: string;
  adminPanel: string;

  // Errors
  somethingWrong: string;
  pageNotFound: string;
};

const es: Dictionary = {
  loading: "Cargando…",
  retry: "Reintentar",
  cancel: "Cancelar",
  save: "Guardar",
  delete: "Eliminar",
  edit: "Editar",
  close: "Cerrar",

  progress: "Mi Progreso",
  chat: "Chat",
  quiz: "Test Rápido",
  exam: "Examen Abierto",
  exams: "Evaluaciones",
  leaderboard: "Ranking",

  myProgress: "Mi Progreso",
  totalQuestions: "Total Preguntas",
  currentStreak: "Racha Actual",
  primaryArea: "Área Principal",
  averageScore: "Nota Media",
  examsCompleted: "Exámenes Realizados",
  lastStudy: "Último Estudio",
  days: "días",
  keepPracticing: "¡Sigue practicando!",

  ranking: "Ranking",
  rankByScore: "Nota media",
  rankByStreak: "Racha",

  dashboard: "Dashboard",
  ragManagement: "Gestión RAG",
  users: "Usuarios",
  reports: "Reportes",
  adminPanel: "Panel Admin",

  somethingWrong: "Algo salió mal",
  pageNotFound: "Página no encontrada",
};

const en: Dictionary = {
  loading: "Loading…",
  retry: "Retry",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",
  edit: "Edit",
  close: "Close",

  progress: "My Progress",
  chat: "Chat",
  quiz: "Quick Quiz",
  exam: "Open Exam",
  exams: "Assessments",
  leaderboard: "Leaderboard",

  myProgress: "My Progress",
  totalQuestions: "Total Questions",
  currentStreak: "Current Streak",
  primaryArea: "Primary Area",
  averageScore: "Average Score",
  examsCompleted: "Exams Completed",
  lastStudy: "Last Study",
  days: "days",
  keepPracticing: "Keep practicing!",

  ranking: "Ranking",
  rankByScore: "Average score",
  rankByStreak: "Streak",

  dashboard: "Dashboard",
  ragManagement: "RAG Management",
  users: "Users",
  reports: "Reports",
  adminPanel: "Admin Panel",

  somethingWrong: "Something went wrong",
  pageNotFound: "Page not found",
};

export const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: string | undefined): Dictionary {
  if (locale && (LOCALES as readonly string[]).includes(locale)) {
    return dictionaries[locale as Locale];
  }
  return dictionaries[DEFAULT_LOCALE];
}

/**
 * Resolve a preferred locale from an Accept-Language header value.
 * Returns the first supported locale from the header's priority list,
 * or DEFAULT_LOCALE if nothing matches.
 */
export function resolveLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0].toLowerCase().slice(0, 2));
  for (const lang of preferred) {
    if ((LOCALES as readonly string[]).includes(lang)) {
      return lang as Locale;
    }
  }
  return DEFAULT_LOCALE;
}
