import { describe, it, expect } from 'vitest';
import { formatFileSize, formatDate, formatPermissions } from './format';

describe('formatFileSize', () => {
	it('formats zero bytes', () => {
		expect(formatFileSize(0)).toBe('0 B');
	});

	it('formats bytes', () => {
		expect(formatFileSize(500)).toBe('500 B');
	});

	it('formats kilobytes', () => {
		expect(formatFileSize(1024)).toBe('1.00 KB');
	});

	it('formats megabytes', () => {
		expect(formatFileSize(1048576)).toBe('1.00 MB');
	});

	it('formats gigabytes', () => {
		expect(formatFileSize(1073741824)).toBe('1.00 GB');
	});

	it('formats with appropriate decimal places', () => {
		expect(formatFileSize(1536)).toBe('1.50 KB');
		expect(formatFileSize(10240)).toBe('10.0 KB');
		expect(formatFileSize(102400)).toBe('100 KB');
	});

	it('handles large terabyte values', () => {
		expect(formatFileSize(1099511627776)).toBe('1.00 TB');
	});
});

describe('formatDate', () => {
	it('returns empty string for null', () => {
		expect(formatDate(null)).toBe('');
	});

	it('formats a date string', () => {
		const result = formatDate('2025-06-15T14:30:00Z');
		// Will contain month-day hours:minutes
		expect(result).toMatch(/\d{2}-\d{2}\s\d{2}:\d{2}/);
	});

	it('shows year for dates not in current year', () => {
		const result = formatDate('2020-01-01T00:00:00Z');
		expect(result).toContain('2020');
	});
});

describe('formatPermissions', () => {
	it('returns empty string for undefined', () => {
		expect(formatPermissions(undefined)).toBe('');
	});

	it('formats rwxr-xr-x (755)', () => {
		expect(formatPermissions(0o100755)).toBe('755');
	});

	it('formats rw-r--r-- (644)', () => {
		expect(formatPermissions(0o100644)).toBe('644');
	});

	it('formats rwx------ (700)', () => {
		expect(formatPermissions(0o100700)).toBe('700');
	});
});
