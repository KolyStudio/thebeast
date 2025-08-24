import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * SvelteKit API route to fetch top-stats from Plausible
 * This handles the server-side request with cookies to avoid browser security restrictions
 */
export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    // Vos cookies récupérés de Chrome - exactement comme dans votre fonction JavaScript
    const cookies = 'logged_in=true; _plausible_prod=SFMyNTY.g3QAAAADbQAAAAtfY3NyZl90b2tlbm0AAAAYMWMybUdzR1lqQ0kzUklvTzZnT1poUm9JbQAAAA5saXZlX3NvY2tldF9pZG0AAAA6dXNlcl9zZXNzaW9uczpVemEwWFkySzYwLUxSOHVuZkJOSTdNUnc5NWdER1Z5YkNmeGZXRUtqWjhrPW0AAAAKdXNlcl90b2tlbm0AAAAgUza0XY2K60-LR8unfBNI7MRw95gDGVybCfxfWEKjZ8k.Yei_lF6QZg_zm_eVh5yQ-19vGVPUeUUUq-cZ8GZSkiw';

    // Get date from query params or use today
    const dateParam = url.searchParams.get('date');
    const today = new Date();
    const dateString = dateParam || today.toISOString().split('T')[0];

    console.log('📊 [Server] Fetching top-stats for date:', dateString);

    // Build URL with query parameters for top-stats endpoint
    const params = new URLSearchParams({
      'period': 'realtime',
      'date': dateString,
      'filters': '[]',
      'with_imported': 'true'
    });

    const apiUrl = `https://plausible.io/api/stats/my-secret.net/top-stats/?${params.toString()}`;

    console.log('🔗 [Server] Request URL:', apiUrl);
    console.log('🍪 [Server] Using cookies:', cookies);

    // Make request to Plausible API with exact headers from your working example
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://plausible.io/my-secret.net',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'cookie': cookies
      }
    });

    console.log('📡 [Server] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Server] Plausible API Error:', response.status, errorText);
      return json(
        { 
          error: `Plausible API error (${response.status}): ${errorText}`,
          top_stats: []
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Server] Raw Plausible top-stats response:', data);
    console.log('✅ [Server] Top stats array:', data.top_stats);

    // Return the data as-is since it's already in the correct format
    return json(data);

  } catch (error) {
    console.error('❌ [Server] Error fetching top-stats:', error);

    // Return empty data on error
    const errorResult = {
      top_stats: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return json(errorResult, { status: 500 });
  }
};
