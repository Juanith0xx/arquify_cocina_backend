// src/store.ts
var import_zustand = require("zustand");
var defaultModule = {
  id: "mod-1",
  width: 60,
  shelves: 2,
  drawers: 2,
  doors: false,
  hasHanger: true,
  innerDrawers: false
};
var getSavedDesigns = () => {
  const designs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("closet-design-")) {
      designs.push(key.replace("closet-design-", ""));
    }
  }
  return designs;
};
var useStore = (0, import_zustand.create)((set, get) => ({
  height: 200,
  depth: 60,
  thickness: 1.5,
  structureMaterial: "melamina",
  structureColor: "#ffffff",
  doorMaterial: "melamina",
  doorColor: "#e5e7eb",
  drawerFrontMaterial: "melamina",
  drawerFrontColor: "#e5e7eb",
  drawerInnerMaterial: "melamina",
  drawerInnerColor: "#ffffff",
  shelfMaterial: "melamina",
  shelfColor: "#ffffff",
  socleMaterial: "melamina",
  socleColor: "#ffffff",
  backColor: "#f3f4f6",
  hplInnerFace: "blanco",
  edgeBandingThicknessCabinets: 1,
  edgeBandingThicknessFronts: 1,
  showTopWall: true,
  showBottomWall: true,
  hplBalancer: true,
  showLeftWall: true,
  showRightWall: true,
  showBackWall: true,
  showSocle: true,
  showLegs: false,
  showDimensions: true,
  dimensionLevel: 2,
  showDecorations: true,
  isTransparent: false,
  drawerHardware: "Provelcar",
  assemblyType: "minifix",
  drawerAssemblyType: "minifix",
  modules: [defaultModule],
  activeModuleId: defaultModule.id,
  savedDesigns: getSavedDesigns(),
  isPrinting: false,
  targetPart: "structure",
  setTargetPart: (part) => set({ targetPart: part }),
  applyTextureToTarget: (textureUrl) => set((state) => {
    switch (state.targetPart) {
      case "structure":
        return { structureColor: textureUrl };
      case "doors":
        return { doorColor: textureUrl };
      case "drawerFronts":
        return { drawerFrontColor: textureUrl };
      case "drawerInner":
        return { drawerInnerColor: textureUrl };
      case "shelves":
        return { shelfColor: textureUrl };
      case "back":
        return { backColor: textureUrl };
      case "socle":
        return { socleColor: textureUrl };
      default:
        return state;
    }
  }),
  customTextures: [],
  setCustomTextures: (textures) => set({ customTextures: textures }),
  setHeight: (height) => set({ height }),
  setDepth: (depth) => set({ depth }),
  setThickness: (thickness) => set({ thickness }),
  setStructureMaterial: (m) => set({ structureMaterial: m }),
  setStructureColor: (c) => set({ structureColor: c }),
  setDoorMaterial: (m) => set({ doorMaterial: m }),
  setDoorColor: (c) => set({ doorColor: c }),
  setDrawerFrontMaterial: (m) => set({ drawerFrontMaterial: m }),
  setDrawerFrontColor: (c) => set({ drawerFrontColor: c }),
  setDrawerInnerMaterial: (m) => set({ drawerInnerMaterial: m }),
  setDrawerInnerColor: (c) => set({ drawerInnerColor: c }),
  setShelfMaterial: (m) => set({ shelfMaterial: m }),
  setShelfColor: (c) => set({ shelfColor: c }),
  setSocleMaterial: (m) => set({ socleMaterial: m }),
  setSocleColor: (c) => set({ socleColor: c }),
  setBackColor: (c) => set({ backColor: c }),
  setHplInnerFace: (f) => set({ hplInnerFace: f }),
  setEdgeBandingThicknessCabinets: (t) => set({ edgeBandingThicknessCabinets: t }),
  setEdgeBandingThicknessFronts: (t) => set({ edgeBandingThicknessFronts: t }),
  toggleTopWall: () => set((state) => ({ showTopWall: !state.showTopWall })),
  toggleBottomWall: () => set((state) => ({ showBottomWall: !state.showBottomWall })),
  setHplBalancer: (val) => set({ hplBalancer: val }),
  toggleLeftWall: () => set((state) => ({ showLeftWall: !state.showLeftWall })),
  toggleRightWall: () => set((state) => ({ showRightWall: !state.showRightWall })),
  toggleBackWall: () => set((state) => ({ showBackWall: !state.showBackWall })),
  toggleSocle: () => set((state) => ({ showSocle: !state.showSocle })),
  toggleLegs: () => set((state) => ({ showLegs: !state.showLegs })),
  toggleDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
  setDimensionLevel: (dimensionLevel) => set({ dimensionLevel }),
  toggleDecorations: () => set((state) => ({ showDecorations: !state.showDecorations })),
  toggleTransparent: () => set((state) => ({ isTransparent: !state.isTransparent })),
  setDrawerHardware: (type) => set({ drawerHardware: type }),
  setAssemblyType: (type) => set({ assemblyType: type }),
  setDrawerAssemblyType: (type) => set({ drawerAssemblyType: type }),
  addModule: () => set((state) => {
    const newId = `mod-${Date.now()}`;
    return {
      modules: [...state.modules, { ...defaultModule, id: newId }],
      activeModuleId: newId
    };
  }),
  updateModule: (id, updates) => set((state) => ({
    modules: state.modules.map((m) => m.id === id ? { ...m, ...updates } : m)
  })),
  updateModuleOverrides: (id, overrides) => set((state) => ({
    modules: state.modules.map((m) => m.id === id ? {
      ...m,
      overrides: overrides === null ? void 0 : { ...m.overrides || {}, ...overrides }
    } : m)
  })),
  removeModule: (id) => set((state) => {
    const newModules = state.modules.filter((m) => m.id !== id);
    return {
      modules: newModules,
      activeModuleId: state.activeModuleId === id ? newModules[0]?.id || null : state.activeModuleId
    };
  }),
  setActiveModule: (id) => set({ activeModuleId: id }),
  saveDesign: (name) => set((state) => {
    const design = {
      height: state.height,
      depth: state.depth,
      thickness: state.thickness,
      structureMaterial: state.structureMaterial,
      structureColor: state.structureColor,
      doorMaterial: state.doorMaterial,
      doorColor: state.doorColor,
      drawerFrontMaterial: state.drawerFrontMaterial,
      drawerFrontColor: state.drawerFrontColor,
      drawerInnerMaterial: state.drawerInnerMaterial,
      drawerInnerColor: state.drawerInnerColor,
      shelfMaterial: state.shelfMaterial,
      shelfColor: state.shelfColor,
      socleMaterial: state.socleMaterial,
      socleColor: state.socleColor,
      backColor: state.backColor,
      hplInnerFace: state.hplInnerFace,
      edgeBandingThicknessCabinets: state.edgeBandingThicknessCabinets,
      edgeBandingThicknessFronts: state.edgeBandingThicknessFronts,
      showTopWall: state.showTopWall,
      showBottomWall: state.showBottomWall,
      hplBalancer: state.hplBalancer,
      showLeftWall: state.showLeftWall,
      showRightWall: state.showRightWall,
      showBackWall: state.showBackWall,
      showSocle: state.showSocle,
      showLegs: state.showLegs,
      drawerHardware: state.drawerHardware,
      assemblyType: state.assemblyType,
      drawerAssemblyType: state.drawerAssemblyType,
      modules: state.modules
    };
    localStorage.setItem(`closet-design-${name}`, JSON.stringify(design));
    return { savedDesigns: getSavedDesigns() };
  }),
  loadDesign: (name) => set((state) => {
    const saved = localStorage.getItem(`closet-design-${name}`);
    if (saved) {
      const design = JSON.parse(saved);
      return {
        ...design,
        activeModuleId: design.modules[0]?.id || null
      };
    }
    return state;
  }),
  setIsPrinting: (val) => set({ isPrinting: val })
}));

