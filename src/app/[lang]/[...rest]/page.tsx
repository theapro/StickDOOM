import { notFound } from "next/navigation";

// `ensureStatic = "navigation"` needs one complete parameter set; every real URL here is unknown.
export function generateStaticParams() {
  return [{ rest: ["not-found"] }];
}

/** Unknown URLs inside a language render that language's 404 page within the site layout. */
export default function UnknownPage() {
  notFound();
}
