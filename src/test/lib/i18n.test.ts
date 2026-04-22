import { describe, it, expect } from "vitest";
import { DEFAULT_LOCALE, LOCALES, dictionaries, getDictionary, resolveLocale } from "@/lib/i18n";

describe("i18n dictionaries", () => {
  it("defines the same keys across all locales", () => {
    const esKeys = Object.keys(dictionaries.es).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(esKeys);
    }
  });

  it("getDictionary returns the requested locale when supported", () => {
    expect(getDictionary("en").progress).toBe("My Progress");
    expect(getDictionary("es").progress).toBe("Mi Progreso");
  });

  it("getDictionary falls back to default for unsupported locales", () => {
    expect(getDictionary("fr").progress).toBe(dictionaries[DEFAULT_LOCALE].progress);
    expect(getDictionary(undefined).progress).toBe(dictionaries[DEFAULT_LOCALE].progress);
    expect(getDictionary("").progress).toBe(dictionaries[DEFAULT_LOCALE].progress);
  });

  it("no value is an empty string", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(dictionaries[locale])) {
        expect(value, `${locale}.${key} is empty`).not.toBe("");
      }
    }
  });
});

describe("resolveLocale", () => {
  it("picks the first supported locale from Accept-Language", () => {
    expect(resolveLocale("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(resolveLocale("es-ES,es;q=0.9")).toBe("es");
  });

  it("falls back to default when no supported locale is present", () => {
    expect(resolveLocale("fr-FR,fr;q=0.9,de;q=0.8")).toBe(DEFAULT_LOCALE);
  });

  it("returns default for null / undefined / empty", () => {
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
  });

  it("ignores quality weights and picks first match", () => {
    // Picks "es" first — both supported, priority wins
    expect(resolveLocale("es;q=0.5,en;q=0.9")).toBe("es");
  });
});
