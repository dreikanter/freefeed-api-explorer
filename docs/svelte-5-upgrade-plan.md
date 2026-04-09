# Svelte 5 Upgrade Plan

Migration plan for upgrading freefeed-api-explorer from Svelte 4 to Svelte 5.

## Current State

- **Svelte:** `^4.2.0`
- **SvelteKit:** `^2.57.0`
- **@sveltejs/vite-plugin-svelte:** `^3.1.2`
- **@sveltejs/adapter-static:** `^3.0.10`
- **Svelte components:** 13 `.svelte` files (7 components + 6 route pages)
- **Third-party Svelte dep:** `@zerodevx/svelte-json-view@^1.0.11` (already supports Svelte 5)

## Migration Strategy

Use the official `npx sv migrate svelte-5` tool for automated conversion, then manually review and fix what it can't handle. Svelte 5 supports Svelte 4 syntax in compatibility mode, so the migration can be done incrementally.

---

## Step 1: Upgrade Dependencies

Update `package.json`:

| Package                        | Current   | Target        |
| ------------------------------ | --------- | ------------- |
| `svelte`                       | `^4.2.0`  | `^5.0.0`      |
| `@sveltejs/kit`                | `^2.57.0` | latest `^2.x` |
| `@sveltejs/vite-plugin-svelte` | `^3.1.2`  | `^5.0.0`      |
| `@sveltejs/adapter-static`     | `^3.0.10` | latest `^3.x` |
| `svelte-check`                 | `^4.4.6`  | latest        |
| `eslint-plugin-svelte`         | `^3.17.0` | latest        |
| `prettier-plugin-svelte`       | `^3.1.0`  | latest        |

**Tasks:**

1. Run `npx sv migrate svelte-5` to bump core deps automatically
2. Run `npm install`
3. Run `npm run build` and `npm run check` to verify the project compiles in compat mode

**Commit:** `Upgrade Svelte and SvelteKit dependencies to v5`

---

## Step 2: Convert Props (`export let` to `$props()`)

7 prop declarations across 5 components need conversion.

| File                     | Props                                                 |
| ------------------------ | ----------------------------------------------------- |
| `ResponseStatus.svelte`  | `status: number`                                      |
| `RequestListItem.svelte` | `endpoint`, `isSelected` (default), `onClick`         |
| `Response.svelte`        | `request` (default `null`)                            |
| `NavigationBar.svelte`   | `currentPage` (default)                               |
| `TokenModal.svelte`      | exported `show()` function (needs `bind:this` review) |

**Pattern:**

```svelte
// Before
export let status: number;
export let isSelected: boolean = false;

// After
let { status, isSelected = false }: { status: number; isSelected?: boolean } = $props();
```

**Tasks:**

1. Convert each component's `export let` to `$props()` destructuring
2. Review `TokenModal.svelte`'s exported `show()` function — ensure it works with Svelte 5's component API
3. Run `npm run check` after each file

**Commit:** `Convert export let props to $props() rune`

---

## Step 3: Convert Reactive Declarations (`$:` to `$derived` / `$effect`)

9 reactive declarations across 4 files.

### Use `$derived` (computed values):

| File                     | Declaration                                             |
| ------------------------ | ------------------------------------------------------- |
| `ResponseStatus.svelte`  | `$: statusInfo = getStatusInfo(status)`                 |
| `RequestListItem.svelte` | `$: selectedTextClass = isSelected ? 'text-light' : ''` |
| `RequestsPage.svelte`    | `$: endpointResponse = ...`                             |
| `RequestsPage.svelte`    | `$: tokensByInstance = ...`                             |
| `Response.svelte`        | `$: parsedResponseBody = ...`                           |

### Use `$effect` (side effects):

| File                   | Declaration                                           |
| ---------------------- | ----------------------------------------------------- |
| `RequestsPage.svelte`  | `$: { filteredEndpoints = ... }` (filter side effect) |
| `RequestsPage.svelte`  | `$: { const endpointParam = ... }` (URL sync)         |
| `history/+page.svelte` | `$: { if (!isNavigating) ... }` (navigation sync)     |

**Pattern:**

```svelte
// Before
$: doubled = count * 2;
$: { console.log(count); }

// After
let doubled = $derived(count * 2);
$effect(() => { console.log(count); });
```

**Tasks:**

1. Convert computed values to `$derived()` or `$derived.by(() => ...)` for complex expressions
2. Convert side effects to `$effect()`
3. Pay special attention to `RequestsPage.svelte` — it has the most complex reactive logic
4. Run `npm run check` after each file

**Commit:** `Convert reactive declarations to $derived and $effect runes`

---

## Step 4: Convert Event Handlers (`on:` to native attributes)

12+ event directives across 5 files.

| File                     | Count | Events                  |
| ------------------------ | ----- | ----------------------- |
| `RequestListItem.svelte` | 1     | `on:click`              |
| `RequestsPage.svelte`    | 5     | `on:click`, `on:change` |
| `TokenModal.svelte`      | 1     | `on:click`              |
| `TokensPage.svelte`      | 3     | `on:click`              |
| `history/+page.svelte`   | 1     | `on:click`              |

