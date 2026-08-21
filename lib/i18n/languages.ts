import type { ContentLanguage } from "@/lib/types";

export const defaultLanguage: ContentLanguage = "English";
export const languageStorageKey = "adaptiva-ui-language";

export type LanguageMeta = {
  value: ContentLanguage;
  label: string;
  nativeLabel: string;
  locale: string;
  lang: string;
  dir: "ltr" | "rtl";
};

export const languageOptions: LanguageMeta[] = [
  { value: "English", label: "English", nativeLabel: "English", locale: "en-US", lang: "en", dir: "ltr" },
  { value: "Hindi", label: "Hindi", nativeLabel: "हिन्दी", locale: "hi-IN", lang: "hi", dir: "ltr" },
  { value: "Kannada", label: "Kannada", nativeLabel: "ಕನ್ನಡ", locale: "kn-IN", lang: "kn", dir: "ltr" },
  { value: "Urdu", label: "Urdu", nativeLabel: "اردو", locale: "ur-IN", lang: "ur", dir: "rtl" },
  { value: "Tamil", label: "Tamil", nativeLabel: "தமிழ்", locale: "ta-IN", lang: "ta", dir: "ltr" }
];

export function isContentLanguage(value: unknown): value is ContentLanguage {
  return typeof value === "string" && languageOptions.some((language) => language.value === value);
}

export function getLanguageMeta(language: ContentLanguage) {
  return languageOptions.find((item) => item.value === language) ?? languageOptions[0]!;
}

export function languageCode(language: ContentLanguage) {
  return getLanguageMeta(language).lang;
}

export function languageLocale(language: ContentLanguage) {
  return getLanguageMeta(language).locale;
}

export function languageDirection(language: ContentLanguage) {
  return getLanguageMeta(language).dir;
}
