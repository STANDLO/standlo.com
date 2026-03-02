# Canvas 3D Engine & BIM Architecture

This consolidated document details the architecture for Standlo's proprietary WebGL 3D Engine (Canvas3D), its specific UI/API patterns, and the long-term BIM (Building Information Modeling) vision for the exhibition sector.

---

## 1. Canvas 3D Engine Implementation

**Goal:** Develop a proprietary, web-native 3D configurator using React Three Fiber (R3F) within the Next.js project, replacing heavy CAD dependencies with a lightweight, high-performance assembly system.

### Core Architecture
- **Three-Tier System:** 
  1. `Part` (primitives or uploaded `.glb`).
  2. `Assembly` (snapped parts forming a functional unit).
  3. `Stand` (Assemblies arranged on a stage).
- **Backend (Firebase):** The `canvas.ts` Gateway is the Single Source of Truth for BOM (Bill of Materials), physics validation, and PDF instruction generation.
- **Frontend State:** Zustand is mandatory for managing 60fps 3D coordinates bypassing React re-renders.
- **Data Structure:** Large projects bypass the 1MB Firestore limit by storing node hierarchies in subcollections (e.g., `stands/[standId]/assemblies` instead of large arrays).
- **Performance:** Relies on InstancedMeshes (single draw calls for repeating items), Draco compression for models, and `three-mesh-bvh` for efficient high-part-count raycasting.
- **Physics & Snapping:** Uses `@react-three/rapier` for collision detection, gravity validation, and magnetic "Sockets" ensuring parts only connect at valid geometric points.

---

## 2. Canvas UI and API Refinements

**Goal:** Refine the Editor into a professional, non-obtrusive environment featuring floating UI elements and robust materials administration.

### UI Enhancements
- **Floating Modals:** Legacy static sidebars are replaced by `CanvasCard` (floating, draggable windows) to maximize 3D viewport space.
- **Creation Wizard:** An automatic popup allowing users to explicitly choose to create a Part, Assembly, or Stand when entering an empty workspace.
- **Hierarchy Tree:** A minimal browser showing the active node tree, similar to Fusion 360's browser.

### Materials and Textures
- **Schemas:** Introduction of `CanvasMaterialSchema` and `CanvasTextureSchema` supporting full Multi-Theme capability (Light/Dark mode textures).
- **Granularity:** Support for both Per-Object (easy, 98% use case) and Per-Face (advanced) texture overrides directly on the nodes.
- **Admin Management:** A dedicated CRUD interface at `/it/admin/canvas-materials` to manage the dictionary of available materials.

---

## 3. The BIM Vision for Temporary Architecture

**Goal:** Transform the 3D editor from a polygon-pusher into an information-rich Building Information Modeler specialized for trade show booths.

### Structural Must-Haves
- **Intelligent Snapping:** "Magnetic" connection points preventing physically impossible assemblies and ensuring accurate fabrication dimensions.
- **Real-Time BOM & Costing:** Because each 3D node links to a Catalog item with price/weight data, the Bill of Materials and commercial quote update live as the user designs.
- **CNC Export:** Capability to export 2D cutting sheets (DXF/SVG) directly from the browser for immediate fabrication.
- **Certified Materials:** Texture data includes real-world properties (Fire Resistance class, RAL codes) automatically compiling the technical compliance dossier required by exhibition centers.

### Future Disruptors (Nice-to-Have)
- **Logistic Optimizer:** Calculates load volumes and specifies precise truck requirements (e.g., "Requires 2x Iveco Daily, 92% loaded").
- **Predictive Structural Analysis:** Real-time physics warnings (e.g., "Overturn risk. Center of gravity offset by 15%").
- **Multiplayer Co-Design & AR:** Collaborative web editing (Figma-style) and 1:1 scale WebXR visualization in the client's physical space.

---

## 4. Master Catalog (Part) RBAC Lockdown

**Goal:** Isolate the `Part` catalog entities to be read-only for standard users and managers, restricting creation and modification exclusively to the Admin Studio.

### Implementation Strategy
- **Firm RBAC Policies:** Update the `PartPolicyMatrix` (in `functions/src/schemas/part.ts`) for standard application roles (e.g., `manager`), explicitly forcing `canCreate: false`, `canUpdate: false`, and `canDelete: false`.
- **Gateway Enforcement:** The `firestoreGateway` relies on `AppCheck` tokens and Firebase Custom Claims, meaning any UI attempt from the main Next.js app to mutate a `Part` will be automatically rejected by the backend at the perimeter.
