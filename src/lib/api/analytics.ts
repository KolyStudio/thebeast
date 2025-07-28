import { PLAUSIBLE_CONFIG, buildPlausibleQuery, queryPlausible, queryPlausibleMainGraph } from '$lib/config/plausible';

/**
 * Format date for API requests
 * @param {Object} date - Date object with year, month, day properties
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export function formatDate(date: { year: number; month: number; day: number }): string {
  if (!date) return "";
  const year = date.year;
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Fetch trend data (visits over time) from Plausible
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Trend data
 */
export async function fetchTrendData(dateFrom: string, dateTo: string): Promise<any> {
  const queryBody = buildPlausibleQuery(
    PLAUSIBLE_CONFIG.DEFAULT_METRICS,
    dateFrom,
    dateTo,
    ["time:hour"]
  );

  const data = await queryPlausible(queryBody);

  // Transform Plausible data to match expected format
  return {
    data: data.results?.map((item: any) => ({
      t: item.dimensions[0] || dateFrom + " 00:00:00",
      visits: item.metrics[2] || 0, // visits is 3rd metric
      pageviews: item.metrics[1] || 0, // pageviews is 2nd metric
      visitors: item.metrics[0] || 0, // visitors is 1st metric
      visit_duration: item.metrics[3] || 0, // visit_duration is 4th metric
      bounce_rate: item.metrics[4] || 0 // bounce_rate is 5th metric
    })) || []
  };
}

/**
 * Fetch KPI data from Plausible (aggregate stats)
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} KPI data
 */
