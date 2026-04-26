import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Parse a date string from the backend as LOCAL time.
 * The backend stores times without timezone (no Z suffix).
 * If the string has no Z/offset, treat it as local. If it does, use as-is.
 */
export function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    const s = String(dateStr);
    // If already has timezone info (Z or +/-offset), parse normally
    if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
        return new Date(s);
    }
    // No timezone — treat as local time (not UTC)
    return new Date(s.replace('T', ' '));
}
