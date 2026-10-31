import type { Locale } from "./config";

/** Noun forms for counts. Russian uses `few`/`many`; Uzbek and English only need `one`/`other`. */
export interface PluralForms {
  one: string;
  few?: string;
  many?: string;
  other: string;
}

/** Fills `{name}` placeholders. */
export function format(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export function plural(locale: Locale, count: number, forms: PluralForms) {
  const rule = new Intl.PluralRules(locale).select(count);
  return (rule === "one" || rule === "few" || rule === "many" ? forms[rule] : undefined) ?? forms.other;
}

/** "3 packs", "3 набора", "3 to‘plam". */
export function count(locale: Locale, value: number, forms: PluralForms) {
  return `${value} ${plural(locale, value, forms)}`;
}
