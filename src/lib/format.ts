const group = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[  \s]/g, " ");

/** "4 850 000 DA" (fr) / "4 850 000 د.ج" (ar). Latin digits in both, as used in Algeria. */
export function formatDZD(n: number, locale: string) {
  return `${group(n)} ${locale === "fr" ? "DA" : "د.ج"}`;
}

export const formatNumber = group;
