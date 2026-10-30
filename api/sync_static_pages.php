<?php
/**
 * Synchronize static chair SEO pages and sitemap.xml automatically
 * Whenever database.json / chairs table is updated.
 */

// Allow CORS if accessed via AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function get_fitform_actie_info($chair) {
    // Najaarsactie verlopen / gedeactiveerd
    return null;
    $condition = strtolower($chair['condition'] ?? '');
    $badge_type = strtolower($chair['badgeType'] ?? '');
    $badge = strtolower($chair['badge'] ?? '');
    $name = strtolower($chair['name'] ?? '');
    $brand = strtolower($chair['brand'] ?? '');
    $model = strtolower($chair['model'] ?? '');
    $is_offer = !empty($chair['is_offer']);

    $is_occasion = (
        $condition === 'occasion' ||
        $badge_type === 'reco' ||
        strpos($badge, 'gereviseerd') !== false ||
        strpos($badge, 'gereconditioneerd') !== false ||
        strpos($badge, 'verkocht') !== false ||
        strpos($name, 'reco') !== false ||
        strpos($name, 'occasion') !== false ||
        strpos($name, 'demo') !== false
    );
    if ($is_occasion) {
        return null;
    }

    $full_text = "$brand $name $model";
    if (strpos($full_text, 'fitform') === false && !$is_offer) {
        return null;
    }

    // 1. 600-serie: €600 korting
    foreach (['633', '600', '612', '614', '610'] as $code) {
        if (strpos($full_text, $code) !== false) {
            return [
                'korting' => 600,
                'label' => '€600,- Korting',
                'title' => 'Fitform Najaarsactie: €600,- Fabriekskorting'
            ];
        }
    }

    // 2. 200-serie & 574 Vario: €500 korting
    foreach (['247', '200', '239', '574'] as $code) {
        if (strpos($full_text, $code) !== false) {
            return [
                'korting' => 500,
                'label' => '€500,- Korting',
                'title' => 'Fitform Najaarsactie: €500,- Fabriekskorting'
            ];
        }
    }

    // 3. Overige: €300 korting
    return [
        'korting' => 300,
        'label' => '€300,- Korting',
        'title' => 'Fitform Najaarsactie: €300,- Fabriekskorting'
    ];
}

function get_leaf_svg($theme, $width, $rotate, $style_pos) {
    $gid = 'slf_' . mt_rand(100000, 999999);
    if ($theme === 'gold') {
        $stops = '<stop offset="0%" stop-color="#fed857"/><stop offset="50%" stop-color="#f39223"/><stop offset="100%" stop-color="#d35400"/>';
    } elseif ($theme === 'red') {
        $stops = '<stop offset="0%" stop-color="#f39223"/><stop offset="65%" stop-color="#c0392b"/><stop offset="100%" stop-color="#78281f"/>';
    } elseif ($theme === 'wine') {
        $stops = '<stop offset="0%" stop-color="#f39223"/><stop offset="60%" stop-color="#b71c1c"/><stop offset="100%" stop-color="#560027"/>';
    } elseif ($theme === 'amber') {
        $stops = '<stop offset="0%" stop-color="#f1c40f"/><stop offset="50%" stop-color="#e67e22"/><stop offset="100%" stop-color="#a04000"/>';
    } else {
        $stops = '<stop offset="0%" stop-color="#7cb342"/><stop offset="50%" stop-color="#e67e22"/><stop offset="100%" stop-color="#c0392b"/>';
    }

    return '
        <div style="position: absolute; ' . $style_pos . ' pointer-events: none; z-index: 4; line-height: 0;">
          <svg width="' . $width . '" height="' . $width . '" viewBox="0 0 32 32" style="display: block; transform: rotate(' . $rotate . 'deg); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.28)); overflow: visible;">
            <defs>
              <linearGradient id="' . $gid . '" x1="0%" y1="0%" x2="100%" y2="100%">
                ' . $stops . '
              </linearGradient>
            </defs>
            <path d="M16 2 C23 6 28 13 26 21 C24 26 18 29 15 29 C14.5 29 14 31 13 32 L12 31.5 C12.8 30 13 28.5 13.5 27.5 C8 26 4 20 4 14 C4 8 10 3 16 2 Z" fill="url(#' . $gid . ')" />
            <path d="M16 3 C15.5 10 14.5 18 13.2 27" stroke="#4a1f03" stroke-width="0.9" fill="none" opacity="0.65" />
            <path d="M15.5 8 Q19 10 22 11 M15 12 Q19 14 23 16 M14.5 16 Q18 18 21 21 M15 10 Q11 12 7 13 M14.5 14 Q10 16 7 18 M14 18 Q10 20 8 23" stroke="#4a1f03" stroke-width="0.6" fill="none" opacity="0.45" />
          </svg>
        </div>';
}

