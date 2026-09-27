/**
 * Partnership / Contract Expiry Reminders
 * ------------------------------------------
 * Run daily on a time trigger. Scans the Partnership Tracker for
 * end dates approaching in 60 days (soft reminder) or 40 days (hard
 * reminder + red highlight), and emails the responsible manager and
 * assistant. Recipient addresses live on a "Managers" tab so they can
 * be updated by anyone without touching code.
 *
 * A second entry point below (sendEngagementExpiryReminders) applies
 * the same logic to the Client Engagement Tracker, which also CCs the
 * delivery team.
 */

function sendPartnershipExpiryReminders() {
  runExpiryReminders_({
    sheetName: 'Partnership Tracker',
    startCol: 8,   // H
    endCol: 9,     // I
    nameCol: 1,    // B (0-indexed)
    subjectPrefix: 'Partnership',
    entityLabel: 'Partner',
    extraCC: null
  });
}

function sendEngagementExpiryReminders() {
  runExpiryReminders_({
    sheetName: 'Client Engagement Tracker',
    startCol: 5,   // E
    endCol: 6,     // F
    nameCol: 2,    // C (0-indexed)
    subjectPrefix: 'Client Engagement',
    entityLabel: 'Client',
    extraCC: 'delivery' // also CC the Delivery contacts from Managers tab (D3/E3)
  });
}

function runExpiryReminders_(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName(config.sheetName);
  const managerSheet = ss.getSheetByName('Managers');
  if (!mainSheet || !managerSheet) {
    Logger.log(`Missing sheet: ${config.sheetName} or Managers`);
    return;
  }

  const contractManagerEmail = managerSheet.getRange('B3').getValue();
  const assistantEmail = managerSheet.getRange('C3').getValue();
  const recipients = [contractManagerEmail, assistantEmail]
    .filter(e => e && e.toString().includes('@')).join(',');

  let ccEmails = '';
  if (config.extraCC === 'delivery') {
    const deliveryManager = managerSheet.getRange('D3').getValue();
    const deliveryAssistant = managerSheet.getRange('E3').getValue();
    ccEmails = [deliveryManager, deliveryAssistant]
      .filter(e => e && e.toString().includes('@')).join(',');
  }

  const START_DATE_COL = config.startCol;
  const END_DATE_COL = config.endCol;
  const data = mainSheet.getDataRange().getValues();
  const headerRow = data[0];

  let logCol = headerRow.indexOf('Expiry Reminder Sent') + 1;
  if (logCol === 0) {
    logCol = headerRow.length + 1;
    mainSheet.getRange(1, logCol).setValue('Expiry Reminder Sent');
  }

  const today = new Date();
  const SOFT_DAYS = 60;
  const HARD_DAYS = 40;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const startDate = row[START_DATE_COL - 1];
    const endDate = row[END_DATE_COL - 1];
    const entityName = row[config.nameCol];
    if (!endDate || isNaN(new Date(endDate))) continue;

    const diffDays = Math.ceil((new Date(endDate) - today) / (1000 * 60 * 60 * 24));
    const logValue = row[logCol - 1] ? row[logCol - 1].toString() : '';

    const cell = mainSheet.getRange(i + 1, END_DATE_COL);
    cell.setBackground(diffDays <= HARD_DAYS && diffDays >= 0 ? '#f4cccc' : null);

    const rowNumber = i + 1;
    const body = `
Row ${rowNumber} in the ${config.sheetName} has an approaching End Date.

${config.entityLabel}: ${entityName || 'N/A'}
Start Date: ${formatDate(startDate)}
End Date: ${formatDate(endDate)}
Days Remaining: ${diffDays}

Open this row:
${ss.getUrl()}#gid=${mainSheet.getSheetId()}&range=${rowNumber}:${rowNumber}
`;

    if (diffDays <= SOFT_DAYS && diffDays > HARD_DAYS && !logValue.includes('Soft')) {
      MailApp.sendEmail({
        to: recipients, cc: ccEmails,
        subject: `${config.subjectPrefix} Soft Reminder: End Date Approaching (Row ${rowNumber})`,
        body: body
      });
      mainSheet.getRange(i + 1, logCol).setValue(`Soft - ${formatDate(today)}`);
    }

    if (diffDays <= HARD_DAYS && diffDays >= 0 && !logValue.includes('Hard')) {
      MailApp.sendEmail({
        to: recipients, cc: ccEmails,
        subject: `${config.subjectPrefix} Hard Reminder: End Date Approaching (Row ${rowNumber})`,
        body: body
      });
      mainSheet.getRange(i + 1, logCol).setValue(`Hard - ${formatDate(today)}`);
    }
  }
}

function formatDate(date) {
  if (!date || isNaN(new Date(date))) return '';
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
