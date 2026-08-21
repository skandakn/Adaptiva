"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { fallbackTranslateText } from "@/lib/i18n/fallback-translations";
import {
  defaultLanguage,
  getLanguageMeta,
  isContentLanguage,
  languageStorageKey
} from "@/lib/i18n/languages";
import type { ContentLanguage } from "@/lib/types";

type TranslationStatus = "idle" | "translating";

type AppLanguageContextValue = {
  language: ContentLanguage;
  setLanguage: (language: ContentLanguage) => void;
  status: TranslationStatus;
};

type TranslationResponse = {
  translations?: Record<string, string>;
};

type TextItem = {
  node: Text;
  original: string;
  key: string;
};

type AttributeItem = {
  element: Element;
  attr: "placeholder" | "aria-label" | "title" | "alt";
  original: string;
  key: string;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

const SKIP_SELECTOR =
  "script, style, noscript, code, pre, textarea, input, option, [data-no-translate], [translate='no']";
const ATTRIBUTE_SKIP_SELECTOR =
  "script, style, noscript, code, pre, option, [data-no-translate], [translate='no']";
const TRANSLATABLE_ATTRS: AttributeItem["attr"][] = ["placeholder", "aria-label", "title", "alt"];

function normalizedKey(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function shouldTranslate(text: string) {
  const key = normalizedKey(text);
  if (key.length < 2 || key.length > 4000) return false;
  if (/^[\d\s.,:;!?()[\]{}'"`~@#$%^&*+=/\\|_-]+$/.test(key)) return false;
  return /[\p{L}\p{N}]/u.test(key);
}

function withOriginalSpacing(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function shouldSkipElement(element: Element | null) {
  return Boolean(element?.closest(SKIP_SELECTOR));
}

function shouldSkipAttributeElement(element: Element | null) {
  return Boolean(element?.closest(ATTRIBUTE_SKIP_SELECTOR));
}

function originalAttrName(attr: AttributeItem["attr"]) {
  return `data-i18n-original-${attr}`;
}

function collectTextItems(root: ParentNode, originals: WeakMap<Text, string>) {
  const items: TextItem[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    if (parent && !shouldSkipElement(parent) && shouldTranslate(node.nodeValue ?? "")) {
      if (!originals.has(node)) originals.set(node, node.nodeValue ?? "");
      const original = originals.get(node) ?? "";
      const key = normalizedKey(original);
      if (shouldTranslate(key)) items.push({ node, original, key });
    }
    current = walker.nextNode();
  }

  return items;
}

function collectAttributeItems(root: ParentNode) {
  const selector = TRANSLATABLE_ATTRS.map((attr) => `[${attr}]`).join(",");
  const elements = Array.from(root.querySelectorAll(selector));
  const items: AttributeItem[] = [];

  for (const element of elements) {
    if (shouldSkipAttributeElement(element)) continue;
    for (const attr of TRANSLATABLE_ATTRS) {
      const value = element.getAttribute(attr);
      if (!value || !shouldTranslate(value)) continue;

      const originalName = originalAttrName(attr);
      if (!element.hasAttribute(originalName)) {
        element.setAttribute(originalName, value);
      }

      const original = element.getAttribute(originalName) ?? value;
      const key = normalizedKey(original);
      if (shouldTranslate(key)) items.push({ element, attr, original, key });
    }
  }

  return items;
}

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<ContentLanguage>(defaultLanguage);
  const [status, setStatus] = useState<TranslationStatus>("idle");
  const languageRef = useRef(language);
  const textOriginals = useRef(new WeakMap<Text, string>());
  const cache = useRef(new Map<string, string>());
  const scanTimer = useRef<number | null>(null);

  const setLanguage = useCallback((nextLanguage: ContentLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
  }, []);

  const cacheKey = useCallback((targetLanguage: ContentLanguage, key: string) => {
    return `${targetLanguage}::${key}`;
  }, []);

  const cachedTranslation = useCallback(
    (targetLanguage: ContentLanguage, key: string) => {
      return cache.current.get(cacheKey(targetLanguage, key));
    },
    [cacheKey]
  );

  const rememberTranslations = useCallback(
    (targetLanguage: ContentLanguage, translations: Record<string, string>) => {
      Object.entries(translations).forEach(([key, value]) => {
        cache.current.set(cacheKey(targetLanguage, key), value);
      });
    },
    [cacheKey]
  );

  const applyItems = useCallback(
    (targetLanguage: ContentLanguage, textItems: TextItem[], attrItems: AttributeItem[]) => {
      for (const item of textItems) {
        if (!item.node.isConnected) continue;
        const translated =
          targetLanguage === "English"
            ? item.key
            : cachedTranslation(targetLanguage, item.key) ?? fallbackTranslateText(targetLanguage, item.key);
        const nextValue = withOriginalSpacing(item.original, translated);
        if (item.node.nodeValue !== nextValue) {
          item.node.nodeValue = nextValue;
        }
      }

      for (const item of attrItems) {
        if (!item.element.isConnected) continue;
        const translated =
          targetLanguage === "English"
            ? item.key
            : cachedTranslation(targetLanguage, item.key) ?? fallbackTranslateText(targetLanguage, item.key);
        if (item.element.getAttribute(item.attr) !== translated) {
          item.element.setAttribute(item.attr, translated);
        }
      }
    },
    [cachedTranslation]
  );

  const scanAndTranslate = useCallback(async () => {
    if (typeof document === "undefined") return;
    const root = document.body;
    const targetLanguage = languageRef.current;
    const textItems = collectTextItems(root, textOriginals.current);
    const attrItems = collectAttributeItems(root);

    if (targetLanguage === "English") {
      applyItems(targetLanguage, textItems, attrItems);
      setStatus("idle");
      return;
    }

    const keys = Array.from(new Set([...textItems, ...attrItems].map((item) => item.key)));
    const missing = keys.filter((key) => !cachedTranslation(targetLanguage, key));

    if (missing.length) {
      setStatus("translating");
      for (let index = 0; index < missing.length; index += 100) {
        const batch = missing.slice(index, index + 100);
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: targetLanguage, texts: batch })
          });
          const payload = (await response.json()) as TranslationResponse;
          if (response.ok && payload.translations) {
            rememberTranslations(targetLanguage, payload.translations);
          } else {
            rememberTranslations(
              targetLanguage,
              Object.fromEntries(batch.map((key) => [key, fallbackTranslateText(targetLanguage, key)]))
            );
          }
        } catch {
          rememberTranslations(
            targetLanguage,
            Object.fromEntries(batch.map((key) => [key, fallbackTranslateText(targetLanguage, key)]))
          );
        }
      }
    }

    if (languageRef.current === targetLanguage) {
      applyItems(targetLanguage, textItems, attrItems);
      setStatus("idle");
    }
  }, [applyItems, cachedTranslation, rememberTranslations]);

  const scheduleScan = useCallback(() => {
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => {
      void scanAndTranslate();
    }, 80);
  }, [scanAndTranslate]);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    if (isContentLanguage(storedLanguage)) {
      setLanguageState(storedLanguage);
    }
  }, []);

  useEffect(() => {
    languageRef.current = language;
    const meta = getLanguageMeta(language);
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
    document.body.dir = meta.dir;
    scheduleScan();
  }, [language, pathname, scheduleScan]);

  useEffect(() => {
    const observer = new MutationObserver(() => scheduleScan());
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS
    });
    return () => {
      observer.disconnect();
      if (scanTimer.current) window.clearTimeout(scanTimer.current);
    };
  }, [scheduleScan]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      status
    }),
    [language, setLanguage, status]
  );

  return <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>;
}

export function useAppLanguage() {
  const context = useContext(AppLanguageContext);
  if (!context) {
    throw new Error("useAppLanguage must be used within AppLanguageProvider");
  }
  return context;
}
