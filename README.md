# STANDLO - The Global Factory 🌍

Benvenuti nel repository principale di **STANDLO SaaS**, The Global Factory. 
Questo documento funge da **Master Context** per nuovi sviluppatori e agenti AI (es. Gemini). Contiene l'intera architettura, le logiche di ecosistema Firebase, le convenzioni di programmazione e i dettagli del sistema RBAC 100% Server-Driven. **Leggere attentamente prima di contribuire.**

---

## 1. Project Overview & Tech Stack
L'obiettivo di STANDLO è introdurre il **TIM (Temporary Information Modeling)**: il sistema operativo che trasforma i dati in strutture fisiche, gestendo stand fieristici e moduli di emergenza con sincronia millimetrica, pagamenti istantanei e logistica predittiva.
Lo stack tecnologico primario comprende:
- **Frontend / Meta-Framework**: Next.js 16 (App Router) abilitato per Turbopack.
- **Styling**: Tailwind CSS (usato rigorosamente via `@layer components`) e temizzazione cromatica (Dark/Light).
- **Database & Auth**: Firebase Hosting, Cloud Firestore, Firebase Identity Platform (Auth).
- **Backend & Logic**: Firebase Cloud Functions v2 (Node.js/TypeScript).
- **Validazione Dati**: Zod (Single Source of Truth per database schemas e API validation).
- **3D Engine**: React Three Fiber, Drei, Zustand (State Management) e Rapier 3D (Fisica).
- **Internationalization (i18n)**: `next-intl` (Zero testi hardcoded, supporto multilingua garantito).

### Il Principio "Thin Consumer"
L'architettura NEXT.js è concepita come un "consumatore UI sottile". Tutta la logica di business pesante, sicurezza crittografica e accesso diretto ai master-schema del database è **delegata alle Cloud Functions**. Il frontend si limita alla renderizzazione di layout e allo scambio di Payload rigorosamente tipizzati.

---

## 2. Architettura dei Gateways & API

L'interazione tra Frontend e Database è schermata da un Pattern a Microservizi basato su **Cloud Functions (`onCall`)** e **Next.js API Routes**. Tutte le chiamate pubbliche sono protette da Firebase AppCheck Edge Enforcement.

### 2.1 Orchestrator
Funzione preposta alle state machines critiche (es. Flusso di Onboarding, Creazione dinamica tenant B2B).
- **Scopo Principale**: Iniettare token e Custom Claims nel JWT, approvare identità, validare setup iniziali e lanciare scritture multi-collezione garantendo transazionalità.

### 2.2 Firestore Gateway
L'unico Data Access Layer standardizzato per l'interazione bidirezionale Frontend<->DB.
- **Orchestrazione**: Gestisce operazioni CRUD in totale autonomia applicando RBAC, impaginazione server-side, multi-tenant isolation e filtraggio composto nativo.
- **Sicurezza & Alerting**: Utilizza un `EntityRegistry` centrale. La manomissione dei payload genera **Security Alerts** silenti archiviati in `/alerts`.

### 2.3 Canvas 3D Engine
Gateway specializzato per l'infrastruttura 3D (WebGL / R3F) e la logica costruttiva del progetto.
- **Architettura**: Utilizza Zustand per la reattività del Single Source of Truth locale, sincronizzato con istanze fisiche (Rapier) per collisioni e interazioni drag-and-drop millimetriche. 
- **Componentistica**: Integrato tramite i moduli `CanvasEditor`, `CanvasParts`, `CanvasAssembly`, e gestito dal pannello spaziale `CameraControls`.

### 2.4 Fusion 360 ERP Bridge
Sistema di integrazione profonda per la preventivazione, logistica e trasformazione del BOM (Bill of Materials).
- **Logica**: Estrazione URL modelli fisici (ModelURL), sincronizzazione degli alberi BOM ricorsivi e calcolo finanziario a numero intero (zero floating-point flaws). Prepara PDF intellegibili con link interattivi.

