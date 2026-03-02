# STANDLO - The Global Factory 🌍

Benvenuti nel repository principale di **STANDLO SaaS**, The Global Factory. 
Questo documento funge da **Master Context** per nuovi sviluppatori e agenti AI (es. Gemini 3.1 Pro). Contiene l'intera architettura, le logiche di ecosistema Firebase, le convenzioni di programmazione e i dettagli del sistema RBAC 100% Server-Driven. **Leggere attentamente prima di contribuire.**

---

## 1. Project Overview & Tech Stack
L'obiettivo di STANDLO è essere la piattaforma globale per i professionisti del settore fiere e contract inizialmente ma poi espandersi a tutti i settori come standard industriale. 
Lo stack tecnologico primario comprende:
- **Frontend / Meta-Framework**: Next.js 16 (App Router).
- **Styling**: Tailwind CSS (usato rigorosamente tramite `@layer components`).
- **Database & Auth**: Firebase Hosting, Cloud Firestore, Firebase Identity Platform (Auth).
- **Backend & Logic**: Firebase Cloud Functions v2 (Node.js/TypeScript).
- **Validazione Dati**: Zod (Single Source of Truth per database schemas e payload API).
- **Forms**: React Hook Form integrato con resolving Zod (`extractZodKeys.ts`).
- **Internationalization (i18n)**: `next-intl` (Zero testi hardcoded).

### Il Principio "Thin Consumer"
L'architettura NEXT.js è concepita come un "consumatore UI sottile". Tutta la logica di business pesante, sicurezza crittografica e accesso diretto ai master-schema del database è **delegata alle Cloud Functions**. Il frontend si limita alla renderizzazione di layout e a spedire/ricevere Payload.

---

## 2. Architettura dei Gateways 

L'interazione tra Frontend e DB as-a-service (Firestore) è schermata da un Pattern a Microservizi basato su **5 Funzioni Gateway Callable (`onCall`)**. Ogni singola funzione è protetta preventivamente da Firebase AppCheck Edge Enforcement.

### 2.1 Orchestrator
È la funzione preposta alle macchine a stati critiche (es. Flusso di Onboarding, Creazione dinamica di account B2B esterni) o a logiche multi-dominio che richiedono operazioni "privilegiate" garantite solo dall'esecuzione server-side tramite Firebase Admin SDK.
- **Scopo Principale**: Iniettare token e Custom Claims, approvare identità, validare setup iniziali e lanciare scritture su più collezioni Firestore garantendo transazionalità.
- **Come Aggiornarlo**: Le sue ramificazioni si trovano in `functions/src/orchestrator/`.

### 2.2 WebInterface (Server-Driven UI e RBAC Layouting)
È il cuore pulsante dinamico del Frontend. Espone chiamate RPC sicure (`rpc`) che ritornano dinamicamente al frontend non solo i dati, ma le regole di rendering UI e l'albero di navigazione.
- **Scopo Principale**: Fornire lo Zod Mapping per l'autogenerazione dei form su Frontend (SDUI) e fornire il **Navigation Manifest** basato sull'identità crittografata dell'utente.
- **Come aggiungere al Navigator**: Per modificare il menu laterale, intervenire sul file `functions/src/rbac/policyEngine.ts` nella funzione `generateNavigationManifest(roleId)`. Questo restituisce al Layout del frontend rotte come `dashboard`, `projects`, e setta la gerarchia visiva. Nessun link è hardcoded in React.
- **Come modificare i permessi RBAC**: I permessi di ogni entità (READ, WRITE, CREATE) sono definiti in matrici precise accanto ai loro file di schema in `functions/src/schemas/` (es. `OrganizationPolicyMatrix` in `organization.ts`). Il motore di navigazione li legge da `PolicyMatrices` sempre dentro `policyEngine.ts`.

### 2.3 Firestore Gateway
È l'unico Data Access Layer standardizzato e controllato per l'interazione bidirezionale Frontend<->DB che non necessita di logiche massive custom.
- **Scopo Principale**: Orchestra in totale autonomia le operazioni CRUD (`list`, `create`, `read`, `update`, `soft_delete`), applicando impaginazione server-side, multi-tenant isolation e filtraggio composto nativo.
- **EntityRegistry & Sicurezza**: Utilizza un `EntityRegistry` centrale per mappare `entityId` ai percorsi Firestore esatti e agli Zod Schemas corrispondenti. Qualsiasi manomissione del payload rispetto allo schema atteso genera automaticamente un **Security Alert** tracciato su Firestore.
- **Error Hashing & Context Enrichment**: In caso di eccezioni (es. permessi, validazione), il Gateway genera un `errorReferenceCode` univoco e lo invia al frontend. I log estesi (comprendenti User-Agent, IP, payload e Request Context) vengono salvati in sicurezza nella collection `alerts`.
- **Long-Term Archiving**: Gestisce nativamente l'esclusione di default dei record soft-deleted e archiviati (`isArchived: true`), mantenendo le collection veloci e sicure tramite Indici Composti.

