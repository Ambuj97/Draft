/**
 * ISO 3166-1 alpha-2 country code -> ISO 4217 currency code.
 *
 * Not exhaustive — covers the markets a beer-tracking app is realistically
 * used in. Anything missing falls back to the device locale's currency.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Eurozone
  AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR", FI: "EUR",
  FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR",
  LV: "EUR", MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR",
  AD: "EUR", MC: "EUR", SM: "EUR", VA: "EUR", ME: "EUR", XK: "EUR",

  // Rest of Europe
  GB: "GBP", CH: "CHF", LI: "CHF", NO: "NOK", SE: "SEK", DK: "DKK",
  IS: "ISK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN",
  RS: "RSD", UA: "UAH", RU: "RUB", BY: "BYN", TR: "TRY", MD: "MDL",
  MK: "MKD", AL: "ALL", BA: "BAM", GE: "GEL", AM: "AMD", AZ: "AZN",

  // Americas
  US: "USD", CA: "CAD", MX: "MXN", BR: "BRL", AR: "ARS", CL: "CLP",
  CO: "COP", PE: "PEN", UY: "UYU", PY: "PYG", BO: "BOB", VE: "VES",
  EC: "USD", CR: "CRC", PA: "USD", GT: "GTQ", DO: "DOP", JM: "JMD",
  TT: "TTD", BS: "BSD", BB: "BBD",

  // Asia-Pacific
  AU: "AUD", NZ: "NZD", JP: "JPY", CN: "CNY", HK: "HKD", TW: "TWD",
  KR: "KRW", SG: "SGD", MY: "MYR", TH: "THB", ID: "IDR", PH: "PHP",
  VN: "VND", IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR",
  KH: "KHR", LA: "LAK", MM: "MMK", MN: "MNT", MO: "MOP", BN: "BND",

  // Middle East
  AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR",
  JO: "JOD", LB: "LBP", IL: "ILS", IQ: "IQD", IR: "IRR",

  // Africa
  ZA: "ZAR", NG: "NGN", EG: "EGP", KE: "KES", GH: "GHS", MA: "MAD",
  TN: "TND", DZ: "DZD", ET: "ETB", TZ: "TZS", UG: "UGX", ZM: "ZMW",
  ZW: "USD", RW: "RWF", SN: "XOF", CI: "XOF", CM: "XAF", MU: "MUR",
};

/** Hand-picked narrow symbols for the currencies most likely to come up. */
const SYMBOLS: Record<string, string> = {
  GBP: "£", USD: "$", EUR: "€", JPY: "¥", CNY: "¥", INR: "₹",
  AUD: "A$", CAD: "C$", NZD: "NZ$", CHF: "CHF", HKD: "HK$", SGD: "S$",
  SEK: "kr", NOK: "kr", DKK: "kr", ISK: "kr", PLN: "zł", CZK: "Kč",
  HUF: "Ft", RON: "lei", BGN: "лв", RSD: "din", UAH: "₴", RUB: "₽",
  TRY: "₺", BRL: "R$", MXN: "$", ARS: "$", CLP: "$", COP: "$",
  PEN: "S/", UYU: "$U", KRW: "₩", TWD: "NT$", THB: "฿", MYR: "RM",
  IDR: "Rp", PHP: "₱", VND: "₫", PKR: "₨", BDT: "৳", LKR: "Rs",
  AED: "د.إ", SAR: "﷼", QAR: "﷼", ILS: "₪", ZAR: "R", NGN: "₦",
  EGP: "E£", KES: "Sh", GHS: "₵", MAD: "DH",
};

/** Currency code -> best display symbol. */
export function symbolForCurrency(code: string): string {
  if (!code) return "£";
  const upper = code.toUpperCase();
  if (SYMBOLS[upper]) return SYMBOLS[upper];
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: upper,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === "currency")?.value;
    if (sym) return sym;
  } catch {
    // Intl may not support narrowSymbol on this runtime — fall through.
  }
  return upper;
}

/** Country code -> { code, symbol }, or null if we don't have a mapping. */
export function currencyForCountry(
  countryCode: string | null | undefined
): { code: string; symbol: string } | null {
  if (!countryCode) return null;
  const code = COUNTRY_TO_CURRENCY[countryCode.toUpperCase()];
  if (!code) return null;
  return { code, symbol: symbolForCurrency(code) };
}
