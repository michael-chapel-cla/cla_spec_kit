# Accessibility Audit Rules

> Load this file before auditing the React SPA (`web-<app-name>/`). Rules are based on WCAG 2.1 AA and MUI v6 conventions. All rules are auditable from source without a running browser.

---

## Quick Reference — All Rules

| #     | Rule                                                              | Severity | Standard     |
| ----- | ----------------------------------------------------------------- | -------- | ------------ |
| AX01  | Interactive element not reachable by keyboard                     | HIGH     | WCAG 2.1.1   |
| AX02  | `<img>` missing `alt` attribute                                   | HIGH     | WCAG 1.1.1   |
| AX03  | Form input missing associated label                               | HIGH     | WCAG 1.3.1   |
| AX04  | Icon-only button missing `aria-label`                             | HIGH     | WCAG 4.1.2   |
| AX05  | Error message not associated with its input via `aria-describedby` | HIGH    | WCAG 1.3.1   |
| AX06  | Color used as sole means of conveying information                 | MEDIUM   | WCAG 1.4.1   |
| AX07  | Focus not managed after modal or dialog opens                     | MEDIUM   | WCAG 2.4.3   |
| AX08  | `tabIndex` value greater than 0                                   | MEDIUM   | WCAG 2.4.3   |
| AX09  | `<dialog>` / MUI Dialog missing `aria-labelledby`                 | MEDIUM   | WCAG 4.1.2   |
| AX10  | MUI Tabs missing `aria-controls` / `id` linkage on Tab + TabPanel | MEDIUM  | WCAG 4.1.2   |
| AX11  | MUI DataGrid column definition missing `headerName`               | MEDIUM   | WCAG 1.3.1   |
| AX12  | Page has no `<main>` landmark or `role="main"`                    | LOW      | WCAG 1.3.6   |
| AX13  | Heading levels skipped (e.g. h1 → h3)                             | LOW      | WCAG 1.3.1   |
| AX14  | Focus indicator removed via `outline: none` with no replacement   | HIGH     | WCAG 2.4.7   |
| AX15  | `aria-hidden="true"` applied to an element that can receive focus | HIGH     | WCAG 4.1.2   |

---

## AX01 — Keyboard Reachability

**Severity**: HIGH | **WCAG**: 2.1.1 Keyboard

All interactive elements must be operable via keyboard. A `<div>` or `<span>` with an `onClick` handler is not keyboard-reachable by default.

### Detect

```bash
grep -rn 'onClick' src/pages/ src/components/ --include='*.tsx' -B2 | \
  grep -E '<div |<span ' | grep -v 'role=\|tabIndex\|<button\|<a '
```

### ❌ NEVER

```tsx
<div onClick={handleSelect}>Select</div>   // not focusable, no role
<span onClick={openMenu}>Menu</span>       // not keyboard-reachable
```

### ✅ ALWAYS

Use a semantically correct element that is natively keyboard-operable:

```tsx
<button onClick={handleSelect}>Select</button>   // ✅ natively focusable
<button onClick={openMenu}>Menu</button>          // ✅

// If a div/span is unavoidable (e.g. custom drag target):
<div role="button" tabIndex={0} onClick={handleSelect}
     onKeyDown={(e) => e.key === 'Enter' && handleSelect()}>
  Select
</div>
```

---

## AX02 — Images Must Have Alt Text

**Severity**: HIGH | **WCAG**: 1.1.1 Non-text Content

Every `<img>` element needs an `alt` attribute. Decorative images use `alt=""` (empty string, not missing).

### Detect

```bash
grep -rn '<img ' src/ --include='*.tsx' | grep -v 'alt='
```

### ❌ NEVER

```tsx
<img src={logo} />                         // missing alt entirely
<Avatar src={user.photoUrl} />             // MUI Avatar — missing alt
```

### ✅ ALWAYS

```tsx
<img src={logo} alt="Acme Corp logo" />              // ✅ descriptive
<img src={divider} alt="" role="presentation" />     // ✅ decorative — empty alt
<Avatar src={user.photoUrl} alt={user.displayName} /> // ✅ MUI Avatar with alt
```

---

## AX03 — Form Inputs Must Have Labels

**Severity**: HIGH | **WCAG**: 1.3.1 Info and Relationships

Every form field must be associated with a visible or accessible label. Placeholder text is not a substitute for a label.

