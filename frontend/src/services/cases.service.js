/**
 * Servicio de Casos Frontend - Operaciones API para casos de cobranza
 * 
 * Responsabilidades:
 * - Listar casos
 * - Obtener detalles de caso
 * - Crear, actualizar, eliminar casos
 * - Gestionar actividades (notas, llamadas)
 * - Gestionar archivos adjuntos
 * - Integración con WhatsApp
 * 
 * Acceso:
 * - Filtrado automático por permisos del usuario
 * - Manejo de errores con respuestas de API
 */

import api from "../api/axios";
// Cada función corresponde a una operación API relacionada con casos de cobranza
export async function listCases() {
  const { data } = await api.get("/cases");
  return data;
}
// Obtener detalles de un caso específico por ID
export async function getCase(id) {
  const { data } = await api.get(`/cases/${id}`);
  return data;
}
// Listar actividades (notas, llamadas) asociadas a un caso
export async function listActivities(caseId) {
  const { data } = await api.get(`/cases/${caseId}/activities`);
  return data;
}
// Agregar una nueva actividad (nota, llamada) a un caso
export async function addActivity(caseId, payload) {
  const { data } = await api.post(`/cases/${caseId}/activities`, payload);
  return data;
}
// Obtener enlace de WhatsApp para un caso específico
export async function getWhatsAppLink(caseId) {
  const { data } = await api.get(`/cases/${caseId}/wa`);
  return data;
}
// Listar archivos adjuntos de un caso específico
export async function listFiles(caseId) {
  const { data } = await api.get(`/cases/${caseId}/files`);
  return data;
}
// Subir un archivo adjunto a un caso específico, con opción de categoría
export async function uploadFile(caseId, file, categoria) {
  const form = new FormData();
  form.append("file", file);
  if (categoria) form.append("categoria", categoria);

  const { data } = await api.post(`/cases/${caseId}/files`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
// Crear un nuevo caso de cobranza con los datos proporcionados
export async function createCase(payload) {
  const { data } = await api.post("/cases", payload);
  return data;
}
// Actualizar un caso existente por ID con los datos proporcionados
export async function updateCase(caseId, payload) {
  const { data } = await api.put(`/cases/${caseId}`, payload);
  return data;
}
// Actualizar información del deudor de un caso específico por ID
export async function updateDebtor(caseId, payload) {
  const { data } = await api.put(`/cases/${caseId}/debtor`, payload);
  return data;
}
// Eliminar un archivo adjunto específico de un caso por sus IDs
export async function deleteFile(caseId, fileId) {
  const { data } = await api.delete(`/cases/${caseId}/files/${fileId}`);
  return data;
}
// Eliminar un caso específico por ID
export async function deleteCase(caseId) {
  const { data } = await api.delete(`/cases/${caseId}`);
  return data;
}
// Eliminar una actividad específica de un caso por sus IDs
export async function updateActivity(activityId, payload) {
  const { data } = await api.put(`/activities/${activityId}`, payload);
  return data;
}
// Eliminar una actividad específica de un caso por su ID
export async function deleteActivity(activityId) {
  const { data } = await api.delete(`/activities/${activityId}`);
  return data;
}

// Actualizar el estado de un caso específico por ID con el nuevo código de estado
export async function updateCaseStatus(caseId, estadoCodigo) {
  const { data } = await api.put(`/cases/${caseId}/status`, { estadoCodigo });
  return data;
}

// Función para cambiar el estado de un caso
export async function changeCaseStatus(caseId, estadoCodigo) {
  return updateCaseStatus(caseId, estadoCodigo);
}
