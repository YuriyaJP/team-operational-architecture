/**
 * New Client Engagement Notification
 * --------------------------------------
 * When a new row appears in the Client Engagement Tracker with
 * status "Not started" (i.e. a contract was just signed), this emails:
 *   - the Finance team, so an invoice gets issued
 *   - the Delivery team, so the client gets onboarded
 * Each email includes the contract details and a direct link to the row.
 * Recipient addresses live on the "Contract Managers" tab.
 *
 * TEST_MODE routes everything to a single test recipient (Script
 * Property TEST_RECIPIENT) instead of the real distribution lists.
 */

function sendNewEngagementNotification() {
  const TEST_MODE = false;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName('Client Engagement Tracker');
  const managerSheet = ss.getSheetByName('Contract Managers');

  const data = mainSheet.getDataRange().getValues();
  const headers = data[0];

  // === Column indexes (0-based) ===
  const STATUS_COL = 0;          // A
  const COMPANY_COL = 2;         // C
  const START_COL = 4;           // E
  const END_COL = 5;             // F
  const AMOUNT_COL = 6;          // G (incl tax)
  const PARTICIPANTS_COL = 7;    // H
  const SESSIONS_COL = 9;        // J
  const BILLING_ADDRESS_COL = 14; // O

  // === Find or create log column ===
  let logCol = headers.indexOf('New Engagement Notification Sent') + 1;
  if (logCol === 0) {
    logCol = headers.length + 1;
    mainSheet.getRange(1, logCol).setValue('New Engagement Notification Sent');
  }

  // === Recipients from Contract Managers tab ===
  const outreach1 = managerSheet.getRange('B3').getValue();
  const outreach2 = managerSheet.getRange('C3').getValue();
  const deliveryManager = managerSheet.getRange('D3').getValue();
  const deliveryAssistant = managerSheet.getRange('E3').getValue();
  const invoiceManager = managerSheet.getRange('F3').getValue();
  const invoiceAssistant = managerSheet.getRange('G3').getValue();

  const outreachCC = [outreach1, outreach2].filter(e => e && e.toString().includes('@')).join(',');
  const deliveryRecipients = [deliveryManager, deliveryAssistant].filter(e => e && e.toString().includes('@')).join(',');
  const invoiceRecipients = [invoiceManager, invoiceAssistant].filter(e => e && e.toString().includes('@')).join(',');

  const testRecipient = PropertiesService.getScriptProperties().getProperty('TEST_RECIPIENT') || '';
  const deliveryEmailTo = TEST_MODE ? testRecipient : deliveryRecipients;
  const invoiceEmailTo = TEST_MODE ? testRecipient : invoiceRecipients;
  const ccEmails = TEST_MODE ? '' : outreachCC;

  // === Prepare email content arrays ===
  const deliveryRows = [];
  const invoiceRows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[STATUS_COL];
    const alreadySent = row[logCol - 1];

    if (status !== 'Not started' || (!TEST_MODE && alreadySent)) continue;

    const rowNumber = i + 1;
    const companyName = row[COMPANY_COL];
    const startDate = row[START_COL];
    const endDate = row[END_COL];
    const amountInclTax = row[AMOUNT_COL];
    const participants = row[PARTICIPANTS_COL];
    const sessions = row[SESSIONS_COL];
    const billingAddress = row[BILLING_ADDRESS_COL];
    const rowLink = `${ss.getUrl()}#gid=${mainSheet.getSheetId()}&range=${rowNumber}:${rowNumber}`;

    const rowText =
`<p>Row ${rowNumber} in the Client Engagement Tracker has been created.</p>
<ul>
<li><strong>Client:</strong> ${companyName || 'N/A'}</li>
<li><strong>Start Date:</strong> ${formatDate(startDate)}</li>
<li><strong>End Date:</strong> ${formatDate(endDate)}</li>
<li><strong># Participants:</strong> ${participants || 'N/A'}</li>
<li><strong>Sessions:</strong> ${sessions || 'N/A'}</li>
<li><strong>Amount (incl tax):</strong> ${formatCurrency(amountInclTax)}</li>
<li><strong>Billing Address:</strong> ${billingAddress || 'N/A'}</li>
<li><a href="${rowLink}">Open this row</a></li>
</ul>`;

    deliveryRows.push(rowText);
    invoiceRows.push(rowText);

    if (!TEST_MODE) {
      mainSheet.getRange(rowNumber, logCol).setValue(`Sent - ${formatDate(new Date())}`);
    }
  }

  // === Delivery team: onboard the client ===
  if (deliveryRows.length > 0) {
    const deliveryBody =
`<p>Dear Delivery Team,</p>
${deliveryRows.join('<hr>')}

<p><strong>Renewal Note:</strong> If the engagement is renewed, Outreach would like to receive the previous usage stats for these clients.</p>
<p><strong>Note:</strong> You're welcome to contact the outreach team for any details, if needed.</p>
<p><em>(This is an automatically generated email.)</em></p>`;

    MailApp.sendEmail({
      to: deliveryEmailTo,
      cc: ccEmails,
      subject: `New Client Engagement(s) Created`,
      htmlBody: deliveryBody
    });
  }

  // === Finance team: issue the invoice ===
  if (invoiceRows.length > 0) {
    const invoiceBody =
`<p>Dear Finance Team,</p>
${invoiceRows.join('<hr>')}
<p><strong>Invoice Note:</strong> Please issue the invoice to the outreach team and record the invoice ID number in this sheet (column Q).</p>
<p><em>(This is an automatically generated email.)</em></p>`;

    MailApp.sendEmail({
      to: invoiceEmailTo,
      cc: ccEmails,
      subject: `New Contract(s) Signed – Invoice Required`,
      htmlBody: invoiceBody
    });
  }
}

function formatDate(date) {
  if (!date || isNaN(new Date(date))) return '';
  return Utilities.formatDate(
    new Date(date),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

function formatCurrency(amount) {
  if (amount === null || amount === '' || isNaN(amount)) return 'N/A';
  return Number(amount).toLocaleString();
}
