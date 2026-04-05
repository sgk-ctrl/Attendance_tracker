import { DAYS, MONTHS, TERM_DATES_2026, CACHE_KEYS } from './constants';

export function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function dateToISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function calcTerm(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  for (const t of TERM_DATES_2026) {
    const afterStart = m > t.start[0] || (m === t.start[0] && day >= t.start[1]);
    const beforeEnd = m < t.end[0] || (m === t.end[0] && day <= t.end[1]);
    if (afterStart && beforeEnd) return t.term;
  }
  if (m <= 1 && day < 27) return 1;
  if (m >= 12 && day > 17) return 4;
  if (m === 4 && day > 3 && day < 20) return 2;
  if (m === 7 && day > 3 && day < 20) return 3;
  if ((m === 9 && day > 25) || (m === 10 && day < 12)) return 4;
  return 1;
}

export function defaultTimeForDay(dayOfWeek) {
  if (dayOfWeek === 3) {
    return { hour: '7', minute: '45', ampm: 'AM', type: 'morning', time: '7:45 AM' };
  }
  return { hour: '3', minute: '10', ampm: 'PM', type: 'afternoon', time: '3:10 PM' };
}

export function buildSessionTime(hour, minute, ampm) {
  return `${hour}:${minute} ${ampm}`;
}

export function sessionTypeFromTime(hour, ampm) {
  const hour24 = ampm === 'PM'
    ? (parseInt(hour) === 12 ? 12 : parseInt(hour) + 12)
    : (parseInt(hour) === 12 ? 0 : parseInt(hour));
  return hour24 < 12 ? 'morning' : 'afternoon';
}

export function pctClass(p) {
  return p >= 80 ? 'pct-good' : p >= 50 ? 'pct-warn' : 'pct-bad';
}

export function pctColor(p) {
  if (p >= 80) return 'var(--green-500)';
  if (p >= 50) return 'var(--orange-500)';
  return 'var(--red-500)';
}

export function pctTextColor(p) {
  if (p >= 80) return 'text-[var(--green-600)]';
  if (p >= 50) return 'text-[var(--orange-500)]';
  return 'text-[var(--red-600)]';
}

// localStorage caching
export function cacheData(instruments, students) {
  try {
    localStorage.setItem(CACHE_KEYS.INSTRUMENTS, JSON.stringify(instruments));
    localStorage.setItem(CACHE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(CACHE_KEYS.CACHE_TIME, new Date().toISOString());
  } catch (e) {
    console.warn('Cache write failed', e);
  }
}

export function getCachedData() {
  try {
    const instruments = JSON.parse(localStorage.getItem(CACHE_KEYS.INSTRUMENTS));
    const students = JSON.parse(localStorage.getItem(CACHE_KEYS.STUDENTS));
    if (instruments && students) return { instruments, students };
  } catch (e) { /* ignore */ }
  return null;
}

export function savePendingAttendance(dateStr, sessionType, term, year, payload) {
  try {
    const key = `pending_attendance_${dateStr}_${sessionType}`;
    localStorage.setItem(key, JSON.stringify({
      payload,
      date: dateStr,
      sessionType,
      term,
      year,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Failed to save pending attendance', e);
  }
}

export function getPendingAttendanceKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pending_attendance_')) {
      keys.push(key);
    }
  }
  return keys;
}

export function removePendingAttendance(dateStr, sessionType) {
  const key = `pending_attendance_${dateStr}_${sessionType}`;
  localStorage.removeItem(key);
}

export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

export function animateCountUp(el, target, total, duration = 800) {
  if (!el) return;
  const text = `${target} / ${total}`;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return;
  }
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = `${current} / ${total}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
