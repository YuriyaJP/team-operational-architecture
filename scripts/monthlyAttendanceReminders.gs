/**
 * Monthly Attendance & Revenue Reminder
 * --------------------------------------
 * Run monthly on a time trigger. Scans the current year's Event
 * Tracker tab for events that already took place but have no
 * attendance figure entered, and emails each responsible team member
 * a summary of what's missing.
 *
 * The name → email lookup lives on a separate "Directory" tab (not
 * hidden columns on the tracker), and the "questions to" contact is
 * read from Script Properties — see config/CONFIG_SETUP.md.
 */

function sendMonthlyAttendanceReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(new Date().getFullYear().toString());
  const directorySheet = ss.getSheetByName('Directory');
  const questionsContact =
    PropertiesService.getScriptProperties().getProperty('OPS_CONTACT_EMAIL') || '';

  if (!sheet) { Logger.log('Year sheet not found.'); return; }
  if (!directorySheet) { Logger.log('Directory sheet not found.'); return; }

  const headerRow = 2;
  const dataStartRow = 3;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];

  const col = (name) => {
    const idx = headers.findIndex(
      h => h && h.toString().trim().toLowerCase() === name.toLowerCase()
    );
    return idx === -1 ? -1 : idx + 1;
  };

  const dateCol = col('Date');
  const eventNameCol = col('Event Name');
  const leadCol = col('Programme Lead');
  const attendeesCol = col('# Attendees');

  if ([dateCol, eventNameCol, leadCol, attendeesCol].includes(-1)) {
    Logger.log('Required columns not found.');
    return;
  }

  // Directory tab: column A = Name, column B = Email
  const dirLastRow = directorySheet.getLastRow();
  const contactDirectory = {};
  if (dirLastRow > 1) {
    directorySheet.getRange(2, 1, dirLastRow - 1, 2).getValues().forEach(([name, email]) => {
      if (name && email) contactDirectory[name.toString().trim().toLowerCase()] = email.toString().trim();
    });
  }

  const data = sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol).getValues();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const reminders = {};

  data.forEach(row => {
    const eventDate = row[dateCol - 1];
    const eventName = row[eventNameCol - 1];
    const lead = row[leadCol - 1];
    const attendees = row[attendeesCol - 1];

    // Skip if attendance already entered
    if (attendees !== '' && attendees !== null && attendees !== undefined) return;
    if (!eventDate || !eventName || !lead) return;

    const d = new Date(eventDate);
    if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;

    const contactKey = lead.toString().trim().toLowerCase();
    const email = contactDirectory[contactKey];
    if (!email) { Logger.log(`No email found for contact: ${lead}`); return; }

    if (!reminders[email]) reminders[email] = { contactName: lead, events: [] };
    reminders[email].events.push({
      name: eventName,
      date: Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    });
  });

  Object.keys(reminders).forEach(email => {
    const recipient = reminders[email];
    let eventList = '';
    recipient.events.forEach(ev => { eventList += `• ${ev.date} - ${ev.name}\n`; });

    const monthName = Utilities.formatDate(today, Session.getScriptTimeZone(), 'MMMM yyyy');
    const subject = `Reminder: Submit attendance and revenue for ${monthName}`;
    const body =
`Hello ${recipient.contactName},

Please submit the attendance numbers and any revenue generated for the following events held during ${monthName}:

${eventList}
For each event, please provide:

• Number of attendees. If there was none, please enter 0
• Revenue amount (if applicable), otherwise leave as blank

Questions to ${questionsContact}

Thank you.`;

    MailApp.sendEmail({ to: email, subject: subject, body: body });
    Logger.log(`Reminder sent to ${email}`);
  });

  Logger.log(`Processed ${Object.keys(reminders).length} reminder recipient(s).`);
}
