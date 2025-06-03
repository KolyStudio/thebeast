/**
 * Visitors API service using Svelte 5 runes
 * Similar pattern to stats API but for Tinybird analytics data
 */

import {
  fetchTrendData,
  fetchKPIData,
  fetchTopPages,
  fetchTopLocations,
  fetchAllAnalyticsData,
  fetchDynamicChartData,
  calculateStatistics,
  fetch30MinutesMainGraph
} from './analytics';

// Types for responses
type ApiResponse = Record<string, any>;

// Date range interface
interface DateRange {
  start: { year: number; month: number; day: number };
  end: { year: number; month: number; day: number };
}

// Create state objects that can be updated
class VisitorsStore {
  trendData = $state<ApiResponse | null>(null);
  kpiData = $state<ApiResponse | null>(null);
  dynamicChartData = $state<ApiResponse | null>(null);
  last30MinutesData = $state<ApiResponse | null>(null);
  topPages = $state<any[]>([]);
  topLocations = $state<any[]>([]);
  statistics = $state({
    totalVisits: 0,
    totalPageviews: 0,
    avgSessionTime: "0m 0s",
    avgBounceRate: "0.00",
    totalUsers30Minutes: 0,
  });

  // Track current date selection state
  currentDateRange = $state<DateRange | null>(null);
  isToday = $state(true);
  periodType = $state<'day' | 'week' | 'month'>('day');

  isLoading = $state({
    trend: false,
    kpi: false,
    topPages: false,
    topLocations: false,
    dynamicChart: false,
    last30Minutes: false,
    all: false
  });

  errors = $state<Record<string, string | null>>({
    trend: null,
    kpi: null,
    topPages: null,
    topLocations: null,
    dynamicChart: null,
    last30Minutes: null,
    all: null
  });

  /**
   * Generic method to handle API requests
   */
  private async fetchResource<T>(
    fetchFunction: () => Promise<T>,
    stateKey: 'trend' | 'kpi' | 'topPages' | 'topLocations' | 'dynamicChart' | 'last30Minutes' | 'all'
  ): Promise<T | null> {
    this.isLoading[stateKey] = true;
    this.errors[stateKey] = null;

    try {
      const data = await fetchFunction();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      this.errors[stateKey] = errorMessage;
      console.error(`Error fetching ${stateKey}:`, errorMessage);
      return null;
    } finally {
      this.isLoading[stateKey] = false;
    }
  }

  /**
   * Fetch trend data for a date range
   */
  async fetchTrend(dateFrom: string, dateTo: string) {
    const data = await this.fetchResource(
      () => fetchTrendData(dateFrom, dateTo),
      'trend'
    );
    if (data) {
      this.trendData = data;
    }
    return data;
  }

  /**
   * Fetch KPI data for a date range
   */
  async fetchKPI(dateFrom: string, dateTo: string) {
    const data = await this.fetchResource(
      () => fetchKPIData(dateFrom, dateTo),
      'kpi'
    );
    if (data) {
      this.kpiData = data;
      // Update statistics when KPI data is fetched
      this.statistics = calculateStatistics(data.data || [], this.trendData?.data || []);
    }
    return data;
  }

  /**
   * Fetch top pages data
   */
  async fetchTopPages(dateFrom: string, dateTo: string, limit: number = 50) {
    const data = await this.fetchResource(
      () => fetchTopPages(dateFrom, dateTo, limit),
      'topPages'
    );
    if (data) {
      this.topPages = data.data || [];
    }
    return data;
  }

  /**
   * Fetch top locations data
   */
  async fetchTopLocations(dateFrom: string, dateTo: string, limit: number = 50) {
    const data = await this.fetchResource(
      () => fetchTopLocations(dateFrom, dateTo, limit),
      'topLocations'
    );
    if (data) {
      this.topLocations = data.data || [];
    }
    return data;
  }

