import { formatDuration, formatDate, formatFileSize } from '../../utils/formatters';

describe('formatters', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(59)).toBe('0:59');
    });

    it('formats minutes correctly', () => {
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3599)).toBe('59:59');
    });

    it('formats hours correctly', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });
  });

  describe('formatDate', () => {
    const mockDate = new Date('2024-01-15T10:30:00Z');
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    beforeAll(() => {
      // Mock the current date for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-16T10:30:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('formats today as time', () => {
      const todayDate = new Date();
      const result = formatDate(todayDate);
      expect(result).toMatch(/^\d{1,2}:\d{2}$/); // Format like "10:30"
    });

    it('formats yesterday correctly', () => {
      const result = formatDate(yesterday);
      expect(result).toBe('Yesterday');
    });

    it('formats recent dates as weekday', () => {
      const result = formatDate(lastWeek);
      expect(result).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/);
    });

    it('formats older dates with month and day', () => {
      const oldDate = new Date('2023-12-15T10:30:00Z');
      const result = formatDate(oldDate);
      expect(result).toMatch(/^[A-Za-z]{3} \d{1,2}(, \d{4})?$/); // Format like "Dec 15" or "Dec 15, 2023"
    });

    it('handles string dates', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toBe('Yesterday');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048575)).toBe('1024 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(1073741823)).toBe('1024 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    it('handles decimal places correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1638400)).toBe('1.56 MB');
    });
  });
});
