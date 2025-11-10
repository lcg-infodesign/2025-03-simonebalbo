//Inizializzazione variabili: csv, icone, hoverxtooltip, checkbox
let table;

const volcanoIcons = {
  "Stratovolcano": "assets/stratovolcano.svg",
  "Shield volcano": "assets/shield_volcano.svg",
  "Complex volcano": "assets/complex_volcano.svg",
  "Cinder cone": "assets/cinder_cone.svg",
  "Pyroclastic cone": "assets/pyroclastic_cone.svg",
  "Tuff cone": "assets/tuff_cone.svg",
  "Lava dome": "assets/lava_dome.svg",
  "Explosion crater": "assets/explosion_crater.svg",
  "Caldera": "assets/caldera.svg",
  "Fissure vent": "assets/fissure_vent.svg",
  "Maar": "assets/maar.svg",
  "Submarine volcano": "assets/submarine_volcano.svg",
  "Volcanic field": "assets/volcanic_field.svg",
  "Pumice cone": "assets/pumice_cone.svg",
  "Scoria cones": "assets/scoria_cones.svg"
};

let volcanoImages = {};
let staticLayer;
let hoverInfo = null;
let selectedVolcano = null;

// Toggle per la griglia (true = si vede)
let showGrid = true;
// Checkbox (cfr in setup)
let gridCheckbox = null;

//Caricamento tab
function preload() {
  table = loadTable('assets/dataset.csv', 'csv', 'header');
  for (const [type, path] of Object.entries(volcanoIcons)) {
    volcanoImages[type] = loadImage(path);
  }
}

//Setup
function setup() {
  //Container x canvas
  const container = document.getElementById('map-container');
  if (!container) {
    console.error('Container #map-container non trovato!');
    return;
  }

  // Dim e pos basate su vw/vh
  container.style.position = 'relative';
  container.style.width = '100vw';
  container.style.height = '100vh';

  const canvas = createCanvas(container.clientWidth, container.clientHeight);
  canvas.parent(container);

  // Layer in caso la griglia sia tolta
  staticLayer = createGraphics(width, height);

  // Contrllo checkbox per la griglia (HTML semplice)
  createGridToggle(container);

  // Primo disegno del layer statico
  drawStaticLayer();
}

//Resizing finestra
function windowResized() {
  const container = document.getElementById('map-container');
  if (!container) return;

  resizeCanvas(container.clientWidth, container.clientHeight);
  staticLayer.resizeCanvas(width, height);
  drawStaticLayer();
}

function createGridToggle(container) {
  // Rimuove eventuale controllo precedente
  const existing = document.getElementById('grid-toggle-wrapper');
  if (existing) existing.remove();

  //wrapper x griglisa
  const wrapper = document.createElement('div');
  wrapper.id = 'grid-toggle-wrapper';
  wrapper.style.position = 'absolute';
  wrapper.style.top = '10px';
  wrapper.style.right = '10px';
  wrapper.style.background = 'rgba(255,255,255,0.9)';
  wrapper.style.padding = '6px 8px';
  wrapper.style.borderRadius = '6px';
  wrapper.style.boxShadow = '0 1px 4px rgba(0,0,0,0.15)';
  wrapper.style.fontFamily = 'sans-serif';
  wrapper.style.fontSize = '13px';
  wrapper.style.zIndex = 10;

  //Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'grid-toggle';
  checkbox.checked = showGrid;
  checkbox.style.marginRight = '6px';

  const label = document.createElement('label');
  label.htmlFor = 'grid-toggle';
  label.innerText = 'Mostra griglia (G)';

  checkbox.addEventListener('change', () => {
    showGrid = checkbox.checked;
    drawStaticLayer();
  });

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);
  container.appendChild(wrapper);

  gridCheckbox = checkbox;
}

  // Toggle con g / G
function keyPressed() {
  if (key === 'g' || key === 'G') {
    showGrid = !showGrid;
    if (gridCheckbox) gridCheckbox.checked = showGrid;
    drawStaticLayer();
  }
}

// Mapping lon/lat a canvas
function lonLatToXY(lon, lat) {
  lon = parseFloat(lon);
  lat = parseFloat(lat);
  if (!isFinite(lon) || !isFinite(lat)) return { x: NaN, y: NaN };

  const x = map(lon, -180, 180, 0, width);
  const y = map(lat, 90, -90, 0, height);
  return { x, y };
}

