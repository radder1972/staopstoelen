const https = require('https');
const fs = require('fs');
const path = require('path');

const SITEMAP_URL = 'https://www.staopstoelen.nl/product-sitemap.xml';

// Helper to make HTTP GET request
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Request failed with status code ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Helper to delay execution
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanHtmlDescription(rawHtml) {
    if (!rawHtml) return "";
    
    // Remove description heading
    let clean = rawHtml.replace(/<h2>Beschrijving<\/h2>/i, '');
    
    // Remove unwanted attributes/classes from tags
    clean = clean.replace(/<([a-z1-6]+)\s+[^>]*>/gi, '<$1>');
    
    // Remove script and style blocks
    clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
    
    // Remove tags that are not in whitelist
    clean = clean.replace(/<\/?(?!p|br|ul|li|strong|b|em|i|u|h3|h4|h5)[a-z1-6]+[^>]*>/gi, '');
    
    // Normalize spaces and newlines
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
}

async function run() {
    console.log("=== STAOPSTOELEN.NL CATALOG SCRAPER ===");
    console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
    
    let sitemapXml;
    try {
        sitemapXml = await fetchUrl(SITEMAP_URL);
    } catch (e) {
        console.error("Failed to fetch sitemap:", e.message);
        process.exit(1);
    }

    // Extract all product URLs
    const urlMatches = sitemapXml.match(/<loc>(https:\/\/www\.staopstoelen\.nl\/product\/[^<]+)<\/loc>/gi) || [];
    const productUrls = urlMatches.map(m => m.replace(/<\/?loc>/g, '').trim());
    
    console.log(`Found ${productUrls.length} products in the sitemap.`);

    const chairs = [];

    for (let i = 0; i < productUrls.length; i++) {
        const url = productUrls[i];
        console.log(`[${i + 1}/${productUrls.length}] Scraping: ${url}`);
        
        try {
            const html = await fetchUrl(url);
            
            // Extract slug / id
            const slugMatch = url.match(/\/product\/([^/]+)/);
            const id = slugMatch ? slugMatch[1] : `product-${i}`;

            // Extract title / name
            let name = "";
            const titleHtmlMatch = html.match(/<(?:h1|h2)[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/(?:h1|h2)>/i);
            if (titleHtmlMatch) {
                name = titleHtmlMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            } else {
                const headTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
                if (headTitleMatch) {
                    name = headTitleMatch[1].replace(/\s*-.*$/, '').replace(/\s*\|.*$/, '').trim();
                } else {
                    name = id.replace(/-/g, ' ');
                }
            }

            // Extract main image
            const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            const image = imgMatch ? imgMatch[1] : "assets/chair_downstand.png";

            // Extract description
            let description = "";
            const descTabMatch = html.match(/<div[^>]*id="tab-description"[^>]*>([\s\S]*?)<\/div>/i);
            const descMatch = html.match(/<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            
            if (descTabMatch) {
                description = cleanHtmlDescription(descTabMatch[1]);
            } else if (descMatch) {
                description = cleanHtmlDescription(descMatch[1]);
            }

            // Extract specifications table
            const specifications = {};
            const tableMatch = html.match(/<table[^>]*class="[^"]*shop_attributes[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
            if (tableMatch) {
                const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
                rows.forEach(row => {
                    const labelMatch = row.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
                    const valMatch = row.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
                    if (labelMatch && valMatch) {
                        const label = labelMatch[1].replace(/<[^>]+>/g, '').trim();
                        const val = valMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                        specifications[label] = val;
                    }
                });
            }

            // Extract key features/highlights from list items in the main description/description tab
            const features = [];
            const searchHtmlForFeatures = (descMatch ? descMatch[1] : "") + " " + (descTabMatch ? descTabMatch[1] : "");
            
            const listItemsMatch = searchHtmlForFeatures.match(/<li>([\s\S]*?)<\/li>/gi) || [];
            listItemsMatch.forEach(li => {
                const cleanText = li.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                const forbidden = ["english", "french", "russian", "deutsch", "nederlands", "winkelwagen", "inloggen", "afrekenen"];
                const isForbidden = forbidden.some(word => cleanText.toLowerCase().includes(word));
                if (cleanText.length > 5 && cleanText.length < 100 && !cleanText.includes('{') && !cleanText.includes('}') && !isForbidden && features.length < 5) {
                    features.push(cleanText);
                }
            });

            // If no features found, provide some defaults based on product types
            if (features.length === 0) {
                features.push("100% Ergonomisch zitcomfort");
                features.push("Geleverd met kwaliteitsgarantie");
                features.push("Volledig op uw lichaamsmaat afgesteld");
            }

            // Extract price
            let price = 0;
            const priceHtmlMatch = html.match(/<p\s+class="price">([\s\S]*?)<\/p>/i);
            if (priceHtmlMatch) {
                const rawPriceHtml = priceHtmlMatch[1];
                let priceText = rawPriceHtml.replace(/<del[\s\S]*?<\/del>/gi, ''); 
                priceText = priceText.replace(/<span[^>]*class="[^"]*screen-reader-text[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '');
                priceText = priceText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                priceText = priceText.replace(/[^0-9.,]/g, '').trim();
                
                if (priceText.endsWith(',00') || priceText.endsWith(',-')) {
                    priceText = priceText.slice(0, -3);
                } else if (priceText.endsWith('.00')) {
                    priceText = priceText.slice(0, -3);
                }
                
                const cleanPrice = priceText.replace(/[.,]/g, '');
                price = parseInt(cleanPrice, 10);
            }
            if (!price || price < 100) {
                price = 1450; // reasonable fallback
            }

            // Extract brand
            let brand = specifications["Merk"] || specifications["merk"] || "";
            if (!brand) {
                const nameLower = name.toLowerCase();
                if (nameLower.includes("fitform")) brand = "Fitform";
                else if (nameLower.includes("mecam")) brand = "Mecam";
                else if (nameLower.includes("doge")) brand = "Doge";
                else if (nameLower.includes("de toekomst")) brand = "De Toekomst";
                else if (nameLower.includes("farstrup")) brand = "Farstrup";
                else if (nameLower.includes("hjort")) brand = "Hjort Knudsen";
                else if (nameLower.includes("dfm")) brand = "DFM";
                else brand = "Overig";
            }

            // Extract type (staop or relax) based on page metadata category if available, otherwise name matching
            let type = "staop";
            const nameSlugLower = (name + " " + id).toLowerCase();
            const postedInMatch = html.match(/<span\s+class="posted_in">([\s\S]*?)<\/span>/i);
            if (postedInMatch) {
                const postedInHtml = postedInMatch[1].toLowerCase();
                if (postedInHtml.includes('senioren-stoelen') || postedInHtml.includes('relax')) {
                    type = "relax";
                } else if (postedInHtml.includes('sta-op') || postedInHtml.includes('staop')) {
                    type = "staop";
                }
            } else {
                if (nameSlugLower.includes("seniorenstoel") || nameSlugLower.includes("senioren-") || nameSlugLower.includes("relax")) {
                    type = "relax";
                }
            }

            // Extract material
            let material = "stof";
            const bodyLower = html.toLowerCase();
            if (bodyLower.includes("leder") || bodyLower.includes("leer") || nameSlugLower.includes("leder") || nameSlugLower.includes("leer")) {
                material = "leer";
            }

            // Extract condition
            let condition = "nieuw";
            if (nameSlugLower.includes("occasion") || nameSlugLower.includes("gebruikt") || nameSlugLower.includes("reco") || nameSlugLower.includes("gereconditioneerd")) {
                condition = "occasion";
            }

            // Extract model
            let model = specifications["Model"] || specifications["model"] || "";
            if (!model) {
                model = name.replace(/^(Sta-op stoel|Senioren sta-op stoel|Senioren stoel|Seniorenstoel)\s+/i, '').trim();
            }

            // Add badge
            let badge = "";
            let badgeType = "new";
            if (condition === "occasion") {
                badge = "Gereviseerd";
                badgeType = "reco";
            } else {
                badge = "Nieuw Model";
                badgeType = "new";
            }

            chairs.push({
                id,
                name,
                brand,
                model,
                price,
                image,
                condition,
                status: "beschikbaar",
                type,
                material,
                description,
                badge,
                badgeType,
                features,
                specifications
            });

        } catch (err) {
            console.error(`Error scraping ${url}:`, err.message);
        }

        // Sleep to avoid overloading the website
        await sleep(600);
    }

    // Save to database.json
    const output = {
        staopstoelen: chairs
    };

    const destPath = path.join(__dirname, '..', 'database.json');
    fs.writeFileSync(destPath, JSON.stringify(output, null, 2), 'utf8');
    console.log(`\nSUCCESS: Scraped ${chairs.length} chairs and saved to ${destPath}`);
}

run();
