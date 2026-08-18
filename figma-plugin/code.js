/* ============================================================
   Export Harta Olt — plugin de Figma

   Scoate din board fiecare element separat, cu poziția lui exactă:
   portretele și siglele ca PNG la 2x, textele și săgețile ca SVG.
   Rezultatul e un singur fișier board.json din care se construiește
   harta interactivă, identică cu plansa.
   ============================================================ */

figma.showUI(__html__, { width: 380, height: 340 });

/* Un element se exportă „ca atare" dacă e o frunză (text, vector, imagine)
   sau un grup mic — adică exact bucata pe care designerul a compus-o.
   Coborâm în grupurile mari, ca să nu exportăm tot board-ul ca o poză. */
const CONTAINER = ["GROUP", "FRAME", "SECTION", "COMPONENT", "INSTANCE"];
const VECTORISH = ["VECTOR", "LINE", "ELLIPSE", "POLYGON", "STAR",
                   "RECTANGLE", "BOOLEAN_OPERATION", "CONNECTOR"];

const DESCEND_AREA = 0.28;   // grupurile peste 28% din board se despachetează
const MAX_DEPTH = 6;

function boxOf(node) {
  return node.absoluteBoundingBox || null;
}

function area(box) {
  return box ? box.width * box.height : 0;
}

function shouldDescend(node, rootArea, depth) {
  if (depth >= MAX_DEPTH) return false;
  if (CONTAINER.indexOf(node.type) === -1) return false;
  if (!("children" in node) || node.children.length === 0) return false;
  if (node.children.length === 1) return true;
  const b = boxOf(node);
  if (!b) return true;
  return area(b) / rootArea > DESCEND_AREA;
}

function collect(node, rootArea, depth, out) {
  if (node.visible === false) return;

  if (shouldDescend(node, rootArea, depth)) {
    for (const child of node.children) collect(child, rootArea, depth + 1, out);
    return;
  }
  if (boxOf(node)) out.push(node);
}

/* textele și vectorii ies ca SVG (mici și clare la orice zoom),
   restul ca PNG la 2x */
function formatFor(node) {
  if (node.type === "TEXT") return "svg";
  if (VECTORISH.indexOf(node.type) !== -1) {
    const fills = node.fills;
    const hasImage = Array.isArray(fills) &&
      fills.some(f => f.type === "IMAGE" && f.visible !== false);
    return hasImage ? "png" : "svg";
  }
  return "png";
}

function bytesToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return figma.base64Encode ? figma.base64Encode(bytes) : btoa(bin);
}

async function run(scale) {
  let root = figma.currentPage.selection[0];

  if (!root) {
    // fără selecție, luăm cel mai mare cadru din pagină
    const frames = figma.currentPage.children.filter(n => boxOf(n));
    frames.sort((a, b) => area(boxOf(b)) - area(boxOf(a)));
    root = frames[0];
  }
  if (!root) {
    figma.ui.postMessage({ type: "error", message: "Selectează cadrul hărții în Figma, apoi apasă din nou." });
    return;
  }

  const rootBox = boxOf(root);
  const rootArea = area(rootBox);

  const nodes = [];
  if ("children" in root) {
    for (const child of root.children) collect(child, rootArea, 1, nodes);
  } else {
    nodes.push(root);
  }

  figma.ui.postMessage({ type: "start", total: nodes.length });

  const elements = [];
  let done = 0;

  for (const node of nodes) {
    const box = boxOf(node);
    const format = formatFor(node);

    let data = null;
    try {
      const settings = format === "svg"
        ? { format: "SVG", svgOutlineText: false }
        : { format: "PNG", constraint: { type: "SCALE", value: scale } };
      const bytes = await node.exportAsync(settings);
      data = format === "svg"
        ? String.fromCharCode.apply(null, bytes)
        : bytesToBase64(bytes);
    } catch (err) {
      data = null;
    }

    const item = {
      id: node.id,
      name: node.name,
      type: node.type,
      x: Math.round((box.x - rootBox.x) * 100) / 100,
      y: Math.round((box.y - rootBox.y) * 100) / 100,
      w: Math.round(box.width * 100) / 100,
      h: Math.round(box.height * 100) / 100,
      rotation: Math.round((node.rotation || 0) * 100) / 100,
      opacity: node.opacity === undefined ? 1 : Math.round(node.opacity * 100) / 100,
      format,
      data
    };

    if (node.type === "TEXT") {
      item.characters = node.characters;
      item.fontSize = typeof node.fontSize === "number" ? node.fontSize : null;
    }

    elements.push(item);
    done++;
    if (done % 3 === 0 || done === nodes.length) {
      figma.ui.postMessage({ type: "progress", done, total: nodes.length });
    }
  }

  figma.ui.postMessage({
    type: "done",
    payload: {
      board: root.name,
      width: Math.round(rootBox.width * 100) / 100,
      height: Math.round(rootBox.height * 100) / 100,
      scale,
      elements
    }
  });
}

figma.ui.onmessage = msg => {
  if (msg.type === "export") run(msg.scale || 2);
  if (msg.type === "close") figma.closePlugin();
};