function drawStaticLayer() {
  staticLayer.clear();
  staticLayer.background(245);

    // Sfondo a griglia spenta
  if (showGrid) {
    drawGrid(staticLayer);
  } else {
    staticLayer.noStroke();
    staticLayer.fill(245);
    staticLayer.rect(0, 0, width, height);
  }

  if (!table) {
    redraw();
    return;
  }


  const latCol = table.columns.find(c => c.toLowerCase().includes('latitude'));
  const lonCol = table.columns.find(c => c.toLowerCase().includes('longitude'));
  const typeCol = table.columns.find(c => c.toLowerCase().includes('type'));
  if (!latCol || !lonCol || !typeCol) {
    redraw();
    return;
  }

  for (let r = 0; r < table.getRowCount(); r++) {
    const lat = parseFloat(table.getString(r, latCol).trim());
    const lon = parseFloat(table.getString(r, lonCol).trim());
    const type = table.getString(r, typeCol).trim();
    if (!isFinite(lat) || !isFinite(lon)) continue;

    const p = lonLatToXY(lon, lat);

    if (volcanoImages[type]) {
      staticLayer.push();
      staticLayer.tint(255, 180);
      staticLayer.image(volcanoImages[type], p.x - 6, p.y - 6, 12, 12);
      staticLayer.pop();
    } else {
      staticLayer.fill(230, 60, 60, 180);
      staticLayer.noStroke();
      staticLayer.ellipse(p.x, p.y, 12, 12);
    }
  }

  redraw();
}


//DRAW!!!
function draw() {
  image(staticLayer, 0, 0);
  hoverInfo = null;

  if (!table) return;
  const latCol = table.columns.find(c => c.toLowerCase().includes('latitude'));
  const lonCol = table.columns.find(c => c.toLowerCase().includes('longitude'));
  const typeCol = table.columns.find(c => c.toLowerCase().includes('type'));
  if (!latCol || !lonCol || !typeCol) return;

  for (let r = 0; r < table.getRowCount(); r++) {
    const lat = parseFloat(table.getString(r, latCol).trim());
    const lon = parseFloat(table.getString(r, lonCol).trim());
    const type = table.getString(r, typeCol).trim();
    const name = table.getString(r, Math.min(1, table.columns.length - 1)).trim();
    if (!isFinite(lat) || !isFinite(lon)) continue;

    const p = lonLatToXY(lon, lat);

    if (dist(mouseX, mouseY, p.x, p.y) < 6 && volcanoImages[type]) {
      hoverInfo = { x: p.x, y: p.y, name: name, type: type };
      push();
      tint(255, 255);
      image(volcanoImages[type], p.x - 6, p.y - 6, 12, 12);
      pop();
    }
  }


   //Tooltip
  if (hoverInfo) {
    push();
    fill(50, 50, 50, 220);
    noStroke();
    rect(hoverInfo.x + 10, hoverInfo.y - 10, textWidth(hoverInfo.name) + 8, 18, 4);
    fill(255);
    textSize(12);
    textAlign(LEFT, CENTER);
    text(hoverInfo.name, hoverInfo.x + 14, hoverInfo.y + 1);
    pop();
  }

  //Legenda al click
  if (selectedVolcano !== null) {
    push();
    fill(255);
    stroke(0);
    strokeWeight(1);
    const cardX = 20, cardY = 20, cardW = 260;
    const cardH = 20 + 18 * table.columns.length;
    rect(cardX, cardY, cardW, cardH, 6);
    fill(0);
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    let y = cardY + 8;
    for (let col of table.columns) {
      const value = table.getString(selectedVolcano, col).trim();
      text(`• ${col}: ${value}`, cardX + 8, y);
      y += 18;
    }
    pop();
  }

  cursor(hoverInfo ? HAND : ARROW);
}


//Linee x griglia
function drawGrid(g) {
  g.noStroke();
  g.fill(234, 244, 255);
  g.rect(0, 0, width, height);
  g.stroke(200);
  g.strokeWeight(1);

  // Meridiani ogni 30°
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = map(lon, -180, 180, 0, width);
    g.line(x, 0, x, height);
  }

  // Paralleli ogni 30°
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = map(lat, 90, -90, 0, height);
    g.line(0, y, width, y);
  }
}

function mouseMoved() {
  redraw();
}


function mousePressed() {
  if (!table) return;
  const latCol = table.columns.find(c => c.toLowerCase().includes('latitude'));
  const lonCol = table.columns.find(c => c.toLowerCase().includes('longitude'));
  if (!latCol || !lonCol) return;

  selectedVolcano = null;

  for (let r = 0; r < table.getRowCount(); r++) {
    const lat = parseFloat(table.getString(r, latCol).trim());
    const lon = parseFloat(table.getString(r, lonCol).trim());
    if (!isFinite(lat) || !isFinite(lon)) continue;

    const p = lonLatToXY(lon, lat);
    if (dist(mouseX, mouseY, p.x, p.y) < 6) {
      selectedVolcano = r;
      break;
    }
  }
}
