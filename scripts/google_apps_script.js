/**
 * Google Apps Script Web App voor Staopstoelen.nl
 * 
 * Beheert:
 * 1. Ophalen van bezette tijdsloten uit Google Agenda (doGet)
 * 2. Aanmaken van de afspraak in Google Agenda (doPost)
 * 3. Verzenden van de bevestigingsmail naar de klant met de gevraagde tekst (doPost)
 * 4. Verzenden van een notificatiemail naar het Staopstoelen.nl team
 * 
 * Instructies:
 * Plak deze code in uw Google Apps Script project (https://script.google.com).
 * Klik op "Implementeren" -> "Nieuwe implementatie beheren" -> "Nieuwe versie" om bij te werken.
 */

// Configuratie
const NOTIFICATION_EMAIL = "info@staopstoelen.nl"; // Ontvangt interne boekingsnotificaties
const CALENDAR_ID = "primary"; // Gebruikt de primaire Google Agenda van het account

/**
 * GET Handler: Haalt bezette tijdsloten op voor een gekozen datum
 */
function doGet(e) {
  try {
    const dateParam = e && e.parameter && e.parameter.date;
    if (!dateParam) {
      return ContentService.createTextOutput(JSON.stringify({ busySlots: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    const targetDate = new Date(dateParam + "T00:00:00");
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const events = calendar.getEvents(dayStart, dayEnd);
    const busySlots = [];

    // Tijdsloten definiëren
    const slots = [
      { label: "10:00 - 12:00", startH: 10, startM: 0, endH: 12, endM: 0 },
      { label: "12:00 - 14:00", startH: 12, startM: 0, endH: 14, endM: 0 },
      { label: "14:00 - 16:00", startH: 14, startM: 0, endH: 16, endM: 0 },
      { label: "16:00 - 18:00", startH: 16, startM: 0, endH: 18, endM: 0 },
      { label: "18:00 - 20:00", startH: 18, startM: 0, endH: 20, endM: 0 }
    ];

    slots.forEach(slot => {
      const slotStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), slot.startH, slot.startM);
      const slotEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), slot.endH, slot.endM);

      const hasConflict = events.some(ev => {
        const evStart = ev.getStartTime();
        const evEnd = ev.getEndTime();
        return (evStart < slotEnd && evEnd > slotStart);
      });

      if (hasConflict) {
        busySlots.push(slot.label);
      }
    });

    return ContentService.createTextOutput(JSON.stringify({ busySlots: busySlots }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ busySlots: [], error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST Handler: Maakt de agenda-afspraak en verstuurt de bevestigingsmail
 */
function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter || {};
    }

    const name = payload.name || "Klant";
    const phone = payload.phone || "Onbekend";
    const email = payload.email || "";
    const date = payload.date || "";
    const timeSlot = payload.timeSlot || "";
    const startTime = payload.startTime || "10:00";
    const endTime = payload.endTime || "12:00";
    const appointmentType = payload.appointmentType || "showroom";
    const address = payload.address || "Merwedestraat 239, 3313 GT Dordrecht";
    const notes = payload.notes || "-";

    const typeTitle = appointmentType === "home" ? "Passing aan Huis" : "Showroombezoek Dordrecht";
    const eventTitle = `Afspraak: ${name} (${typeTitle})`;

    // 1. Maak agenda afspraak
    let startDateObj, endDateObj;
    if (date && startTime && endTime) {
      const [year, month, day] = date.split("-").map(Number);
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      startDateObj = new Date(year, month - 1, day, startH, startM);
      endDateObj = new Date(year, month - 1, day, endH, endM);
    } else {
      startDateObj = new Date();
      endDateObj = new Date(startDateObj.getTime() + 2 * 60 * 60 * 1000);
    }

    const description = 
      `Klant: ${name}\n` +
      `Telefoon: ${phone}\n` +
      `E-mail: ${email}\n` +
      `Type: ${typeTitle}\n` +
      `Locatie: ${address}\n` +
      `Opmerkingen / Wensen: ${notes}\n`;

    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    calendar.createEvent(eventTitle, startDateObj, endDateObj, {
      description: description,
      location: address
    });

    // 2. Bevestigingsmail naar de klant
    if (email) {
      const emailSubject = `Bevestiging van uw aanvraag voor een adviesgesprek - Staopstoelen.nl`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #2e382b; max-width: 620px; margin: 0 auto; border: 1px solid #e2ddd3; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2e382b; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px; color: #ffffff;">Hartelijk dank voor uw aanvraag!</h2>
            <p style="margin: 6px 0 0 0; color: #d6e2cf; font-size: 14px;">Staopstoelen.nl &bull; Specialist in Zitcomfort</p>
          </div>
          
          <div style="padding: 28px 24px; background-color: #ffffff;">
            <p>Beste <strong>${name}</strong>,</p>
            <p>Fijn dat u contact met ons heeft opgenomen voor een adviesgesprek. Uw aanvraag is in goede orde ontvangen met onderstaande gegevens:</p>
            
            <div style="background-color: #f7f5f0; border-left: 4px solid #4b8f24; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 4px 0;"><strong>Type afspraak:</strong> ${typeTitle}</p>
              <p style="margin: 4px 0;"><strong>Datum:</strong> ${date}</p>
              <p style="margin: 4px 0;"><strong>Tijdvak:</strong> ${timeSlot}</p>
              <p style="margin: 4px 0;"><strong>Locatie:</strong> ${address}</p>
              ${notes && notes !== '-' ? `<p style="margin: 4px 0;"><strong>Uw opmerkingen:</strong> ${notes}</p>` : ''}
            </div>

            <h3 style="color: #2e382b; margin-top: 24px; margin-bottom: 8px; font-size: 17px;">Hoe nu verder?</h3>
            <p style="margin-top: 0;">
              Ik zal telefonisch contact met u opnemen om de afspraak te bevestigen en eventuele details door te nemen.
            </p>

            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; line-height: 1.5;">
                Met vriendelijke groet,<br><br>
                <strong>Geertjan Klein Haneveld</strong><br>
                <span style="color: #666; font-size: 14px;">Bewegingstechnoloog &amp; Erkend Fitform Dealer</span><br>
                <span style="color: #4b8f24; font-weight: 600;">Staopstoelen.nl</span> &bull; Schipper Compact Wonen<br>
                Merwedestraat 239, 3313 GT Dordrecht<br>
                Telefoon: <a href="tel:0786314858" style="color: #4b8f24; text-decoration: none; font-weight: 600;">078 - 631 4858</a>
              </p>
            </div>
          </div>
        </div>
      `;

      GmailApp.sendEmail(email, emailSubject, "", {
        htmlBody: emailHtml,
        name: "Geertjan Klein Haneveld - Staopstoelen.nl"
      });
    }

    // 3. Notificatiemail naar het bedrijf / team
    if (NOTIFICATION_EMAIL) {
      const internalSubject = `Nieuwe afspraak: ${name} (${typeTitle}) - ${date} ${timeSlot}`;
      const internalBody = 
        `Er is een nieuwe afspraak ingepland via de website:\n\n` +
        `Klant: ${name}\n` +
        `Telefoon: ${phone}\n` +
        `E-mail: ${email}\n` +
        `Datum: ${date}\n` +
        `Tijdvak: ${timeSlot}\n` +
        `Type: ${typeTitle}\n` +
        `Locatie: ${address}\n` +
        `Opmerkingen: ${notes}\n\n` +
        `Deze afspraak is automatisch aan de Google Agenda toegevoegd.`;

      MailApp.sendEmail(NOTIFICATION_EMAIL, internalSubject, internalBody);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handmatige Testfunctie:
 * Selecteer deze functie bovenin de knoppenbalk van Google Apps Script
 * en klik op "Uitvoeren" om direct een testmail naar matthias.radder@gmail.com te sturen.
 */
function testBooking() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        name: "Matthias Radder (Test)",
        phone: "078 - 631 4858",
        email: "matthias.radder@gmail.com",
        date: "2026-10-20",
        timeSlot: "10:00 - 12:00",
        startTime: "10:00",
        endTime: "12:00",
        appointmentType: "showroom",
        address: "Merwedestraat 239, 3313 GT Dordrecht",
        notes: "Testboeking vanuit Google Apps Script editor om de nieuwe tekst te controleren."
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log("Resultaat van test: " + result.getContent());
}