### Detect

```bash
grep -rn '<TextField\|<Select\|<Checkbox\|<RadioGroup' src/ --include='*.tsx' | grep -v 'label='
grep -rn '<input ' src/ --include='*.tsx' | grep -v 'aria-label\|aria-labelledby\|<label'
```

### ❌ NEVER

```tsx
<TextField placeholder="Enter amount" />           // no label — disappears on focus
<input type="text" placeholder="Search" />         // no associated label
```

### ✅ ALWAYS

```tsx
<TextField label="Amount (£)" required />                  // ✅ MUI provides label
<TextField label="Search" inputProps={{ 'aria-label': 'Search expenses' }} /> // ✅

// Native input:
<label htmlFor="amount-input">Amount (£)</label>
<input id="amount-input" type="number" />
```

---

## AX04 — Icon-Only Buttons Must Have `aria-label`

**Severity**: HIGH | **WCAG**: 4.1.2 Name, Role, Value

A button that contains only an icon (SVG or MUI SvgIcon) with no visible text has no accessible name. Screen readers will announce "button" with no context.

### Detect

```bash
# IconButton with no aria-label
grep -rn '<IconButton' src/ --include='*.tsx' | grep -v 'aria-label\|aria-labelledby'

# Tooltip wrapping IconButton is acceptable if the IconButton still has aria-label
```

### ❌ NEVER

```tsx
<IconButton onClick={handleDelete}>
  <DeleteIcon />
</IconButton>
```

### ✅ ALWAYS

```tsx
<IconButton aria-label="Delete expense" onClick={handleDelete}>
  <DeleteIcon />
</IconButton>

// Tooltip does NOT replace aria-label — tooltips are not available to keyboard-only users
// who rely on screen readers without a pointing device:
<Tooltip title="Delete expense">
  <IconButton aria-label="Delete expense" onClick={handleDelete}>  {/* ✅ both */}
    <DeleteIcon />
  </IconButton>
</Tooltip>
```

---

## AX05 — Error Messages Must Be Programmatically Associated

**Severity**: HIGH | **WCAG**: 1.3.1 Info and Relationships

Displaying an error message visually near an input is not sufficient. Screen readers must be told which input the error describes via `aria-describedby`.

### Detect

```bash
grep -rn 'helperText\|FormHelperText\|error' src/ --include='*.tsx' -B3 | \
  grep -v 'aria-describedby\|helperText.*prop\|TextField.*error'
```

### ❌ NEVER

```tsx
<TextField value={amount} />
{error && <Typography color="error">Amount is required</Typography>}
// Error is visible but not linked to the input
```

### ✅ ALWAYS

```tsx
// MUI TextField handles this automatically when you pass helperText + error:
<TextField
  label="Amount"
  value={amount}
  error={!!error}
  helperText={error ?? ' '}   // ✅ MUI renders aria-describedby automatically
/>

// For custom cases:
<input id="amount" aria-describedby="amount-error" />
<span id="amount-error" role="alert">{error}</span>
```

---

## AX06 — Color Must Not Be the Only Differentiator

**Severity**: MEDIUM | **WCAG**: 1.4.1 Use of Color

Status indicators, chart legends, or validation states that communicate meaning purely through color exclude users with color-vision deficiencies.

### ❌ NEVER

```tsx
// Red text alone for errors, green for success — no icon, no text label
<Typography color={status === 'approved' ? 'green' : 'red'}>{status}</Typography>
```

### ✅ ALWAYS

Pair color with an icon, text label, or pattern:

```tsx
// ✅ color + icon + text
{status === 'approved'
  ? <Chip icon={<CheckCircleIcon />} label="Approved" color="success" />
  : <Chip icon={<CancelIcon />} label="Rejected" color="error" />
}

// ✅ in a DataGrid column — use renderCell for status columns
{
  field: 'status',
  headerName: 'Status',
  renderCell: (params) => (
    <Chip
      label={params.value}
      color={params.value === 'Approved' ? 'success' : 'error'}
      icon={params.value === 'Approved' ? <CheckCircleIcon /> : <CancelIcon />}
    />
  ),
}
```

---

## AX07 — Focus Management on Modal Open

**Severity**: MEDIUM | **WCAG**: 2.4.3 Focus Order

When a dialog or modal opens, focus must move inside it. MUI Dialog handles this automatically — do not override it with `disableAutoFocus` or `disableEnforceFocus`.

