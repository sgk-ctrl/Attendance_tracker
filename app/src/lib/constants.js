export const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];
export const DAYS_MED = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const HOURS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
export const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];
export const AMPM = ['AM','PM'];

export const TERMS = [1, 2, 3, 4];

export const REPORT_YEARS = [2027, 2026, 2025];

// NSW 2026 school term dates
export const TERM_DATES_2026 = [
  { term: 1, start: [1, 27], end: [4, 3] },
  { term: 2, start: [4, 20], end: [7, 3] },
  { term: 3, start: [7, 20], end: [9, 25] },
  { term: 4, start: [10, 12], end: [12, 17] },
];

// NSW 2027 school term dates (approximate — verify with NSW DoE when confirmed)
export const TERM_DATES_2027 = [
  { term: 1, start: [1, 25], end: [4, 2] },
  { term: 2, start: [4, 19], end: [7, 2] },
  { term: 3, start: [7, 19], end: [9, 24] },
  { term: 4, start: [10, 11], end: [12, 17] },
];

// Year-indexed term dates — add a new entry each January
export const TERM_DATES_BY_YEAR = {
  2026: TERM_DATES_2026,
  2027: TERM_DATES_2027,
};
