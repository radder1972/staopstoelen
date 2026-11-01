const fs = require('fs');
const path = require('path');

const stoelenDir = path.join(__dirname, '..', 'stoelen');
const files = fs.readdirSync(stoelenDir).filter(f => f.endsWith('.html'));

console.log(`Processing ${files.length} static chair pages...`);

let count = 0;

for (const file of files) {
  const filePath = path.join(stoelenDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Navbar Logo: ensure full markup so it doesn't wrap or break
  html = html.replace(
    /<a href="\.\.\/index\.html" class="nav-text-logo" id="navTextLogo">staopstoelen<span>\.nl<\/span><\/a>/g,
    `<a href="../index.html" class="nav-text-logo" id="navTextLogo">
        <div class="nav-logo-main">staopstoelen<span>.nl</span></div>
        <div class="nav-logo-strapline">Specialist in ergonomisch zitcomfort</div>
      </a>`
  );

  // 2. Navbar contact links: wrap icons in .nav-top-contact-badge
  html = html.replace(
    /<a href="tel:\+31786314858" class="nav-top-contact-link">\s*<svg[^>]*>.*?<\/svg>\s*078 - 631 4858\s*<\/a>/s,
    `<a href="tel:+31786314858" class="nav-top-contact-link">
          <span class="nav-top-contact-badge">
            <svg style="width: 14px; height: 14px; stroke: currentColor; fill: none;" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </span>
          078 - 631 4858
        </a>`
  );

  html = html.replace(
    /<a href="mailto:info@staopstoelen\.nl" class="nav-top-contact-link">\s*<svg[^>]*>.*?<\/svg>\s*info@staopstoelen\.nl\s*<\/a>/s,
    `<a href="mailto:info@staopstoelen.nl" class="nav-top-contact-link">
          <span class="nav-top-contact-badge">
            <svg style="width: 14px; height: 14px; stroke: currentColor; fill: none;" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
          info@staopstoelen.nl
        </a>`
  );

  // 3. Trust bullets in <style>
  const oldStyleRegex = /\.trust-bullets-box\s*\{[^}]*\}\s*\.trust-bullet\s*\{[^}]*\}\s*\.trust-bullet:last-child\s*\{[^}]*\}/;
  const newStyle = `.trust-bullets-box {
      background: #fbfdf9;
      border: 1.5px solid #dbe8d4;
      border-radius: 14px;
      padding: 20px 22px;
      margin-top: 24px;
      box-shadow: 0 2px 10px rgba(46, 104, 25, 0.04);
    }
    .trust-bullet {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.9rem;
      color: #2c3e2d;
      margin-bottom: 10px;
      line-height: 1.45;
    }
    .trust-bullet:last-child {
      margin-bottom: 0;
    }
    .trust-bullet-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #eaf4e5;
      border: 1.5px solid #b8dcab;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #2e6819;
      box-shadow: 0 1px 3px rgba(46, 104, 25, 0.08);
    }
    .trust-bullet-icon svg {
      width: 13px;
      height: 13px;
      stroke: #2e6819;
      stroke-width: 3;
    }
    .showroom-phone-cta-btn:hover {
      background: #e07f12 !important;
      border-color: #e07f12 !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(243, 146, 35, 0.45) !important;
    }`;

  if (oldStyleRegex.test(html)) {
    html = html.replace(oldStyleRegex, newStyle);
  }

  // 4. Trust bullets content: wrap checkmark SVGs in .trust-bullet-icon
  html = html.replace(
    /<div class="trust-bullet">\s*<svg width="18" height="18"[^>]*>.*?<\/svg>\s*<span>(.*?)<\/span>\s*<\/div>/g,
    `<div class="trust-bullet">
            <span class="trust-bullet-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span>$1</span>
          </div>`
  );

  // 5. Geertjan bubble: add phone badge
  html = html.replace(
    /<div>Heeft u vragen over dit model\? Bel mij gerust op <span[^>]*>078 - 631 4858<\/span>\.<\/div>/g,
    `<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                  <span>Vragen over dit model? Bel mij gerust:</span>
                  <span style="display: inline-flex; align-items: center; gap: 5px; background: #eaf4e5; border: 1.5px solid #4b8f24; color: #256616; font-weight: 800; padding: 3px 9px; border-radius: 999px; font-size: 0.84rem; white-space: nowrap;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    078 - 631 4858
                  </span>
                </div>`
  );

  // 6. Showroom bottom CTA: replace emoji telephone with styled SVG button
  html = html.replace(
    /<a href="tel:\+31786314858" class="btn btn-secondary"[^>]*>\s*📞\s*078 - 631 4858\s*<\/a>/g,
    `<a href="tel:+31786314858" class="showroom-phone-cta-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 13px 22px; font-weight: 700; text-decoration: none; border: 2px solid #f39223; background: #f39223; color: #ffffff; border-radius: var(--radius-sm); font-size: 1rem; box-shadow: 0 4px 14px rgba(243, 146, 35, 0.35); transition: all 0.2s ease;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>078 - 631 4858</span>
        </a>`
  );

  // 7. Footer: ensure .nl span is styled correctly
  html = html.replace(
    /<h3 style="color: var\(--color-light\);">staopstoelen\.nl<\/h3>/g,
    '<h3 style="color: var(--color-light);">staopstoelen<span>.nl</span></h3>'
  );

  fs.writeFileSync(filePath, html, 'utf8');
  count++;
}

console.log(`Successfully updated ${count} static chair pages with brand styling!`);
