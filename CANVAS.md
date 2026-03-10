# Context: Standlo 3D Canvas Refactoring

Questo documento serve come contesto per riprendere il lavoro sul Canvas 3D di Standlo dopo un aggiornamento o una perdita di sessione dell'AI. Copia questo contenuto e passalo all'agente per ripristinare il contesto.

## Stato Attuale dell'Integrazione (Ultimo Aggiornamento)
Abbiamo unificato e raffinato il `Canvas.tsx` dell'interfaccia frontend, importando le meccaniche architetturali avanzate dal `AssemblyCanvasEditor.tsx` (lato admin).

### Funzionalità Implementate e Stabili:
1. **Store Gestione Stato (`store.ts`)**: 
   - Espanso per gestire `transformMode` (translate, rotate, scale, snap).
   - Gestione vista telecamera `cameraMode` (perspective/orthographic).
   - Metodi di rendering `shadingMode` (default, wireframe, flat, smooth).
2. **Manipolazione Oggetti (`GenericPart.tsx`)**: 
   - I componenti reagiscono ai cambiamenti di `transformMode` nello store per abilitare la trasformazione interattiva o lo snap.
3. **Gizmo Direzionale 3D (`ZUpGizmoViewcube.tsx`)**: 
   - Aggiunto il componente Viewcube customizzato per sistemi Z-Up.
   - Perfettamente posizionato (margin `[96, 140]`).
   - Implementato con `renderPriority={2}` all'interno di `GizmoHelper` per risolvere i bug di visibilità causati dagli effetti di post-processing (EffectComposer / Bvh).
4. **Griglia e Assi Ottimizzati (`Canvas.tsx`)**:
   - `MutedAxes` applicati.
   - Griglia infinita con spaziature esatte (multipli e sottomultipli quadrati perfetti): `cellSize={0.1}` (10 cm) e `sectionSize={1}` (1 metro).
   - **Supporto Temi Dinamico (next-themes)**:
     - Tema Light: `cellSize` a `hsl(220, 13%, 65%)` (più scuro per visibilità) e `sectionSize` a `hsl(220, 13%, 75%)` (più chiaro per non disturbare).
     - Tema Dark: `cellSize` `#3f3f46` e `sectionSize` `#52525b`.
   - Rimosso `ContactShadows` che generava aloni grigi sull'origine `[0,0,0]`.
5. **Sistema di Snapping**: 
   - Interfaccia reattiva con indicatori visivi (sfere e cerchi rossi) per `hoverSnap` e `snapSource`. 
   - Supporto nativo per lo snap all'origine del mondo.
6. **UI Canvas Toolbar**: 
   - Overlay per abilitare in tempo reale i comandi (Tools, Modes, Visibilità).

### File Architetturali Coinvolti:
- `src/components/layout/canvas/Canvas.tsx` (Render root, Luci, Griglia, Camera, Snap target primari)
- `src/components/layout/canvas/store.ts` (Zustand state globale)
- `src/components/layout/canvas/GenericPart.tsx` (Entità dinamiche 3D)
- `src/components/layout/canvas/ZUpGizmoViewcube.tsx` (Componente Navigazione Telecamera)

### Prossimi Passi (Da dove ripartire):
- Verificare la corretta rilevazione e calcolo dei punti geometrici limite (bbox corners/centers) all'interno di `GenericPart.tsx` per i target di snap secondari.
- Continuare l'integrazione/testing della logica per il salvataggio persistente nel database Firebase tramite API quando un oggetto viene mosso/snappato in modo definitivo.
- Verificare le interazioni fisiche con i collider Rapier, se presenti/necessari nel nuovo sistema snap.
