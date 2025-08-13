import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * SvelteKit API route to fetch 30-minute visitor data from Plausible
 * This handles the server-side request with cookies to avoid browser security restrictions
 */
export const GET: RequestHandler = async ({ fetch }) => {
  try {
    // Vos cookies récupérés de Chrome - exactement comme dans votre fonction JavaScript
    const cookies = 'logged_in=true; _plausible_prod=SFMyNTY.g3QAAAADbQAAAAtfY3NyZl90b2tlbm0AAAAYRHA4Y3N3bUJ6emdjSFVVOWxWbEhvTktNbQAAAA5saXZlX3NvY2tldF9pZG0AAAA6dXNlcl9zZXNzaW9uczpIaWFvdmxTZHpFM2FWZDdranNQTEpta1NTWEEyWUJVSEdaTFRIVUtlTllVPW0AAAAKdXNlcl90b2tlbm0AAAAgHiaovlSdzE3aVd7kjsPLJmkSSXA2YBUHGZLTHUKeNYU.j38syS3BEi2hRJSuO5KWZzZ-tAMsCcQyhjw4tCiYOF8';

    // Get current date in YYYY-MM-DD format for the API
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    console.log('🔗 [Server] Fetching 30min data with cookies for date:', dateString);

    // Build URL with query parameters exactly like your JavaScript function
    const params = new URLSearchParams({
      'period': 'realtime',
      'date': dateString,
      'filters': '[]',
      'with_imported': 'true',
      'metric': 'visitors',
      'interval': 'minute'
    });

    const url = `https://plausible.io/api/stats/my-secret.net/main-graph/?${params.toString()}`;

    console.log('🔗 [Server] Request URL:', url);
    console.log('🍪 [Server] Using cookies:', cookies);

    // Make the request with exact same headers and cookies as your JavaScript function
    // Server-side fetch can use these headers without browser restrictions
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
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
          data: [],
          totalVisitors: 0
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Server] Raw Plausible response:', data);
    console.log('✅ [Server] Response keys:', Object.keys(data));
    console.log('✅ [Server] Plot data:', data.plot);
    console.log('✅ [Server] Labels data:', data.labels);

    // Transform the response to our expected format
    // The main-graph API returns { plot: [...], labels: [...] }
    if (data.plot && data.labels) {
      const minuteData = [];
      const now = new Date();

      // Create 30-minute timeline
      for (let i = 29; i >= 0; i--) {
        const minuteTime = new Date(now.getTime() - (i * 60 * 1000));

        // Find corresponding data point from API response
        // Labels are negative minutes from now (e.g., -29, -28, ..., -1, 0)
        const labelIndex = data.labels.findIndex((label: number) => label === -i);
        const visitors = labelIndex >= 0 ? (data.plot[labelIndex] || 0) : 0;

        minuteData.push({
          t: minuteTime.toISOString().replace('T', ' ').substring(0, 19),
          time: minuteTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
          }),
          visitors: visitors,
          minute: minuteTime.getMinutes(),
          hour: minuteTime.getHours()
        });
      }

      console.log('📈 [Server] Transformed data points:', minuteData.length);
      console.log('📈 [Server] Sample data:', minuteData.slice(0, 3));

      const result = {
        data: minuteData,
        totalVisitors: minuteData.reduce((sum, item) => sum + item.visitors, 0),
        rawData: data
      };

      return json(result);
    }

    // Fallback if data structure is unexpected
    console.warn('⚠️ [Server] Unexpected API response structure:', data);
    const fallbackResult = {
      data: [],
      totalVisitors: 0,
      rawData: data,
      error: 'Unexpected API response structure'
    };

    return json(fallbackResult);

  } catch (error) {
    console.error('❌ [Server] Error fetching 30min data with cookies:', error);

    // Return empty timeline on error
    const minuteData = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const minuteTime = new Date(now.getTime() - (i * 60 * 1000));
      minuteData.push({
        t: minuteTime.toISOString().replace('T', ' ').substring(0, 19),
        time: minuteTime.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris'
        }),
        visitors: 0,
        minute: minuteTime.getMinutes(),
        hour: minuteTime.getHours()
      });
    }

    const errorResult = {
      data: minuteData,
      totalVisitors: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return json(errorResult, { status: 500 });
  }
};