### 2.4 Choreography
Coda asincrona per task _fire-and-forget_ e code distribuite. 
- **Scopo Principale**: Gestione di trigger asincroni (event listeners su insert/update Firestore per ricalcoli, statistiche, clean-up o messaggistica heavy come server push e mailers).
- **Architettura in Evoluzione**: Separato dalle chiamate onCall sincrone per evitare che il frontend attenda code di timeout estenuanti.

### 2.5 Brain
L'interfaccia verso le Intelligenze Artificiali / LLMs (attualmente in via di evoluzione e documentazione dinamica).
- **Scopo Principale**: Agente AI Centralizzato, gestirà in futuro logiche come orchestrazione AI/Processi automatizzati, parsing multimodale per PDF architettonici e RAG su vector database proprietari per estrarre storicità STANDLO.

---

## 3. RBAC & Security Context (Zero-Trust JWT)
La sicurezza di STANDLO è strutturata su sessioni non statali (JWT Custom Claims). Il Client non ha **MAI** voce in capitolo sull'affermazione del proprio ruolo.

- **Custom Claims in the Source of Truth**: Cloud Functions speciali (es. `orchestrator`) iniettano direttamente nel JWT dell'utente variabili che ne compongono il DNA autorizzativo istantaneo. I Custom Claims correnti includono:
  - `role`: (es. `"customer"`, `"manager"`, `"provider"`) determina l'accessibilità operativa top-level.
  - `orgId`: L'UID univoco nel datalake dell'Organizzazione primaria.
  - `orgName`: Nome dell'organizzazione dell'ultimo check in formato label.
  - `logoUrl`: Asset URL per rendering fulminei in sidebar e header.
  - `onboarding`: Boolean (`true/false`) che certifica il passaggio dell'utente nei funnel primari prima della redirezione in rotte sicure.
  - `location`: Estratto dalla residenza/Sede (composto per default da CountryCode e ZipCode, es. `IT-20017`). Abilita future categorizzazioni spaziali in filter-free edge resolution.
  - **Dynamic Entity IDs**: `${role}Id` e `${role}Name`, auto-costruiti e serializzati, per tracciamento granulare del path specifico all'interno di relazioni multiple complesse.
- **Latenza Zero HTTP Edge Middleware**: In `/src/proxy.ts`, Edge valuta il payload JWT in frazioni di millisecondo ed instrada i route `/[locale]/[role]/...` rigettando cross-contamination o redirezionando al processo di *onboarding* qualificato.
- **Navigation (SDUI)**: Il menu (`LayoutProtected`) esegue una Fetch SSR che chiama la `WebInterface` (`policyEngine.ts`) traducendo all'istante i flag di cui sopra in Sidebar Navigations vive. 

---

## 4. Data Layer & Zod Schema Paradigms
Le regole sui dati sono gestite in modo matematico per prevenire Data Leakage o Type Misalignments.
Tutti gli schemi risiedono univocamente in `functions/src/schemas`.

- **Entity Schema Grouping**: I file sono raggruppati per Entità di Business (es. `organization.ts`, `project.ts`) e **MAI** per livello architetturale.
- **MasterSchema VS RoleSchema**: Per ogni Business Entity si concepisce un `MasterSchema` (ereditato da un universale `BaseSchema` preposto al track lifecycle morbido e **archiviazione a lungo termine**). Da questo Master si derivano chirurgicamente i sub-schemi RBAC.
- **Componenti Autonomi SDUI (`FormList`, `FormCreate`, `FormDetail`)**: L'intero front-end opera in logica "Zero-Boilerplate". Navigando su rotte generiche come `/[locale]/partner/[roleId]/[entity]`, l'interfaccia inietta a runtime i Form generici passandogli solo `entity` e `roleId`. I form invocano autonomamente il **Firestore Gateway**, delegano la validazione Zod al backend e gestiscono in autonomia caricamento, impaginazione e mutation state.

---

## 5. UI Design System & Strict CSS Rules
Il Frontend è strutturato su convenzioni testate:

- **Zero Inline Tailwind nei File React**: È vietato inserire utility class come `bg-blue-500` o `w-full` nei file `.tsx` logici. I file React richiamano unicamente semantica di alto livello.
- **`@layer components` in globals.css**: Tutte le composizioni visive sono estrapolate in `src/app/globals.css`. Es. contenitori come `.layout-auth-wrapper`.
- **Componentistica Atomica Protetta**: Utilizzo obbligatorio dei widget in `src/components/ui/` (es. `<InputLocalized>`). Raggruppamento dei form in `src/components/forms/`. Convenzione **PascalCase**.
- **ErrorGuard & UX Sicura**: Intercettazione globale degli errori in `FormList`, `FormCreate` e `FormDetail` tramite il componente `<ErrorGuard />`. Mostra unicamente messaggi user-friendly e un UUID univoco (Reference Code) per l'assistenza, nascondendo gli stack trace al client (visualizzabili solo tramite il toggle "Sincere View" in Dev Mode).
- **Internazionalizzazione Obbligata**: **Nessun testo hardcoded in vista.** Messaggi, labels, configurati nel the tree `/messages` (es. `/messages/it.json`). Acceduti tramite hook standardizzati globali (`useTranslations`).

