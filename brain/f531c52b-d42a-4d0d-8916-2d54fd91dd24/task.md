# Design Information Modelling (DIM) Task List

## Part 1: Entity Migration (Canvas -> Design)

### Backend (Functions)
- [x] Rename `functions/src/schemas/canvas.ts` to `design.ts`
  - [x] Rename `CanvasSchema`, `CanvasCreateSchema`, `CanvasUpdateSchema` to their `Design` equivalents.
  - [x] Replace `canvas_id` with `design_id`.
  - [x] Change references to `canvases` collection to `designs`.
- [x] Update `functions/src/schemas/index.ts` to export `design.ts` instead of `canvas.ts`.
- [x] Rename `functions/src/choreography/canvas.ts` to `design.ts`
  - [x] Update function names (`choreographyCanvasCreateSandbox` -> `choreographyDesignCreateSandbox`, etc.).
  - [x] Update document triggers from `canvases/{designId}` to `designs/{designId}`.
- [x] Rename `functions/src/orchestrator/canvas.ts` to `design.ts`
  - [x] Update function name (`orchestratorCanvas` -> `orchestratorDesign`).
  - [x] Update all schema validations and entity registry calls.
- [x] Update Gateways (`functions/src/gateways/choreography.ts`, `entityRegistry.ts`, `orchestrator.ts`)
  - [x] Replace `/canvas/` routes with `/design/` routes.
  - [x] Update typings and method names.
- [x] Update `functions/src/rbac/policyEngine.ts`
  - [x] Change `canvas` scope/resource to `design`.
- [x] Update `functions/src/index.ts`
  - [x] Export `design` orchestrator and choreography instead of `canvas`.

### Admin App
- [x] Update `admin/app/pdm/stands/components/StandCanvasEditor.tsx` -> `StandDesignEditor.tsx`.
- [x] Update `admin/app/pdm/bundles/components/BundleCanvasEditor.tsx` -> `BundleDesignEditor.tsx`.
- [x] Update `admin/app/pdm/assemblies/components/AssemblyCanvasEditor.tsx` -> `AssemblyDesignEditor.tsx`.
- [x] Ensure any admin routing or API calls targeting `canvases` are switched to `designs`.

### Frontend App (src)
- [x] Rename `src/lib/canvas.ts` -> `src/lib/design.ts`.
- [x] Rename folder `src/components/layout/canvas` -> `src/components/layout/design`.
  - [x] Rename components explicitly with `Canvas` prefix (e.g., `CanvasHeader.tsx` -> `DesignHeader.tsx`, `CanvasTools.tsx` -> `DesignTools.tsx`).
- [x] Rename API route `src/app/api/canvas/dictionaries/route.ts` -> `api/design/dictionaries/route.ts`.
- [x] Rename Frontend Pages
  - [x] `src/app/[locale]/canvas/page.tsx` -> `[locale]/design/page.tsx`
  - [x] `src/app/[locale]/canvas/layout.tsx` -> `[locale]/design/layout.tsx`
  - [x] `src/app/[locale]/partner/[roleId]/canvas/page.tsx` -> `[locale]/partner/[roleId]/design/page.tsx`
  - [x] `src/app/[locale]/canvas/public/[uid]/page.tsx` -> `[locale]/design/public/[uid]/page.tsx`
- [x] Carefully update React components across the codebase that reference `Canvas` entity without modifying `@react-three/fiber` `<Canvas />` rendering components.

## Part 2: Data-Driven Rendering (v2.0)

### Phase 1: Data Foundations & Caching
- [ ] Implement `GET /api/design/dictionaries` endpoint with `?v=` version caching.
- [ ] Setup `idb-keyval` for async IndexedDB storage.
- [ ] Implement rendering block and offline fallback in `DesignOnboarding.tsx`.
- [ ] Inject registries into Zustand `store.ts` and refactor UI readers.
- [ ] Implement `useDictionarySync` for background updates.

### Phase 2: Communication Proxy
- [ ] Create `useDesignOrchestrator` to hit `/api/gateway?target=orchestrator`.
- [ ] Remove all direct Firestore `onSnapshot` usages in the 3D client.
- [ ] Implement paginated chunking (`listDesignNodesPaginated`) in the Orchestrator.
- [ ] Adapt Zustand store for progressive visual streaming.

### Phase 3: Core 3D Architecture
- [ ] Integrate `three-mesh-bvh` for optimized raycasting geometry octrees.
- [ ] Implement `organizeRenderGroups` in Zustand for `InstancedMesh` / `BatchedMesh` routing.
- [ ] Implement dynamic selection extraction (Instanced -> Mesh + TransformControls -> Instanced).
- [ ] Replace `Rapier` with AABB collision math for drag-and-drop validation.

### Phase 4: Graphics & Photorealism
- [ ] Map PBR metadata (`clearcoat`, `sheen`, `transmission`) to `MeshPhysicalMaterial`.
- [ ] Parameterize texture tiling (`repeatX`, `repeatY`).
- [ ] Setup `@react-three/postprocessing` outline strictly for the selected object.
- [ ] Optimize shadows via `ContactShadows` or static ambient occlusion on heavy geometry.
- [ ] Develop background Cloud Function for 3-tier LOD mesh generation upon upload.

### Phase 5: PDM Updates
- [ ] Add `compatibleMaterials` array to `Texture` schema.
- [ ] Implement multi-selector in `/admin/pdm/textures`.
- [ ] Add `defaultTextureId` selector in `/admin/pdm/parts`.
- [ ] Extend `Material` schema with PBR physics params.
- [ ] Add `ADVANCED PHOTOREALISM` tab in `/admin/pdm/materials` with live sliders.

## Validation
- [x] Verify Monorepo Builds (`npm run build`).
- [ ] Ensure end-to-end `design` workflow runs cleanly via Emulator without legacy `canvas` references blocking state.
