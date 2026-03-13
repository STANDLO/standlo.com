# Implementation Plan: Canvas Layout & Onboarding Refactor v4

## Proposed Changes

### 1. CSS Layout (`src/app/globals.css`)
- **Modify** `.ui-canvas-onboarding-container` to be full width (`w-full`) and full height (`min-h-[100dvh]`), ensuring the two columns are always side-by-side on desktop.
- **Modify** `.ui-canvas-onboarding-left-col` to have the default theme dotted background (`bg-background`).
- **Modify** `.ui-canvas-onboarding-right-col` to have the inverted theme dotted background (dark in light theme, light in dark theme).

### 2. Rename and Refactor Onboarding Form (`src/components/forms/FormOnboarding.tsx` -> `OrganizationOnboarding.tsx`)
- **Rename** `FormOnboarding.tsx` to `OrganizationOnboarding.tsx` to better reflect its purpose (initializing the organization).
- **Update Imports**: Update `src/app/[locale]/(protected)/onboarding/page.tsx` to import the component under its new name.
- **Remove `callGateway("orchestrator", { actionId: "getManifest" })`**: Stop fetching a dynamic UI manifest from the backend.
- **Implement Zod Native UI Validation**: Use `react-hook-form` and `@hookform/resolvers/zod` combined with the frontend exported `OrganizationCreateSchema` from `@/core/schemas`. Add the `birthday` field to the local schema parsing since it's required during onboarding to set up the user profile.
- **Manual Field Rendering**: Instead of mapping over generic manifest elements, render the required fields explicitly (`type`, `name`, `vatNumber`, `sdiCode`, `birthday`, `roleId`, `place`, `logoUrl`) using the custom Standlo components (`Input`, `Select`, `InputVat`, `InputPlace`, `InputDate`, `Gallery`). Look at `FormCreate` or `FormDetail` as an example of hooking these up to `react-hook-form`.
- **Validation Presentation**: Wire up Zod format errors right into the input fields, enabling instantly localized, inline validation for mandatory fields, valid VAT numbers, valid PEc/SDI codes, etc.

### 3. Cleanup Legacy Dynamic Form System
- **Delete** `src/components/forms/DynamicSDUIForm.tsx`: Since `OrganizationOnboarding` (the last remaining consumer of the old dynamic manifest system) is migrating to native Zod validation, this file is fully obsolete and will be removed to keep the codebase clean.

## Verification Plan

### Automated Tests
- Run `npm run validate` to ensure no linting, TS compilation, or import errors are introduced after the rename and refactoring.

### Manual Verification
- In the browser, navigate to a Canvas Onboarding URL (e.g. `http://localhost:3000/it/canvas`) and verify that the layout displays as two distinct, full-height columns with alternating dotted backgrounds that invert automatically when toggling light/dark mode.
- Log in to a fresh Google account without an organization payload to reach the `/onboarding` page. Ensure `OrganizationOnboarding` renders smoothly.
- Test native UI validation: Submit the form totally blank, with an invalid VAT, or an incomplete date. Verify that Zod intercepts the submission and presents localized inline error messages immediately without an extra network request to the orchestrator.
- Fill the form correctly and submit to verify that the `onboard_organization` orchestrator action still succeeds and redirects the user inside the main dashboard.
