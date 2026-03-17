export const PHONE_COUNTRIES = [
  // Norteamérica
  { code: "CA", name: "Canadá", flag: "🇨🇦", dialCode: "+1", maxDigits: 10 },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", dialCode: "+1", maxDigits: 10 },
  { code: "MX", name: "México", flag: "🇲🇽", dialCode: "+52", maxDigits: 10 },

  // Centroamérica
  { code: "BZ", name: "Belice", flag: "🇧🇿", dialCode: "+501", maxDigits: 7 },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dialCode: "+506", maxDigits: 8 },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", dialCode: "+503", maxDigits: 8 },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dialCode: "+502", maxDigits: 8 },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dialCode: "+504", maxDigits: 8 },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", dialCode: "+505", maxDigits: 8 },
  { code: "PA", name: "Panamá", flag: "🇵🇦", dialCode: "+507", maxDigits: 8 },

  // Caribe
  { code: "AG", name: "Antigua y Barbuda", flag: "🇦🇬", dialCode: "+1", maxDigits: 10 },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", dialCode: "+1", maxDigits: 10 },
  { code: "BB", name: "Barbados", flag: "🇧🇧", dialCode: "+1", maxDigits: 10 },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dialCode: "+53", maxDigits: 8 },
  { code: "DM", name: "Dominica", flag: "🇩🇲", dialCode: "+1", maxDigits: 10 },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", dialCode: "+1", maxDigits: 10 },
  { code: "GD", name: "Granada", flag: "🇬🇩", dialCode: "+1", maxDigits: 10 },
  { code: "HT", name: "Haití", flag: "🇭🇹", dialCode: "+509", maxDigits: 8 },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", dialCode: "+1", maxDigits: 10 },
  { code: "KN", name: "San Cristóbal y Nieves", flag: "🇰🇳", dialCode: "+1", maxDigits: 10 },
  { code: "LC", name: "Santa Lucía", flag: "🇱🇨", dialCode: "+1", maxDigits: 10 },
  { code: "VC", name: "San Vicente y las Granadinas", flag: "🇻🇨", dialCode: "+1", maxDigits: 10 },
  { code: "TT", name: "Trinidad y Tobago", flag: "🇹🇹", dialCode: "+1", maxDigits: 10 },

  // Sudamérica
  { code: "AR", name: "Argentina", flag: "🇦🇷", dialCode: "+54", maxDigits: 10 },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", dialCode: "+591", maxDigits: 8 },
  { code: "BR", name: "Brasil", flag: "🇧🇷", dialCode: "+55", maxDigits: 11 },
  { code: "CL", name: "Chile", flag: "🇨🇱", dialCode: "+56", maxDigits: 9 },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dialCode: "+57", maxDigits: 10 },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", dialCode: "+593", maxDigits: 9 },
  { code: "GY", name: "Guyana", flag: "🇬🇾", dialCode: "+592", maxDigits: 7 },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", dialCode: "+595", maxDigits: 9 },
  { code: "PE", name: "Perú", flag: "🇵🇪", dialCode: "+51", maxDigits: 9 },
  { code: "SR", name: "Surinam", flag: "🇸🇷", dialCode: "+597", maxDigits: 7 },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", dialCode: "+598", maxDigits: 8 },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dialCode: "+58", maxDigits: 10 },
];

export function getCountryByCode(code) {
  return PHONE_COUNTRIES.find((c) => c.code === code) || PHONE_COUNTRIES.find((c) => c.code === "SV");
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