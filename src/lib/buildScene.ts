/**
 * Stage-1 Geometry Builder - Multi-Stand-Type Architecture
 * Builds authoritative 3D geometry that Stage-2 must preserve
 * Supports: Tabletop, Floor, Wall Mount, Corner, Rotating, Multi-tier stands
 */

import * as THREE from "three";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Spec } from "./spec";
import { FormData, StandType } from "../types";

export interface StandSpec extends Spec {
  standType: StandType;
  shelfCount: number;
  formData: Partial<FormData>;
}

/**
 * Main entry point - Stand Type Factory
 * Routes to appropriate builder based on stand type
 */
export function buildStandGroup(spec: Spec, formData?: Partial<FormData>): THREE.Group {
  const standType = formData?.standType || 'Tabletop Stand';
  const shelfCount = formData?.shelfCount || 1;

  const standSpec: StandSpec = {
    ...spec,
    standType,
    shelfCount,
    formData: formData || {}
  };

  console.log(`🏗️ Building ${standType} with ${shelfCount} shelf(s)`);

  switch (standType) {
    case 'Tabletop Stand':
      return buildTabletopStand(standSpec);
    case 'Floor Stand':
      return buildFloorStand(standSpec);
    case 'Wall Mount Stand':
      return buildWallMountStand(standSpec);
    case 'Corner Stand':
      return buildCornerStand(standSpec);
    case 'Rotating Stand':
      return buildRotatingStand(standSpec);
    case 'Multi-tier Stand':
      return buildMultiTierStand(standSpec);
    default:
      console.warn(`⚠️ Unknown stand type: ${standType}, falling back to Tabletop`);
      return buildTabletopStand(standSpec);
  }
}

/**
 * TABLETOP STAND BUILDER - Enhanced Multi-Shelf Support
 */
