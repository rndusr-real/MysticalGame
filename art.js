// ♥ A macskalányok és a helyszínek rajzai. Minden kódból készül, nem kell hozzá képfájl. ♥
// A szereplők színei a levels.js "cast" részében írhatók át.

const ART = (function () {
  "use strict";

  let uid = 0;

  // Mindig ugyanazt a "véletlen" sorozatot adja, így a rajzok nem változnak betöltésenként.
  function seeded(seed) {
    let value = seed;
    return function (min, max) {
      value = (value * 16807) % 2147483647;
      return min + ((value - 1) / 2147483646) * (max - min);
    };
  }

  const MIRROR = 'transform="matrix(-1 0 0 1 480 0)"';
  const LASH = "#2b0b26";
  const MOUTH = "#a8285c";
  const LOCKS = 7;

  /* ---------- Arc ---------- */

  function openEye(cx, side, id, size) {
    const lift = size === "wide" ? -5 : 0;
    const irisX = size === "wide" ? 15 : 19;
    const irisY = size === "wide" ? 21 : 27;
    return `
      <path fill="#fffafc" d="M${cx - 25} 219 Q${cx - 4} ${180 + lift} ${cx + 25} 217 Q${cx + 20} 251 ${cx} 253 Q${cx - 20} 251 ${cx - 25} 219Z"/>
      <ellipse cx="${cx}" cy="223" rx="${irisX}" ry="${irisY}" fill="url(#${id}-iris)"/>
      <ellipse cx="${cx}" cy="224" rx="5" ry="${irisY - 6}" fill="#25071f"/>
      <circle cx="${cx - 7}" cy="209" r="6.5" fill="#fff"/>
      <circle cx="${cx + 8}" cy="236" r="3.2" fill="#fff" opacity="0.85"/>
      <path fill="none" stroke="${LASH}" stroke-width="6.5" stroke-linecap="round" d="M${cx - 27} 220 Q${cx - 4} ${176 + lift} ${cx + 27} 216"/>
      <path fill="none" stroke="${LASH}" stroke-width="4" stroke-linecap="round" d="M${cx + side * 25} ${side < 0 ? 219 : 216} l${side * 9} -6"/>`;
  }

  function halfEye(cx, side, id) {
    return `
      <path fill="#fffafc" d="M${cx - 25} 222 L${cx + 25} 222 Q${cx + 20} 251 ${cx} 253 Q${cx - 20} 251 ${cx - 25} 222Z"/>
      <path fill="url(#${id}-iris)" d="M${cx - 18} 222 L${cx + 18} 222 Q${cx + 17} 250 ${cx} 250 Q${cx - 17} 250 ${cx - 18} 222Z"/>
      <path fill="#25071f" d="M${cx - 5} 222 L${cx + 5} 222 Q${cx + 4} 240 ${cx} 244 Q${cx - 4} 240 ${cx - 5} 222Z"/>
      <circle cx="${cx - 7}" cy="229" r="3.6" fill="#fff"/>
      <path fill="none" stroke="${LASH}" stroke-width="6.5" stroke-linecap="round" d="M${cx - 28} 222 L${cx + 28} 221"/>
      <path fill="none" stroke="${LASH}" stroke-width="4" stroke-linecap="round" d="M${cx + side * 27} 221 l${side * 8} -4"/>`;
  }

  function closedEye(cx) {
    return `<path fill="none" stroke="${LASH}" stroke-width="6.5" stroke-linecap="round" d="M${cx - 24} 232 Q${cx} 202 ${cx + 24} 232"/>`;
  }

  function brows(kind) {
    const paths = {
      soft: "M180 182 Q204 170 222 178 M258 178 Q276 170 300 182",
      up: "M180 170 Q204 156 222 166 M258 166 Q276 156 300 170",
      sad: "M182 170 Q204 174 222 186 M258 186 Q276 174 298 170",
      sly: "M182 186 Q204 180 222 188 M258 176 Q276 164 300 176",
    };
    return `<path fill="none" stroke="${LASH}" stroke-width="3.4" stroke-linecap="round" opacity="0.75" d="${paths[kind]}"/>`;
  }

  const MOUTHS = {
    line: `<path fill="none" stroke="${MOUTH}" stroke-width="3.4" stroke-linecap="round" d="M232 279 Q240 283 248 279"/>`,
    cat: `<path fill="none" stroke="${MOUTH}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" d="M222 275 Q230 288 240 277 Q250 288 258 275"/>`,
    fang: `<path fill="none" stroke="${MOUTH}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" d="M222 275 Q230 288 240 277 Q250 288 258 275"/><path fill="#fff" stroke="${MOUTH}" stroke-width="1.6" stroke-linejoin="round" d="M248 282 l4 8 l4 -10z"/>`,
    open: `<path fill="#b52a60" d="M222 272 Q240 278 258 272 Q255 296 240 296 Q225 296 222 272Z"/><path fill="#ff8fb4" d="M229 288 Q240 281 251 288 Q247 296 240 296 Q233 296 229 288Z"/>`,
    oh: `<ellipse cx="240" cy="282" rx="7" ry="9" fill="#b52a60"/>`,
    down: `<path fill="none" stroke="${MOUTH}" stroke-width="3.4" stroke-linecap="round" d="M230 285 Q240 275 250 285"/>`,
  };

  function blush(alpha) {
    return `
      <ellipse cx="184" cy="262" rx="24" ry="12" fill="#ff7fae" opacity="${alpha}"/>
      <ellipse cx="296" cy="262" rx="24" ry="12" fill="#ff7fae" opacity="${alpha}"/>`;
  }

  const WHISKERS = `<path fill="none" stroke="#c9587f" stroke-width="2.2" stroke-linecap="round" opacity="0.55" d="M170 256 l14 2 M170 266 l14 -1 M310 256 l-14 2 M310 266 l-14 -1"/>`;

  const MOODS = {
    neutral: { eyes: "open", brow: "soft", mouth: "line", blush: 0.25 },
    smile: { eyes: "open", brow: "soft", mouth: "cat", blush: 0.4 },
    happy: { eyes: "closed", brow: "up", mouth: "open", blush: 0.6 },
    smug: { eyes: "half", brow: "sly", mouth: "fang", blush: 0.2 },
    surprised: { eyes: "wide", brow: "up", mouth: "oh", blush: 0.45 },
    sad: { eyes: "open", brow: "sad", mouth: "down", blush: 0.3 },
    sleepy: { eyes: "half", brow: "soft", mouth: "line", blush: 0.25 },
  };

  function face(mood, id) {
    const m = MOODS[mood] || MOODS.neutral;
    let eyes;
    if (m.eyes === "closed") eyes = closedEye(202) + closedEye(278);
    else if (m.eyes === "half") eyes = halfEye(202, -1, id) + halfEye(278, 1, id);
    else eyes = openEye(202, -1, id, m.eyes) + openEye(278, 1, id, m.eyes);
    return `
      ${blush(m.blush)}${WHISKERS}
      <g class="eyes">${eyes}</g>
      ${brows(m.brow)}
      <circle cx="240" cy="262" r="1.8" fill="#c9587f"/>
      ${MOUTHS[m.mouth]}`;
  }

  /* ---------- Haj ---------- */

  function bow(x, y, color) {
    return `
      <g>
        <path fill="${color}" d="M${x} ${y} C${x - 38} ${y - 34} ${x - 52} ${y - 8} ${x - 44} ${y + 12} C${x - 34} ${y + 22} ${x - 14} ${y + 12} ${x} ${y}Z"/>
        <path fill="${color}" d="M${x} ${y} C${x + 38} ${y - 34} ${x + 52} ${y - 8} ${x + 44} ${y + 12} C${x + 34} ${y + 22} ${x + 14} ${y + 12} ${x} ${y}Z"/>
        <path fill="#000" opacity="0.14" d="M${x} ${y} C${x - 20} ${y + 2} ${x - 34} ${y + 4} ${x - 44} ${y + 12} C${x - 34} ${y + 22} ${x - 14} ${y + 12} ${x} ${y}Z M${x} ${y} C${x + 20} ${y + 2} ${x + 34} ${y + 4} ${x + 44} ${y + 12} C${x + 34} ${y + 22} ${x + 14} ${y + 12} ${x} ${y}Z"/>
        <circle cx="${x}" cy="${y}" r="9" fill="#fff" opacity="0.9"/>
        <circle cx="${x}" cy="${y}" r="6" fill="${color}"/>
      </g>`;
  }

  const SHINE = `
    <g fill="none" stroke="#fff" stroke-linecap="round">
      <path opacity="0.3" stroke-width="7" d="M186 142 Q204 124 226 118 M254 118 Q276 124 294 142"/>
      <path opacity="0.14" stroke-width="3" d="M214 88 C206 104 200 120 196 138 M240 84 V116 M266 88 C274 104 280 120 284 138"/>
    </g>`;

  const HAIR = {
    twintails: {
      back(fill, shade) {
        const tail = "M160 128 C92 136 34 250 42 396 C48 512 88 590 132 640 C118 560 128 480 150 410 C170 346 184 270 182 206 C180 170 172 144 160 128Z";
        const strand = "M152 170 C104 214 78 300 82 396 C86 470 102 530 118 576";
        return `
          <path fill="${fill}" d="${tail}"/>
          <path fill="none" stroke="${shade}" stroke-width="5" stroke-linecap="round" opacity="0.5" d="${strand}"/>
          <g ${MIRROR}>
            <path fill="${fill}" d="${tail}"/>
            <path fill="none" stroke="${shade}" stroke-width="5" stroke-linecap="round" opacity="0.5" d="${strand}"/>
          </g>
          <path fill="${shade}" d="M154 190 C150 104 330 104 326 190 C330 256 318 316 296 336 L184 336 C162 316 150 256 154 190Z"/>`;
      },
      front(fill, shade, look) {
        return `
          <path fill="${fill}" d="M150 244 C136 120 196 78 240 78 C284 78 344 120 330 244 C326 222 320 196 308 176 C306 196 296 208 284 214 C286 192 276 170 262 158 C254 182 232 204 204 212 C212 192 212 176 208 164 C198 186 182 200 170 204 C162 216 154 230 150 244Z"/>
          <path fill="${shade}" opacity="0.28" d="M308 176 C306 196 296 208 284 214 C286 192 276 170 262 158 C254 182 232 204 204 212 C212 192 212 176 208 164 C198 186 182 200 170 204 C180 188 200 150 206 146 C230 150 250 146 262 138 C280 150 298 160 308 176Z"/>
          ${SHINE}
          ${bow(160, 132, look.trim)}
          <g ${MIRROR}>${bow(160, 132, look.trim)}</g>`;
      },
    },
    long: {
      back(fill, shade) {
        return `
          <path fill="${fill}" d="M146 170 C114 300 118 540 84 760 C150 790 330 790 396 760 C362 540 366 300 334 170 C318 80 162 80 146 170Z"/>
          <path fill="none" stroke="${shade}" stroke-width="5" stroke-linecap="round" opacity="0.7" d="M128 400 C124 520 116 620 104 730 M352 400 C356 520 364 620 376 730"/>`;
      },
      front(fill, shade, look) {
        const lock = "M152 130 C136 200 138 310 142 412 L164 396 L194 414 C188 340 184 260 186 186Z";
        return `
          <path fill="${fill}" d="${lock}"/>
          <g ${MIRROR}><path fill="${fill}" d="${lock}"/></g>
          <path fill="${fill}" d="M150 226 C136 116 196 78 240 78 C284 78 344 116 330 226 C326 214 322 204 316 194 L164 194 C158 204 154 214 150 226Z"/>
          <path fill="${shade}" opacity="0.45" d="M172 194 L176 160 L186 194Z M214 194 L218 152 L228 194Z M256 194 L260 152 L270 194Z M296 194 L302 160 L308 194Z"/>
          ${SHINE}
          <g>
            <circle cx="322" cy="128" r="17" fill="#ffe28f"/>
            <circle cx="329" cy="122" r="15" fill="${fill}"/>
            <path fill="none" stroke="${look.trim}" stroke-width="3" stroke-linecap="round" d="M322 146 v26 M312 150 v16 M332 150 v16"/>
          </g>`;
      },
    },
    fluffy: {
      back(fill, shade, look) {
        return `
          <path fill="${look.robe[1]}" d="M112 340 C96 200 150 60 240 60 C330 60 384 200 368 340 C340 390 140 390 112 340Z"/>
          <path fill="${shade}" d="M132 216 C116 104 364 104 348 216 C366 272 352 342 318 356 C298 366 282 344 270 340 L210 340 C198 344 182 366 162 356 C128 342 114 272 132 216Z"/>`;
      },
      front(fill, shade) {
        return `
          <path fill="none" stroke="${fill}" stroke-width="9" stroke-linecap="round" d="M240 84 C232 54 256 38 278 52"/>
          <path fill="${fill}" d="M128 262 C112 120 190 76 240 76 C290 76 368 120 352 262 C350 304 332 344 310 346 C322 306 324 262 312 216 C306 198 300 186 292 174 C292 196 284 208 272 214 C272 192 264 176 252 166 C244 188 226 204 204 208 C210 192 208 178 206 168 C196 188 180 204 168 216 C156 262 158 306 170 346 C148 344 130 304 128 262Z"/>
          <path fill="${shade}" opacity="0.32" d="M312 216 C324 262 322 306 310 346 C326 340 340 316 346 286 C338 262 326 236 312 216Z M168 216 C156 262 158 306 170 346 C154 340 140 316 134 286 C142 262 154 236 168 216Z"/>
          ${SHINE}`;
      },
    },
  };

  /* ---------- Test ---------- */

  function robe(id, look) {
    const sleeve = "M144 394 C112 462 84 580 78 690 C104 712 150 716 182 700 C186 610 192 500 186 420Z";
    const sleeveCuff = "M78 690 C104 712 150 716 182 700 L183 672 C150 690 108 686 80 662Z";
    return `
      <path fill="url(#${id}-robe)" d="M204 346 C176 352 152 364 138 392 C118 480 98 660 90 820 L390 820 C382 660 362 480 342 392 C328 364 304 352 276 346 C262 364 218 364 204 346Z"/>
      <path fill="#fff7fb" d="M214 340 L240 432 L266 340 C256 352 224 352 214 340Z"/>
      <path fill="none" stroke="${look.trim}" stroke-width="11" stroke-linejoin="round" d="M210 342 L240 438 L270 342"/>
      <path fill="url(#${id}-robe)" d="${sleeve}"/>
      <path fill="${look.trim}" d="${sleeveCuff}"/>
      <path fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="4" stroke-linecap="round" d="M128 500 C118 560 110 610 108 660 M160 480 C156 550 152 610 152 670"/>
      <g ${MIRROR}>
        <path fill="url(#${id}-robe)" d="${sleeve}"/>
        <path fill="${look.trim}" d="${sleeveCuff}"/>
        <path fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="4" stroke-linecap="round" d="M128 500 C118 560 110 610 108 660 M160 480 C156 550 152 610 152 670"/>
      </g>
      <path fill="${look.trim}" d="M184 500 Q240 516 296 500 L300 572 Q240 588 180 572Z"/>
      <path fill="#000" opacity="0.14" d="M180 572 Q240 588 300 572 L299 556 Q240 572 181 556Z"/>
      <path fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="4" d="M183 528 Q240 544 297 528"/>
      <path fill="none" stroke="#ffd98a" stroke-width="3.4" d="M240 536 V606"/>
      <circle cx="240" cy="620" r="15" fill="#ffd98a"/>
      <circle cx="235" cy="615" r="4" fill="#fff" opacity="0.8"/>
      <path fill="none" stroke="#a8691c" stroke-width="3" stroke-linecap="round" d="M240 622 V635"/>`;
  }

  function sprite(look) {
    const id = "girl" + ++uid;
    const hair = HAIR[look.hairStyle] || HAIR.twintails;
    const [hairLight, hairMid, hairDark] = look.hair;
    const ear = "M164 136 C156 104 152 76 156 50 C158 40 168 40 174 46 C198 64 216 84 232 106Z";
    const earInner = "M176 116 C172 98 168 82 168 66 C186 78 202 92 214 106Z";
    const fill = `url(#${id}-hair)`;

    return `
    <svg class="girl" viewBox="0 0 480 820" aria-hidden="true">
      <defs>
        <linearGradient id="${id}-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${hairLight}"/>
          <stop offset="0.45" stop-color="${hairMid}"/>
          <stop offset="1" stop-color="${hairDark}"/>
        </linearGradient>
        <linearGradient id="${id}-robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${look.robe[0]}"/>
          <stop offset="1" stop-color="${look.robe[1]}"/>
        </linearGradient>
        <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff0ea"/>
          <stop offset="1" stop-color="#ffdcd8"/>
        </linearGradient>
        <linearGradient id="${id}-iris" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${look.eyes[1]}"/>
          <stop offset="1" stop-color="${look.eyes[0]}"/>
        </linearGradient>
      </defs>
      <g class="tail">
        <path fill="none" stroke="${hairDark}" stroke-width="32" stroke-linecap="round" d="M330 650 C414 660 462 590 440 508 C430 466 396 462 384 490"/>
        <path fill="none" stroke="${hairMid}" stroke-width="24" stroke-linecap="round" d="M330 650 C414 660 462 590 440 508 C430 466 396 462 384 490"/>
      </g>
      ${hair.back(fill, hairDark, look)}
      ${robe(id, look)}
      <path fill="#f9c6c6" d="M220 288 H260 V342 C252 356 228 356 220 342Z"/>
      <path fill="url(#${id}-skin)" d="M160 196 C160 128 320 128 320 196 C322 250 284 304 240 314 C196 304 158 250 160 196Z"/>
      <g class="ear ear-left">
        <path fill="${hairMid}" d="${ear}"/>
        <path fill="#ffc4d8" d="${earInner}"/>
      </g>
      <g ${MIRROR}>
        <g class="ear ear-right">
          <path fill="${hairMid}" d="${ear}"/>
          <path fill="#ffc4d8" d="${earInner}"/>
        </g>
      </g>
      <g class="face"></g>
      ${hair.front(fill, hairDark, look)}
    </svg>
    <svg class="night-eyes" viewBox="0 0 480 820" aria-hidden="true">
      <g class="night-eye" style="color:${look.eyes[0]}">
        <path fill="${look.eyes[0]}" d="M177 224 Q202 196 227 224 Q202 246 177 224Z"/>
        <ellipse cx="202" cy="224" rx="3.4" ry="12" fill="#14020f"/>
        <path fill="${look.eyes[0]}" d="M253 224 Q278 196 303 224 Q278 246 253 224Z"/>
        <ellipse cx="278" cy="224" rx="3.4" ry="12" fill="#14020f"/>
      </g>
    </svg>`;
  }

  // Az üdvözlő képernyő szemei a sötétben.
  function eyes(color) {
    return `
    <svg class="dark-eyes" viewBox="0 0 150 50" aria-hidden="true">
      <path fill="${color}" d="M6 28 Q32 2 60 26 Q32 42 6 28Z"/>
      <ellipse cx="33" cy="25" rx="3.4" ry="13" fill="#0a0208"/>
      <path fill="${color}" d="M90 26 Q118 2 144 28 Q118 42 90 26Z"/>
      <ellipse cx="117" cy="25" rx="3.4" ry="13" fill="#0a0208"/>
    </svg>`;
  }

  /* ---------- Helyszínek ---------- */

  function layer(depth, content) {
    return `<svg class="layer${depth > 1.2 ? " near" : ""}" style="--d:${depth}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${content}</svg>`;
  }

  function stars(seed, count, height, color) {
    const random = seeded(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const delay = random(0, 6).toFixed(1);
      out += `<circle class="star" style="animation-delay:-${delay}s" cx="${random(0, 1600).toFixed(0)}" cy="${random(0, height).toFixed(0)}" r="${random(0.7, 2.3).toFixed(1)}" fill="${color}"/>`;
    }
    return out;
  }

  function blossoms(seed, cx, cy, spreadX, spreadY, count, tones) {
    const random = seeded(seed);
    let out = "";
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const reach = Math.sqrt(random(0, 1));
      const x = cx + Math.cos(angle) * reach * spreadX;
      const y = cy + Math.sin(angle) * reach * spreadY;
      const tone = tones[Math.floor(random(0, tones.length))];
      out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${random(18, 54).toFixed(0)}" fill="${tone}" opacity="${random(0.5, 0.95).toFixed(2)}"/>`;
    }
    return out;
  }

  function moon(id, x, y, r, inner, outer, halo) {
    return `
      <defs>
        <radialGradient id="${id}-moon"><stop offset="0" stop-color="${inner}"/><stop offset="0.8" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient>
        <radialGradient id="${id}-halo"><stop offset="0.3" stop-color="${halo}" stop-opacity="0.75"/><stop offset="1" stop-color="${halo}" stop-opacity="0"/></radialGradient>
      </defs>
      <circle class="halo" cx="${x}" cy="${y}" r="${r * 2.5}" fill="url(#${id}-halo)"/>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}-moon)"/>
      <g fill="${outer}" opacity="0.28">
        <circle cx="${x - r * 0.35}" cy="${y - r * 0.25}" r="${r * 0.17}"/>
        <circle cx="${x + r * 0.32}" cy="${y + r * 0.1}" r="${r * 0.12}"/>
        <circle cx="${x - r * 0.1}" cy="${y + r * 0.45}" r="${r * 0.2}"/>
      </g>`;
  }

  function paperLantern(x, y, scale, body, glow) {
    return `
      <g transform="translate(${x} ${y}) scale(${scale})">
        <circle class="lantern-glow" r="96" fill="url(#${glow})"/>
        <path fill="none" stroke="#14040f" stroke-width="3" d="M0 -80 V-36"/>
        <rect x="-16" y="-40" width="32" height="8" rx="2" fill="#14040f"/>
        <ellipse rx="34" ry="40" fill="${body}"/>
        <path fill="none" stroke="#000" stroke-opacity="0.2" stroke-width="2" d="M-34 -8 Q0 -2 34 -8 M-34 10 Q0 16 34 10 M-18 -36 Q-26 0 -18 36 M18 -36 Q26 0 18 36"/>
        <rect x="-16" y="32" width="32" height="8" rx="2" fill="#14040f"/>
        <path fill="none" stroke="#14040f" stroke-width="3" d="M0 40 V62"/>
      </g>`;
  }

  function glowDef(id, color) {
    return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="0.85"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>`;
  }

  function branches(color) {
    return `
      <path fill="none" stroke="${color}" stroke-linecap="round" stroke-width="26" d="M-20 120 C120 150 240 110 380 60"/>
      <path fill="none" stroke="${color}" stroke-linecap="round" stroke-width="12" d="M160 134 C230 200 300 220 400 216 M280 100 C350 130 430 130 500 96"/>
      <path fill="none" stroke="${color}" stroke-linecap="round" stroke-width="30" d="M1620 90 C1480 130 1380 110 1240 40"/>
      <path fill="none" stroke="${color}" stroke-linecap="round" stroke-width="13" d="M1440 120 C1370 190 1300 210 1210 200 M1330 90 C1270 120 1190 120 1130 90"/>`;
  }

  function gate(palette) {
    const id = "gate" + ++uid;
    const s = palette.shape;
    return `
      <div class="backdrop" style="background:${palette.sky}"></div>
      ${layer(0.2, `
        ${stars(11, palette.stars, 560, palette.star)}
        ${moon(id, 800, 360, 250, palette.moon[0], palette.moon[1], palette.moon[2])}
        <g class="cloud" fill="${palette.cloud}" opacity="0.5">
          <rect x="120" y="300" width="620" height="16" rx="8"/>
          <rect x="260" y="330" width="380" height="10" rx="5"/>
          <rect x="980" y="420" width="560" height="14" rx="7"/>
          <rect x="1100" y="448" width="300" height="9" rx="4.5"/>
        </g>`)}
      ${layer(0.5, `
        <path fill="${palette.hills}" d="M0 650 C180 560 340 620 500 590 C660 560 760 640 900 620 C1100 590 1260 540 1600 640 V900 H0Z"/>
        <g fill="${palette.hills}">
          ${blossoms(23, 110, 560, 150, 110, 22, [palette.hills])}
          ${blossoms(29, 1490, 560, 170, 120, 22, [palette.hills])}
        </g>`)}
      ${layer(0.9, `
        ${glowDef(id + "-lamp", palette.glow)}
        <g fill="${s}">
          <path d="M360 158 Q800 232 1240 158 L1214 214 Q800 276 386 214Z"/>
          <rect x="432" y="234" width="736" height="30"/>
          <rect x="412" y="330" width="776" height="34"/>
          <rect x="758" y="232" width="84" height="110" rx="4"/>
          <path d="M488 220 H566 L584 900 H470Z"/>
          <path d="M1034 220 H1112 L1130 900 H1016Z"/>
        </g>
        <rect x="772" y="246" width="56" height="82" rx="3" fill="${palette.glow}" opacity="0.55"/>
        <g fill="${palette.stairs}">
          <path d="M0 720 H1600 V900 H0Z"/>
        </g>
        <path fill="none" stroke="${s}" stroke-width="5" d="M0 752 H1600 M0 792 H1600 M0 840 H1600"/>
        ${paperLantern(620, 442, 1, palette.lantern, id + "-lamp")}
        ${paperLantern(980, 442, 1, palette.lantern, id + "-lamp")}
      `)}
      ${layer(1.4, `
        ${branches(s)}
        ${blossoms(41, 240, 110, 310, 130, palette.bloom, palette.petals)}
        ${blossoms(47, 1370, 90, 320, 130, palette.bloom, palette.petals)}
      `)}`;
  }

  function hall() {
    const id = "hall" + ++uid;
    const cx = 800;
    const cy = 440;
    const steps = [1, 0.66, 0.44, 0.3, 0.2, 0.135];
    const frame = (k) => ({
      l: cx - 860 * k, r: cx + 860 * k, t: cy - 470 * k, b: cy + 470 * k,
    });
    let walls = "";
    let beams = "";
    steps.forEach((k, i) => {
      const a = frame(k);
      const next = steps[i + 1];
      if (next) {
        const b = frame(next);
        const glow = 0.3 + i * 0.13;
        const panel = (x1, x2) => {
          const ty1 = x1 === a.l || x1 === a.r ? a.t : b.t;
          const by1 = x1 === a.l || x1 === a.r ? a.b : b.b;
          const ty2 = x2 === a.l || x2 === a.r ? a.t : b.t;
          const by2 = x2 === a.l || x2 === a.r ? a.b : b.b;
          let grid = "";
          for (let g = 1; g < 4; g++) {
            const t = g / 4;
            const x = x1 + (x2 - x1) * t;
            grid += `M${x} ${ty1 + (ty2 - ty1) * t} L${x} ${by1 + (by2 - by1) * t} `;
          }
          for (let g = 1; g < 5; g++) {
            const t = g / 5;
            grid += `M${x1} ${ty1 + (by1 - ty1) * t} L${x2} ${ty2 + (by2 - ty2) * t} `;
          }
          return `<path fill="#ff6fb4" opacity="${glow}" d="M${x1} ${ty1} L${x2} ${ty2} L${x2} ${by2} L${x1} ${by1}Z"/>
            <path fill="none" stroke="#1c0519" stroke-width="${2 + 4 * k}" d="${grid}"/>`;
        };
        walls += panel(a.l, b.l) + panel(a.r, b.r);
        walls += `<path fill="#180516" d="M${a.l} ${a.t} L${a.r} ${a.t} L${b.r} ${b.t} L${b.l} ${b.t}Z"/>`;
        walls += `<path fill="#2a0a24" d="M${a.l} ${a.b} L${a.r} ${a.b} L${b.r} ${b.b} L${b.l} ${b.b}Z"/>`;
      }
      const w = 44 * k + 3;
      beams += `<path fill="none" stroke="#120310" stroke-width="${w}" d="M${a.l} ${a.b} L${a.l} ${a.t} L${a.r} ${a.t} L${a.r} ${a.b}"/>`;
    });
    const end = frame(steps[steps.length - 1]);
    return `
      <div class="backdrop" style="background:#120310"></div>
      ${layer(0.3, `
        <defs><radialGradient id="${id}-end"><stop offset="0" stop-color="#fff0f8"/><stop offset="0.4" stop-color="#ff7fc0"/><stop offset="1" stop-color="#ff4fa0" stop-opacity="0"/></radialGradient></defs>
        ${glowDef(id + "-lamp", "#ff7fc0")}
        ${walls}
        <rect x="${end.l}" y="${end.t}" width="${end.r - end.l}" height="${end.b - end.t}" fill="#ffc4e2"/>
        <circle class="halo" cx="${cx}" cy="${cy}" r="330" fill="url(#${id}-end)"/>
        <g fill="#14030f">
          <circle cx="800" cy="440" r="11"/>
          <path d="M790 436 L788 420 L799 430Z M810 436 L812 420 L801 430Z"/>
          <path d="M792 450 Q800 446 808 450 L820 500 H780Z"/>
        </g>
        ${beams}
        <g fill="#14030f" opacity="0.7">
          <circle cx="256" cy="462" r="50"/>
          <path d="M214 446 L204 382 L252 424Z M298 446 L308 382 L260 424Z"/>
          <path d="M222 512 Q256 500 290 512 C322 560 340 640 346 720 H166 C172 640 190 560 222 512Z"/>
        </g>
      `)}
      ${layer(1.1, `
        ${paperLantern(470, 150, 1.25, "#ffb8dd", id + "-lamp")}
        ${paperLantern(1130, 150, 1.25, "#ffb8dd", id + "-lamp")}
      `)}`;
  }

  function room() {
    const id = "room" + ++uid;
    let lattice = "";
    for (let x = -210; x <= 210; x += 70) lattice += `M${800 + x} 90 V510 `;
    for (let y = 90; y <= 510; y += 70) lattice += `M590 ${y} H1010 `;
    return `
      <div class="backdrop" style="background:linear-gradient(#2a0b2c,#4a1244 60%,#1a0618)"></div>
      ${layer(0.25, `
        <defs>
          <clipPath id="${id}-win"><circle cx="800" cy="300" r="214"/></clipPath>
          <linearGradient id="${id}-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb8dd" stop-opacity="0.34"/><stop offset="1" stop-color="#ffb8dd" stop-opacity="0"/></linearGradient>
        </defs>
        <g clip-path="url(#${id}-win)">
          <rect x="580" y="80" width="440" height="440" fill="#31103f"/>
          ${stars(61, 26, 520, "#ffe6f4")}
          ${moon(id, 880, 240, 96, "#fff0f8", "#ffa6d6", "#ff8cc6")}
        </g>
        <path fill="none" stroke="#150412" stroke-width="7" d="${lattice}" clip-path="url(#${id}-win)"/>
        <circle cx="800" cy="300" r="222" fill="none" stroke="#150412" stroke-width="22"/>
        <circle cx="800" cy="300" r="240" fill="none" stroke="#ff8cc6" stroke-opacity="0.25" stroke-width="3"/>
        <path fill="url(#${id}-beam)" d="M620 420 L980 420 L1280 900 L320 900Z"/>
      `)}
      ${layer(0.7, `
        <path fill="#1d0719" d="M0 690 H1600 V900 H0Z"/>
        <path fill="none" stroke="#3b0f33" stroke-width="4" d="M0 730 H1600 M0 790 H1600 M0 860 H1600 M240 690 L90 900 M560 690 L510 900 M1040 690 L1090 900 M1360 690 L1510 900"/>
        <g>
          <rect x="120" y="600" width="350" height="26" rx="6" fill="#120310"/>
          <rect x="146" y="624" width="24" height="90" fill="#120310"/>
          <rect x="420" y="624" width="24" height="90" fill="#120310"/>
          <circle cx="296" cy="490" r="96" fill="#120310"/>
          <circle cx="296" cy="490" r="78" fill="#ffc4e2" opacity="0.65"/>
          <path fill="#fff" opacity="0.5" d="M250 470 Q280 430 324 432 Q290 444 262 486Z"/>
          <rect x="280" y="580" width="32" height="22" fill="#120310"/>
          <rect x="356" y="586" width="60" height="14" rx="4" fill="#ff8cc6" opacity="0.26" stroke="#ff8cc6" stroke-dasharray="6 5" stroke-width="2"/>
        </g>
        <g>
          <path fill="#120310" d="M1200 720 C1180 610 1220 520 1300 480 C1380 520 1420 610 1400 720Z"/>
          <circle cx="1300" cy="466" r="46" fill="#120310"/>
          <path fill="#120310" d="M1262 440 L1254 386 L1296 424Z M1338 440 L1346 386 L1304 424Z"/>
        </g>
      `)}
      ${layer(1.2, `
        ${glowDef(id + "-lamp", "#ff8cc6")}
        ${paperLantern(1090, 140, 1.15, "#ffb8dd", id + "-lamp")}
      `)}`;
  }

  function lab() {
    const id = "lab" + ++uid;
    const random = seeded(83);

    function monitor(x, y, w, h, tone, lines) {
      let code = "";
      for (let i = 0; i < lines; i++) {
        const indent = Math.floor(random(0, 3)) * w * 0.05;
        const length = random(0.2, 0.7) * w;
        const step = (h * 0.8) / lines;
        code += `<rect x="${(x + w * 0.08 + indent).toFixed(0)}" y="${(y + h * 0.12 + i * step).toFixed(0)}" width="${length.toFixed(0)}" height="${Math.max(step * 0.4, 2).toFixed(1)}" rx="1" fill="${tone}" opacity="0.75"/>`;
      }
      return `
        <rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="6" fill="#0a0612"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="#10203c"/>
        ${code}
        <rect x="${x + w / 2 - w * 0.06}" y="${y + h + 8}" width="${w * 0.12}" height="${h * 0.16}" fill="#0a0612"/>
        <rect x="${x + w / 2 - w * 0.2}" y="${y + h + 8 + h * 0.16}" width="${w * 0.4}" height="6" rx="3" fill="#0a0612"/>`;
    }

    let wall = "";
    [[60, 210], [260, 210], [60, 400], [260, 400], [1190, 210], [1390, 210], [1190, 400], [1390, 400]].forEach(([x, y], i) => {
      wall += monitor(x, y, 150, 96, i % 3 === 0 ? "#ff8cc6" : "#9fe8ff", 5);
    });

    let desks = "";
    [[40, 640], [340, 640], [1060, 640], [1360, 640]].forEach(([x, y]) => {
      desks += `
        <rect x="${x - 20}" y="${y + 104}" width="240" height="18" rx="4" fill="#0a0612"/>
        <rect x="${x}" y="${y + 122}" width="16" height="130" fill="#0a0612"/>
        <rect x="${x + 184}" y="${y + 122}" width="16" height="130" fill="#0a0612"/>
        ${monitor(x + 30, y, 140, 78, "#9fe8ff", 4)}`;
    });

    return `
      <div class="backdrop" style="background:linear-gradient(#0a0a22,#1a0d36 58%,#0b0312)"></div>
      ${layer(0.25, `
        ${glowDef(id + "-glow", "#7fd8ff")}
        <path fill="none" stroke="#2a1c4a" stroke-width="5" d="M0 120 C300 170 500 90 800 130 S1300 90 1600 140 M0 60 C400 100 700 40 1000 80 S1400 50 1600 70"/>
        ${wall}
        <circle class="halo" cx="800" cy="300" r="470" fill="url(#${id}-glow)" opacity="0.55"/>
        ${monitor(540, 150, 520, 300, "#9fe8ff", 9)}
        <rect class="lock-open" x="584" y="424" width="22" height="10" fill="#fff0f8"/>
      `)}
      ${layer(0.7, `
        <path fill="#120a24" d="M0 740 H1600 V900 H0Z"/>
        <path fill="none" stroke="#2a1c4a" stroke-width="4" d="M0 740 H1600 M0 800 H1600 M0 866 H1600 M240 740 L90 900 M560 740 L510 900 M1040 740 L1090 900 M1360 740 L1510 900"/>
        ${desks}
      `)}`;
  }

  function door() {
    const id = "door" + ++uid;
    const heart = "M0 8 C-14 -6 -8 -18 0 -10 C8 -18 14 -6 0 8Z";
    let locks = "";
    for (let i = 0; i < LOCKS; i++) {
      const angle = ((-90 + (i * 360) / LOCKS) * Math.PI) / 180;
      const x = 800 + Math.cos(angle) * 216;
      const y = 400 + Math.sin(angle) * 216;
      const last = i === LOCKS - 1;
      locks += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(2.1)">
        <circle r="17" fill="#1a0517" stroke="#ff8cc6" stroke-width="1.5"/>
        <path class="${last ? "lock-open" : ""}" fill="${last ? "#fff" : "#ff5fa8"}" d="${heart}"/>
      </g>`;
    }
    return `
      <div class="backdrop" style="background:radial-gradient(circle at 50% 44%,#5a1650,#1c0618 62%,#0b0209)"></div>
      ${layer(0.25, `
        <defs>
          <radialGradient id="${id}-disc"><stop offset="0" stop-color="#6b1f60"/><stop offset="1" stop-color="#28092a"/></radialGradient>
          <radialGradient id="${id}-aura"><stop offset="0.5" stop-color="#ff5fa8" stop-opacity="0.4"/><stop offset="1" stop-color="#ff5fa8" stop-opacity="0"/></radialGradient>
        </defs>
        <circle class="halo" cx="800" cy="400" r="560" fill="url(#${id}-aura)"/>
        <rect x="170" y="0" width="90" height="760" fill="#12030f"/>
        <rect x="1340" y="0" width="90" height="760" fill="#12030f"/>
        <circle cx="800" cy="400" r="330" fill="#12030f"/>
        <circle cx="800" cy="400" r="306" fill="url(#${id}-disc)" stroke="#ff8cc6" stroke-opacity="0.55" stroke-width="3"/>
        <circle class="spin" cx="800" cy="400" r="278" fill="none" stroke="#ffb8dd" stroke-opacity="0.6" stroke-width="5" stroke-dasharray="3 22" stroke-linecap="round"/>
        <circle class="spin spin-back" cx="800" cy="400" r="156" fill="none" stroke="#ffb8dd" stroke-opacity="0.5" stroke-width="3" stroke-dasharray="26 12"/>
        <path fill="#14030f" stroke="#ff8cc6" stroke-opacity="0.7" stroke-width="3" stroke-linejoin="round" d="M734 468 C722 420 730 380 744 356 L732 302 L776 336 Q800 330 824 336 L868 302 L856 356 C870 380 878 420 866 468 C846 492 754 492 734 468Z"/>
        <path fill="#ff8cc6" d="M752 404 Q770 386 788 404 Q770 416 752 404Z M812 404 Q830 386 848 404 Q830 416 812 404Z"/>
        <ellipse cx="770" cy="402" rx="2.4" ry="9" fill="#14030f"/>
        <ellipse cx="830" cy="402" rx="2.4" ry="9" fill="#14030f"/>
        ${locks}
      `)}
      ${layer(0.75, `
        <path fill="#180515" d="M0 740 H1600 V900 H0Z"/>
        <path fill="none" stroke="#3b0f33" stroke-width="5" d="M0 740 H1600 M0 790 H1600 M0 850 H1600"/>
        ${glowDef(id + "-flame", "#ff8cc6")}
        ${[120, 330, 1270, 1480].map((x) => `
          <circle class="lantern-glow" cx="${x}" cy="620" r="90" fill="url(#${id}-flame)"/>
          <rect x="${x - 11}" y="634" width="22" height="110" fill="#fff0f7"/>
          <path fill="#ff8cc6" d="M${x} 600 C${x + 13} 618 ${x + 8} 632 ${x} 632 C${x - 8} 632 ${x - 13} 618 ${x} 600Z"/>`).join("")}
      `)}`;
  }

  function dawn() {
    const id = "dawn" + ++uid;
    const random = seeded(97);
    let sky = "";
    for (let i = 0; i < 16; i++) {
      const x = random(40, 1560).toFixed(0);
      const y = random(30, 460).toFixed(0);
      const k = random(0.28, 0.72).toFixed(2);
      sky += `<g class="drift" style="animation-delay:-${random(0, 16).toFixed(1)}s">${paperLantern(x, y, k, "#ffd98a", id + "-lamp")}</g>`;
    }
    const candles = [-120, -72, -24, 24, 72, 120].map((x, i) => `
      <rect x="${800 + x - 7}" y="${346 + (i % 2) * 8}" width="14" height="52" rx="3" fill="${i % 2 ? "#fff" : "#ffc4e2"}"/>
      <circle class="lantern-glow" cx="${800 + x}" cy="${332 + (i % 2) * 8}" r="30" fill="url(#${id}-lamp)"/>
      <path fill="#ffd98a" d="M${800 + x} ${318 + (i % 2) * 8} c9 12 6 24 0 24 c-6 0 -9 -12 0 -24Z"/>`).join("");
    return `
      <div class="backdrop" style="background:linear-gradient(#5a1a6a,#c8307f 45%,#ff8cc6 75%,#ffd9a8)"></div>
      ${layer(0.2, `
        ${glowDef(id + "-lamp", "#ffd98a")}
        ${stars(71, 34, 320, "#fff")}
        <circle class="halo" cx="800" cy="480" r="560" fill="url(#${id}-lamp)" opacity="0.7"/>
        ${sky}
      `)}
      ${layer(0.6, `
        <path fill="#6b1b5e" d="M0 690 C300 640 520 680 800 664 C1100 650 1320 630 1600 690 V900 H0Z"/>
        <path fill="#3e0f3a" d="M0 740 H1600 V900 H0Z"/>
        <path fill="none" stroke="#ffd98a" stroke-width="4" stroke-opacity="0.8" d="M0 90 Q400 190 800 100 T1600 90"/>
        ${[120, 260, 400, 540, 680, 820, 960, 1100, 1240, 1380, 1520].map((x, i) => `<path fill="${i % 2 ? "#ffc4e2" : "#ff5fa8"}" d="M${x - 22} ${118 + Math.sin(x / 160) * 34} h44 l-22 42z"/>`).join("")}
        <g>
          <ellipse cx="800" cy="716" rx="290" ry="30" fill="#1c0618" opacity="0.5"/>
          <path fill="#ff8cc6" d="M560 530 H1040 V690 C1040 718 560 718 560 690Z"/>
          <path fill="#fff4fa" d="M560 530 H1040 V566 C1000 606 980 560 950 590 C920 620 890 566 850 600 C820 626 780 566 740 596 C700 624 680 564 650 592 C620 618 590 566 560 586Z"/>
          <path fill="#d6246f" d="M624 406 H976 V536 C976 560 624 560 624 536Z"/>
          <path fill="#fff4fa" d="M624 396 H976 V432 C946 462 926 426 896 450 C866 476 840 426 800 454 C760 480 736 428 704 452 C674 474 650 428 624 448Z"/>
          ${candles}
          <path fill="#fff" d="M770 628 C745 604 754 588 770 600 C786 588 795 604 770 628Z M830 628 C805 604 814 588 830 600 C846 588 855 604 830 628Z" opacity="0.9"/>
        </g>
      `)}`;
  }

  const SKY_NIGHT = "linear-gradient(#0d0318 0%,#2b0a3d 38%,#7a1a66 66%,#d94c9b 88%,#ffa1cf 100%)";
  const SKY_BLOOM = "linear-gradient(#ffd6ec 0%,#ffb8dd 40%,#ff8cc6 72%,#f05aa8 100%)";

  const SCENES = {
    gate: () => gate({
      sky: SKY_NIGHT, stars: 110, star: "#ffe6f4",
      moon: ["#ffeef8", "#ff9fd0", "#ff6fb4"], cloud: "#2b0a3d",
      hills: "#3b0d42", stairs: "#1d0719", shape: "#12030f",
      glow: "#ff6fb4", lantern: "#ffb8dd", bloom: 56,
      petals: ["#a81f6e", "#7c1558", "#d6408f", "#551048"],
    }),
    bloom: () => gate({
      sky: SKY_BLOOM, stars: 0, star: "#fff",
      moon: ["#fff4fa", "#ffc4e2", "#ffffff"], cloud: "#fff0f8",
      hills: "#ff77b8", stairs: "#c72d82", shape: "#b81f74",
      glow: "#fff0f8", lantern: "#fff0f8", bloom: 72,
      petals: ["#fff0f8", "#ffd6ec", "#ffb8dd", "#ff8cc6"],
    }),
    hall, room, lab, door, dawn,
  };

  function scene(name) {
    return (SCENES[name] || SCENES.gate)();
  }

  return { sprite, face, eyes, scene };
})();