function sync_static_chair_pages($chairs = null) {
    $base_dir = dirname(__DIR__);
    $stoelen_dir = $base_dir . '/stoelen';
    $json_file = $base_dir . '/database.json';
    $sitemap_file = $base_dir . '/sitemap.xml';

    if (!is_dir($stoelen_dir)) {
        @mkdir($stoelen_dir, 0755, true);
    }

    if ($chairs === null) {
        if (file_exists($json_file)) {
            $json_raw = file_get_contents($json_file);
            $db_data = json_decode($json_raw, true);
            $chairs = $db_data['staopstoelen'] ?? [];
        } else {
            $chairs = [];
        }
    }

    if (!is_array($chairs)) {
        $chairs = [];
    }

    $valid_ids = [];
    $generated_count = 0;

    foreach ($chairs as $chair) {
        $chair_id = trim($chair['id'] ?? '');
        if (!$chair_id) {
            continue;
        }

        $valid_ids[$chair_id] = true;

        $chair_name = htmlspecialchars($chair['name'] ?? 'Sta-op stoel', ENT_QUOTES, 'UTF-8');
        $brand = htmlspecialchars($chair['brand'] ?? 'A-Merk', ENT_QUOTES, 'UTF-8');
        $model = htmlspecialchars($chair['model'] ?? 'Premium Model', ENT_QUOTES, 'UTF-8');
        $condition = strtolower($chair['condition'] ?? 'nieuw');
        $material = htmlspecialchars($chair['material'] ?? 'Stof', ENT_QUOTES, 'UTF-8');
        $price = floatval($chair['price'] ?? 0);
        $old_price = !empty($chair['old_price']) ? floatval($chair['old_price']) : null;
        $desc = $chair['description'] ?? 'Comfortabele ergonomische sta-op stoel op maat.';
        $chair_type = $chair['type'] ?? 'staop';

        $is_occasion = ($condition === 'occasion');
        $catalog_page = ($chair_type === 'relax') ? 'seniorenstoelen.html' : 'staopstoelen.html';
        $catalog_name = ($chair_type === 'relax') ? 'Seniorenstoelen' : 'Sta-op stoelen';

        $condition_label = $is_occasion ? 'Occasion' : 'Nieuw';
        $condition_badge_class = $is_occasion ? 'badge-reco' : 'badge-new';

        $actie_info = get_fitform_actie_info($chair);

        // Images gathering
        $main_image = $chair['image'] ?? '';
        $gallery = $chair['gallery'] ?? [];

        $thumbnail_images = [];
        if ($main_image) {
            $thumbnail_images[] = $main_image;
        }

        if (empty($gallery)) {
            foreach (['imageUp', 'imageLie', 'ambientImage'] as $extra_field) {
                $extra_val = $chair[$extra_field] ?? null;
                if ($extra_val && !in_array($extra_val, $thumbnail_images)) {
                    $thumbnail_images[] = $extra_val;
                }
            }
        } else {
            foreach ($gallery as $g_img) {
                if ($g_img && !in_array($g_img, $thumbnail_images)) {
                    $thumbnail_images[] = $g_img;
                }
            }
        }

        $main_image_url = ($main_image && strpos($main_image, 'http') !== 0) ? "../$main_image" : $main_image;
        $seo_image_url = ($main_image && strpos($main_image, 'http') !== 0) ? "https://staopstoelen.nl/$main_image" : $main_image;

        $gallery_html = '';
        if (count($thumbnail_images) > 1) {
            $thumbs_html = '';
            foreach ($thumbnail_images as $idx => $t_img) {
                $t_url = (strpos($t_img, 'http') !== 0) ? "../$t_img" : $t_img;
                $active_class = ($idx === 0) ? ' active' : '';
                $thumbs_html .= '
              <div class="gallery-thumbnail' . $active_class . '" onclick="switchDetailPhoto(\'' . htmlspecialchars($t_url, ENT_QUOTES) . '\', this)" title="Bekijk foto ' . ($idx + 1) . '">
                <img src="' . htmlspecialchars($t_url, ENT_QUOTES) . '" alt="Foto ' . ($idx + 1) . ' ' . $chair_name . '" style="width: 100%; height: 100%; object-fit: contain;">
              </div>';
            }
            $gallery_html = '
          <div class="modal-gallery-thumbnails" style="justify-content: flex-start; margin-top: 14px; padding: 4px 2px;">
            ' . $thumbs_html . '
          </div>';
        }

        // Najaarsactie Alert Box
        $actie_box_html = '';
        if ($actie_info) {
            $old_price_val = $old_price ?: ($price + $actie_info['korting']);
            $leaves_html = get_leaf_svg('gold', 28, -18, 'top: -14px; right: 46px;') .
                           get_leaf_svg('wine', 24, 18, 'top: -16px; right: 26px;') .
                           get_leaf_svg('green', 26, 38, 'top: -12px; right: 8px;');

            $actie_box_html = '
          <div id="productNajaarsactieAlert" style="background: linear-gradient(135deg, #fffbf5 0%, #fff7ed 55%, #f7fee7 100%); border: 1.5px solid rgba(234, 88, 12, 0.28); border-left: 5px solid #ea580c; border-radius: 14px; padding: 18px 22px; margin: 20px 0; position: relative; overflow: visible; box-shadow: 0 6px 20px rgba(234, 88, 12, 0.08), 0 2px 8px rgba(37, 102, 22, 0.05);">
            ' . $leaves_html . '
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
              <span style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(115deg, #ea580c 0%, #e68a00 45%, #256616 100%); color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                Fitform Najaarsactie
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.82rem; font-weight: 700; color: #256616; background: rgba(37, 102, 22, 0.1); padding: 3px 10px; border-radius: 6px;">
                ✓ Direct verrekend
              </span>
            </div>
            
            <div style="font-size: 1.05rem; font-weight: 800; color: #1f2937; margin-bottom: 8px; font-family: var(--font-heading);">
              Profiteer van <span style="color: #ea580c;">€' . number_format($actie_info['korting'], 0, ',', '.') . ',- Fabriekskorting</span> op dit model!
            </div>
            
            <div style="font-size: 0.88rem; color: #4b5563; line-height: 1.5; margin-bottom: 12px;">
              Tijdens de landelijke najaarsactie ontvangt u <strong>€' . number_format($actie_info['korting'], 0, ',', '.') . ',- korting</strong> op de adviesprijs van <span style="text-decoration: line-through; color: #9ca3af; font-weight: 600;">€' . number_format($old_price_val, 0, ',', '.') . ',-</span>. 
              Uw actieprijs is nu <strong style="color: #256616; font-size: 1.02rem;">€' . number_format($price, 0, ',', '.') . ',-</strong> inclusief volledige maatwerkservice en garantie.
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px dashed rgba(234, 88, 12, 0.25); font-size: 0.8rem; color: #374151;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #256616; font-weight: bold;">✓</span> 100% Maatwerk aangemeten
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #256616; font-weight: bold;">✓</span> 10 Jaar Fitform Garantie
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: #ea580c; font-weight: bold;">✓</span> Gratis proefzitten aan huis
              </div>
            </div>
          </div>';
        }

        // Price box
        if ($actie_info && $old_price && $old_price > $price) {
            $price_box_html = '
        <div class="modal-price-box" style="margin-top: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
            <span style="text-decoration: line-through; color: #8a9097; font-size: 1.05rem; font-weight: 600;">Oorspronkelijk: € ' . number_format($old_price, 0, ',', '.') . ',-</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: linear-gradient(115deg, #ea580c 0%, #256616 100%); color: #ffffff; font-size: 0.8rem; font-weight: 800; padding: 3px 9px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Actieprijs</span>
              <span class="price-value" style="color: var(--color-forest); font-weight: 800; font-size: 2rem; line-height: 1.1;">€ ' . number_format($price, 0, ',', '.') . ',-</span>
            </div>
            <span style="font-size: 0.85rem; color: #284e1b; font-weight: 700; background: rgba(75, 143, 36, 0.1); padding: 3px 12px; border-radius: 999px;">Uw Najaarsvoordeel: € ' . number_format($actie_info['korting'], 0, ',', '.') . ',-</span>
          </div>
        </div>';
        } elseif ($actie_info) {
            $calc_old = $price + $actie_info['korting'];
            $price_box_html = '
        <div class="modal-price-box" style="margin-top: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
            <span style="text-decoration: line-through; color: #8a9097; font-size: 1.05rem; font-weight: 600;">Oorspronkelijk: € ' . number_format($calc_old, 0, ',', '.') . ',-</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: linear-gradient(115deg, #ea580c 0%, #256616 100%); color: #ffffff; font-size: 0.8rem; font-weight: 800; padding: 3px 9px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Actieprijs</span>
              <span class="price-value" style="color: var(--color-forest); font-weight: 800; font-size: 2rem; line-height: 1.1;">€ ' . number_format($price, 0, ',', '.') . ',-</span>
            </div>
            <span style="font-size: 0.85rem; color: #284e1b; font-weight: 700; background: rgba(75, 143, 36, 0.1); padding: 3px 12px; border-radius: 999px;">Uw Najaarsvoordeel: € ' . number_format($actie_info['korting'], 0, ',', '.') . ',-</span>
          </div>
        </div>';
        } elseif ($old_price && $old_price > $price) {
            $price_box_html = '
        <div class="modal-price-box" style="margin-top: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;">
            <span style="text-decoration: line-through; color: var(--color-terracotta); font-size: 1.15rem; font-weight: 600;">€ ' . number_format($old_price, 0, ',', '.') . ',-</span>
            <span class="price-value" style="color: var(--color-forest); font-weight: bold; font-size: 1.95rem;">€ ' . number_format($price, 0, ',', '.') . ',-</span>
          </div>
        </div>';
        } else {
            $price_box_html = '
        <div class="modal-price-box" style="margin-top: 20px; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin-bottom: 16px;">
          <span class="price-value" style="font-size: 1.95rem; font-weight: 800; color: var(--color-forest); line-height: 1;">€ ' . number_format($price, 0, ',', '.') . ',-</span>
        </div>';
        }

        // Features
        $features = $chair['features'] ?? [];
        $highlights_html = '';
        if (!empty($features) && is_array($features)) {
            $feats_li = '';
            foreach ($features as $f) {
                $feats_li .= '<li>' . htmlspecialchars($f, ENT_QUOTES, 'UTF-8') . '</li>';
            }
            $highlights_html = '
        <div class="modal-highlights-box" style="margin-top: 24px; width: 100%; box-sizing: border-box;">
          <h4 style="color: var(--color-forest-dark); margin-bottom: 10px; font-family: var(--font-heading); font-size: 1.05rem;">Belangrijkste kenmerken:</h4>
          <ul class="modal-highlights-list">
            ' . $feats_li . '
          </ul>
        </div>';
        }

        // Specifications
        $specs = $chair['specifications'] ?? [];
        $specs_items_html = '';
        $skip_keys = ['merk', 'model', 'staat', 'materiaal', 'brand', 'name', 'condition', 'material'];
        if (!empty($specs) && is_array($specs)) {
            foreach ($specs as $s_key => $s_val) {
                if ($s_val && !in_array(strtolower(trim($s_key)), $skip_keys)) {
                    $label_nl = htmlspecialchars(ucfirst(str_replace('_', ' ', $s_key)), ENT_QUOTES, 'UTF-8');
                    $val_nl = htmlspecialchars(strval($s_val), ENT_QUOTES, 'UTF-8');
                    $specs_items_html .= '
            <div class="modal-spec-item">
              <span class="modal-spec-label">' . $label_nl . '</span>
              <span class="modal-spec-value">' . $val_nl . '</span>
            </div>';
                }
            }
        }

        $clean_desc = str_replace(["\r", "\n", '"'], ['', ' ', '\"'], strip_tags($desc));
        $item_condition = $is_occasion ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition";
        $chair_active_staop = ($catalog_page === 'staopstoelen.html') ? 'active' : '';
        $chair_active_relax = ($catalog_page === 'seniorenstoelen.html') ? 'active' : '';

        $html_content = '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' . $chair_name . ' | ' . $brand . ' ' . $condition_label . ' | Staopstoelen.nl</title>
  <meta name="description" content="Bekijk de ' . $chair_name . ' van ' . $brand . '. Uitstekend zitcomfort, ergonomisch op maat ingesteld en inclusief garantie en gratis thuisadvies door heel Nederland.">
  <link rel="canonical" href="https://staopstoelen.nl/stoelen/' . $chair_id . '.html">
  
  <!-- OpenGraph / Social Meta -->
  <meta property="og:title" content="' . $chair_name . ' | Staopstoelen.nl">
  <meta property="og:description" content="Comfortabele ' . $condition_label . ' van ' . $brand . '. Bekijk specificaties, prijzen en plan een vrijblijvend zitadvies in onze showroom.">
  <meta property="og:image" content="' . htmlspecialchars($seo_image_url, ENT_QUOTES) . '">
  <meta property="og:url" content="https://staopstoelen.nl/stoelen/' . $chair_id . '.html">
  <meta property="og:type" content="product">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  
  <!-- Stylesheets & Fonts -->
  <link rel="stylesheet" href="../style.css?v=10.234">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Schema.org JSON-LD Structured Data for Google -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "' . $chair_name . '",
    "image": "' . $seo_image_url . '",
    "description": "' . $clean_desc . '",
    "brand": {
      "@type": "Brand",
      "name": "' . $brand . '"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://staopstoelen.nl/stoelen/' . $chair_id . '.html",
      "priceCurrency": "EUR",
      "price": "' . $price . '",
      "availability": "https://schema.org/InStock",
      "itemCondition": "' . $item_condition . '"
    }
  }
  </script>

  <style>
    .product-page-container {
      max-width: 1200px;
      margin: 20px auto 60px auto;
      padding: 0 20px;
    }
    .product-grid-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 40px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .product-grid-layout {
        grid-template-columns: 1fr;
        gap: 28px;
      }
    }
    .main-image-frame {
      background: white;
      border: 1px solid var(--color-gray-light);
      border-radius: var(--radius-lg);
      padding: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      min-height: 420px;
    }
    .main-image-frame img {
      max-width: 100%;
      max-height: 440px;
      object-fit: contain;
      transition: opacity 0.25s ease;
    }
    .main-image-frame img.has-photo-bg,
    .main-image-frame img:not([src*=".png"]) {
      border-radius: 16px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }
    .gallery-thumbnail img {
      border-radius: 4px;
    }
    .trust-bullets-box {
      background: #fbf9f5;
      border: 1px solid #ebdccb;
      border-radius: 12px;
      padding: 18px 20px;
      margin-top: 24px;
    }
    .trust-bullet {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.88rem;
      color: #374151;
      margin-bottom: 8px;
    }
    .trust-bullet:last-child {
      margin-bottom: 0;
    }
  </style>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5KQF1CELDD"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag("js", new Date());

    gtag("config", "AW-923357429");
    gtag("config", "AW-18540486129");
    gtag("config", "G-5KQF1CELDD");
  </script>
</head>
<body>

  <!-- Top Contact Header -->
  <header class="navbar">
    <div class="container navbar-container">
      <svg class="logo-swoosh" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path d="M 0,90 Q 250,160 500,100 T 1000,110" fill="none" stroke="var(--color-sky)" stroke-width="8" stroke-linecap="round" opacity="0.6"></path>
        <path d="M 0,110 Q 250,70 500,120 T 1000,130" fill="none" stroke="var(--color-terracotta)" stroke-width="6" stroke-linecap="round" opacity="0.75"></path>
        <path d="M 0,125 Q 250,170 500,115 T 1000,140" fill="none" stroke="var(--color-sage)" stroke-width="7" stroke-linecap="round" opacity="0.8"></path>
        <path d="M 0,140 Q 250,100 500,145 T 1000,150" fill="none" stroke="var(--color-forest)" stroke-width="10" stroke-linecap="round" opacity="0.95"></path>
      </svg>
      <a href="../index.html" class="nav-text-logo" id="navTextLogo">staopstoelen<span>.nl</span></a>
      <div class="navbar-top-right">
        <a href="tel:+31786314858" class="nav-top-contact-link">
          <svg style="width: 15px; height: 15px; stroke: var(--color-terracotta); fill: none;" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          078 - 631 4858
        </a>
        <a href="mailto:info@staopstoelen.nl" class="nav-top-contact-link">
          <svg style="width: 15px; height: 15px; stroke: var(--color-terracotta); fill: none;" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          info@staopstoelen.nl
        </a>
        <a href="../afspraak.html" class="btn btn-primary btn-nav-appointment">Maak een afspraak</a>
      </div>
      <button class="menu-toggle" id="menuToggle" aria-label="Open menu" onclick="document.getElementById(\'navLinks\').classList.toggle(\'active\')">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="navbar-row-2">
        <nav class="nav-links" id="navLinks">
          <a href="../staopstoelen.html" class="' . $chair_active_staop . '">Sta-op Stoelen</a>
          <a href="../seniorenstoelen.html" class="' . $chair_active_relax . '">Senioren Stoelen</a>
          <a href="../revisie.html">Revisieproces</a>
          <a href="../ervaringen.html">Ervaringen</a>
          <a href="../faq.html">FAQ</a>
          <a href="../info.html">Over Ons</a>
          <a href="../afspraak.html" class="nav-desktop-hide">Afspraak Maken</a>
        </nav>
      </div>
    </div>
  </header>

  <!-- Main Product Detail View -->
  <main class="product-page-container">
    
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Kruimelpad" style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--color-gray); margin-bottom: 24px;">
      <a href="../index.html" style="color: var(--color-forest); text-decoration: none; font-weight: 600;">Home</a>
      <span>›</span>
      <a href="../' . $catalog_page . '" style="color: var(--color-forest); text-decoration: none; font-weight: 600;">' . $catalog_name . '</a>
      <span>›</span>
      <span style="color: var(--color-dark); font-weight: 600;">' . $chair_name . '</span>
    </nav>

    <div class="product-grid-layout">
      
      <!-- Left Column: Gallery & USPs -->
      <div class="product-gallery-section">
        <div class="main-image-frame">
          <span class="badge ' . $condition_badge_class . '" style="position: absolute; top: 16px; left: 16px; z-index: 2;">
            ' . $condition_label . '
          </span>
          <img id="detailMainImg"' . ((strpos(strtolower($main_image_url), '.png') === false) ? ' class="has-photo-bg"' : '') . ' src="' . htmlspecialchars($main_image_url, ENT_QUOTES) . '" alt="' . $chair_name . '">
        </div>
        
        ' . $gallery_html . '

        ' . $highlights_html . '

        <div class="trust-bullets-box">
          <div class="trust-bullet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>100% Maatwerk:</strong> Volledig ergonomisch op uw zithoogte en zitdiepte ingesteld.</span>
          </div>
          <div class="trust-bullet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Gratis thuisproefzitten:</strong> Wij komen vrijblijvend met deze stoel bij u aan huis.</span>
          </div>
          <div class="trust-bullet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Betrouwbare garantie:</strong> Volledige fabrieksgarantie en eigen servicedienst.</span>
          </div>
          <div class="trust-bullet">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-forest)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span><strong>Deskundig advies:</strong> Gerealiseerd door gediplomeerde BewegingsTechnologen.</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Chair Information & Ordering -->
      <div class="product-info-column">
        <div style="font-size: 0.85rem; font-weight: 800; color: var(--color-terracotta); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
          ' . $brand . '
        </div>
        <h1 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--color-forest-dark); line-height: 1.25; margin-bottom: 14px;">
          ' . $chair_name . '
        </h1>

        ' . $actie_box_html . '

        ' . $price_box_html . '

        <!-- Action CTA Buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px;">
          <a href="../afspraak.html?stoel=' . urlencode($chair_id) . '" class="btn btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 24px; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-sm); text-decoration: none;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Afspraak maken</span>
          </a>
                                  <!-- Subtiele Geertjan Micro-Conversie (Tekst rechts, grotere avatar, niet onderstreept) -->
            <a href="tel:+31786314858" class="advisor-trust-bubble" style="display: flex !important; align-items: center !important; gap: 12px !important; margin-top: 12px !important; text-decoration: none !important; color: inherit !important; box-sizing: border-box !important; width: 100% !important; background: transparent !important; border: none !important; padding: 0 !important; transition: all 0.2s ease !important;" title="Bel direct met Geertjan voor advies over dit model">
              <!-- Geertjan Pasfoto (Groter: 54px) -->
              <div style="position: relative !important; width: 54px !important; height: 54px !important; min-width: 54px !important; max-width: 54px !important; border-radius: 50% !important; overflow: hidden !important; border: 2.5px solid #4b8f24 !important; flex-shrink: 0 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;">
                <img src="../assets/geert.png" alt="Geertjan" style="width: 54px !important; height: 54px !important; max-width: 54px !important; min-width: 54px !important; object-fit: cover !important; object-position: top center !important; display: block !important; margin: 0 !important; border-radius: 50% !important; border: none !important;">
              </div>
              <!-- Tekstballonnetje Rechts -->
              <div style="position: relative !important; background: #ffffff !important; border: 1.5px solid #c9dcb9 !important; border-radius: 12px !important; padding: 9px 13px !important; font-size: 0.84rem !important; line-height: 1.35 !important; color: #2d3329 !important; flex: 1 !important; text-align: left !important; box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;">
                <span style="position: absolute !important; left: -7px !important; top: 50% !important; transform: translateY(-50%) !important; width: 0 !important; height: 0 !important; border-top: 6px solid transparent !important; border-bottom: 6px solid transparent !important; border-right: 6px solid #c9dcb9 !important; display: block !important;"></span>
                <span style="position: absolute !important; left: -5px !important; top: 50% !important; transform: translateY(-50%) !important; width: 0 !important; height: 0 !important; border-top: 5px solid transparent !important; border-bottom: 5px solid transparent !important; border-right: 5px solid #ffffff !important; display: block !important;"></span>
                <div>Heeft u vragen over dit model? Bel mij gerust op <span style="font-weight: 700 !important; text-decoration: none !important; color: #256616 !important; white-space: nowrap !important;">078 - 631 4858</span>.</div>
              </div>
            </a>
        </div>
          <a href="../' . $catalog_page . '#' . urlencode($chair_id) . '" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 20px; font-size: 0.95rem; font-weight: 600; border-radius: var(--radius-sm); text-decoration: none;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Bekijk in de catalogus</span>
          </a>

        <!-- Specifications Grid -->
        <div style="margin-bottom: 28px;">
          <h3 style="font-size: 1.1rem; color: var(--color-forest-dark); margin-bottom: 12px; font-family: var(--font-heading);">
            Technische specificaties:
          </h3>
          <div class="modal-specs-grid">
            <div class="modal-spec-item">
              <span class="modal-spec-label">Merk</span>
              <span class="modal-spec-value">' . $brand . '</span>
            </div>
            <div class="modal-spec-item">
              <span class="modal-spec-label">Model</span>
              <span class="modal-spec-value">' . $model . '</span>
            </div>
            <div class="modal-spec-item">
              <span class="modal-spec-label">Staat</span>
              <span class="modal-spec-value">' . $condition_label . '</span>
            </div>
            <div class="modal-spec-item">
              <span class="modal-spec-label">Materiaal</span>
              <span class="modal-spec-value">' . $material . '</span>
            </div>
            ' . $specs_items_html . '
          </div>
        </div>

        <!-- Description -->
        <div style="background: white; border: 1px solid var(--color-gray-light); border-radius: 12px; padding: 22px 24px; line-height: 1.6; font-size: 0.92rem; color: #374151;">
          <h3 style="font-size: 1.05rem; color: var(--color-forest-dark); margin-bottom: 12px; font-family: var(--font-heading);">
            Over de ' . $chair_name . '
          </h3>
          <div>' . nl2br(htmlspecialchars($desc, ENT_QUOTES, 'UTF-8')) . '</div>
        </div>

      </div>
    </div>

    <!-- Showroom & Advice Banner -->
    <div style="background: linear-gradient(135deg, #122b07 0%, #1e450c 100%); color: white; border-radius: 16px; padding: 36px 32px; margin-top: 50px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
      <div style="max-width: 650px;">
        <span style="color: var(--color-terracotta); font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 6px;">
          Persoonlijk & Vrijblijvend
        </span>
        <h2 style="color: white; font-family: var(--font-heading); font-size: 1.7rem; margin-bottom: 10px;">
          Wilt u deze stoel rustig proberen in onze showroom of bij u thuis?
        </h2>
        <p style="color: rgba(255,255,255,0.8); font-size: 0.95rem; margin: 0; line-height: 1.5;">
          Onze zitspecialisten stellen de stoel direct exact af op uw lichaamslengte en zithouding. Geheel kosteloos en zonder verplichtingen.
        </p>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="../afspraak.html" class="btn btn-primary" style="padding: 14px 24px; font-weight: 700; text-decoration: none;">
          Plan een Afspraak
        </a>
        <a href="tel:+31786314858" class="btn btn-secondary" style="padding: 14px 20px; font-weight: 700; text-decoration: none; border-color: rgba(255,255,255,0.4); color: white;">
          📞 078 - 631 4858
        </a>
      </div>
    </div>

  </main>

  <!-- Footer Section -->
  <footer>
    <div class="container footer-grid">
      <div class="footer-col">
        <h3 style="color: var(--color-light);">staopstoelen.nl</h3>
        <p style="font-size: 0.92rem; color: var(--color-terracotta); font-weight: 700; margin-top: 10px; margin-bottom: 6px; letter-spacing: 0.2px;">
          Zitspecialist &amp; Officieel Fitform Dealer &mdash; Showroom Dordrecht
        </p>
        <p style="font-size: 0.9rem; color: rgba(255,255,255,0.65); margin-top: 0; line-height: 1.6;">
          Maatwerk in nieuwe A-merk sta-op stoelen, ergonomische seniorenfauteuils en gecertificeerd gereviseerde topoccasions.
        </p>
      </div>
      <div class="footer-col">
        <h3>Snelle Links</h3>
        <ul style="margin-top: 16px;">
          <li><a href="../staopstoelen.html">Sta-op Stoelen</a></li>
          <li><a href="../fitform-dealer-dordrecht.html">Fitform Dealer Dordrecht</a></li>
          <li><a href="../seniorenstoelen.html">Senioren Stoelen</a></li>
          <li><a href="../revisie.html">Revisieproces</a></li>
          <li><a href="../ervaringen.html">Klantverhalen</a></li>
          <li><a href="../faq.html">Veelgestelde vragen (FAQ)</a></li>
          <li><a href="../afspraak.html">Afspraak Inplannen</a></li>
          <li><a href="../info.html">Over Ons</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Contact &amp; Showroom</h3>
        <div class="footer-contact-info">
          <strong>Showroom Dordrecht:</strong><br>
          Merwedestraat 239<br>
          3313 GT Dordrecht<br>
          <span style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">(in het pand van Schipper Compact Wonen)</span>
        </div>
        <div class="footer-contact-links">
          <a href="tel:+31786314858">
            <svg class="contact-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            078 - 631 4858
          </a>
          <a href="mailto:info@staopstoelen.nl">
            <svg class="contact-icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            info@staopstoelen.nl
          </a>
        </div>
        <div class="footer-contact-info" style="margin-top: 14px;">
          <strong>Openingstijden:</strong><br>
          Dinsdag t/m Vrijdag: 10:00 - 16:00<br>
          Maandag &amp; Zaterdag: Op afspraak
        </div>
        <ul class="footer-usp-list">
          <li>
            <span class="footer-usp-badge">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span><strong>Gratis parkeren</strong> voor de deur</span>
          </li>
          <li>
            <span class="footer-usp-badge">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>Gelijkvloers &amp; rolstoelvriendelijk</span>
          </li>
          <li>
            <span class="footer-usp-badge">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>Buiten openingstijden op afspraak welkom</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="container footer-bottom">
      <div class="footer-copyright">
        &copy; 2026 staopstoelen.nl. Alle rechten voorbehouden.
      </div>
      <div style="font-size: 0.875rem; color: rgba(255,255,255,0.5);">
        Gerealiseerd door BewegingsTechnologen. | Versie 10.234
      </div>
    </div>
  </footer>

  <script>
    function switchDetailPhoto(imgUrl, element) {
      const mainImg = document.getElementById("detailMainImg");
      if (mainImg) {
        mainImg.style.opacity = "0.3";
        setTimeout(() => {
          mainImg.src = imgUrl;
          if (/\.png(\?|$)/i.test(imgUrl)) {
            mainImg.classList.remove("has-photo-bg");
          } else {
            mainImg.classList.add("has-photo-bg");
          }
          mainImg.style.opacity = "1";
        }, 150);
      }
      document.querySelectorAll(".gallery-thumbnail").forEach(t => t.classList.remove("active"));
      if (element) element.classList.add("active");
    }
  </script>

</body>
</html>';

        $file_path = $stoelen_dir . '/' . $chair_id . '.html';
        file_put_contents($file_path, $html_content);
        $generated_count++;
    }

    // Clean up obsolete chair files
    $deleted_files = [];
    if (is_dir($stoelen_dir)) {
        $files = scandir($stoelen_dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            if (substr($file, -5) === '.html') {
                $id = substr($file, 0, -5);
                if (!isset($valid_ids[$id])) {
                    $del_path = $stoelen_dir . '/' . $file;
                    @unlink($del_path);
                    $deleted_files[] = $file;
                }
            }
        }
    }

    // Regenerate sitemap.xml
    $today = date('Y-m-d');
    $site_url = 'https://staopstoelen.nl';
    $static_pages = [
        ["", "1.0", "daily"],
        ["/staopstoelen.html", "0.9", "daily"],
        ["/fitform-dealer-dordrecht.html", "0.9", "weekly"],
        ["/seniorenstoelen.html", "0.9", "daily"],
        ["/keuzehulp.html", "0.8", "weekly"],
        ["/revisie.html", "0.8", "weekly"],
        ["/ervaringen.html", "0.7", "weekly"],
        ["/faq.html", "0.7", "weekly"],
        ["/info.html", "0.7", "weekly"],
        ["/afspraak.html", "0.9", "daily"],
        ["/winkel.html", "0.8", "weekly"]
    ];

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
    $xml .= '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

    foreach ($static_pages as $page_info) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>" . $site_url . $page_info[0] . "</loc>\n";
        $xml .= "    <lastmod>" . $today . "</lastmod>\n";
        $xml .= "    <changefreq>" . $page_info[2] . "</changefreq>\n";
        $xml .= "    <priority>" . $page_info[1] . "</priority>\n";
        $xml .= "  </url>\n";
    }

    foreach ($chairs as $chair) {
        $chair_id = trim($chair['id'] ?? '');
        $chair_name = htmlspecialchars($chair['name'] ?? '', ENT_QUOTES, 'UTF-8');
        $chair_img = trim($chair['image'] ?? '');
        if ($chair_id) {
            $url_loc = $site_url . '/stoelen/' . $chair_id . '.html';
            $xml .= "  <url>\n";
            $xml .= "    <loc>" . $url_loc . "</loc>\n";
            $xml .= "    <lastmod>" . $today . "</lastmod>\n";
            $xml .= "    <changefreq>daily</changefreq>\n";
            $xml .= "    <priority>0.8</priority>\n";
            if ($chair_img) {
                $img_loc = (strpos($chair_img, 'http') !== 0) ? ($site_url . '/' . $chair_img) : $chair_img;
                $xml .= "    <image:image>\n";
                $xml .= "      <image:loc>" . htmlspecialchars($img_loc, ENT_QUOTES) . "</image:loc>\n";
                $xml .= "      <image:title>" . $chair_name . "</image:title>\n";
                $xml .= "    </image:image>\n";
            }
            $xml .= "  </url>\n";
        }
    }

    $xml .= "</urlset>\n";
    file_put_contents($sitemap_file, $xml);

    return [
        'status' => 'success',
        'generated' => $generated_count,
        'deleted' => count($deleted_files),
        'deleted_files' => $deleted_files,
        'sitemap_updated' => true
    ];
}

// If invoked directly via HTTP request
if (php_sapi_name() !== 'cli' && basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'sync_static_pages.php') {
    header('Content-Type: application/json; charset=utf-8');
    $result = sync_static_chair_pages();
    echo json_encode($result);
    exit;
}