### Detect

```bash
grep -rn 'disableAutoFocus\|disableEnforceFocus\|disableRestoreFocus' src/ --include='*.tsx'
```

### ❌ NEVER

```tsx
<Dialog open={open} disableAutoFocus disableEnforceFocus>
  ...
</Dialog>
```

### ✅ ALWAYS

```tsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Confirm Deletion</DialogTitle>
  <DialogContent>...</DialogContent>
  <DialogActions>
    <Button onClick={handleClose} autoFocus>Cancel</Button>  {/* ✅ first focusable element */}
    <Button onClick={handleConfirm} color="error">Delete</Button>
  </DialogActions>
</Dialog>
```

---

## AX08 — No `tabIndex` Greater Than 0

**Severity**: MEDIUM | **WCAG**: 2.4.3 Focus Order

`tabIndex > 0` creates a custom tab order that diverges from the DOM order, breaking keyboard navigation for users who expect a consistent linear flow.

### Detect

```bash
grep -rn 'tabIndex={[1-9]\|tabIndex="[1-9]' src/ --include='*.tsx'
```

### ❌ NEVER

```tsx
<Button tabIndex={2}>Submit</Button>   // jumps ahead of other focusable elements
<div tabIndex={1} role="button">Click</div>
```

### ✅ ALWAYS

```tsx
<Button tabIndex={0}>Submit</Button>   // natural DOM order — or omit tabIndex entirely
```

---

## AX09 — Dialogs Must Have an Accessible Name

**Severity**: MEDIUM | **WCAG**: 4.1.2 Name, Role, Value

Screen readers announce the dialog name when focus enters it. Without `aria-labelledby`, the user has no context for what dialog has opened.

### Detect

```bash
grep -rn '<Dialog' src/ --include='*.tsx' | grep -v 'aria-labelledby\|aria-label'
```

### ✅ ALWAYS

```tsx
<Dialog open={open} aria-labelledby="confirm-delete-title">
  <DialogTitle id="confirm-delete-title">Confirm Deletion</DialogTitle>
  ...
</Dialog>
```

The `id` on `DialogTitle` and `aria-labelledby` on `Dialog` must match.

---

## AX10 — MUI Tabs Must Link Tabs to TabPanels

**Severity**: MEDIUM | **WCAG**: 4.1.2 Name, Role, Value

Each `<Tab>` must have a unique `id` and an `aria-controls` pointing to the corresponding `TabPanel`'s `id`. Each `TabPanel` must have a matching `aria-labelledby`.

### ❌ NEVER

```tsx
<Tabs value={tab}><Tab label="Details" /><Tab label="History" /></Tabs>
<div role="tabpanel">{tab === 0 && <Details />}</div>
```

### ✅ ALWAYS

```tsx
function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

<Tabs value={tab}>
  <Tab label="Details" {...a11yProps(0)} />
  <Tab label="History" {...a11yProps(1)} />
</Tabs>

<Box role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0" hidden={tab !== 0}>
  <Details />
</Box>
<Box role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1" hidden={tab !== 1}>
  <History />
</Box>
```

---

## AX11 — DataGrid Columns Must Have `headerName`

**Severity**: MEDIUM | **WCAG**: 1.3.1 Info and Relationships

A DataGrid column definition with only `field` has no accessible column header. Screen readers will announce the raw field name (e.g. `createdOn`), not a human-readable label.

### Detect

```bash
grep -rn '{ field:' src/ --include='*.tsx' | grep -v 'headerName'
```

### ❌ NEVER

```typescript
const columns: GridColDef[] = [
  { field: 'id', width: 70 },                    // no headerName
  { field: 'createdOn', type: 'dateTime' },       // screen reader says "createdOn"
];
```

### ✅ ALWAYS

```typescript
const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'createdOn', headerName: 'Created', type: 'dateTime', width: 160 },
];
```

---

## AX12 — Page Must Have a `<main>` Landmark

**Severity**: LOW | **WCAG**: 1.3.6 Identify Purpose

Landmarks allow screen reader users to skip directly to main content. Every page must wrap its primary content in a `<main>` element.

### Detect

```bash
grep -rn 'export default function' src/pages/ --include='*.tsx' -A 20 | grep -v '<main\|role="main'
```

### ✅ ALWAYS