function buildTabletopStand(standSpec: StandSpec): THREE.Group {
  const group = new THREE.Group();
  group.name = "TabletopStand";

  const { W, D, H, shelfThick } = standSpec.stand;
  const { shelfCount } = standSpec;
  const product = standSpec.product;

  // Create procedural textures for realistic appearance
  const textureLoader = new THREE.TextureLoader();

  // Procedural normal map for stand (subtle surface detail)
  const standNormalTexture = new THREE.DataTexture(
    createNormalMapData(64, 64, 0.1),
    64, 64, THREE.RGBFormat
  );
  standNormalTexture.needsUpdate = true;

  // Procedural roughness for shelf (slightly varied surface)
  const shelfRoughnessTexture = new THREE.DataTexture(
    createRoughnessMapData(32, 32, 0.3, 0.6),
    32, 32, THREE.RedFormat
  );
  shelfRoughnessTexture.needsUpdate = true;

  // Enhanced PBR Materials with realistic properties and textures
  const standMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4a90e2, // Blue for stand structure
    roughness: 0.3, // Smooth plastic/metal finish
    metalness: 0.1, // Slightly metallic
    clearcoat: 0.8, // Glossy protective coating
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    normalMap: standNormalTexture,
    normalScale: new THREE.Vector2(0.3, 0.3),
    name: "StandMaterial"
  });

  const shelfMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x7ed321, // Green for shelf/tray surface
    roughness: 0.4, // Slightly textured surface
    metalness: 0.0, // Non-metallic
    clearcoat: 0.5, // Moderate coating
    clearcoatRoughness: 0.2,
    reflectivity: 0.7,
    roughnessMap: shelfRoughnessTexture,
    name: "ShelfMaterial"
  });

  const productMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf5a623, // Orange for products
    roughness: 0.6, // Cardboard/package texture
    metalness: 0.0, // Non-metallic packaging
    clearcoat: 0.2, // Minimal coating
    clearcoatRoughness: 0.3,
    reflectivity: 0.5,
    name: "ProductMaterial"
  });

  // BASE PLATFORM (with rounded edges)
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(W, shelfThick, D, 4, 0.2),
    standMaterial
  );
  base.position.set(0, shelfThick / 2, 0);
  base.name = "Base";
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // SIDE WALLS
  const wallThickness = 0.5; // 5mm walls

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, H, D),
    standMaterial
  );
  leftWall.position.set(-W/2 + wallThickness/2, H/2, 0);
  leftWall.name = "LeftWall";
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, H, D),
    standMaterial
  );
  rightWall.position.set(W/2 - wallThickness/2, H/2, 0);
  rightWall.name = "RightWall";
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // BACK WALL
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, wallThickness),
    standMaterial
  );
  backWall.position.set(0, H/2, -D/2 + wallThickness/2);
  backWall.name = "BackWall";
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  // MULTI-SHELF SYSTEM with 2D Grid Layout (frontFaceCount × backToBackCount)
  const availableHeight = H - shelfThick; // Total height minus base
  const shelfSpacing = availableHeight / shelfCount; // Equal spacing

  // Calculate 2D grid layout - EACH SHELF gets the full grid
  const frontFaceCount = standSpec.layout.columns; // Width (front-facing rows)
  const backToBackCount = standSpec.layout.depthCount; // Depth (back-to-back columns)
  const productsPerShelf = frontFaceCount * backToBackCount; // Each shelf gets full grid
  const totalProducts = productsPerShelf * shelfCount; // Total across all shelves

  console.log(`📐 Tabletop Stand: ${frontFaceCount}×${backToBackCount} grid per shelf × ${shelfCount} shelves = ${totalProducts} total products`);
  console.log(`📐 Multi-shelf: ${shelfCount} shelves, ${productsPerShelf} products per shelf, ${shelfSpacing.toFixed(1)}cm spacing`);

  const shelvesGroup = new THREE.Group();
  shelvesGroup.name = "Shelves";

  const productsGroup = new THREE.Group();
  productsGroup.name = "Products";

  let globalProductIndex = 0;

  for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex++) {
    // Calculate shelf height (starting from base + spacing)
    const shelfHeight = shelfThick + (shelfIndex + 1) * shelfSpacing;

    // Create shelf
    const shelf = new THREE.Mesh(
      new RoundedBoxGeometry(W - wallThickness, shelfThick, D - wallThickness, 4, 0.15),
      shelfMaterial
    );
    shelf.position.set(0, shelfHeight, 0);
    shelf.name = `Shelf_${shelfIndex + 1}`;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    shelvesGroup.add(shelf);

    // Each shelf gets the FULL 2D grid layout (6×5=30 products per shelf)
    for (let row = 0; row < frontFaceCount; row++) {
      for (let col = 0; col < backToBackCount; col++) {
        const pack = new THREE.Mesh(
          new RoundedBoxGeometry(product.W, product.H, product.D, 4, 0.1),
          productMaterial
        );

        // Calculate 2D grid positions
        // X-axis: spread products across width (frontFaceCount)
        const totalWidth = (frontFaceCount - 1) * product.W;
        const xStart = -totalWidth / 2;
        const xPosition = xStart + (row * product.W);

        // Z-axis: place products depth-wise (backToBackCount)
        const frontEdge = D/2 - product.D/2;
        const depthOffset = col * (product.D + standSpec.layout.gapsDepth);
        const zPosition = frontEdge - depthOffset;

        pack.position.set(
          xPosition, // 2D grid X position
          shelfHeight + shelfThick/2 + product.H/2, // On shelf surface
          zPosition // 2D grid Z position (depth)
        );

        pack.name = `Product_R${row + 1}C${col + 1}_Shelf${shelfIndex + 1}`;
        pack.castShadow = true;
        pack.receiveShadow = true;
        productsGroup.add(pack);

        globalProductIndex++;
      }
    }
  }

  group.add(shelvesGroup);
  group.add(productsGroup);

  // Add metadata for validation
  group.userData = {
    spec: standSpec,
    measurements: {
      standDimensions: { W, D, H },
      productDimensions: { W: product.W, H: product.H, D: product.D },
      layout: standSpec.layout,
      totalProducts: totalProducts,
      frontFaceCount: frontFaceCount,
      backToBackCount: backToBackCount,
      shelfCount: shelfCount,
      standType: standSpec.standType
    },
    generated: new Date().toISOString()
  };

  return group;
}