### 2.5 Brain & AI Intelligence (Coherence)
Interfaccia verso gli LLMs (es. Vertex AI Reasoning Engine).
- **Scopo Principale**: Agente AI centralizzato preposto all'automazione del workflow progettuale, validazione assistita del design canvas, traduzioni massifiche e generazione dei manifest SDUI.

---

## 3. RBAC & Security Context (Zero-Trust JWT)
La sicurezza è strutturata su sessioni non statali (JWT Custom Claims). Il client non decide **MAI** le proprie permission.

- **Custom Claims Injector**: Il JWT contiene claims come `role` (es. "customer", "manager", "admin"), `orgId`, `onboarding` flag e limitazioni fisiche/geografiche.
- **Edge Middleware latency-zero**: Il proxy `middleware.ts` valuta i token localmente in millisecondi, impedendo accessi a rotte `/partner/...` o `/admin/...` senza adeguata validazione crittografica. Nessuna UI viene mostrata senza diritti.
- **SDUI Navigation**: Le interfacce si autodeterminano basandosi sull'entità (es. FormCreate generici per ogni modulo Zod) invece di creare boilerplate ridondante.

---

## 4. Code Standards & Data Layer Zod
Tutte le logiche dati risiedono in `functions/src/schemas`.
- **Entity Schema Grouping**: File raggruppati unicamente per Entità di Business (es. `project.ts`), derivando `RoleSchema` da `MasterSchema` omogenei.
- **Prevenzione Data Leak**: Qualsiasi dato in in/out dal Firestore Gateway viene parsato strict via Zod. Le chiavi non documentate vengono scartate.

---

## 5. Strict CSS & UI Design System
- **Zero Inline Tailwind nei File React**: I file `.tsx` non descrivono classi utility di styling ma richiamano semantica componentizzata in `globals.css` (`@layer components`).
- **Puro "Shadcn/UI" Extended**: Componenti atomici (`<InputLocalized>`, `<Badge>`, ecc.) con temizzazione primaria integrata (es. Fuchsia/Cyan support per tag).
- **UI UX Sicura**: `<ErrorGuard />` globale inietta Error Reference Code (UUID) e nasconde lo stack-trace all'end-user, salvaguardando l'information disclosure.

---

## 6. Sviluppo & Qualità del Codice (Strict Mode)
- **Zero Warnings / Zero Errors**: Prima di ogni merge o deploy (`npm run cloud:validation`), i comandi `npm run lint` e `npm run build` non ammettono fallimenti od eccezioni TypeScript (`any` non permesso).
- **GitHub Single Source of Truth**: L'orchestrazione dello sviluppo e il workflow di design vengono tracciati tramite *GitHub Projects* (`STANDLO/standlo.com`). Piani architetturali (es. Canvas, Admin) vengono gestiti via Milestone e Issues su Github, garantendo collaborazione estesa al team.

---

## 7. Developer Local Setup & Workflow
L'operatività base per testare il codice in locale:

1. **Installazione**: `npm i` nel root + `cd functions && npm i`.
2. **Setup Ambiente**: Effettuare login Firebase CLI: `firebase login`. Assicurarsi che l'ambiente corretto (.env.local) punti al backend dev appropriato.
3. **Sviluppo Locale**: Dalla ROOT, avviare `npm run dev`. Il server esponde su `http://localhost:3000`.
4. **Validazione e Deploy**:
   - `npm run lint` e `npm run build` obbligatori localmente.
   - `npm run cloud:validation`: esegue lo stack pre-flight completo di DevSecOps.

---

## 8. Standlo Admin Studio
Ecosistema isolato Next.js nella route `/admin` usato dal team centrale.
Include:
- **Flussi User Activation**: Approvazione manuale delle organizzazioni in onboarding.
- **Canvas Master Catalog Management**: Interfaccia CRUD per la gestione delle Master Parts e Materials del 3D Engine. Modifica le entità base prelevate dinamicamente dal Canvas.
- **Universal Admin CRUD**: Controllo totale su tutte le collection per ripristino hard/soft deletes e investigazione logs (`/alerts`).
- **GitHub Integration Dashboard**: Esportazione e visualizzazione degli stati di completamento delle milestone direttamente dentro il Project Management aziendale.

*(Fine Master Context)*