// src/store/kitchenStore.ts
var import_zustand2 = require("zustand");
var useKitchenStore = (0, import_zustand2.create)((set) => ({
  viewMode: "3d",
  toolMode: "select",
  walls: [],
  cabinets: [],
  activeCabinetId: null,
  showSocle: false,
  drawingStart: null,
  setViewMode: (mode) => set({ viewMode: mode }),
  setToolMode: (mode) => set({ toolMode: mode, drawingStart: null }),
  addWall: (wall) => set((state) => ({ walls: [...state.walls, wall] })),
  addCabinet: (cabinet) => set((state) => ({ cabinets: [...state.cabinets, cabinet] })),
  setActiveCabinet: (id) => set({ activeCabinetId: id }),
  setDrawingStart: (pos) => set({ drawingStart: pos }),
  setShowSocle: (val) => set({ showSocle: val }),
  updateCabinet: (id, updates) => set((state) => ({ cabinets: state.cabinets.map((c) => c.id === id ? { ...c, ...updates } : c) }))
}));

// src/utils/kitchenManufacturing.ts
function getNominalSlideLength(nominalDepth) {
  const validLengths = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
  let maxValid = 25;
  for (const l of validLengths) {
    if (l <= nominalDepth) {
      maxValid = l;
    } else {
      break;
    }
  }
  return maxValid;
}
function generateKitchenPartsList(cabinets) {
  const parts = [];
  const state = useStore.getState();
  const thickness = state.thickness;
  cabinets.forEach((cab, index) => {
    const cabName = `(Cab ${index + 1} ${cab.type})`;
    const w = cab.width;
    const h = cab.height;
    const d = cab.depth;
    const legsHeight = cab.type === "base" || cab.type === "island" ? 15 : 0;
    const cabH = h - legsHeight;
    const innerW = w - thickness * 2;
    const innerH = cabH - thickness * (cab.type === "base" || cab.type === "island" ? 1 : 2);
    parts.push({
      name: `Lateral ${cabName}`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 2,
      length: cabH * 10,
      width: d * 10,
      thickness: thickness * 10,
      material: cab.structureColor || state.structureColor,
      edgeL1: true,
      edgeL2: false,
      edgeW1: true,
      edgeW2: true,
      notes: "Laterales del gabinete"
    });
    parts.push({
      name: `Piso ${cabName}`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 1,
      length: innerW * 10,
      width: d * 10,
      thickness: thickness * 10,
      material: cab.structureColor || state.structureColor,
      edgeL1: true,
      edgeL2: false,
      edgeW1: false,
      edgeW2: false,
      notes: "Piso del gabinete"
    });
    if (cab.type === "base" || cab.type === "island") {
      parts.push({
        name: `Barra Frontal ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: innerW * 10,
        width: 10 * 10,
        // 10 cm width
        thickness: thickness * 10,
        material: cab.structureColor || state.structureColor,
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false
      });
      parts.push({
        name: `Barra Trasera ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: innerW * 10,
        width: 10 * 10,
        // 10 cm width
        thickness: thickness * 10,
        material: cab.structureColor || state.structureColor,
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false
      });
    } else {
      parts.push({
        name: `Techo ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: innerW * 10,
        width: d * 10,
        thickness: thickness * 10,
        material: cab.structureColor || state.structureColor,
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false,
        notes: "Techo del gabinete"
      });
    }
    parts.push({
      name: `Fondo Traseara ${cabName}`,
      moduleId: cab.id,
      moduleIndex: index,
      qty: 1,
      length: innerW * 10,
      width: innerH * 10,
      thickness: thickness * 10,
      material: cab.backColor || state.structureColor,
      edgeL1: false,
      edgeL2: false,
      edgeW1: false,
      edgeW2: false
    });
    if (cab.variant === "2_doors" || cab.variant === "1_door") {
      parts.push({
        name: `Repisa ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: (innerW - 0.2) * 10,
        width: (d - 5) * 10,
        thickness: thickness * 10,
        material: cab.shelfColor || state.structureColor,
        edgeL1: true,
        edgeL2: false,
        edgeW1: false,
        edgeW2: false
      });
    }
    const gap = 0.3;
    const frontMat = cab.doorColor || state.doorColor;
    if (cab.variant === "1_door" || cab.variant === "spice_rack") {
      parts.push({
        name: `Puerta Frontal ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 1,
        length: (cabH - gap * 2) * 10,
        width: (w - gap * 2) * 10,
        thickness: thickness * 10,
        material: frontMat,
        edgeL1: true,
        edgeL2: true,
        edgeW1: true,
        edgeW2: true
      });
    } else if (cab.variant === "2_doors") {
      parts.push({
        name: `Puerta Frontal ${cabName}`,
        moduleId: cab.id,
        moduleIndex: index,
        qty: 2,
        length: (cabH - gap * 2) * 10,
        width: (w - gap * 3) / 2 * 10,
        thickness: thickness * 10,
        material: frontMat,
        edgeL1: true,
        edgeL2: true,
        edgeW1: true,
        edgeW2: true
      });
    } else if (cab.variant === "4_drawers" || cab.variant === "2_pot_drawers" || cab.variant === "1_door_1_drawer") {
      let drawCount = 0;
      let drawerHeights = [];
      if (cab.variant === "4_drawers") {
        drawCount = 4;
        drawerHeights = [(cabH - gap * 5) / 4, (cabH - gap * 5) / 4, (cabH - gap * 5) / 4, (cabH - gap * 5) / 4];
      }
      if (cab.variant === "2_pot_drawers") {
        drawCount = 2;
        drawerHeights = [(cabH - gap * 3) / 2, (cabH - gap * 3) / 2];
      }
      if (cab.variant === "1_door_1_drawer") {
        drawCount = 1;
        drawerHeights = [18];
      }
      drawerHeights.forEach((dh, i) => {
        parts.push({
          name: `Frente Caj\xF3n ${i + 1} ${cabName}`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 1,
          length: dh * 10,
          width: (w - gap * 2) * 10,
          thickness: thickness * 10,
          material: cab.drawerFrontColor || frontMat,
          edgeL1: true,
          edgeL2: true,
          edgeW1: true,
          edgeW2: true
        });
      });
      if (cab.variant === "1_door_1_drawer") {
        const doorH = cabH - gap * 3 - 18;
        parts.push({
          name: `Puerta Frontal ${cabName}`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 1,
          length: doorH * 10,
          width: (w - gap * 2) * 10,
          thickness: thickness * 10,
          material: frontMat,
          edgeL1: true,
          edgeL2: true,
          edgeW1: true,
          edgeW2: true
        });
      }
      const sideH = 12;
      const slideLen = getNominalSlideLength(d - 5);
      const skw = innerW - 4.9;
      const cInnerMat = cab.drawerInnerColor || state.structureColor;
      for (let i = 0; i < drawCount; i++) {
        parts.push({
          name: `Caj\xF3n Lateral ${cabName} (${i + 1})`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 2,
          length: slideLen * 10,
          width: sideH * 10,
          thickness: thickness * 10,
          material: cInnerMat,
          edgeL1: true,
          edgeL2: false,
          edgeW1: true,
          edgeW2: true
        });
        parts.push({
          name: `Caj\xF3n F/T ${cabName} (${i + 1})`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 2,
          length: skw * 10,
          width: (sideH - 1.2) * 10,
          thickness: thickness * 10,
          material: cInnerMat,
          edgeL1: true,
          edgeL2: false,
          edgeW1: false,
          edgeW2: false
        });
        parts.push({
          name: `Caj\xF3n Piso ${cabName} (${i + 1})`,
          moduleId: cab.id,
          moduleIndex: index,
          qty: 1,
          length: slideLen * 10,
          width: skw * 10,
          thickness: 3,
          material: "#dddddd",
          edgeL1: false,
          edgeL2: false,
          edgeW1: false,
          edgeW2: false
        });
      }
    }
  });
  return parts;
}
function generateKitchenHardwareList(cabinets) {
  const hardware = [];
  const state = useStore.getState();
  const kState = useKitchenStore.getState();
  let totalHinges = 0;
  let totalDrawerSlides = 0;
  let totalScrews = 0;
  let totalBaseWidth = 0;
  cabinets.forEach((cab) => {
    totalScrews += 20;
    if (cab.variant === "1_door" || cab.variant === "spice_rack" || cab.variant === "1_door_1_drawer") {
      totalHinges += 2;
    } else if (cab.variant === "2_doors") {
      totalHinges += 4;
    }
    if (cab.variant === "4_drawers") totalDrawerSlides += 4;
    if (cab.variant === "2_pot_drawers") totalDrawerSlides += 2;
    if (cab.variant === "1_door_1_drawer") totalDrawerSlides += 1;
    if (cab.type === "base" || cab.type === "island" || cab.type === "tall") {
      totalBaseWidth += cab.width;
    }
  });
  hardware.push({ Item: "Tornillos Spax 4x50", Cantidad: totalScrews, "Unidad": "un" });
  if (totalHinges > 0) hardware.push({ Item: "Bisagras Rectas Cierre Suave", Cantidad: totalHinges, "Unidad": "un" });
  if (totalDrawerSlides > 0) hardware.push({ Item: `Correderas Ocultas ${state.drawerHardware}`, Cantidad: totalDrawerSlides, "Unidad": "par" });
  if (cabinets.filter((c) => c.type === "base" || c.type === "island" || c.type === "tall").length > 0) {
    hardware.push({ Item: "Patas Regulables 10cm", Cantidad: cabinets.filter((c) => c.type === "base" || c.type === "island" || c.type === "tall").length * 4, "Unidad": "un" });
  }
  if (kState.showSocle && totalBaseWidth > 0) {
    const totalBaseWidthMm = totalBaseWidth * 10;
    const socleStrips = Math.ceil(totalBaseWidthMm / 3e3);
    hardware.push({ Item: "Z\xF3calo de PVC/Aluminio (Tira 3m)", Cantidad: socleStrips, "Unidad": "un" });
    const straightJoints = Math.max(0, socleStrips - 1);
    if (straightJoints > 0) {
      hardware.push({ Item: "Uni\xF3n Recta para Z\xF3calo", Cantidad: straightJoints, "Unidad": "un" });
    }
    let hasCorner = false;
    let firstRot = null;
    cabinets.filter((c) => c.type === "base" || c.type === "island").forEach((c) => {
      if (firstRot === null) firstRot = c.rotation;
      else if (firstRot !== c.rotation) hasCorner = true;
    });
    const cornerJoints = hasCorner ? 2 : 0;
    if (cornerJoints > 0) {
      hardware.push({ Item: "Escuadra 90\xB0 para Z\xF3calo", Cantidad: cornerJoints, "Unidad": "un" });
    } else if (cabinets.length > 2) {
      hardware.push({ Item: "Escuadra 90\xB0 para Z\xF3calo", Cantidad: 1, "Unidad": "un" });
    }
  }
  return hardware;
}

// test_run.ts
global.localStorage = { length: 0, getItem: () => null, setItem: () => {
}, removeItem: () => {
}, clear: () => {
}, key: () => null };
try {
  const kState = useKitchenStore.getState();
  kState.cabinets.push({
    id: "test",
    type: "base",
    variant: "2_doors",
    width: 60,
    height: 90,
    depth: 60,
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    showSocle: true
  });
  console.log("Cabinets:", kState.cabinets.length);
  const parts = generateKitchenPartsList(kState.cabinets);
  console.log("Parts:", parts.length);
  const hardware = generateKitchenHardwareList(kState.cabinets);
  console.log("Hardware:", hardware.length);
} catch (e) {
  console.error("ERROR CAUGHT:", e);
}