**Pattern:**

```svelte
// Before
<button on:click={handler}>

// After
<button onclick={handler}>
```

**Tasks:**

1. Replace `on:click` with `onclick`, `on:change` with `onchange`, etc.
2. Run `npm run check`

**Commit:** `Convert on: event directives to native event attributes`

---

## Step 5: Convert Lifecycle Hooks

2 lifecycle hooks in `RequestsPage.svelte`.

| Hook                                         | Replacement                                                   |
| -------------------------------------------- | ------------------------------------------------------------- |
| `onMount(() => { initHighlight() })`         | `$effect(() => { initHighlight() })` with appropriate cleanup |
| `afterUpdate(() => { hljs.highlightAll() })` | `$effect(() => { hljs.highlightAll() })`                      |

**Tasks:**

1. Replace `onMount` / `afterUpdate` with `$effect`
2. Ensure highlight.js re-runs when response content changes (may need to read reactive dependencies explicitly)
3. Run `npm run check`

**Commit:** `Convert lifecycle hooks to $effect rune`

---

## Step 6: Convert Slots to Snippets

2 slot usages.

| File                     | Slot                           |
| ------------------------ | ------------------------------ |
| `RequestListItem.svelte` | `<slot name="side-content" />` |
| `+layout.svelte`         | `<slot />` (default)           |

**Pattern:**

```svelte
// Before (parent)
<Component><span slot="side-content">...</span></Component>

// After (child definition)
{#snippet sideContent()}<span>...</span>{/snippet}
// or via render prop: let {sideContent} = $props(); // then: {@render sideContent?.()}

// Before (layout)
<slot />

// After
{@render children()}
```

**Tasks:**

1. Convert `+layout.svelte` default slot to `{@render children()}`
2. Convert `RequestListItem.svelte` named slot to snippet prop
3. Update all call sites that pass slot content
4. Run `npm run check`

**Commit:** `Convert slots to Svelte 5 snippets`

---

## Step 7: Review Store Usage

The `$store` auto-subscription syntax still works in Svelte 5. The stores in `stores.ts` use `writable`/`derived` from `svelte/store`, which remain supported.

**Tasks:**

1. Verify all `$store` template subscriptions work correctly after upgrade
2. Verify `bind:value={$store}` bindings work (may need adjustment)
3. Optionally: consider migrating to `$state` runes in a future follow-up (not required for this upgrade)

**Commit:** (no commit — verification only, unless fixes needed)

---

## Step 8: Update Linting and Formatting Config

**Tasks:**

1. Verify `eslint-plugin-svelte` works with Svelte 5 syntax
2. Verify `prettier-plugin-svelte` formats Svelte 5 syntax correctly
3. Run `npm run lint` and `npm run format`
4. Fix any config issues

**Commit:** `Update linting and formatting config for Svelte 5` (if changes needed)

---

## Step 9: Final Verification

**Tasks:**

1. `npm run check` — type checking passes
2. `npm run lint` — no lint errors
3. `npm run build` — production build succeeds
4. `npm run preview` — app loads and works correctly
5. `npm run test` — all tests pass
6. Manual smoke test: navigate all pages, execute an API request, manage tokens, check history

---

## Files Changed (by impact)

### High impact (complex reactive logic)

- `src/lib/components/RequestsPage.svelte` — props, 4 reactive declarations, 5 events, 2 lifecycle hooks
- `src/routes/history/+page.svelte` — reactive side effect, event, navigation sync

### Medium impact

- `src/lib/components/RequestListItem.svelte` — 3 props, 1 reactive, 1 event, 1 named slot
- `src/lib/components/TokenModal.svelte` — exported function, bindings, event
- `src/lib/components/TokensPage.svelte` — events, store subscriptions
- `src/lib/components/Response.svelte` — 1 prop, 1 reactive
- `src/routes/+layout.svelte` — default slot conversion

### Low impact (minimal or no changes)

- `src/lib/components/ResponseStatus.svelte` — 1 prop, 1 reactive
- `src/lib/components/NavigationBar.svelte` — 1 prop
- `src/routes/+page.svelte` — minimal
- `src/routes/requests/+page.svelte` — wrapper
- `src/routes/tokens/+page.svelte` — wrapper
- `src/routes/about/+page.svelte` — static content

### Non-Svelte files (no migration)

- `src/lib/stores.ts` — Svelte stores remain compatible; no changes required
- `src/lib/types.ts` — pure TypeScript
- `src/lib/api-endpoints.ts` — pure TypeScript

## Risks

1. **`afterUpdate` replacement** — The highlight.js `afterUpdate` hook in `RequestsPage.svelte` needs careful handling to ensure syntax highlighting still triggers at the right time.
2. **Exported function in `TokenModal.svelte`** — The `export function show()` pattern may need adjustment for Svelte 5's component instance API.
3. **Store bindings** — `bind:value={$store}` should work but needs testing.
4. **`svelte-json-view`** — Already declares Svelte 5 peer dep support, but should be tested.
