/**
 * Centralized Call Service
 * Single source of truth for call data across Reception module
 * 
 * IMPORTANT: This service ensures consistent call counting by:
 * - Using the same API endpoints everywhere
 * - Filtering out follow-up calls from today's count
 * - Providing helper functions for common operations
 */

import { apiRequest } from '../utils/api';

// Cache for call stats to prevent redundant API calls
let statsCache = null;
let statsCacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get call statistics from backend
 * Uses /api/calls/stats which already filters out follow-ups
 * @returns {Promise<Object>} Call stats object
 */
export async function getCallStats() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (statsCache && (now - statsCacheTime) < CACHE_TTL) {
    return statsCache;
  }
  
  try {
    const stats = await apiRequest('/api/calls/stats');
    statsCache = {
      todayCalls: stats.today_calls || 0,
      dailyTarget: stats.daily_target || 40,
      completionPercentage: stats.completion_percentage || 0,
      notInterestedCount: stats.not_interested_count || 0,
      interestedBuyLaterCount: stats.interested_buy_later_count || 0,
      purchasedCount: stats.purchased_count || 0,
      pendingMonthlyFollowups: stats.pending_monthly_followups || 0,
      todaysFollowups: stats.todays_followups || 0
    };
    statsCacheTime = now;
    return statsCache;
  } catch (error) {
    console.error('Failed to fetch call stats:', error);
    return {
      todayCalls: 0,
      dailyTarget: 40,
      completionPercentage: 0,
      notInterestedCount: 0,
      interestedBuyLaterCount: 0,
      purchasedCount: 0,
      pendingMonthlyFollowups: 0,
      todaysFollowups: 0
    };
  }
}

/**
 * Get today's calls (excludes follow-ups)
 * Uses /api/calls/today which filters out is_followup_call=true
 * @returns {Promise<Array>} Array of today's call records
 */
export async function getTodaysCalls() {
  try {
    const calls = await apiRequest('/api/calls/today');
    return Array.isArray(calls) ? calls : [];
  } catch (error) {
    console.error('Failed to fetch today calls:', error);
    return [];
  }
}

/**
 * Get all call history (not just today's)
 * @param {number} limit - Maximum number of records to fetch
 * @returns {Promise<Array>} Array of all call records
 */
export async function getAllCallHistory(limit = 100) {
  try {
    const calls = await apiRequest(`/api/calls/history?limit=${limit}`);
    return Array.isArray(calls) ? calls : [];
  } catch (error) {
    console.error('Failed to fetch call history:', error);
    return [];
  }
}

/**
 * Get monthly follow-ups that need attention
 * @returns {Promise<Array>} Array of follow-up records
 */
export async function getMonthlyFollowups() {
  try {
    const followups = await apiRequest('/api/calls/monthly-followups');
    return Array.isArray(followups) ? followups : [];
  } catch (error) {
    console.error('Failed to fetch monthly followups:', error);
    return [];
  }
}

/**
 * Get today's due follow-ups
 * @returns {Promise<Array>} Array of follow-ups due today
 */
export async function getTodaysFollowups() {
  try {
    const followups = await apiRequest('/api/calls/monthly-followups/today');
    return Array.isArray(followups) ? followups : [];
  } catch (error) {
    console.error('Failed to fetch today followups:', error);
    return [];
  }
}

/**
 * Log a new call
 * @param {Object} callData - Call data to submit
 * @returns {Promise<Object>} Created call record
 */
export async function logCall(callData) {
  // Invalidate cache
  statsCache = null;
  
  const response = await apiRequest('/api/calls/', {
    method: 'POST',
    body: JSON.stringify(callData)
  });
  
  return response;
}

/**
 * Submit a follow-up for an existing call
 * @param {Object} followupData - Follow-up data
 * @returns {Promise<Object>} Created follow-up record
 */
export async function submitFollowup(followupData) {
  // Invalidate cache
  statsCache = null;
  
  const response = await apiRequest('/api/calls/monthly-followup', {
    method: 'POST',
    body: JSON.stringify(followupData)
  });
  
  return response;
}

/**
 * Invalidate the stats cache (call after any data modification)
 */
export function invalidateCache() {
  statsCache = null;
  statsCacheTime = 0;
}

/**
 * Check if a call is from today
 * @param {Object} call - Call record with call_date or created_at
 * @returns {boolean} True if call is from today
 */
export function isCallFromToday(call) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const callDate = call.call_date || call.created_at;
  if (!callDate) return false;
  
  const callDateStr = callDate.split('T')[0];
  return callDateStr === todayStr;
}

/**
 * Filter calls to get only today's non-followup calls
 * Use this when you already have a calls array and need to filter locally
 * @param {Array} calls - Array of call records
 * @returns {Array} Filtered calls from today (excluding follow-ups)
 */
export function filterTodaysCalls(calls) {
  if (!Array.isArray(calls)) return [];
  
  return calls.filter(call => 
    isCallFromToday(call) && !call.is_followup_call
  );
}

export default {
  getCallStats,
  getTodaysCalls,
  getMonthlyFollowups,
  getTodaysFollowups,
  logCall,
  submitFollowup,
  invalidateCache,
  isCallFromToday,
  filterTodaysCalls
};