/**
 * FLOOR STAND BUILDER - Tall stands with enhanced stability
 */
function buildFloorStand(standSpec: StandSpec): THREE.Group {
  const group = new THREE.Group();
  group.name = "FloorStand";

  const { W, D, H, shelfThick } = standSpec.stand;
  const { shelfCount } = standSpec;
  const product = standSpec.product;

  console.log(`🏗️ Building floor stand: ${W}×${D}×${H}cm with ${shelfCount} shelves`);

  // Create materials (same as tabletop but with enhanced structural appearance)
  const { standMaterial, shelfMaterial, productMaterial } = createStandMaterials();

  // Enhanced base for floor stands - larger and more stable
  const baseHeight = Math.max(shelfThick * 2, 4); // Thicker base for stability
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(W + 2, baseHeight, D + 2, 4, 0.3), // Slightly larger base
    standMaterial
  );
  base.position.set(0, baseHeight / 2, 0);
  base.name = "FloorBase";
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Vertical support pillars for structural integrity
  const pillarWidth = 3; // 3cm pillars
  const pillarPositions = [
    [-W/2 + pillarWidth/2, 0, -D/2 + pillarWidth/2], // Back left
    [W/2 - pillarWidth/2, 0, -D/2 + pillarWidth/2],  // Back right
    [-W/2 + pillarWidth/2, 0, D/2 - pillarWidth/2],  // Front left
    [W/2 - pillarWidth/2, 0, D/2 - pillarWidth/2]    // Front right
  ];

  pillarPositions.forEach((pos, index) => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(pillarWidth, H, pillarWidth),
      standMaterial
    );
    pillar.position.set(pos[0], H/2 + baseHeight, pos[2]);
    pillar.name = `Pillar_${index + 1}`;
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    group.add(pillar);
  });

  // Optional back panel for larger floor stands
  if (H > 60) { // Add back panel for tall stands
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(W - pillarWidth, H * 0.8, 1),
      standMaterial
    );
    backPanel.position.set(0, H/2 + baseHeight, -D/2 + 0.5);
    backPanel.name = "BackPanel";
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    group.add(backPanel);
  }

  // Multi-shelf system optimized for floor stands with 2D Grid Layout
  const availableHeight = H - baseHeight;
  const shelfSpacing = availableHeight / (shelfCount + 1); // Extra space at top

  // Calculate 2D grid layout - EACH SHELF gets the full grid
  const frontFaceCount = standSpec.layout.columns; // Width (front-facing rows)
  const backToBackCount = standSpec.layout.depthCount; // Depth (back-to-back columns)
  const productsPerShelf = frontFaceCount * backToBackCount; // Each shelf gets full grid
  const totalProducts = productsPerShelf * shelfCount; // Total across all shelves

  console.log(`📐 Floor Stand: ${frontFaceCount}×${backToBackCount} grid per shelf × ${shelfCount} shelves = ${totalProducts} total products`);

  const shelvesGroup = new THREE.Group();
  shelvesGroup.name = "FloorShelves";

  const productsGroup = new THREE.Group();
  productsGroup.name = "FloorProducts";

  let globalProductIndex = 0;

  for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex++) {
    const shelfHeight = baseHeight + (shelfIndex + 1) * shelfSpacing;

    // Create shelf with better support for floor stands
    const shelf = new THREE.Mesh(
      new RoundedBoxGeometry(W - pillarWidth, shelfThick, D - pillarWidth, 4, 0.15),
      shelfMaterial
    );
    shelf.position.set(0, shelfHeight, 0);
    shelf.name = `FloorShelf_${shelfIndex + 1}`;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    shelvesGroup.add(shelf);

    // Add shelf support brackets
    if (W > 30 || D > 40) { // Add supports for larger shelves
      const supportPositions = [
        [-W/4, shelfHeight - shelfThick/2, 0],
        [W/4, shelfHeight - shelfThick/2, 0]
      ];

      supportPositions.forEach((pos, supportIndex) => {
        const support = new THREE.Mesh(
          new THREE.BoxGeometry(2, shelfThick, D - pillarWidth - 2),
          standMaterial
        );
        support.position.set(pos[0], pos[1], pos[2]);
        support.name = `Support_Shelf${shelfIndex + 1}_${supportIndex + 1}`;
        support.castShadow = true;
        support.receiveShadow = true;
        shelvesGroup.add(support);
      });
    }

    // Each shelf gets the FULL 2D grid layout (6×5=30 products per shelf)
    for (let row = 0; row < frontFaceCount; row++) {
      for (let col = 0; col < backToBackCount; col++) {
        const pack = new THREE.Mesh(
          new RoundedBoxGeometry(product.W, product.H, product.D, 4, 0.1),
          productMaterial
        );

        // Calculate 2D grid positions for floor stand
        // X-axis: spread products across width (frontFaceCount)
        const totalWidth = (frontFaceCount - 1) * product.W;
        const xStart = -totalWidth / 2;
        const xPosition = xStart + (row * product.W);

        // Z-axis: place products depth-wise (backToBackCount), accounting for pillars
        const frontEdge = D/2 - product.D/2 - pillarWidth/2;
        const depthOffset = col * (product.D + standSpec.layout.gapsDepth);
        const zPosition = frontEdge - depthOffset;

        pack.position.set(
          xPosition, // 2D grid X position
          shelfHeight + shelfThick/2 + product.H/2, // On shelf surface
          zPosition // 2D grid Z position (depth), accounting for pillars
        );

        pack.name = `FloorProduct_R${row + 1}C${col + 1}_Shelf${shelfIndex + 1}`;
        pack.castShadow = true;
        pack.receiveShadow = true;
        productsGroup.add(pack);

        globalProductIndex++;
      }
    }
  }

  group.add(shelvesGroup);
  group.add(productsGroup);

  // Enhanced metadata for floor stands
  group.userData = {
    spec: standSpec,
    measurements: {
      standDimensions: { W, D, H },
      productDimensions: { W: product.W, H: product.H, D: product.D },
      layout: standSpec.layout,
      totalProducts: totalProducts,
      frontFaceCount: frontFaceCount,
      backToBackCount: backToBackCount,
      shelfCount: shelfCount,
      standType: standSpec.standType,
      baseHeight: baseHeight,
      pillarSupport: pillarPositions.length
    },
    generated: new Date().toISOString()
  };

  return group;
}

