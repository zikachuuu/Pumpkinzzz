export const DATE_FORMATS = {
  iso: 'yyyy-mm-dd',
  dmy: 'dd-mm-yyyy'
};

export function formatDate(dateValue, format = DATE_FORMATS.iso) {
  if (!dateValue) return '-';
  const value = String(dateValue).slice(0, 10);
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, year, month, day] = match;
  return format === DATE_FORMATS.dmy ? `${day}-${month}-${year}` : `${year}-${month}-${day}`;
}

export function getStoredDateFormat() {
  return localStorage.getItem('pumpkinzzz-date-format') || DATE_FORMATS.iso;
}

export function setStoredDateFormat(format) {
  localStorage.setItem('pumpkinzzz-date-format', format);
}
