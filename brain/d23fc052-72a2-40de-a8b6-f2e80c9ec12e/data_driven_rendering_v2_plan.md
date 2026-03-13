# Data-Driven Rendering Architecture (v2.0) - Piano di Implementazione Completo

Questo piano definisce la strategia per evolvere il Canvas 3D di Standlo, permettendogli di scalare fino a **10.000+ oggetti** eliminando i colli di bottiglia e raggiungendo un livello di **fotorealismo avanzato** paragonabile ai software CAD tradizionali.

Gli step sono stati riordinati in un flusso logico sequenziale: dalle fondamenta dei dati (Phase 1), alla pipeline di comunicazione (Phase 2), all'architettura 3D core (Phase 3), fino ai dettagli visivi finali (Phase 4).

---

## Phase 1: Fondamenta dei Dati e Caching (IndexedDB Sync)
*Obiettivo: Eliminare i file JSON statici dal bundle JS, garantendo che l'engine 3D si avvii solo quando tutti i dizionari (Materiali e Texture) sono disponibili in RAM, con latenza zero per gli accessi futuri.*

1. **Endpoint API di Sincronizzazione (`GET /api/canvas/dictionaries`)**
   - Creazione di un endpoint che restituisce il dizionario combinato (Materials + Textures).
   - Implementazione del **Versioning Caching**: l'API confronta il parametro `?v=` con la versione del `package.json` e restituisce `304 Not Modified` se il client è già aggiornato.
2. **Setup Archiviazione Asincrona (`idb-keyval`)**
   - Aggiunta della dipendenza `idb-keyval` per l'archiviazione asincrona su IndexedDB (superando il limite di 5MB del LocalStorage e senza bloccare il main thread).
3. **App Onboarding Check & Graceful Degradation (`CanvasOnboarding.tsx`)**
   - Implementazione del **blocco del rendering**: il Canvas non viene montato finché i dizionari non sono pronti in memoria.
   - Aggiunta di un **fallback di emergenza**: se la rete è assente e IndexedDB è vuoto, caricamento di un mini-dizionario base in hard-code per non bloccare l'app.
4. **Iniezione nello Zustand Store e Refactoring (`store.ts`)**
   - Aggiornamento di `store.ts` per accogliere `materialsRegistry` e `texturesRegistry`.
   - Modifica di `CanvasTools.tsx` e `CanvasCatalogSidebar.tsx` affinché leggano i dati dallo Store anziché importarli staticamente.
5. **Background Sync Invisibile (`useDictionarySync`)**
   - Creazione di un hook che verifica periodicamente la versione in sottofondo. In caso di aggiornamento (es. nuovo deploy in cloud), scarica silenziosamente il JSON e mostra un avviso non intrusivo ("Nuovi materiali disponibili, ricarica la pagina").

---

## Phase 2: Pipeline di Comunicazione e Stato Proxy
*Obiettivo: Disaccoppiare il client dal database Firebase rendendo tutte le comunicazioni mediate da endpoint interni, permettendo paginazione e streaming sicuro.*

1. **Proxy Esclusivo tramite API Gateway (`/api/gateway?target=orchestrator`)**
   - Rimozione totale di chiamate dirette a Firestore (es. `onSnapshot`) dal frontend 3D.
   - Creazione di un hook `useCanvasOrchestrator` per gestire il fetch via Gateway.
2. **Caricamento Progressivo (Paginated Chunking)**
   - Modifica dell'Orchestrator per fornire `listCanvasNodesPaginated` (es. blocchi da 500 oggetti).
   - Adattamento dello Zustand Store per processare l'arrivo progressivo degli oggetti e aggiornare la scena in modo fluido (Streaming Visivo) senza bloccare il browser.

---

## Phase 3: Core 3D Architettonico (Performance & Raycasting)
*Obiettivo: Mantenere le Draw Calls della GPU al minimo indispensabile raggruppando dinamicamente gli oggetti e ottimizzando al massimo le collisioni e i click.*

1. **Raycasting Spaziale Ottimizzato (`three-mesh-bvh`)**
   - Integrazione di `three-mesh-bvh` per generare una gerarchia di volumi (Octree) sulla logica di Three.js. Questo rende l'intersezione del mouse istantanea (O(log N)) anche con 10.000 mesh.
2. **Raggruppamento Dinamico (Instanced & Batched Meshes)**
   - Sviluppo di una logica in Zustand (`organizeRenderGroups`) che calcola un *Hash Visivo* (`baseEntityId` + `textureId`) per ogni oggetto in arrivo.
   - Conversioni automatiche:
     - > 50 entità uguali -> pool `InstancedMesh`.
     - Stessa geometria, materiali diversi -> pool `BatchedMesh`.
     - Oggetti unici/In modifica -> `<mesh>` singolo.