/**
 * WALL MOUNT STAND BUILDER - Space-efficient wall mounting
 */
function buildWallMountStand(standSpec: StandSpec): THREE.Group {
  const group = new THREE.Group();
  group.name = "WallMountStand";

  const { W, D, H, shelfThick } = standSpec.stand;
  const { shelfCount } = standSpec;
  const product = standSpec.product;

  console.log(`🔧 Building wall mount stand: ${W}×${D}×${H}cm with ${shelfCount} shelves`);

  const { standMaterial, shelfMaterial, productMaterial } = createStandMaterials();

  // Wall mounting bracket system
  const backPlate = new THREE.Mesh(
    new THREE.BoxGeometry(W, H, 1),
    standMaterial
  );
  backPlate.position.set(0, H/2, -D/2 - 0.5);
  backPlate.name = "WallBackPlate";
  backPlate.castShadow = true;
  backPlate.receiveShadow = true;
  group.add(backPlate);

  // Mounting brackets (visual representation)
  const bracketSize = Math.min(W/8, 4);
  const bracketPositions = [
    [-W/3, H * 0.8, -D/2 - 0.5],
    [W/3, H * 0.8, -D/2 - 0.5],
    [-W/3, H * 0.2, -D/2 - 0.5],
    [W/3, H * 0.2, -D/2 - 0.5]
  ];

  bracketPositions.forEach((pos, index) => {
    const bracket = new THREE.Mesh(
      new THREE.CylinderGeometry(bracketSize/2, bracketSize/2, 0.5),
      standMaterial
    );
    bracket.position.set(pos[0], pos[1], pos[2]);
    bracket.rotation.x = Math.PI / 2;
    bracket.name = `MountBracket_${index + 1}`;
    bracket.castShadow = true;
    bracket.receiveShadow = true;
    group.add(bracket);
  });

  // Shelf system for wall mounts (cantilevered design) with 2D Grid Layout
  const shelfSpacing = H / (shelfCount + 1);

  // Calculate 2D grid layout - EACH SHELF gets the full grid
  const frontFaceCount = standSpec.layout.columns; // Width (front-facing rows)
  const backToBackCount = standSpec.layout.depthCount; // Depth (back-to-back columns)
  const productsPerShelf = frontFaceCount * backToBackCount; // Each shelf gets full grid
  const totalProducts = productsPerShelf * shelfCount; // Total across all shelves

  console.log(`📐 Wall Mount Stand: ${frontFaceCount}×${backToBackCount} grid per shelf × ${shelfCount} shelves = ${totalProducts} total products`);

  const shelvesGroup = new THREE.Group();
  shelvesGroup.name = "WallShelves";

  const productsGroup = new THREE.Group();
  productsGroup.name = "WallProducts";

  let globalProductIndex = 0;

  for (let shelfIndex = 0; shelfIndex < shelfCount; shelfIndex++) {
    const shelfHeight = (shelfIndex + 1) * shelfSpacing;

    // Wall-mounted shelf with support arms
    const shelf = new THREE.Mesh(
      new RoundedBoxGeometry(W * 0.9, shelfThick, D, 4, 0.15),
      shelfMaterial
    );
    shelf.position.set(0, shelfHeight, 0);
    shelf.name = `WallShelf_${shelfIndex + 1}`;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    shelvesGroup.add(shelf);

    // Support arms connecting shelf to back plate
    const armPositions = [-W/3, W/3];
    armPositions.forEach((xPos, armIndex) => {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, D + 1),
        standMaterial
      );
      arm.position.set(xPos, shelfHeight - shelfThick/2, -0.5);
      arm.name = `SupportArm_Shelf${shelfIndex + 1}_${armIndex + 1}`;
      arm.castShadow = true;
      arm.receiveShadow = true;
      shelvesGroup.add(arm);
    });

    // Each shelf gets the FULL 2D grid layout (6×5=30 products per shelf)
    for (let row = 0; row < frontFaceCount; row++) {
      for (let col = 0; col < backToBackCount; col++) {
        const pack = new THREE.Mesh(
          new RoundedBoxGeometry(product.W, product.H, product.D, 4, 0.1),
          productMaterial
        );

        // Calculate 2D grid positions for wall mount
        // X-axis: spread products across width (frontFaceCount)
        const totalWidth = (frontFaceCount - 1) * product.W;
        const xStart = -totalWidth / 2;
        const xPosition = xStart + (row * product.W);

        // Z-axis: place products depth-wise (backToBackCount)
        const frontEdge = D/2 - product.D/2;
        const depthOffset = col * (product.D + standSpec.layout.gapsDepth);
        const zPosition = frontEdge - depthOffset;

        pack.position.set(
          xPosition, // 2D grid X position
          shelfHeight + shelfThick/2 + product.H/2, // On shelf surface
          zPosition // 2D grid Z position (depth)
        );

        pack.name = `WallProduct_R${row + 1}C${col + 1}_Shelf${shelfIndex + 1}`;
        pack.castShadow = true;
        pack.receiveShadow = true;
        productsGroup.add(pack);

        globalProductIndex++;
      }
    }
  }

  group.add(shelvesGroup);
  group.add(productsGroup);

  group.userData = {
    spec: standSpec,
    measurements: {
      standDimensions: { W, D, H },
      productDimensions: { W: product.W, H: product.H, D: product.D },
      layout: standSpec.layout,
      totalProducts: totalProducts,
      frontFaceCount: frontFaceCount,
      backToBackCount: backToBackCount,
      shelfCount: shelfCount,
      standType: standSpec.standType,
      mountingPoints: bracketPositions.length
    },
    generated: new Date().toISOString()
  };

  return group;
}

