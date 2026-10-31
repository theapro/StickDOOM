import type { Locale } from "../config";
import en, { type Dictionary } from "./en";
import ru from "./ru";
import uz from "./uz";

export type { Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { uz, ru, en };
