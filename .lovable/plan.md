
## Plan

Three focused changes — all frontend, no backend/business-logic edits.

### 1. `src/components/workspace/FloatingAssistant.tsx` — restyle bubble + panel
- Minimized bubble: 60×60 circle pinned to `bottom: 0; right: 0` (flush corner, as requested) with `linear-gradient(135deg, #0D1B2A, #000000)` inline style, white 💬 icon, white ring, hover scale, focus ring.
- Remove the drag-to-move and persisted x/y position (since the spec mandates a fixed corner). Keep Alt+A shortcut and Esc-to-close.
- Expanded panel: same dark-blue→black gradient header, anchored bottom-right (400×560), still resizable from top-left grip.
- Header keeps: Clear Chat (trash icon, with confirm) and Close (X) buttons. ARIA labels preserved.
- Keep existing tutor/quick/exam mode tabs and `AssistantChat` body untouched.

### 2. New `src/components/PremiumButton.tsx` + mount in `src/routes/index.tsx` header
- Gold button (`#FFD700` bg, black bold text) labeled "Upgrade to Premium" with crown icon.
- Click → placeholder `toast` ("Premium checkout coming soon") for now; later swap for Razorpay/Paytm URL (single TODO comment).
- Tooltip lists premium benefits (debugging, optimization, runtime analysis, progress tracking, multi-language, analytics).
- Mounted in the existing workspace header area in `src/routes/index.tsx` — NOT inside the chat panel.

### 3. Desktop/tablet-only gate
- New `src/components/MobileBlock.tsx`: full-screen message "This workspace is optimized for tablets and desktops. Please open it on a larger screen." shown when viewport width < 768px (reuses existing `useIsMobile` hook).
- Wrap the route in `src/routes/index.tsx`: if mobile → render `<MobileBlock />`, else render the workspace. Bubble and Premium button only render in the non-mobile branch.

### Technical notes
- Pure presentation; no changes to `AssistantChat`, server functions, `ai.functions.ts`, or styles.css.
- The runtime "Element type is invalid" error is unrelated to this task (ReactMarkdown ESM default-export issue in `AssistantChat`); flagging it but leaving out of scope unless you want it fixed in the same turn.
- No payment SDK, no new dependencies.

### Out of scope (Phase 4/5/6 features listed as "benefits")
Debugging tools, optimization hints, runtime analysis, progress tracking, multi-language, analytics — none implemented now; they're advertised in the Premium tooltip only.

### Verification
- Bubble flush at bottom-right with new gradient; click expands chat; Clear + Close work; Alt+A toggles; Esc closes.
- Gold Premium button visible in header; click shows placeholder toast.
- Resizing viewport below 768px shows the MobileBlock screen.