```tsx
export default function ExpenseList() {
  return (
    <main>
      <Typography variant="h1">My Expenses</Typography>
      ...
    </main>
  );
}
```

MUI's `Container` and `Box` do not add a `<main>` role. Wrap with `<main>` or `<Box component="main">`.

---

## AX13 — Do Not Skip Heading Levels

**Severity**: LOW | **WCAG**: 1.3.1 Info and Relationships

Heading levels must be sequential. Jumping from `h1` to `h3` breaks the document outline and confuses screen reader users navigating by heading.

### Detect

```bash
grep -rn 'variant="h[1-6]"' src/pages/ --include='*.tsx'
# Review manually: check that each page has h1, then h2, then h3 — no gaps
```

### ❌ NEVER

```tsx
<Typography variant="h1">Expenses</Typography>
<Typography variant="h3">This Month</Typography>  {/* ❌ skips h2 */}
```

### ✅ ALWAYS

```tsx
<Typography variant="h1">Expenses</Typography>
<Typography variant="h2">This Month</Typography>
<Typography variant="h3">Submitted</Typography>
```

Visual size can be decoupled from semantic level using `component`:

```tsx
<Typography variant="h4" component="h2">Section title styled as h4</Typography>
```

---

## AX14 — Do Not Remove Focus Indicator Without Replacement

**Severity**: HIGH | **WCAG**: 2.4.7 Focus Visible

Removing the browser's default focus outline without providing a visible alternative makes keyboard navigation impossible for sighted keyboard users.

### Detect

```bash
grep -rn 'outline.*none\|outline: 0' src/ --include='*.tsx' --include='*.ts' --include='*.css'
```

### ❌ NEVER

```css
*:focus { outline: none; }           /* removes focus for all elements */
button:focus { outline: 0; }         /* removes focus on buttons */
```

```tsx
<Box sx={{ '&:focus': { outline: 'none' } }}>...</Box>   // ❌
```

### ✅ ALWAYS

If the default outline is visually inconsistent with the design, replace it with an equivalent visible indicator:

```tsx
<Box sx={{
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
}}>
```

The `claTheme` from `lib-seamlesscomponents-react` includes focus-visible styles — do not override them.

---

## AX15 — `aria-hidden` Elements Must Not Be Focusable

**Severity**: HIGH | **WCAG**: 4.1.2 Name, Role, Value

`aria-hidden="true"` hides an element from the accessibility tree. If a hidden element can receive keyboard focus, screen readers will encounter a focusable element with no name, role, or description — confusing and inaccessible.

### Detect

```bash
grep -rn 'aria-hidden="true"' src/ --include='*.tsx' -B2 -A2 | \
  grep -E 'tabIndex|button|input|a href|<Button|<Link'
```

### ❌ NEVER

```tsx
<div aria-hidden="true">
  <button onClick={closeMenu}>×</button>   {/* ❌ focusable inside aria-hidden */}
</div>
```

### ✅ ALWAYS

If the element must be hidden from AT, ensure nothing inside it is focusable:

```tsx
<div aria-hidden="true" style={{ display: 'none' }}>   {/* ✅ not in tab order */}
  <span>decorative only</span>
</div>

// Or keep the close button accessible and hide the container differently:
<Box sx={{ visibility: 'hidden' }}>   // ✅ visibility:hidden removes from AT and tab order
```

---

## Audit Checklist

When auditing `web-<app-name>/src/`:

1. No `<div onClick>` or `<span onClick>` without `role` and `tabIndex={0}`
2. All `<img>` elements have `alt` attribute (empty string for decorative)
3. All MUI `TextField`, `Select`, `Checkbox`, `RadioGroup` have `label` prop
4. All `<IconButton>` components have `aria-label`
5. Error messages use MUI `helperText` + `error` props (not standalone text)
6. Status indicators use icon + text, not color alone
7. No `disableAutoFocus` or `disableEnforceFocus` on MUI Dialog
8. No `tabIndex` values > 0
9. All `<Dialog>` elements have `aria-labelledby` matching a `DialogTitle` id
10. All MUI `Tab` components have `id` and `aria-controls`; all TabPanels have `aria-labelledby`
11. All DataGrid column definitions have `headerName`
12. Every page has a `<main>` element wrapping primary content
13. No `outline: none` without a `focus-visible` replacement
14. No focusable elements inside `aria-hidden="true"` containers