export async function fetchKPIData(dateFrom: string, dateTo: string): Promise<any> {
  const queryBody = buildPlausibleQuery(
    PLAUSIBLE_CONFIG.DEFAULT_METRICS,
    dateFrom,
    dateTo
  );

  const data = await queryPlausible(queryBody);

  // Transform Plausible aggregate data to match expected format
  // Create hourly breakdown for compatibility with existing components
  const hourlyData = [];
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  // Get aggregate values from API v2 response
  const aggregateResult = data.results?.[0];
  const visitors = aggregateResult?.metrics[0] || 0;
  const pageviews = aggregateResult?.metrics[1] || 0;
  const visits = aggregateResult?.metrics[2] || 0;
  const visit_duration = aggregateResult?.metrics[3] || 0;
  const bounce_rate = aggregateResult?.metrics[4] || 0;

  // If it's the same day, create hourly breakdown
  if (dateFrom === dateTo) {
    for (let hour = 0; hour < 24; hour++) {
      const date = new Date(startDate);
      date.setHours(hour, 0, 0, 0);
      hourlyData.push({
        date: date.toISOString(),
        visits: Math.floor(visits / 24),
        pageviews: Math.floor(pageviews / 24),
        visitors: Math.floor(visitors / 24),
        avg_session_sec: visit_duration,
        bounce_rate: bounce_rate / 100
      });
    }
  } else {
    // For date ranges, create daily breakdown
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      hourlyData.push({
        date: currentDate.toISOString(),
        visits: Math.floor(visits / daysDiff),
        pageviews: Math.floor(pageviews / daysDiff),
        visitors: Math.floor(visitors / daysDiff),
        avg_session_sec: visit_duration,
        bounce_rate: bounce_rate / 100
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return {
    data: hourlyData
  };
}

/**
 * Fetch top pages data from Plausible
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object>} Top pages data
 */
export async function fetchTopPages(dateFrom: string, dateTo: string, limit: number = 50): Promise<any> {
  const queryBody = buildPlausibleQuery(
    ["visitors", "pageviews"],
    dateFrom,
    dateTo,
    ["event:page"],
    [],
    { pagination: { limit } }
  );

  const data = await queryPlausible(queryBody);

  // Transform Plausible data to match expected format
  return {
    data: data.results?.map((item: any) => ({
      pathname: item.dimensions[0],
      page: item.dimensions[0],
      visits: item.metrics[0] || 0,
      visitors: item.metrics[0] || 0,
      pageviews: item.metrics[1] || 0
    })) || []
  };
}

/**
 * Fetch top locations data from Plausible (grouped by country)
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object>} Top locations data grouped by country
 */
export async function fetchTopLocations(dateFrom: string, dateTo: string, limit: number = 50): Promise<any> {
  const queryBody = buildPlausibleQuery(
    ["visitors", "pageviews"],
    dateFrom,
    dateTo,
    ["visit:country_name"], // Only country dimension to group by country
    [],
    { pagination: { limit } }
  );

  const data = await queryPlausible(queryBody);

  // Transform Plausible data to match expected format (grouped by country)
  return {
    data: data.results?.map((item: any) => ({
      country: item.dimensions[0],
      city: null, // No city data since we're grouping by country
      location: item.dimensions[0], // Just the country name
      visits: item.metrics[0] || 0,
      visitors: item.metrics[0] || 0,
      pageviews: item.metrics[1] || 0
    })) || []
  };
}

/**
 * Fetch realtime visitor data for the last 30 minutes with forced complete timeline
 * Uses Plausible's API v2 with custom date_range for precise 30-minute window
 * @returns {Promise<Object>} 30-minute visitor data with all minutes included (0 if no data)
 */
export async function fetchLast30MinutesData(): Promise<any> {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  // Create forced 30-minute timeline first
  const minuteData: any[] = [];
  for (let i = 29; i >= 0; i--) {
    const minuteTime = new Date(now.getTime() - i * 60 * 1000);

    minuteData.push({
      t: minuteTime.toISOString(),
      time: minuteTime.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris' // Utilise le fuseau français automatiquement
      }),
      visitors: 0, // Default to 0
      visits: 0
    });
  }

  try {
    // Use Plausible API v2 with time:hour and distribute data across minutes
    const frenchOffset = 2 * 60 * 60 * 1000; // +2h en millisecondes
    const startTimeFrench = new Date(thirtyMinutesAgo.getTime() + frenchOffset);
    const endTimeFrench = new Date(now.getTime() + frenchOffset);

    const startTime = startTimeFrench.toISOString().replace('Z', '+02:00');
    const endTime = endTimeFrench.toISOString().replace('Z', '+02:00');

    const queryBody = {
      "site_id": PLAUSIBLE_CONFIG.SITE_ID,
      "metrics": ["visitors"],
      "date_range": [startTime, endTime],
      "dimensions": ["time:hour"],
      "include": {
        "time_labels": true
      }
    };

    const realtimeData = await queryPlausible(queryBody);

    // Map API v2 hourly data to our minute timeline by distributing visitors
    if (realtimeData?.results && Array.isArray(realtimeData.results)) {
      realtimeData.results.forEach((item: any) => {
        const apiTime = new Date(item.dimensions[0]);
        const hourlyVisitors = item.metrics[0] || 0;

        // Distribute hourly visitors across 60 minutes
        const visitorsPerMinute = Math.floor(hourlyVisitors / 60);
        const extraVisitors = hourlyVisitors % 60;

        // Find all minutes in this hour and distribute visitors
        minuteData.forEach((minute) => {
          const minuteTime = new Date(minute.t);

          if (minuteTime.getFullYear() === apiTime.getFullYear() &&
              minuteTime.getMonth() === apiTime.getMonth() &&
              minuteTime.getDate() === apiTime.getDate() &&
              minuteTime.getHours() === apiTime.getHours()) {

            // Base visitors per minute + extra for some minutes
            let visitors = visitorsPerMinute;
            if (minuteTime.getMinutes() < extraVisitors) {
              visitors += 1; // Distribute extra visitors to first N minutes
            }

            minute.visitors = visitors;
            minute.visits = visitors;
          }
        });
      });
    }

    // Use time_labels to ensure we have coverage for all hours
    // All minutes remain at 0 (already set by default) if no data for any hour

  } catch (error) {
    // Keep the forced timeline with 0 values
  }

  return {
    data: minuteData,
    totalVisitors: minuteData.reduce((sum, item) => sum + item.visitors, 0)
  };
}

/**
 * Fetch 30-minute visitor data using Plausible main-graph API with cookies
 * This function uses the same endpoint as your browser request
 * @returns {Promise<Object>} 30-minute visitor data with minute-by-minute breakdown
 */
export async function fetch30MinutesMainGraph(): Promise<any> {
  try {
    // Get current date in YYYY-MM-DD format for the API
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Use the same parameters as your browser request
    const data = await queryPlausibleMainGraph({
      period: 'realtime',
      date: dateString,
      filters: '[]',
      with_imported: true,
      metric: 'visitors',
      interval: 'minute'
    });

    // Transform the response to match our expected format
    // The main-graph API returns data in a different format than v2 API
    if (data && data.plot) {
      // Create minute-by-minute data from the plot array
      const minuteData = [];
      const now = new Date();

      // Create 30 minutes of data points
      for (let i = 29; i >= 0; i--) {
        const minuteTime = new Date(now.getTime() - (i * 60 * 1000));

        // Find corresponding data in the plot array
        // The plot array contains visitor counts for each minute
        const plotIndex = 29 - i; // Reverse index since plot[0] is oldest
        const visitors = data.plot && data.plot[plotIndex] !== undefined ? data.plot[plotIndex] : 0;

        minuteData.push({
          t: minuteTime.toISOString().replace('T', ' ').substring(0, 19), // Format: "YYYY-MM-DD HH:MM:SS"
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

      return {
        data: minuteData,
        totalVisitors: minuteData.reduce((sum, item) => sum + item.visitors, 0),
        rawData: data // Include raw data for debugging
      };
    }

    // Fallback if no plot data
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

    return {
      data: minuteData,
      totalVisitors: 0,
      rawData: data
    };

  } catch (error) {
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

    return {
      data: minuteData,
      totalVisitors: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch top stats from Plausible (current visitors, unique visitors 30min, pageviews 30min)
 * @returns {Promise<Object>} Top stats data with current visitors, unique visitors, and pageviews
 */
export async function fetchTopStats(): Promise<any> {
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Call our local API route for top-stats
    const response = await fetch(`/api/plausible/top-stats?date=${dateString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Top Stats API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Extract the metrics from top_stats array
    const topStats = data.top_stats || [];
    const currentVisitors = topStats.find((stat: any) => stat.graph_metric === 'current_visitors')?.value || 0;
    const uniqueVisitors30min = topStats.find((stat: any) => stat.graph_metric === 'visitors')?.value || 0;
    const pageviews30min = topStats.find((stat: any) => stat.graph_metric === 'pageviews')?.value || 0;

    return {
      currentVisitors,
      uniqueVisitors30min,
      pageviews30min,
      rawData: data
    };

  } catch (error) {
    return {
      currentVisitors: 0,
      uniqueVisitors30min: 0,
      pageviews30min: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch 30-minute visitor data using SvelteKit API route (server-side)
 * This calls our local API route which handles the Plausible request with cookies
 * @returns {Promise<Object>} 30-minute visitor data with minute-by-minute breakdown
 */
export async function fetch30MinutesWithCookies(): Promise<any> {
  try {
    // Call our local API route instead of Plausible directly
    const response = await fetch('/api/plausible/30min', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SvelteKit API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // The data is already transformed by our server-side API route
    return data;

  } catch (error) {
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

    return {
      data: minuteData,
      totalVisitors: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test function to debug Plausible API - call this from browser console
 * Usage: window.testPlausible()
 */
export async function testPlausibleAPI() {

  try {
    const result = await fetch30MinutesWithCookies();
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testPlausible = testPlausibleAPI;
}

/**
 * Fetch dynamic chart data using date range format with adaptive time dimension
 * @param {string[]} dateRange - Date range in format ["2024-01-01", "2024-07-01"]
 * @param {string} timeDimension - Time dimension: "time:hour", "time:day", "time:week", "time:month"
 * @returns {Promise<Object>} Dynamic chart data for the date range with appropriate time grouping
 */
export async function fetchDynamicChartData(dateRange?: string[], timeDimension: string = "time:hour"): Promise<any> {
  // Use provided date range or default to today
  let dateRangeValue: string | string[];

  if (dateRange && dateRange.length === 2) {
    dateRangeValue = dateRange;
  } else {
    // Default to today if no range provided
    dateRangeValue = "day";
  }

  const queryBody = {
    "site_id": PLAUSIBLE_CONFIG.SITE_ID,
    "metrics": ["visitors", "events"],
    "date_range": dateRangeValue,
    "dimensions": [timeDimension],
    "include": {
      "time_labels": true
    }
  };


  const data = await queryPlausible(queryBody);

  // Create a complete timeline using time_labels to ensure no missing hours
  const completeTimeline = [];

  if (data?.meta?.time_labels && Array.isArray(data.meta.time_labels)) {
    // Use time_labels to create complete timeline
    data.meta.time_labels.forEach((timeLabel: string) => {
      const date = new Date(timeLabel);

      // Find matching data for this time label
      const matchingData = data.results?.find((item: any) => {
        return item.dimensions[0] === timeLabel;
      });

      completeTimeline.push({
        date: timeLabel,
        time: date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris'
        }),
        hour: date.getHours(),
        visits: matchingData?.metrics[0] || 0,
        visitors: matchingData?.metrics[0] || 0,
        events: matchingData?.metrics[1] || 0
      });
    });
  } else {
    // Fallback to original method if time_labels not available
    completeTimeline.push(...(data.results?.map((item: any) => {
      const timeString = item.dimensions[0]; // Format: "2024-01-01 14:00:00"
      const date = new Date(timeString);

      return {
        date: timeString,
        time: date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris'
        }),
        hour: date.getHours(),
        visits: item.metrics[0] || 0,
        visitors: item.metrics[0] || 0,
        events: item.metrics[1] || 0
      };
    }) || []));
  }

  return {
    data: completeTimeline,
    meta: data?.meta || {},
    time_labels: data?.meta?.time_labels || []
  };
}

/**
 * Fetch all analytics data in parallel
 * @param {Object} dateRange - Date range with start and end properties
 * @param {string} timeDimension - Time dimension for chart data
 * @returns {Promise<Object>} All analytics data
 */
export async function fetchAllAnalyticsData(dateRange: { start: { year: number; month: number; day: number }; end: { year: number; month: number; day: number } }, timeDimension: string = "time:hour"): Promise<any> {
  const dateFrom = formatDate(dateRange.start);
  const dateTo = formatDate(dateRange.end);

  // Create date range array for dynamic chart data
  const chartDateRange = [dateFrom, dateTo];

  try {
    const [trendData, kpiData, topPagesData, topLocationsData, last30MinData, dynamicChartData] =
      await Promise.all([
        fetchTrendData(dateFrom, dateTo),
        fetchKPIData(dateFrom, dateTo),
        fetchTopPages(dateFrom, dateTo),
        fetchTopLocations(dateFrom, dateTo),
        fetchLast30MinutesData(),
        fetchDynamicChartData(chartDateRange, timeDimension)
      ]);

    return {
      trendData,
      kpiData,
      topPages: topPagesData.data || [],
      topLocations: topLocationsData.data || [],
      last30Minutes: last30MinData,
      dynamicChart: dynamicChartData
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
}

/**
 * Format time in seconds to minutes and seconds
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time (e.g. "5m 30s")
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Calculate statistics from KPI data
 * @param {Array} kpiData - Array of KPI data items
 * @param {Array} trendData - Array of trend data items (optional, for compatibility)
 * @param {Object} last30MinData - Last 30 minutes data with complete timeline
 * @returns {Object} Calculated statistics
 */
export function calculateStatistics(kpiData: any[], trendData?: any[], last30MinData?: any): {
  totalVisits: number;
  totalPageviews: number;
  avgSessionTime: string;
  avgBounceRate: string;
  totalUsers30Minutes: number;
} {
  if (!kpiData?.length) {
    return {
      totalVisits: 0,
      totalPageviews: 0,
      avgSessionTime: "0m 0s",
      avgBounceRate: "0.00",
      totalUsers30Minutes: 0,
    };
  }

  const totalVisits = kpiData.reduce(
    (sum, item) => sum + (item.visits || 0),
    0
  );

  const totalPageviews = kpiData.reduce(
    (sum, item) => sum + (item.pageviews || 0),
    0
  );

  const totalAvgSessionSec = kpiData.reduce(
    (sum, item) => sum + (item.avg_session_sec || 0),
    0
  );

  const totalBounceRate = kpiData.reduce(
    (sum, item) => sum + (item.bounce_rate || 0),
    0
  );

  // Use dedicated 30-minute data if available, otherwise fallback to trend data
  const totalUsers30Minutes = last30MinData?.totalVisitors ||
    trendData?.reduce((sum: number, item: any) => sum + (item.visits || 0), 0) || 0;

  const avgSessionTime = formatTime(totalAvgSessionSec / kpiData.length);
  const avgBounceRate = ((totalBounceRate / kpiData.length) * 100).toFixed(2);

  return {
    totalVisits,
    totalPageviews,
    avgSessionTime,
    avgBounceRate,
    totalUsers30Minutes,
  };
}
