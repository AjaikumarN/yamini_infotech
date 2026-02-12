import { renderHook, waitFor } from '@testing-library/react';
import { useAttendanceCheck } from '../useAttendanceCheck';
import { apiRequest } from '../../utils/api';

// Mock the API
jest.mock('../../utils/api');

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('useAttendanceCheck', () => {
  const TODAY = '2025-12-25';
  
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorageMock.clear();
    
    // Mock Date to return consistent "today"
    jest.spyOn(global, 'Date').mockImplementation(() => ({
      getFullYear: () => 2025,
      getMonth: () => 11, // December (0-indexed)
      getDate: () => 25,
      toISOString: () => `${TODAY}T10:00:00.000Z`
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('❌ No attendance today → blocked', async () => {
    apiRequest.mockResolvedValue([]);

    const { result } = renderHook(() => useAttendanceCheck());

    expect(result.current.attendanceLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(false);
    expect(result.current.attendanceData).toBe(null);
  });

  test('❌ Old attendance only → blocked', async () => {
    apiRequest.mockResolvedValue([
      { date: '2025-12-20', status: 'Present' },
      { date: '2025-12-24', status: 'Present' }
    ]);

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(false);
    expect(result.current.attendanceData).toBe(null);
  });

  test('✅ Attendance exists for today → allowed', async () => {
    const todayRecord = { date: TODAY, status: 'Present' };
    apiRequest.mockResolvedValue([
      { date: '2025-12-20', status: 'Present' },
      todayRecord,
      { date: '2025-12-24', status: 'Present' }
    ]);

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(true);
    expect(result.current.attendanceData).toEqual(todayRecord);
  });

  test('✅ Cache works for same day', async () => {
    const todayRecord = { date: TODAY, status: 'Present' };
    
    // First call - fetches from API
    apiRequest.mockResolvedValue([todayRecord]);
    
    const { result, unmount } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(true);
    expect(apiRequest).toHaveBeenCalledTimes(1);

    unmount();

    // Second call - should use cache
    const { result: result2 } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result2.current.attendanceLoading).toBe(false);
    });

    expect(result2.current.attendanceMarked).toBe(true);
    expect(apiRequest).toHaveBeenCalledTimes(1); // No additional API call
  });

  test('🔄 Force refresh ignores cache', async () => {
    const todayRecord = { date: TODAY, status: 'Present' };
    apiRequest.mockResolvedValue([todayRecord]);

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(apiRequest).toHaveBeenCalledTimes(1);

    // Force refresh
    await result.current.refreshAttendance();

    expect(apiRequest).toHaveBeenCalledTimes(2); // Made another API call
  });

  test('🚫 Old cache from previous day is invalid', async () => {
    const yesterdayRecord = { date: '2025-12-24', status: 'Present' };
    
    // Set old cache
    sessionStorageMock.setItem('attendance_verified', JSON.stringify({
      date: '2025-12-24',
      verified: true,
      data: yesterdayRecord
    }));

    apiRequest.mockResolvedValue([yesterdayRecord]);

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    // Should reject old cache and check API
    expect(result.current.attendanceMarked).toBe(false);
    expect(apiRequest).toHaveBeenCalled();
  });

  test('✅ Handles various date field names', async () => {
    const records = [
      { attendance_date: TODAY, status: 'Present' }
    ];
    apiRequest.mockResolvedValue(records);

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(true);
  });

  test('✅ Handles ISO datetime format', async () => {
    const records = [
      { date: `${TODAY}T08:30:00.000Z`, status: 'Present' }
    ];
    apiRequest.mockResolvedValue(records);

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(true);
  });

  test('⚠️ API error → blocked with safe fallback', async () => {
    apiRequest.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAttendanceCheck());

    await waitFor(() => {
      expect(result.current.attendanceLoading).toBe(false);
    });

    expect(result.current.attendanceMarked).toBe(false);
    expect(result.current.attendanceData).toBe(null);
  });
});
