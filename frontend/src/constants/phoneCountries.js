export const PHONE_COUNTRIES = [
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dialCode: "+503", maxDigits: 8 },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "+502", maxDigits: 8 },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "+504", maxDigits: 8 },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dialCode: "+505", maxDigits: 8 },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506", maxDigits: 8 },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "+507", maxDigits: 8 },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52", maxDigits: 10 },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1", maxDigits: 10 },
];

export function getCountryByCode(code) {
  return PHONE_COUNTRIES.find((c) => c.code === code) || PHONE_COUNTRIES[0];
}

export function sanitizePhoneNumber(value = "") {
  return String(value).replace(/\D/g, "");
}

export function formatFullPhone(prefijo, numero) {
  const n = sanitizePhoneNumber(numero);
  if (!prefijo && !n) return null;
  if (!prefijo) return n || null;
  return `${prefijo}${n}`;
}