/*
* Archivo de entrada principal para la aplicación React
* 
* Responsabilidades:
* - Renderizar el componente raíz de la aplicación
* - Envolver la aplicación con proveedores de contexto (AuthProvider, ToastProvider)
* - Configurar el enrutador para manejar rutas y navegación
* - Mostrar notificaciones de login al cargar la aplicación
* 
* Estructura:
* - AuthProvider: Proporciona contexto de autenticación a toda la aplicación
* - ToastProvider: Proporciona sistema de notificaciones (toasts)
* - AppRoutes: Define las rutas protegidas y públicas de la aplicación 
*/
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./components/leafletFix";
import App from "./App";
import "./styles/global.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