  /**
   * Fetch dynamic chart data for real-time updates
   */
  async fetchDynamicChart(dateRange?: string[], timeDimension?: string) {
    const data = await this.fetchResource(
      () => fetchDynamicChartData(dateRange, timeDimension),
      'dynamicChart'
    );
    if (data) {
      this.dynamicChartData = data;
    }
    return data;
  }

  /**
   * Fetch 30-minute real-time data using main-graph API
   */
  async fetchLast30MinutesMainGraph() {
    const data = await this.fetchResource(
      () => fetch30MinutesMainGraph(),
      'last30Minutes'
    );
    if (data) {
      this.last30MinutesData = data;
    }
    return data;
  }

  /**
   * Convert DateRange to string array format
   */
  private dateRangeToStringArray(range: DateRange): string[] {
    const formatDate = (date: { year: number; month: number; day: number }) => {
      const year = date.year;
      const month = date.month.toString().padStart(2, '0');
      const day = date.day.toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return [formatDate(range.start), formatDate(range.end)];
  }

  /**
   * Fetch all visitor data at once
   */
  async fetchAllData(dateRange?: DateRange) {
    // Use today's date if no range provided
    const today = new Date();
    const defaultRange = {
      start: { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() },
      end: { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() }
    };

    const range = dateRange || defaultRange;

    // Update current date range state
    this.currentDateRange = range;

    // Check if the selected date range is today
    const isRangeToday = range.start.year === today.getFullYear() &&
                        range.start.month === today.getMonth() + 1 &&
                        range.start.day === today.getDate() &&
                        range.end.year === today.getFullYear() &&
                        range.end.month === today.getMonth() + 1 &&
                        range.end.day === today.getDate();

    this.isToday = isRangeToday;

    // Determine period type based on date range
    const startDate = new Date(range.start.year, range.start.month - 1, range.start.day);
    const endDate = new Date(range.end.year, range.end.month - 1, range.end.day);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let timeDimension = "time:hour";
    if (daysDiff <= 1) {
      this.periodType = 'day';
      timeDimension = "time:hour";
    } else if (daysDiff <= 7) {
      this.periodType = 'week';
      timeDimension = "time:day";
    } else {
      this.periodType = 'month';
      timeDimension = "time:day";
    }

    const data = await this.fetchResource(
      () => fetchAllAnalyticsData(range, timeDimension),
      'all'
    );

    if (data) {
      this.trendData = data.trendData;
      this.kpiData = data.kpiData;
      this.topPages = data.topPages;
      this.topLocations = data.topLocations;

      // Update statistics
      this.statistics = calculateStatistics(data.kpiData?.data || [], data.trendData?.data || []);
    }

    return data;
  }

  /**
   * Fetch data for today
   */
  async fetchToday() {
    const today = new Date();

    return this.fetchAllData({
      start: { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() },
      end: { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() }
    });
  }

  /**
   * Fetch data for yesterday
   */
  async fetchYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.fetchAllData({
      start: { year: yesterday.getFullYear(), month: yesterday.getMonth() + 1, day: yesterday.getDate() },
      end: { year: yesterday.getFullYear(), month: yesterday.getMonth() + 1, day: yesterday.getDate() }
    });
  }

  /**
   * Fetch data for current month
   */
  async fetchMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    return this.fetchAllData({
      start: { year: firstDay.getFullYear(), month: firstDay.getMonth() + 1, day: firstDay.getDate() },
      end: { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() }
    });
  }

  /**
   * Clear all data and reset state
   */
  clearData() {
    this.trendData = null;
    this.kpiData = null;
    this.topPages = [];
    this.topLocations = [];
    this.statistics = {
      totalVisits: 0,
      totalPageviews: 0,
      avgSessionTime: "0m 0s",
      avgBounceRate: "0.00",
      totalUsers30Minutes: 0,
    };

    // Clear errors
    Object.keys(this.errors).forEach(key => {
      this.errors[key as keyof typeof this.errors] = null;
    });
  }
}

// Create and export a singleton instance
export const visitorsStore = new VisitorsStore();
