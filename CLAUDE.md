# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc`) then build for production into `dist/`
- `npm run lint` — ESLint over `ts`/`tsx`; configured with `--max-warnings 0`, so any warning fails the lint
- `npm run preview` — serve the production build locally

There is no test suite in this project.

## Architecture

Single-page React 18 + TypeScript app (Vite) for managing student→brigade→venue assignments at an event. Backend is entirely Firebase (Firestore + Auth); there is no custom server and no environment variables — Firebase config is hardcoded in [src/lib/firebase.ts](src/lib/firebase.ts).

### Two audiences, one app
- **Public student portal** — [src/pages/HomePage.tsx](src/pages/HomePage.tsx) at `/`. A student enters their roll number and gets their brigade number, lead contact, and venue. No auth. A catch-all `*` route renders [NotFound.tsx](src/pages/NotFound.tsx).
- **Admin console** — everything under `/admin/*`, gated by [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) (redirects to `/admin/login` when unauthenticated). `/admin` itself redirects to dashboard-or-login based on auth. Sidebar = **Dashboard · Students · Brigades · Users**. Routes are declared in [src/App.tsx](src/App.tsx).
  - [StudentsPage.tsx](src/pages/StudentsPage.tsx) / [BrigadesPage.tsx](src/pages/BrigadesPage.tsx): paginated tables with add/edit modals, per-row + delete-all confirmations, and a "Bulk Upload" button linking to `/admin/{students,brigades}/upload`. These replaced the old `DataManagement` and `StudBrigManagement` pages (now deleted); legacy paths redirect here.
  - [UserManagement.tsx](src/pages/UserManagement.tsx) at `/admin/users`: full CRUD + change-password UI over [src/lib/userService.ts](src/lib/userService.ts). **Firebase Auth users cannot be administered from the browser** — the service throws `BackendNotConfiguredError` until Admin-SDK Cloud Functions are deployed and `USER_BACKEND_READY` is flipped to `true`. The page shows a "backend not connected" banner in that state.

### Provider nesting (order matters)
`FirebaseProvider` → `AuthProvider` → `Router` (see [src/App.tsx](src/App.tsx)). `AuthProvider` renders `{!loading && children}`, so nothing mounts until the initial `onAuthStateChanged` resolves — this prevents a flash of the login redirect on refresh.

### Firebase access pattern (important gotcha)
The SDK usage is mixed and this is intentional/load-bearing:
- [src/lib/firebase.ts](src/lib/firebase.ts) initializes via the **compat** API (`firebase/compat/app`) and exports `db` and `auth`.
- Page components import **modular** v9 functions (`collection`, `query`, `where`, `getDocs`, `doc`, `setDoc`, `deleteDoc` from `firebase/firestore`; auth helpers from `firebase/auth`) and pass the `db`/`auth` from context into them.
- Always obtain `db`/`auth` through `useFirebase()` ([src/contexts/FirebaseContext.tsx](src/contexts/FirebaseContext.tsx)), not by importing from `lib/firebase` directly in pages. Auth actions go through `useAuth()` ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)).

### Firestore data model
Two top-level collections; the roll/brigade number is the **document ID** (uploads use `setDoc(doc(db, ...))`, so re-uploading the same ID overwrites):
- `students`: `{ stdroll, stdname, stdbg }` — `stdbg` is the brigade number linking to a brigade.
- `brigades`: `{ bnameno, blname, blno, venue }`.

HomePage resolves a lookup in two hops: query `students` by roll → take `stdbg` → query `brigades` by that number → show venue/lead.

### Pagination (cost control for 1000+ rows)
Admin tables never fetch a whole collection. [src/hooks/usePaginatedCollection.ts](src/hooks/usePaginatedCollection.ts) does Firestore cursor pagination (`orderBy` + `limit` + `startAfter`, 20/page, page-size selector), with `getCountFromServer` for the total. The tables' exact-key search does a single `getDoc` by document ID rather than a query. `refresh()` re-reads the current page after a mutation.

### Excel upload flow (parse → review → commit)
Upload pages ([StudentUpload.tsx](src/pages/StudentUpload.tsx), [BrigadeUpload.tsx](src/pages/BrigadeUpload.tsx)) share [src/lib/uploadValidation.ts](src/lib/uploadValidation.ts). Flow: select `.xlsx` → **Analyze** (parse via `sheet_to_json({header:1})`, positional columns; flag missing fields, bad phone numbers, and in-file duplicate keys; cross-check existing keys that would be overwritten) → **Review** report → **Commit** via `writeBatch` (500/batch, progress callback — no artificial per-row delay). `ReviewPanel`/`UploadProgress` are exported from StudentUpload and reused by BrigadeUpload. Prominent "do not close the tab" warnings show during analyze/upload. `batchUpload` uses `setDoc`, so existing IDs are overwritten.

### shadcn/ui component system
UI primitives live in [src/components/ui/](src/components/ui/) (Radix + CVA + `cn` from [src/lib/utils.ts](src/lib/utils.ts)): `button`, `card`, `input`, `label`, `table`, `select`, `dialog` (modals), `alert-dialog` (destructive confirms — replaced all `window.confirm`/`prompt`), `badge`, `pagination-bar`, and `sonner` (the toast system). Toasts come from `@/components/ui/sonner` (`import { toast }`), NOT `react-hot-toast` (removed). Design tokens are HSL CSS vars in [src/index.css](src/index.css) mapped to Tailwind semantic colors (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-destructive`, `bg-success`, …). The Ignite brand logo is served from `public/Ignite.png` (referenced as `/Ignite.png`).

## Conventions
- Path alias `@` → `/src` (configured in [vite.config.ts](vite.config.ts)).
- Styling is Tailwind driven by shadcn semantic tokens (see the component-system note above). [tailwind.config.js](tailwind.config.js) maps the CSS vars to colors, adds the `tailwindcss-animate` plugin, and keeps legacy numeric `primary`/`accent` scales for backward compat. `montserrat` (headings) / `poppins` (body) fonts; richer motion uses `framer-motion`. Legacy `.btn-*`/`.card`/`.input-field` classes remain in `index.css` but new UI should use the `ui/` components.
- User feedback is via `react-hot-toast` (`<Toaster>` mounted once in App.tsx).
- Admin dashboard charts use `recharts`; icons are `lucide-react`.
