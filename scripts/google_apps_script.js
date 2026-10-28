/**
 * Google Apps Script Web App voor Schipper Compact Wonen & Staopstoelen.nl
 * 
 * Beheert:
 * 1. Ophalen van bezette tijdsloten uit Google Agenda (doGet)
 * 2. Aanmaken van de afspraak in Google Agenda (doPost)
 * 3. Dynamisch verzenden van de bevestigingsmail naar de klant op basis van het merk (Schipper vs Staopstoelen)
 * 4. Verzenden van de interne notificatiemail naar het team
 * 5. autoriseerEmail(): eenmalig uitvoeren om e-mailrechten te activeren
 * 6. testBookingSchipper() & testBookingStaopstoelen(): handmatige testfuncties in de Apps Script editor
 */

// Configuratie
const DEFAULT_NOTIFICATION_EMAIL = "schipperwonen@gmail.com, info@staopstoelen.nl";
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

    // Tijdsloten definiëren (sluit aan op zowel Staopstoelen als Schipper)
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
 * POST Handler: Maakt agenda-afspraak en verstuurt merk-specifieke e-mails
 */
function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter || {};
    }

    // Merk-detectie: Schipper Compact Wonen vs Staopstoelen.nl
    // LET OP: Nooit notificationEmail gebruiken voor merk-detectie, omdat
    // schipperwonen@gmail.com de centrale Google-inbox is voor BEIDE websites!
    const explicitBrand = String(payload.brand || "").toLowerCase();
    const explicitSite = String(payload.site || "").toLowerCase();
    const explicitSender = String(payload.senderName || "").toLowerCase();
    const explicitSubject = String(payload.emailSubject || "").toLowerCase();

    let isSchipper = false;
    if (explicitBrand === "schipper" || explicitSite.includes("schipper")) {
      isSchipper = true;
    } else if (explicitBrand === "staopstoelen" || explicitSite.includes("staopstoelen")) {
      isSchipper = false;
    } else if (explicitSender.includes("staopstoelen") || explicitSubject.includes("staopstoelen")) {
      isSchipper = false;
    } else if (explicitSender.includes("schipper") || explicitSubject.includes("schipper")) {
      isSchipper = true;
    } else {
      // Standaard fallback: Staopstoelen.nl
      isSchipper = false;
    }

    const brandConfig = isSchipper ? {
      brandName: "Schipper Compact Wonen",
      brandSubtitle: "Specialist in Ergonomisch Zitcomfort & Fitform",
      senderName: "Geertjan Klein Haneveld - Schipper Compact Wonen",
      replyTo: "info@schippercompactwonen.nl",
      websiteUrl: "https://schippercompactwonen.nl",
      websiteDomain: "www.schippercompactwonen.nl",
      defaultSubject: "Bevestiging van uw aanvraag voor een adviesgesprek - Schipper Compact Wonen",
      internalTag: "[Schipper Compact Wonen]",
      primaryColor: "#344E41",
      accentColor: "#588157",
      bgColor: "#FAF7F1",
      borderColor: "#DDD3C2",
      notificationEmail: "schipperwonen@gmail.com, info@schippercompactwonen.nl"
    } : {
      brandName: "Staopstoelen.nl",
      brandSubtitle: "Specialist in Zitcomfort & Ergonomie",
      senderName: "Geertjan Klein Haneveld - Staopstoelen.nl",
      replyTo: "info@staopstoelen.nl",
      websiteUrl: "https://staopstoelen.nl",
      websiteDomain: "www.staopstoelen.nl",
      defaultSubject: "Bevestiging van uw aanvraag voor een adviesgesprek - Staopstoelen.nl",
      internalTag: "[Staopstoelen.nl]",
      primaryColor: "#2e382b",
      accentColor: "#4b8f24",
      bgColor: "#f7f5f0",
      borderColor: "#e2ddd3",
      notificationEmail: "schipperwonen@gmail.com, info@staopstoelen.nl"
    };

    const name = payload.name || "Klant";
    const phone = payload.phone || "Onbekend";
    const email = payload.email || "";
    const date = payload.date || "";
    const timeSlot = payload.timeSlot || payload.time || "";
    
    // Tijdslot start & end time
    let startTime = payload.startTime;
    let endTime = payload.endTime;
    if ((!startTime || !endTime) && timeSlot && timeSlot.includes(" - ")) {
      const parts = timeSlot.split(" - ");
      if (!startTime) startTime = parts[0].trim();
      if (!endTime) endTime = parts[1].trim();
    }
    if (!startTime) startTime = "10:00";
    if (!endTime) endTime = "12:00";

    const appointmentType = payload.appointmentType || "showroom";
    const address = payload.address || (isSchipper ? "Merwedestraat 239, 3313 GT Dordrecht (Showroom)" : "Merwedestraat 239, 3313 GT Dordrecht");
    const notes = payload.notes || "-";

    const senderName = payload.senderName || brandConfig.senderName;
    const replyToEmail = payload.replyTo || brandConfig.replyTo;
    const notificationEmail = payload.notificationEmail || brandConfig.notificationEmail || DEFAULT_NOTIFICATION_EMAIL;

    // A. Specifieke afhandeling voor Lead Magnet: Zithouding Checklist Download
    if (appointmentType === "checklist_download" || payload.action === "checklist_download") {
      if (email && payload.emailHtml) {
        const customerSubject = payload.emailSubject || `Uw Zithouding Checklist (PDF) - ${brandConfig.brandName}`;
        const plainDownloadBody = `Beste ${name},\n\nHartelijk dank voor uw download van de Zithouding Checklist (PDF).\nBekijk de checklist via: ${brandConfig.websiteUrl}\n\nMet vriendelijke groet,\n${senderName}\n${brandConfig.websiteDomain}`;
        try {
          MailApp.sendEmail({
            to: email,
            subject: customerSubject,
            body: plainDownloadBody,
            htmlBody: payload.emailHtml,
            name: senderName,
            replyTo: replyToEmail
          });
        } catch (e1) {
          try {
            GmailApp.sendEmail(email, customerSubject, plainDownloadBody, {
              htmlBody: payload.emailHtml,
              name: senderName,
              replyTo: replyToEmail
            });
          } catch (e2) {
            Logger.log("Fout bij verzenden checklist downloadmail: " + e2.toString());
          }
        }
      }

      if (notificationEmail) {
        const downloadSubject = `${brandConfig.internalTag} Nieuwe download: Zithouding Checklist (${name})`;
        const downloadBody = 
          `Er is zojuist een gratis Zithouding Checklist (PDF) gedownload via ${brandConfig.brandName} (${brandConfig.websiteDomain}):\n\n` +
          `Naam: ${name}\n` +
          `E-mail: ${email}\n` +
          `Datum & tijd: ${new Date().toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}\n\n` +
          `De bezoeker heeft direct de e-mailbevestiging met de downloadlink ontvangen.\n` +
          `Er is géén agenda-afspraak aangemaakt (dit betreft een lead download).`;

        try {
          MailApp.sendEmail({
            to: notificationEmail,
            subject: downloadSubject,
            body: downloadBody,
            name: `${brandConfig.brandName} | Downloads`,
            replyTo: email || replyToEmail
          });
        } catch (e2) {}
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "checklist_download" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // B. Agenda afspraak & bevestiging voor Adviesgesprek / Passing
    const isHome = appointmentType === "home" || appointmentType === "thuis";
    const typeTitle = isHome ? "Passing aan Huis" : "Showroombezoek Dordrecht";
    const isScheduled = Boolean(date && date.includes("-"));
    const eventTitle = isScheduled 
      ? `${brandConfig.internalTag} Afspraak: ${name} (${typeTitle})`
      : `${brandConfig.internalTag} Aanvraag / Terugbellen: ${name} (${typeTitle})`;

    // 1. Maak agenda afspraak
    let startDateObj, endDateObj;
    if (isScheduled && startTime && endTime) {
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
      `Website: ${brandConfig.brandName} (${brandConfig.websiteDomain})\n` +
      `Klant: ${name}\n` +
      `Telefoon: ${phone}\n` +
      `E-mail: ${email}\n` +
      `Type: ${typeTitle}\n` +
      (timeSlot ? `Tijdvak: ${timeSlot}\n` : '') +
      `Locatie: ${address}\n` +
      `Opmerkingen / Wensen: ${notes}\n`;

    const calendar = CalendarApp.getCalendarById(CALENDAR_ID) || CalendarApp.getDefaultCalendar();
    calendar.createEvent(eventTitle, startDateObj, endDateObj, {
      description: description,
      location: address
    });

    // 2. Bevestigingsmail naar de klant
    if (email) {
      const emailSubject = payload.emailSubject || brandConfig.defaultSubject;
      const plainTextBody = `Beste ${name},\n\nHartelijk dank voor uw aanvraag voor een ${typeTitle}.\n` +
        (date ? `Datum: ${date}\n` : '') +
        (timeSlot ? `Tijdvak: ${timeSlot}\n` : '') +
        `Locatie: ${address}\n\n` +
        `Geertjan Klein Haneveld zal contact met u opnemen om de afspraak te bevestigen.\n\n` +
        `Met vriendelijke groet,\n${senderName}\n${brandConfig.websiteDomain}`;
      
      const emailHtml = payload.emailHtml || `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #2e382b; max-width: 620px; margin: 0 auto; border: 1px solid ${brandConfig.borderColor}; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: ${brandConfig.primaryColor}; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">Hartelijk dank voor uw aanvraag!</h2>
            <p style="margin: 6px 0 0 0; color: #e5ede3; font-size: 14px;">${brandConfig.brandName} &bull; ${brandConfig.brandSubtitle}</p>
          </div>
          
          <div style="padding: 28px 24px;">
            <p>Beste <strong>${name}</strong>,</p>
            <p>Fijn dat u contact met ons heeft opgenomen voor een adviesgesprek. Uw aanvraag is in goede orde ontvangen met onderstaande gegevens:</p>
            
            <div style="background-color: ${brandConfig.bgColor}; border-left: 4px solid ${brandConfig.accentColor}; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
              <p style="margin: 4px 0;"><strong>Type afspraak:</strong> ${typeTitle}</p>
              ${date ? `<p style="margin: 4px 0;"><strong>Datum:</strong> ${date}</p>` : ''}
              ${timeSlot ? `<p style="margin: 4px 0;"><strong>Tijdvak:</strong> ${timeSlot}</p>` : ''}
              <p style="margin: 4px 0;"><strong>Locatie:</strong> ${address}</p>
              ${notes && notes !== '-' ? `<p style="margin: 4px 0;"><strong>Uw opmerkingen:</strong> ${notes}</p>` : ''}
            </div>

            <h3 style="color: ${brandConfig.primaryColor}; margin-top: 24px; margin-bottom: 8px; font-size: 17px;">Hoe nu verder?</h3>
            <p style="margin-top: 0;">
              Ik zal telefonisch contact met u opnemen om de afspraak te bevestigen en eventuele details door te nemen.
            </p>

            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0 0 16px 0; line-height: 1.5;">Met vriendelijke groet,</p>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0; padding: 0;">
                <tr>
                  <td style="vertical-align: top; padding-right: 20px; width: 92px;">
                    <img src="https://staopstoelen.nl/assets/geert_avatar.png" alt="Geertjan Klein Haneveld" width="92" height="92" style="display: block; width: 92px; height: 92px; border-radius: 50%; border: 1px solid ${brandConfig.borderColor}; object-fit: cover;">
                  </td>
                  <td style="vertical-align: top; font-size: 14px; line-height: 1.5; color: #111111;">
                    <div style="font-size: 16px; font-weight: bold; color: #111111; margin-bottom: 2px;">Geertjan Klein Haneveld</div>
                    <div style="font-size: 13px; color: #555555; font-weight: 600; margin-bottom: 8px;">Gediplomeerd bewegingstechnoloog &amp; Erkend Fitform Dealer</div>
                    <div style="font-size: 13px; line-height: 1.6; color: #333333;">
                      06 - 22 23 29 64 &nbsp;&bull;&nbsp; 078 - 631 4858<br>
                      <a href="mailto:${replyToEmail}" style="color: ${brandConfig.primaryColor}; font-weight: 600; text-decoration: none;">${replyToEmail}</a> &nbsp;&bull;&nbsp; <a href="${brandConfig.websiteUrl}" target="_blank" style="color: ${brandConfig.primaryColor}; text-decoration: none;">${brandConfig.websiteDomain}</a><br>
                      Showroom: Merwedestraat 239, 3313 GT Dordrecht
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;

      try {
        MailApp.sendEmail({
          to: email,
          subject: emailSubject,
          body: plainTextBody,
          htmlBody: emailHtml,
          name: senderName,
          replyTo: replyToEmail
        });
      } catch (e1) {
        try {
          GmailApp.sendEmail(email, emailSubject, plainTextBody, {
            htmlBody: emailHtml,
            name: senderName,
            replyTo: replyToEmail
          });
        } catch (e2) {
          Logger.log("Fout bij verzenden klantbevestiging: " + e2.toString());
        }
      }
    }

    // 3. Notificatiemail naar het bedrijf / team
    if (notificationEmail) {
      const internalSubject = `${brandConfig.internalTag} Nieuwe afspraak: ${name} (${typeTitle})${date ? ` - ${date} ${timeSlot}` : ''}`;
      const internalBody = 
        `Er is een nieuwe afspraak ingepland via ${brandConfig.brandName} (${brandConfig.websiteDomain}):\n\n` +
        `Klant: ${name}\n` +
        `Telefoon: ${phone}\n` +
        `E-mail: ${email}\n` +
        (date ? `Datum: ${date}\n` : '') +
        (timeSlot ? `Tijdvak: ${timeSlot}\n` : '') +
        `Type: ${typeTitle}\n` +
        `Locatie: ${address}\n` +
        `Opmerkingen: ${notes}\n\n` +
        `Deze afspraak is automatisch aan de Google Agenda toegevoegd.`;

      try {
        MailApp.sendEmail({
          to: notificationEmail,
          subject: internalSubject,
          body: internalBody,
          name: `${brandConfig.brandName} | Afspraken`,
          replyTo: email || replyToEmail
        });
      } catch (e2) {}
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * STAP A: Voer deze functie EENMALIG uit om Google toestemming voor e-mail te geven
 */
function autoriseerEmail() {
  GmailApp.sendEmail("schipperwonen@gmail.com", "Test Autorisatie Staopstoelen & Schipper", "Toestemming voor het verzenden van e-mails is succesvol geactiveerd!");
  Logger.log("Toestemming geactiveerd en testmail verzonden!");
}

/**
 * Handmatige Testfunctie voor Schipper Compact Wonen
 */
function testBookingSchipper() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        brand: "Schipper Compact Wonen",
        site: "schippercompactwonen.nl",
        name: "Test Klant Schipper",
        phone: "078 - 631 4858",
        email: "schipperwonen@gmail.com",
        date: "2026-10-25",
        timeSlot: "14:00 - 16:00",
        startTime: "14:00",
        endTime: "16:00",
        appointmentType: "showroom",
        address: "Merwedestraat 239, 3313 GT Dordrecht",
        notes: "Testboeking voor Schipper Compact Wonen afzender en opmaak.",
        senderName: "Geertjan Klein Haneveld - Schipper Compact Wonen",
        replyTo: "info@schippercompactwonen.nl"
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log("Schipper Resultaat: " + result.getContent());
}

/**
 * Handmatige Testfunctie voor Staopstoelen.nl
 */
function testBookingStaopstoelen() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        brand: "Staopstoelen.nl",
        site: "staopstoelen.nl",
        name: "Test Klant Staopstoelen",
        phone: "078 - 631 4858",
        email: "schipperwonen@gmail.com",
        date: "2026-10-25",
        timeSlot: "10:00 - 12:00",
        startTime: "10:00",
        endTime: "12:00",
        appointmentType: "home",
        address: "Teststraat 1, Dordrecht",
        notes: "Testboeking voor Staopstoelen.nl afzender en opmaak.",
        senderName: "Geertjan Klein Haneveld - Staopstoelen.nl",
        replyTo: "info@staopstoelen.nl"
      })
    }
  };
  const result = doPost(fakeEvent);
  Logger.log("Staopstoelen Resultaat: " + result.getContent());
}
