/**
 * Monthly Revenue Summary Builder
 * ----------------------------------
 * Aggregates confirmed partnership/sponsorship revenue by month from
 * the Partnership Tracker and writes a clean monthly summary table
 * that the analytics dashboard's charts read from. Runs on a daily
 * time trigger; the dashboard tab itself just points its charts at
 * "Monthly Summary".
 */

function buildConfirmedPartnershipSummary() {
  const SOURCE_SHEET_NAME = 'Partnership Tracker';
  const OUTPUT_SHEET_NAME = 'Monthly Summary';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName(SOURCE_SHEET_NAME);
  if (!sourceSheet) {
    throw new Error('Source sheet not found: ' + SOURCE_SHEET_NAME);
  }

  let outputSheet = ss.getSheetByName(OUTPUT_SHEET_NAME);
  if (!outputSheet) {
    outputSheet = ss.insertSheet(OUTPUT_SHEET_NAME);
  } else {
    outputSheet.clearContents();
  }

  const data = sourceSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const headers = data[0].map(h => h.toString().trim());
  const stageIdx = headers.indexOf('Stage');
  const dateIdx = headers.indexOf('Close Date');
  const amtIdx = headers.indexOf('Amount');

  if ([stageIdx, dateIdx, amtIdx].includes(-1)) {
    throw new Error('Required headers missing (Stage, Close Date, Amount)');
  }

  const monthly = {};
  let minDate = null;
  let maxDate = null;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const d = new Date(row[dateIdx]);
    if (isNaN(d)) continue;

    // Track overall date range (even if not Confirmed)
    if (!minDate || d < minDate) minDate = new Date(d);
    if (!maxDate || d > maxDate) maxDate = new Date(d);

    if (row[stageIdx] !== 'Confirmed') continue;

    const rawAmt = row[amtIdx];
    const amt = Number(
      String(rawAmt || '')
        .replace(/,/g, '')
        .replace(/[^\d.-]/g, '')
    );

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[monthKey]) monthly[monthKey] = 0;
    monthly[monthKey] += amt || 0;
  }

  // Build full month range so the dashboard trendline has no gaps
  const rows = [['Month', 'Total']];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    rows.push([key, monthly[key] || 0]);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  outputSheet.getRange(1, 1, rows.length, 2).setValues(rows);
  outputSheet
    .getRange(2, 2, rows.length - 1, 1)
    .setNumberFormat('#,##0');
}
