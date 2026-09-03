export const DATE_FORMATS = {
  iso: 'yyyy-mm-dd',
  dmy: 'dd-mm-yyyy'
};

export const DEFAULT_URGENCY_SETTINGS = {
  milestoneUrgentDays: 30,
  milestoneVeryUrgentDays: 7,
  componentUrgentDays: 30,
  componentVeryUrgentDays: 7
};

export const DEFAULT_SETTINGS = {
  dateFormat: DATE_FORMATS.iso,
  startOfWeek: 1,
  urgencySettings: DEFAULT_URGENCY_SETTINGS,
};

const SETTINGS_STORAGE_KEY = 'pumpkinzzz-settings';

function getStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function normalizeSettings(settings = {}) {
  const storedDateFormat = settings.dateFormat;
  const dateFormat = storedDateFormat === 'yyyy-mm-dd' || storedDateFormat === 'yyyy/mm/dd'
    ? DATE_FORMATS.iso
    : storedDateFormat === 'dd-mm-yyyy' || storedDateFormat === 'dd/mm/yyyy'
      ? DATE_FORMATS.dmy
      : storedDateFormat || DEFAULT_SETTINGS.dateFormat;
  const urgencySettings = {
    ...DEFAULT_URGENCY_SETTINGS,
    ...(settings.urgencySettings || {})
  };

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    startOfWeek: Number(settings.startOfWeek ?? DEFAULT_SETTINGS.startOfWeek),
    dateFormat,
    urgencySettings,
  };
}

export function readPersistedSettings() {
  const storage = getStorage();
  if (!storage) {
    return normalizeSettings();
  }

  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeSettings();
  }
}

export function writePersistedSettings(nextSettings) {
  const storage = getStorage();
  const normalized = normalizeSettings(nextSettings);

  if (storage) {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  }

  if (window.electronAPI && typeof window.electronAPI.writeSettings === 'function') {
    window.electronAPI.writeSettings(normalized).catch(() => {});
  }

  return normalized;
}

export function resetPersistedSettings() {
  const defaults = normalizeSettings();
  return writePersistedSettings(defaults);
}

export async function syncSettingsFromJson() {
  if (!window.electronAPI || typeof window.electronAPI.readSettings !== 'function') {
    return readPersistedSettings();
  }

  try {
    const settings = await window.electronAPI.readSettings();
    const normalized = normalizeSettings(settings || {});
    if (typeof window !== 'undefined') {
      const storage = getStorage();
      if (storage) {
        storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
      }
    }
    return normalized;
  } catch {
    return readPersistedSettings();
  }
}

export function normalizeDateValue(dateValue, preferredFormat = DATE_FORMATS.iso) {
  if (!dateValue) return '';

  const value = String(dateValue).trim();
  let year;
  let month;
  let day;
  let match = value.match(/^(\d{4})[-/]([01]?\d)[-/]([0-3]?\d)$/);

  if (match) {
    [, year, month, day] = match;
  } else {
    match = value.match(/^([0-3]?\d)[-/]([01]?\d)[-/](\d{2}|\d{4})$/);
    if (!match) return '';
    [, day, month, year] = match;
    if (year.length === 2) year = `20${year}`;
  }

  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    utcDate.getUTCFullYear() !== Number(year) ||
    utcDate.getUTCMonth() !== Number(month) - 1 ||
    utcDate.getUTCDate() !== Number(day)
  ) return '';

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getDateInputValue(dateValue, dateFormat = DATE_FORMATS.iso) {
  return normalizeDateValue(dateValue, dateFormat);
}

export function formatDate(dateValue, format = DATE_FORMATS.iso) {
  if (!dateValue) return '-';
  const value = normalizeDateValue(dateValue, format);
  if (!value) return String(dateValue);
  const [year, month, day] = value.split('-');
  return format === DATE_FORMATS.dmy || format === 'dd-mm-yyyy'
    ? `${day}-${month}-${year}`
    : `${year}-${month}-${day}`;
}

export function getStoredDateFormat() {
  return readPersistedSettings().dateFormat || DATE_FORMATS.iso;
}

export function setStoredDateFormat(format) {
  return writePersistedSettings({ ...readPersistedSettings(), dateFormat: format }).dateFormat;
}

export function getUrgencySettings() {
  return readPersistedSettings().urgencySettings;
}

export function setUrgencySettings(settings) {
  const current = readPersistedSettings();
  const nextSettings = {
    ...current.urgencySettings,
    ...settings,
  };

  return writePersistedSettings({ ...current, urgencySettings: nextSettings }).urgencySettings;
}

export const getStartOfWeek = () => {
  return Number(readPersistedSettings().startOfWeek ?? 1);
};

export const setStartOfWeek = (dayIndex) => {
  return writePersistedSettings({ ...readPersistedSettings(), startOfWeek: Number(dayIndex) }).startOfWeek;
};
