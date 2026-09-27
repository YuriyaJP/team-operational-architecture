/**
 * Event Tracker → Calendar Sync
 * ------------------------------
 * Watches the active year tab of the Event Tracker for edits and keeps
 * two Google Calendars in sync with it:
 *   - an internal calendar (full detail, every event)
 *   - a public calendar (title/time/location only, events marked
 *     "Add to public calendar?" = TRUE)
 *
 * Calendar IDs are read from Script Properties, not hardcoded — see
 * config/CONFIG_SETUP.md. This is what lets the same script move
 * between spreadsheets/projects without a code change.
 */

function onEdit(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const PRIVATE_CAL_ID = props.getProperty('PRIVATE_CALENDAR_ID');
    const PUBLIC_CAL_ID = props.getProperty('PUBLIC_CALENDAR_ID');

    if (!PRIVATE_CAL_ID || !PUBLIC_CAL_ID) {
      Logger.log('Calendar IDs not configured in Script Properties.');
      return;
    }

    // ================= HELPERS =================
    function cleanText(text) {
      if (!text) return '';
      return text.toString()
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&quot;/g, '"');
    }

    function getEvent(calendar, id) {
      if (!id) return null;
      try {
        return calendar.getEventById(id.toString().trim());
      } catch (err) {
        return null;
      }
    }

    // ================= SHEET =================
    const sheet = e.source.getActiveSheet();
    const row = e.range.getRow();
    if (row < 3) return; // data starts row 3

    const headerRow = 2;
    const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];

    const col = (name) => {
      const i = headers.findIndex(h =>
        h && h.toString().trim().toLowerCase() === name.toLowerCase()
      );
      return i === -1 ? -1 : i + 1;
    };

    // ================= COLUMNS =================
    const dateCol = col('Date');
    const titleCol = col('Event Name');
    const locationCol = col('Location');
    const privateIdCol = col('Calendar Event ID');
    const publicIdCol = col('Public Calendar Event ID');
    const checkboxCol = col('Add to public calendar?');
    const statusCol = col('Status (auto)');
    const notesCol = col('Notes (Programme/Grant etc)');
    const leadCol = col('Programme Lead');

    if ([dateCol, titleCol, locationCol, privateIdCol, publicIdCol].includes(-1)) return;

    const editedCol = e.range.getColumn();
    if (editedCol === privateIdCol || editedCol === publicIdCol) return;

    // ================= DATA =================
    const eventDate = sheet.getRange(row, dateCol).getValue();
    const eventTitle = sheet.getRange(row, titleCol).getValue();
    const location = sheet.getRange(row, locationCol).getValue();

    const privateId = sheet.getRange(row, privateIdCol).getValue();
    const publicId = sheet.getRange(row, publicIdCol).getValue();

    const status = statusCol !== -1 ? sheet.getRange(row, statusCol).getValue() : '';
    const notes = notesCol !== -1 ? sheet.getRange(row, notesCol).getValue() : '';
    const lead = leadCol !== -1 ? sheet.getRange(row, leadCol).getValue() : '';

    const checkboxRaw = checkboxCol !== -1 ? sheet.getRange(row, checkboxCol).getValue() : false;
    const publishPublic = checkboxRaw === true;

    // ================= CALENDARS =================
    const privateCal = CalendarApp.getCalendarById(PRIVATE_CAL_ID);
    const publicCal = CalendarApp.getCalendarById(PUBLIC_CAL_ID);

    // ================= CANCEL =================
    if (status && status.toString().toLowerCase() === 'cancelled') {
      const pe = getEvent(privateCal, privateId);
      if (pe) pe.deleteEvent();
      sheet.getRange(row, privateIdCol).clearContent();

      const pub = getEvent(publicCal, publicId);
      if (pub) pub.deleteEvent();
      sheet.getRange(row, publicIdCol).clearContent();
      return;
    }

    if (!eventDate || !eventTitle) return;

    // ================= TIME =================
    const d = new Date(eventDate);
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;

    const start = hasTime ? d : new Date(d.setHours(12, 0, 0, 0));
    const end = new Date(start.getTime() + 60 * 60000);

    // ================= DESCRIPTION (internal calendar only) =================
    let description = `Programme lead: ${lead || ''}`;
    if (notes) description += `\n\nNotes:\n${notes}`;

    // ================= PRIVATE =================
    let privateEvent = getEvent(privateCal, privateId);

    if (privateEvent) {
      privateEvent.setTitle(cleanText(eventTitle));
      privateEvent.setTime(start, end);
      privateEvent.setLocation(cleanText(location));
      privateEvent.setDescription(description);
    } else {
      const newEv = privateCal.createEvent(
        cleanText(eventTitle),
        start,
        end,
        {
          location: cleanText(location),
          description: description
        }
      );
      sheet.getRange(row, privateIdCol).setValue(newEv.getId());
    }

    // ================= PUBLIC (no internal notes ever written here) =================
    let publicEvent = getEvent(publicCal, publicId);

    if (publishPublic) {
      if (publicEvent) {
        publicEvent.setTitle(cleanText(eventTitle));
        publicEvent.setTime(start, end);
        publicEvent.setLocation(cleanText(location));
        publicEvent.setDescription('');
      } else {
        const newPub = publicCal.createEvent(
          cleanText(eventTitle),
          start,
          end,
          {
            location: cleanText(location),
            description: ''
          }
        );
        sheet.getRange(row, publicIdCol).setValue(newPub.getId());
      }
    } else {
      if (publicEvent) publicEvent.deleteEvent();
      sheet.getRange(row, publicIdCol).clearContent();
    }

  } catch (err) {
    Logger.log(err);
  }
}