/**
 * CORNER STAND BUILDER - Space-efficient corner fitting
 */
function buildCornerStand(standSpec: StandSpec): THREE.Group {
  // For now, use angled tabletop design - can be enhanced later
  const group = buildTabletopStand(standSpec);
  group.name = "CornerStand";

  // Rotate 45 degrees for corner placement
  group.rotation.y = Math.PI / 4;

  return group;
}

/**
 * ROTATING STAND BUILDER - Rotating display mechanism
 */
function buildRotatingStand(standSpec: StandSpec): THREE.Group {
  const baseStand = buildTabletopStand(standSpec);
  baseStand.name = "RotatingStand";

  // Add rotation base mechanism (visual representation)
  const { W, D } = standSpec.stand;
  const { standMaterial } = createStandMaterials();

  const rotationBase = new THREE.Mesh(
    new THREE.CylinderGeometry(Math.max(W, D)/2 + 2, Math.max(W, D)/2 + 2, 2),
    standMaterial
  );
  rotationBase.position.set(0, -1, 0);
  rotationBase.name = "RotationBase";
  rotationBase.castShadow = true;
  rotationBase.receiveShadow = true;
  baseStand.add(rotationBase);

  return baseStand;
}

/**
 * MULTI-TIER STAND BUILDER - Tiered pyramid-like structure
 */