3. **Transizione di Selezione Dinamica (Interattività Multi-Oggetto)**
   - Implementazione della logica temporanea di estrazione: quando l'utente clicca una porzione di muro (InstancedMesh), quell'esatto `instanceId` viene "estratto" temporaneamente in una Singola `<mesh>` con agganciato il `<TransformControls>`, per consentirne la modifica, e reinserito al termine del dropping.
4. **Collisioni Logiche AABB (Rimozione Motore Fisico)**
   - Sostituzione di `Rapier` (eccessivo per 10k collider) con matematica vettroriale semplificata AABB (Axis-Aligned Bounding Box) per verificare se il bounding box dell'oggetto attualmente mosso interseca quello di un'altra mesh, cambiandone il colore (es. luce rossa) in caso di errore.

---

## Phase 4: Motore Grafico e Fotorealismo (Aesthetics)
*Obiettivo: Elevare il livello grafico per moquette, laccature e dettagli di riflessione, aggiungendo un tocco CAD con outline selettivi.*

1. **Conversione PBR Avanzata (`MeshPhysicalMaterial`)**
   - Estensione del renderer affinché generi in automatico `MeshPhysicalMaterial` basandosi su metadati PBR specifici:
     - **Clearcoat & Roughness:** per laccature e smalti lucidi sopra il colore di base.
     - **Sheen:** fondamentale in ambito fieristico per velluto, stoffe, e moquette (crea i riflessi morbidi sui bordi).
     - **Transmission / IOR:** per vetrate fisicamente credibili (simulando l'indice di rifrazione) rispetto alla semplice opacità.
2. **Texturing Settings e Dynamic Tiling**
   - Parametrizzazione in r3f di `repeatX` e `repeatY` (`texture.repeat.set(...)`). Impostazione implicita di `THREE.RepeatWrapping` per stendere mattoni o moquette in modo seamless su grandi superfici.
3. **Selezione "Effetto CAD" via Post-Processing**
   - Setup di `@react-three/postprocessing` per applicare effetto Outline "Neon" ESCLUSIVAMENTE all'oggetto attualmente selezionato, garantendo un feedback d'autore netto (invece di variare semplicemente il colore primitivo).
4. **Shadow Baking e Ambient Occlusion Statico**
   - Ottimizzazione delle ombre dinamiche (`castShadow={false}` sulla maggior parte delle mura/pannelli) usando componenti nativi (`ContactShadows`) od originando *fake Ambient Occlusion* per "schiacciare" correttamente a terra le pareti, scaricando oneri grafici spaventosi dalle luci direzionali continue.
5. **Generazione LOD in Background**
   - Configurazione di una Cloud Function che, al caricamento di file mesh personalizzati, generi tre pesi asincroni (Box proxy, Low-poly, High-poly) in background.

---

## Phase 5: PDM e Varianti Intelligenti di Texture
*Obiettivo: Aggiornare i pannelli di amministrazione e le proprietà dell'oggetto per governare la complessità visiva delle nuove texture fisicamente accurate.*

1. **Intelligent Texture Variant System**
   - **Associazione Materiale-Texture**: Aggiunta di `compatibleMaterials` nello schema `Texture` per indicare a quali materiali di base si applica la texture variante.
   - **PDM UI**: Selettore multiplo in `admin/app/pdm/textures/page.tsx` per mappare queste compatibilità.
   - **Default Variant su Parts**: Selettore in `admin/app/pdm/parts/page.tsx` (sotto 3D Properties) per scegliere la `defaultTextureId`. La variante scelta influenza automaticamente il nome generato per la parte (es. "Base Quadrata [Moquette Rossa]").
   - **Filtraggio Intelligente in Canvas**: Il nuovo modulo The Global Factory riconosce quali texture offrire all'utente basandosi sul materiale del nodo cliccato.  
   *(Status: Completato)*
2. **PDM Admin Update per Materiali Fotorealistici**
   - **Estensione Schema**: Aggiunta dei parametri fisici PBR in `functions/src/schemas/material.ts`: `repeatX`, `repeatY`, `clearcoat`, `clearcoatRoughness`, `sheen`, `sheenRoughness`, `transmission`, `ior`.
   - **Editor Materiali**: Modifica a `/admin/pdm/materials` includendo un nuovo tab/sezione "ADVANCED PHOTOREALISM" con campi slider per governare opzionalmente la fisica della verniciatura, del vetro e dei tessuti in preview realtime.

---

*Questo piano rappresenta la mappa maestra per la migrazione. Si raccomanda di completare la Phase 1 (Fondamenta, IndexedDB e Caching) e la Phase 2 prima di avventurarsi nel refactoring visivo e nel post-processing estremo (Phase 4 e 5).*
