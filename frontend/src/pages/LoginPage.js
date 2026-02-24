/**
 * Página de Login - Autenticación de usuarios
 * 
 * Responsabilidades:
 * - Formulario de email y contraseña
 * - Validación de credenciales
 * - Almacenamiento de token y datos de usuario
 * - Redireccionamiento a dashboard tras login exitoso
 * - Manejo de errores de autenticación
 * 
 * Interfaz: Formulario centrado con diseño responsive
 */

// src/pages/LoginPage.js
import { useEffect, useState } from "react";
import { login } from "../services/auth.service";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../ui/ToastContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { loginSuccess, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redireccionar a dashboard si ya está logueado
  useEffect(() => {
    if (user) navigate("/cases", { replace: true });
  }, [user, navigate]);

  // Mostrar toast de sesión expirada si viene de redireccionamiento por token inválido
  useEffect(() => {
    const raw = sessionStorage.getItem("sessionExpiredToast");
    if (!raw) return;

    try {
      const t = JSON.parse(raw);
      if (t?.message) showToast(t.message, t.type || "warning", 4500);
    } catch (_) {}

    sessionStorage.removeItem("sessionExpiredToast");
  }, [showToast]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast("Completa email y contraseña.", "warning", 5000);
      return;
    }

    setLoading(true);
    try {
      const r = await login(email.trim(), password);

      //Guardar token y datos de usuario en contexto global
      loginSuccess(r.token, r.user);

      // Bienvenida personalizada con Toast
      sessionStorage.setItem(
        "loginToast",
        JSON.stringify({
          message: `Bienvenido ${r.user.nombre}`,
          type: "success",
        })
      );

      navigate("/cases", { replace: true });
      setPassword("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Credenciales incorrectas";

      showToast(msg, "error", 5000);
      setLoading(false); 
      return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "100px auto",
        padding: 16,
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>Iniciar sesión</h2>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div style={{ display: "grid", gap: 10 }}>
          <input
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            inputMode="email"
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />

          <div style={{ position: "relative" }}>
            <input
              value={password}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                width: "100%",
              }}
            />
            <span
              role="button"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={0}
              onClick={() => setShowPassword((s) => !s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setShowPassword((s) => !s);
                }
              }}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#666",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  width={20}
                  height={20}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3l18 18M12 8a4 4 0 014 4m0 0a4 4 0 01-4 4m0-8a4 4 0 00-4 4m0 0a4 4 0 004 4m6 2a9 9 0 01-6 2.5M6 6a9 9 0 016-2.5"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  width={20}
                  height={20}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}