function buildMultiTierStand(standSpec: StandSpec): THREE.Group {
  const group = new THREE.Group();
  group.name = "MultiTierStand";

  const { W, D, H, shelfThick } = standSpec.stand;
  const { shelfCount } = standSpec;
  const product = standSpec.product;

  console.log(`🎪 Building multi-tier stand: ${shelfCount} tiers`);

  const { standMaterial, shelfMaterial, productMaterial } = createStandMaterials();

  // Create tiered structure with 2D Grid Layout - each tier slightly smaller than the last
  const tierHeight = H / shelfCount;

  // Calculate 2D grid layout - EACH TIER gets a scaled version of the full grid
  const frontFaceCount = standSpec.layout.columns; // Width (front-facing rows)
  const backToBackCount = standSpec.layout.depthCount; // Depth (back-to-back columns)
  const baseProductsPerTier = frontFaceCount * backToBackCount; // Base products per tier
  let totalProducts = 0;

  let globalProductIndex = 0;

  for (let tierIndex = 0; tierIndex < shelfCount; tierIndex++) {
    // Calculate tier dimensions (shrinking towards top)
    const tierScale = 1 - (tierIndex * 0.15); // Each tier 15% smaller
    const tierW = W * tierScale;
    const tierD = D * tierScale;
    const tierY = tierIndex * tierHeight;

    // Scale the grid for this tier (smaller tiers get fewer products)
    const tierFrontFaceCount = Math.max(1, Math.floor(frontFaceCount * tierScale));
    const tierBackToBackCount = Math.max(1, Math.floor(backToBackCount * tierScale));
    const productsOnThisTier = tierFrontFaceCount * tierBackToBackCount;
    totalProducts += productsOnThisTier;

    console.log(`🎪 Tier ${tierIndex + 1}: ${tierFrontFaceCount}×${tierBackToBackCount} grid = ${productsOnThisTier} products (scale: ${tierScale.toFixed(2)})`);

    // Create tier base
    const tierBase = new THREE.Mesh(
      new RoundedBoxGeometry(tierW, shelfThick, tierD, 4, 0.2),
      shelfMaterial
    );
    tierBase.position.set(0, tierY + shelfThick/2, 0);
    tierBase.name = `Tier_${tierIndex + 1}_Base`;
    tierBase.castShadow = true;
    tierBase.receiveShadow = true;
    group.add(tierBase);

    // Each tier gets a scaled 2D grid layout
    for (let row = 0; row < tierFrontFaceCount; row++) {
      for (let col = 0; col < tierBackToBackCount; col++) {
        const pack = new THREE.Mesh(
          new RoundedBoxGeometry(product.W, product.H, product.D, 4, 0.1),
          productMaterial
        );

        // Calculate 2D grid positions for this tier
        // X-axis: spread products across tier width
        const totalWidth = (tierFrontFaceCount - 1) * product.W;
        const xStart = -totalWidth / 2;
        const xPosition = xStart + (row * product.W);

        // Z-axis: place products depth-wise within tier
        const frontEdge = tierD/2 - product.D/2;
        const depthOffset = col * (product.D + standSpec.layout.gapsDepth);
        const zPosition = frontEdge - depthOffset;

        pack.position.set(
          xPosition, // 2D grid X position
          tierY + shelfThick + product.H/2, // On tier surface
          zPosition // 2D grid Z position (depth)
        );

        pack.name = `TierProduct_R${row + 1}C${col + 1}_Tier${tierIndex + 1}`;
        pack.castShadow = true;
        pack.receiveShadow = true;
        group.add(pack);

        globalProductIndex++;
      }
    }
  }

  console.log(`🎪 Multi-tier Stand Total: ${totalProducts} products across ${shelfCount} tiers`);

  group.userData = {
    spec: standSpec,
    measurements: {
      standDimensions: { W, D, H },
      productDimensions: { W: product.W, H: product.H, D: product.D },
      layout: standSpec.layout,
      totalProducts: totalProducts,
      frontFaceCount: frontFaceCount,
      backToBackCount: backToBackCount,
      shelfCount: shelfCount,
      standType: standSpec.standType,
      tierCount: shelfCount
    },
    generated: new Date().toISOString()
  };

  return group;
}

