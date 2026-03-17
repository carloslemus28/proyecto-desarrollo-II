import { useMemo } from "react";
import { PHONE_COUNTRIES, getCountryByCode, sanitizePhoneNumber } from "../constants/phoneCountries";

export default function PhoneInput({
  value = {
    telefonoPais: "SV",
    telefonoPrefijo: "+503",
    telefonoNumero: "",
  },
  onChange,
  disabled = false,
}) {
  const selectedCountry = useMemo(
    () => getCountryByCode(value.telefonoPais || "SV"),
    [value.telefonoPais]
  );

  function handleCountryChange(e) {
    const country = getCountryByCode(e.target.value);

    const currentNumber = sanitizePhoneNumber(value.telefonoNumero || "").slice(0, country.maxDigits);

    onChange?.({
      telefonoPais: country.code,
      telefonoPrefijo: country.dialCode,
      telefonoNumero: currentNumber,
    });
  }

  function handleNumberChange(e) {
    const clean = sanitizePhoneNumber(e.target.value).slice(0, selectedCountry.maxDigits);

    onChange?.({
      telefonoPais: selectedCountry.code,
      telefonoPrefijo: selectedCountry.dialCode,
      telefonoNumero: clean,
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10 }}>
      <select
        value={selectedCountry.code}
        onChange={handleCountryChange}
        disabled={disabled}
        style={inputStyle}
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name} ({c.dialCode})
          </option>
        ))}
      </select>

      <input
        value={value.telefonoNumero || ""}
        onChange={handleNumberChange}
        disabled={disabled}
        placeholder={`Número (${selectedCountry.maxDigits} dígitos máx.)`}
        inputMode="numeric"
        style={inputStyle}
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
};