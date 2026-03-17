import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PHONE_COUNTRIES, getCountryByCode, sanitizePhoneNumber } from "../constants/phoneCountries";

function getFlagUrl(code) {
  return `https://flagcdn.com/24x18/${String(code || "").toLowerCase()}.png`;
}

export default function PhoneInput({
  value = {
    telefonoPais: "SV",
    telefonoPrefijo: "+503",
    telefonoNumero: "",
  },
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedCountry = useMemo(
    () => getCountryByCode(value.telefonoPais || "SV"),
    [value.telefonoPais]
  );

  useEffect(() => {
    function handleClickOutside(e) {
      const wrap = wrapRef.current;
      const menu = menuRef.current;

      if (wrap && wrap.contains(e.target)) return;
      if (menu && menu.contains(e.target)) return;

      setOpen(false);
    }

    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, []);

  useLayoutEffect(() => {
    if (open) updateMenuPosition();
  }, [open]);

  function updateMenuPosition() {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const dropdownWidth = 280;
    const viewportPadding = 8;

    let left = rect.left + window.scrollX;
    let top = rect.bottom + 6 + window.scrollY;

    const maxLeft = window.scrollX + window.innerWidth - dropdownWidth - viewportPadding;
    if (left > maxLeft) left = maxLeft;
    if (left < window.scrollX + viewportPadding) left = window.scrollX + viewportPadding;

    setMenuStyle({
      position: "absolute",
      top,
      left,
      width: dropdownWidth,
      maxHeight: 240,
      overflowY: "auto",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
      zIndex: 999999,
    });
  }

  function handleCountrySelect(country) {
    const currentNumber = sanitizePhoneNumber(value.telefonoNumero || "").slice(0, country.maxDigits);

    onChange?.({
      telefonoPais: country.code,
      telefonoPrefijo: country.dialCode,
      telefonoNumero: currentNumber,
    });

    setOpen(false);
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
    <>
      <div
        ref={wrapRef}
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: 10,
          alignItems: "start",
        }}
      >
        {/* selector país */}
        <div ref={triggerRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              if (!open) updateMenuPosition();
              setOpen((v) => !v);
            }}
            disabled={disabled}
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: disabled ? "not-allowed" : "pointer",
              background: "#fff",
              gap: 8,
              minHeight: 44,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <img
                src={getFlagUrl(selectedCountry.code)}
                alt={selectedCountry.name}
                width={24}
                height={18}
                style={{ borderRadius: 3, flexShrink: 0, objectFit: "cover" }}
              />

              <div style={{ display: "grid", textAlign: "left", minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {selectedCountry.name}
                </span>
                <span style={{ fontSize: 11, opacity: 0.75 }}>{selectedCountry.dialCode}</span>
              </div>
            </div>

            <span style={{ fontSize: 11, opacity: 0.75, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* número */}
        <input
          value={value.telefonoNumero || ""}
          onChange={handleNumberChange}
          disabled={disabled}
          placeholder={`Número (${selectedCountry.maxDigits} dígitos máx.)`}
          inputMode="numeric"
          style={{
            ...inputStyle,
            minHeight: 44,
          }}
        />
      </div>

      {/* dropdown renderizado en portal */}
      {open && !disabled && menuStyle
        ? createPortal(
            <div ref={menuRef} style={menuStyle}>
              {PHONE_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  style={{
                    ...optionStyle,
                    background: c.code === selectedCountry.code ? "#f8fafc" : "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      c.code === selectedCountry.code ? "#f8fafc" : "#fff";
                  }}
                >
                  <img
                    src={getFlagUrl(c.code)}
                    alt={c.name}
                    width={24}
                    height={18}
                    style={{ borderRadius: 3, flexShrink: 0, objectFit: "cover" }}
                  />

                  <div style={{ display: "grid", flex: 1, textAlign: "left", minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {c.name}
                    </span>
                    <span style={{ fontSize: 11, opacity: 0.75 }}>{c.dialCode}</span>
                  </div>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  boxSizing: "border-box",
};

const optionStyle = {
  width: "100%",
  border: "none",
  background: "#fff",
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
};