/**
 * SHARED MATERIALS FACTORY
 */
function createStandMaterials() {
  // Procedural normal map for stand (subtle surface detail)
  const standNormalTexture = new THREE.DataTexture(
    createNormalMapData(64, 64, 0.1),
    64, 64, THREE.RGBFormat
  );
  standNormalTexture.needsUpdate = true;

  // Procedural roughness for shelf (slightly varied surface)
  const shelfRoughnessTexture = new THREE.DataTexture(
    createRoughnessMapData(32, 32, 0.3, 0.6),
    32, 32, THREE.RedFormat
  );
  shelfRoughnessTexture.needsUpdate = true;

  const standMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4a90e2, // Blue for stand structure
    roughness: 0.3,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    normalMap: standNormalTexture,
    normalScale: new THREE.Vector2(0.3, 0.3),
    name: "StandMaterial"
  });

  const shelfMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x7ed321, // Green for shelf/tray surface
    roughness: 0.4,
    metalness: 0.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    reflectivity: 0.7,
    roughnessMap: shelfRoughnessTexture,
    name: "ShelfMaterial"
  });

  const productMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf5a623, // Orange for products
    roughness: 0.6,
    metalness: 0.0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.3,
    reflectivity: 0.5,
    name: "ProductMaterial"
  });

  return { standMaterial, shelfMaterial, productMaterial };
}

/**
 * Create dimension line between two points
 */
