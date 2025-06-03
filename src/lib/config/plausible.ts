/**
 * Configuration pour l'API Plausible.io
 *
 * Instructions :
 * 1. Remplacez PLAUSIBLE_SITE_ID par votre domaine (ex: "monsite.com")
 * 2. Assurez-vous que votre clé API a les bonnes permissions
 * 3. Vérifiez que votre site est bien configuré dans Plausible
 */

export const PLAUSIBLE_CONFIG = {
  // Votre clé API Plausible (ne pas modifier)
  API_KEY: "b2T5aTukVykd0ULbfLukmwJQvImAlVarM0aV1RtTBDG9hw-tmR8e_bLOVuoRZOdw",

  // IMPORTANT: Remplacez par votre domaine exact tel qu'il apparaît dans Plausible
  SITE_ID: "my-secret.net",

  // URL de base de l'API Plausible v2 (ne pas modifier)
  BASE_URL: "https://plausible.io/api/v2/query",

  // URL de base pour l'API main-graph avec cookies
  MAIN_GRAPH_URL: "https://plausible.io/api/stats",

  // Configuration par défaut pour les requêtes
  DEFAULT_LIMIT: 50,
  DEFAULT_METRICS: ["visitors", "pageviews", "visits", "visit_duration", "bounce_rate"]
};

/**
 * Headers par défaut pour les requêtes Plausible
 */
export const getPlausibleHeaders = () => ({
  "Authorization": `Bearer ${PLAUSIBLE_CONFIG.API_KEY}`,
  "Content-Type": "application/json"
});

/**
 * Construit le body de requête pour l'API Plausible v2
 */
export const buildPlausibleQuery = (
  metrics: string[],
  dateFrom: string,
  dateTo: string,
  dimensions: string[] = [],
  filters: any[] = [],
  additionalOptions: Record<string, any> = {}
) => {
  return {
    site_id: PLAUSIBLE_CONFIG.SITE_ID,
    metrics,
    date_range: [dateFrom, dateTo],
    dimensions,
    filters,
    ...additionalOptions
  };
};

/**
 * Fonction utilitaire pour faire des requêtes à l'API Plausible v2
 */
export const queryPlausible = async (queryBody: any) => {
  const response = await fetch(PLAUSIBLE_CONFIG.BASE_URL, {
    method: 'POST',
    headers: getPlausibleHeaders(),
    body: JSON.stringify(queryBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Plausible API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * Headers pour les requêtes avec cookies (pour l'API main-graph)
 */
export const getPlausibleCookieHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  // Les cookies seront automatiquement inclus si la requête est faite depuis le navigateur
});

/**
 * Fonction pour faire des requêtes à l'API main-graph avec cookies
 * Utilise l'endpoint /api/stats/{site_id}/main-graph/ avec les paramètres URL
 */
export const queryPlausibleMainGraph = async (params: {
  period?: string;
  date?: string;
  filters?: string;
  with_imported?: boolean;
  metric?: string;
  interval?: string;
}) => {
  const searchParams = new URLSearchParams();

  // Ajouter les paramètres à l'URL
  if (params.period) searchParams.append('period', params.period);
  if (params.date) searchParams.append('date', params.date);
  if (params.filters) searchParams.append('filters', params.filters);
  if (params.with_imported !== undefined) searchParams.append('with_imported', params.with_imported.toString());
  if (params.metric) searchParams.append('metric', params.metric);
  if (params.interval) searchParams.append('interval', params.interval);

  const url = `${PLAUSIBLE_CONFIG.MAIN_GRAPH_URL}/${PLAUSIBLE_CONFIG.SITE_ID}/main-graph/?${searchParams.toString()}`;

  console.log('🔗 Plausible main-graph URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: getPlausibleCookieHeaders(),
    credentials: 'include' // Important pour inclure les cookies
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Plausible main-graph API error (${response.status}): ${errorText}`);
  }

  return response.json();
};
