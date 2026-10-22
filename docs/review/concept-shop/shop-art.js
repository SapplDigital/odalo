/* Original product, packaging and ingredient drawings for the fictional "Brindle Pantry" campaign concept.
 * Plain SVG strings. Product origin (0,0) is the centre of its base; negative y is up. Ingredients are centred on (0,0).
 * Loaded by the HTML pages as a classic script (window.ShopArt) and by tools/build-assets.mjs through node:vm. */
(function () {
  var P = { tomato: '#f2542d', tomatoDark: '#c93a18', mustard: '#f7b32b', green: '#0b5d4a', greenLight: '#2f8a6f', ink: '#1b2220', paper: '#fafaf6', plum: '#6a2150', plumLight: '#9b3a78', lemon: '#f3d74a', glass: '#ffffff', wood: '#b98a56', woodDark: '#8d6439', cream: '#fff6df' };
  var SLAB = "Rockwell, 'Roboto Slab', Georgia, serif"; // used at font-weight 800 (Rockwell Extra Bold)
  var SLABR = "Rockwell, 'Roboto Slab', Georgia, serif";
  var txt = function (x, y, s, size, fill, anchor, family, spacing) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="' + (family || SLAB) + '" font-weight="' + (family ? 400 : 800) + '" font-size="' + size + '" fill="' + fill + '"' + (spacing ? ' letter-spacing="' + spacing + '"' : '') + '>' + s + '</text>'; };

  var ingredients = {
    plum: '<circle r="56" fill="' + P.plum + '"/><path d="M0 -54C-6 -20 -6 20 0 54" stroke="' + P.plumLight + '" stroke-width="4" fill="none" opacity="0.6"/><ellipse cx="-20" cy="-22" rx="14" ry="8" fill="#fff" opacity="0.28" transform="rotate(-30 -20 -22)"/><path d="M0 -54q12 -26 38 -24q-6 22 -38 24Z" fill="' + P.greenLight + '"/><line x1="0" y1="-54" x2="4" y2="-70" stroke="' + P.green + '" stroke-width="5" stroke-linecap="round"/>',
    lemon: '<circle r="58" fill="' + P.mustard + '"/><circle r="48" fill="' + P.lemon + '"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<path d="M0 0L' + (Math.cos(i * Math.PI / 4 - 0.3) * 44).toFixed(1) + ' ' + (Math.sin(i * Math.PI / 4 - 0.3) * 44).toFixed(1) + 'A44 44 0 0 1 ' + (Math.cos(i * Math.PI / 4 + 0.3) * 44).toFixed(1) + ' ' + (Math.sin(i * Math.PI / 4 + 0.3) * 44).toFixed(1) + 'Z" fill="#fff3a8" opacity="0.9"/>'; }).join('') + '<circle r="5" fill="' + P.mustard + '"/>',
    thyme: '<path d="M-10 70C-6 20 6 -20 14 -70" stroke="' + P.green + '" stroke-width="6" fill="none" stroke-linecap="round"/>' + [[-2, 40, -40], [6, 12, 36], [-6, -12, -42], [10, -34, 38], [0, -56, -30], [14, -66, 20]].map(function (a) { return '<ellipse cx="' + (a[0] + (a[2] > 0 ? 14 : -14)) + '" cy="' + a[1] + '" rx="16" ry="7" transform="rotate(' + a[2] + ' ' + a[0] + ' ' + a[1] + ')" fill="' + P.greenLight + '"/>'; }).join(''),
    seeds: [[-30, -10, 20], [-6, -34, -50], [22, -14, 70], [-18, 22, -10], [10, 18, 40], [34, 30, -30], [-40, 30, 60]].map(function (a) { return '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="16" ry="8" transform="rotate(' + a[2] + ' ' + a[0] + ' ' + a[1] + ')" fill="' + P.paper + '"/><line x1="' + (a[0] - 8) + '" y1="' + a[1] + '" x2="' + (a[0] + 8) + '" y2="' + a[1] + '" stroke="' + P.wood + '" stroke-width="2" transform="rotate(' + a[2] + ' ' + a[0] + ' ' + a[1] + ')"/>'; }).join(''),
    chilli: '<path d="M-40 -30C-10 -46 40 -30 44 20C46 50 30 66 10 62C28 40 20 8 -30 -4Z" fill="' + P.tomatoDark + '"/><path d="M-30 -4C-40 -12 -50 -20 -52 -32q14 -14 30 -2Z" fill="' + P.green + '"/><path d="M-6 -20C20 -22 36 -4 38 18" stroke="#ff9d80" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.7"/>',
    salt: [[-30, -20, 18, 12], [4, -34, 22, 40], [26, -6, 16, 60], [-14, 14, 20, -20], [18, 28, 14, 20], [-38, 20, 12, 50]].map(function (a) { return '<rect x="' + (a[0] - a[2] / 2) + '" y="' + (a[1] - a[2] / 2) + '" width="' + a[2] + '" height="' + a[2] + '" rx="2" fill="' + P.paper + '" stroke="#dfe6e2" stroke-width="2" transform="rotate(' + a[3] + ' ' + a[0] + ' ' + a[1] + ')"/>'; }).join(''),
  };

  var products = {
    jam: function () {
      return '<g>' +
        '<rect x="-80" y="-190" width="160" height="190" rx="22" fill="#ffffff" opacity="0.5"/>' +
        '<rect x="-76" y="-172" width="152" height="166" rx="18" fill="' + P.plum + '"/>' +
        '<rect x="-64" y="-160" width="14" height="130" rx="7" fill="#fff" opacity="0.22"/>' +
        '<path d="M-86 -196q8 -42 86 -42t86 42v14h-172Z" fill="' + P.tomato + '"/>' +
        [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<rect x="' + (-80 + i * 26) + '" y="-232" width="13" height="50" fill="#fff" opacity="0.85"/>'; }).join('') +
        '<path d="M-88 -184q88 18 176 0" stroke="' + P.ink + '" stroke-width="4" fill="none"/>' +
        '<rect x="-60" y="-132" width="120" height="86" rx="8" fill="' + P.paper + '"/>' +
        '<rect x="-54" y="-126" width="108" height="74" rx="5" fill="none" stroke="' + P.green + '" stroke-width="3"/>' +
        txt(0, -98, 'PLUM &amp;', 19, P.green) + txt(0, -76, 'THYME', 19, P.green) + txt(0, -58, 'jam', 15, P.tomato, 'middle', SLABR) +
        '</g>';
    },
    salt: function () {
      return '<g>' +
        '<rect x="-84" y="-118" width="168" height="118" rx="12" fill="' + P.green + '"/>' +
        '<ellipse cx="0" cy="-118" rx="84" ry="16" fill="' + P.greenLight + '"/><ellipse cx="0" cy="-120" rx="70" ry="10" fill="' + P.green + '"/>' +
        '<rect x="-84" y="-82" width="168" height="52" fill="' + P.paper + '"/>' +
        txt(0, -62, 'SMOKED', 21, P.green) + txt(0, -40, 'SEA SALT', 17, P.tomato) +
        '<g transform="translate(-60 -56) scale(0.2)">' + ingredients.salt + '</g>' +
        '<rect x="-84" y="-118" width="14" height="118" rx="7" fill="#fff" opacity="0.16"/>' +
        '</g>';
    },
    oil: function () {
      return '<g>' +
        '<path d="M-48 0V-210q0 -30 28 -50v-34h40v34q28 20 28 50V0Z" fill="#ffffff" opacity="0.55"/>' +
        '<path d="M-42 -4V-208q0 -26 26 -44v-32h32v32q26 18 26 44V-4Z" fill="#d6d93c"/>' +
        '<rect x="-34" y="-190" width="9" height="150" rx="4" fill="#fff" opacity="0.35"/>' +
        '<rect x="-17" y="-318" width="34" height="34" rx="5" fill="' + P.wood + '"/><rect x="-17" y="-318" width="34" height="8" rx="4" fill="' + P.woodDark + '"/>' +
        '<rect x="-42" y="-176" width="84" height="104" fill="' + P.paper + '"/>' +
        '<g transform="translate(0 -142) scale(0.34)">' + ingredients.lemon + '</g>' +
        txt(0, -100, 'LEMON', 16, P.green) + txt(0, -80, 'OIL', 17, P.tomato) +
        '</g>';
    },
    crackers: function () {
      return '<g>' +
        '<rect x="-92" y="-250" width="184" height="250" rx="8" fill="' + P.tomato + '"/>' +
        '<rect x="-92" y="-250" width="184" height="26" rx="8" fill="' + P.tomatoDark + '"/>' +
        '<rect x="-74" y="-196" width="148" height="86" rx="6" fill="' + P.mustard + '"/>' +
        [[-42, -170], [0, -158], [40, -172], [-24, -134], [26, -128]].map(function (c, i) { return '<rect x="' + (c[0] - 22) + '" y="' + (c[1] - 14) + '" width="44" height="28" rx="5" fill="' + P.cream + '" transform="rotate(' + (i * 14 - 20) + ' ' + c[0] + ' ' + c[1] + ')"/>'; }).join('') +
        '<rect x="-92" y="-96" width="184" height="64" fill="' + P.paper + '"/>' +
        txt(0, -66, 'SEED', 25, P.tomato) + txt(0, -42, 'CRACKERS', 21, P.green) +
        '<rect x="-92" y="-250" width="12" height="250" rx="6" fill="#fff" opacity="0.14"/>' +
        '</g>';
    },
    honey: function () {
      return '<g>' +
        '<path d="M-60 -20l-18 -30V-120l18 -30h120l18 30V-50l-18 30Z" fill="#ffffff" opacity="0.5"/>' +
        '<path d="M-54 -26l-14 -24V-118l14 -24h108l14 24V-50l-14 24Z" fill="' + P.mustard + '"/>' +
        [[-30, -80], [10, -100], [34, -62], [-10, -48], [24, -112]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="4" fill="' + P.tomatoDark + '"/>'; }).join('') +
        '<rect x="-48" y="-136" width="14" height="86" rx="7" fill="#fff" opacity="0.28"/>' +
        '<rect x="-66" y="-170" width="132" height="30" rx="6" fill="' + P.ink + '"/>' +
        '<rect x="-52" y="-100" width="104" height="52" rx="6" fill="' + P.green + '"/>' +
        txt(0, -80, 'CHILLI', 18, P.paper) + txt(0, -60, 'HONEY', 18, P.mustard) +
        '</g>';
    },
  };

  var api = {
    palette: P, fonts: { slab: SLAB, slabRegular: SLABR }, ingredients: ingredients, products: products,
    /** a standalone SVG of one product on a soft ground, for export */
    productSvg: function (name, bg) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-200 -380 400 420" width="400" height="420" role="img"><rect x="-200" y="-380" width="400" height="420" fill="' + (bg || P.paper) + '"/><ellipse cx="0" cy="6" rx="110" ry="12" fill="' + P.ink + '" opacity="0.14"/>' + products[name]() + '</svg>\n'; },
  };
  if (typeof window !== 'undefined') window.ShopArt = api;
})();