export function createDimensionLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  label: string,
  offset: number = 2
): THREE.Group {
  const dimGroup = new THREE.Group();
  dimGroup.name = `Dimension_${label}`;

  // Main line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x555555,
    linewidth: 2
  });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  dimGroup.add(line);

  // Extension lines (small perpendicular lines at ends)
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(0.5);

  // Start extension
  const startExt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      start.clone().add(perpendicular),
      start.clone().sub(perpendicular)
    ]),
    lineMaterial
  );
  dimGroup.add(startExt);

  // End extension
  const endExt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      end.clone().add(perpendicular),
      end.clone().sub(perpendicular)
    ]),
    lineMaterial
  );
  dimGroup.add(endExt);

  // Label position (midpoint + offset)
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const labelPos = midpoint.add(new THREE.Vector3(0, offset, 0));

  // Text sprite (simplified - will be replaced with proper text in component)
  dimGroup.userData = {
    labelText: label,
    labelPosition: labelPos,
    start: start,
    end: end
  };

  return dimGroup;
}

/**
 * Add standard dimension lines to a stand group
 */
export function addStandardDimensions(standGroup: THREE.Group, spec: Spec): void {
  const { W, D, H } = spec.stand;
  const dimensionsGroup = new THREE.Group();
  dimensionsGroup.name = "Dimensions";

  // Width dimension (front, above stand)
  const widthDim = createDimensionLine(
    new THREE.Vector3(-W/2, H + 3, D/2 + 1),
    new THREE.Vector3(W/2, H + 3, D/2 + 1),
    `${W} cm`
  );
  dimensionsGroup.add(widthDim);

  // Depth dimension (right side)
  const depthDim = createDimensionLine(
    new THREE.Vector3(W/2 + 3, H + 1, -D/2),
    new THREE.Vector3(W/2 + 3, H + 1, D/2),
    `${D} cm`
  );
  dimensionsGroup.add(depthDim);

  // Height dimension (left side)
  const heightDim = createDimensionLine(
    new THREE.Vector3(-W/2 - 3, 0, -D/2 - 1),
    new THREE.Vector3(-W/2 - 3, H, -D/2 - 1),
    `${H} cm`
  );
  dimensionsGroup.add(heightDim);

  standGroup.add(dimensionsGroup);
}

/**
 * Validate built geometry matches spec
 */
export function validateBuiltGeometry(group: THREE.Group, spec: Spec): boolean {
  const metadata = group.userData;
  if (!metadata || !metadata.spec) return false;

  const builtSpec = metadata.spec;
  return (
    builtSpec.stand.W === spec.stand.W &&
    builtSpec.stand.D === spec.stand.D &&
    builtSpec.stand.H === spec.stand.H &&
    builtSpec.layout.depthCount === spec.layout.depthCount
  );
}

/**
 * Create procedural normal map data for surface detail
 */
function createNormalMapData(width: number, height: number, intensity: number): Uint8Array {
  const size = width * height;
  const data = new Uint8Array(3 * size);

  for (let i = 0; i < size; i++) {
    const stride = i * 3;

    // Generate subtle surface variations
    const noise = (Math.random() - 0.5) * intensity;

    // Normal vector (slight perturbation from straight up)
    const x = noise;
    const y = noise * 0.5;
    const z = 1.0;

    // Normalize and convert to 0-255 range
    const length = Math.sqrt(x * x + y * y + z * z);
    data[stride] = Math.floor(((x / length) * 0.5 + 0.5) * 255);
    data[stride + 1] = Math.floor(((y / length) * 0.5 + 0.5) * 255);
    data[stride + 2] = Math.floor(((z / length) * 0.5 + 0.5) * 255);
  }

  return data;
}

/**
 * Create procedural roughness map data for varied surface roughness
 */
function createRoughnessMapData(width: number, height: number, minRoughness: number, maxRoughness: number): Uint8Array {
  const size = width * height;
  const data = new Uint8Array(size);

  for (let i = 0; i < size; i++) {
    const noise = Math.random();
    const roughness = minRoughness + (maxRoughness - minRoughness) * noise;
    data[i] = Math.floor(roughness * 255);
  }

  return data;
}