---

## 6. DevSecOps, Audit & Penetration Testing
Piattaforma ingegnerizzata su logiche difensive ISO/IEC 27001 conformant:

- **Script `pentest.mjs` Bloccante**: Prevenzione attiva di IDOR tramite scansione dei ruleset Firestore. Verifica Edge Middleware per Cookie hijacking/SSRF (Strict HTTPS Transport Security enforced).
- **API Keys Programmatiche Hashed**: Gestione sicura per chiamate macchina-a-macchina. Trackato il token via transazionale tramite l'estensione crittografica SHA-256 in volo su firebase hook `withApiKeyTracking`, proteggendo da fughe massive on rest.

---

## 7. Programming Rules (Strict Mode)
Integrazione completa delle regole di sviluppo interne di STANDLO:

- **Type Safety**: Divieto assoluto di utilizzo di `any`. Obbligo di interfacce strette e validazioni Zod per ogni payload transitante da e verso i Gateways.
- **Componentistica e Naming**: Convenzioni PascalCase, divieto di tag HTML grezzi per UI Form (obbligo uso proxy abstraction layer es. `<Input>` anziché markup DOM raw `<input>`).
- **Continuous Validation**: Obbligo di `npm run lint` e `npm run build` con risultato garantito "Zero Errors / Zero Warnings" al pre-flight check. Approvvigionamento di `npm audit` obbligatoriamente clean.

---

## 8. Developer Local Setup & Workflow
L'operatività base per testare il codice in locale:

1. **Installazione Base**: `npm i` nel root + `cd functions && npm i`
2. **Ambiente di Sviluppo**: Sulla ROOT `npm run dev`. Apre l'istanza su `http://localhost:3000`.
3. **Deployment**:
   - `npm run cloud:validate`: Lancia il DevSecOps Pentest in locale + build completa TypeScript. Esegue la "gate validation" prima del deploy.
   - `npm run cloud` o equivalente: Seguire le istruzioni DevSecOps o gli automatismi CI/CD previsti dal workflow. Nativamente Vercel-like in staging.

## 9. Standlo Admin Studio (Control Panel & Local Developer GUI)
Ecosistema Low-Code parallelo installato isolatamente nella cartella root `/admin`. É un'applicazione Next.js nativa con accesso Firebase "God Mode" (tramite Firebase Admin SDK) per bypassare restrizioni e permettere interventi totali. Mai rilasciata in produzione (inserita in `.gitignore`).
Include capacità avanzate:
- **Visual Schema & Policy Editor (NoCode):** Interfaccia drag-and-drop per l'astrazione JSON->Zod. Riscrive file sorgente come `schemas/organization.ts` e `policyEngine.ts` dinamicamente con introspezione di `UIFieldMeta`.
- **Safe Generation Pipeline (AST Validation):** Middleware node che parsifica virtualmente tramite *TypeScript Compiler API* e formatta con *Prettier* prima di innescare save su file physicali, ostacolando Syntax Error letali.
- **Interactive Role Impersonation:** Motore QA integrato. Selettore "Impersonifica" inietta dinamicamente il RoleID ai Meta-Form per simulare cosa vede l'utente con l'attuale filtro Zod.
- **Universal Admin CRUD:** Re-implementa i Meta-Form (`FormList`, `Create`, `Detail`) ma con privilegi assoluti, rendendolo l'Internal Panel definitivo per aggiustare/ispezionare entità DB con Meta-UI.
- **Security Alerts Dashboard:** Sincronizzazione in tempo reale dal Backend Firestore Gateway degli alert Security Deposit (manipolazioni data, permessi mancanti).
- **Monorepo Component Reusability:** Importa e aliasa (via turbopack e tsconfig) i percorsi UI `src/` del main project per continuità visiva Zero-Boilerplate.

---

## 10. Project Management & GitHub Single Source of Truth
L'intero ciclo di vita dello sviluppo e l'orchestrazione delle architetture sono tracciate tramite GitHub e la GitHub CLI (`gh`). 
L'unica Source of Truth del project management risiede nell'organizzazione GitHub di STANDLO (es. `https://github.com/orgs/STANDLO/projects/[ID]`).
I piani architetturali generati dagli Agenti AI (Artefatti Locali) vengono costruiti nell'ambiente di sviluppo e, una volta approvati, vengono frammentati in rigorose GitHub Issues automatiche, assegnate programmaticamente alle Project Boards. 

*(Fine Master Context)*
