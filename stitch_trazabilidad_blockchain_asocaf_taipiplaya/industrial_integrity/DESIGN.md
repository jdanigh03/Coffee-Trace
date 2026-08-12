---
name: Industrial Integrity
colors:
  surface: '#f3faff'
  surface-dim: '#c7dde9'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f6ff'
  surface-container: '#dbf1fe'
  surface-container-high: '#d5ecf8'
  surface-container-highest: '#cfe6f2'
  on-surface: '#071e27'
  on-surface-variant: '#504442'
  inverse-surface: '#1e333c'
  inverse-on-surface: '#dff4ff'
  outline: '#827472'
  outline-variant: '#d3c3c0'
  surface-tint: '#745853'
  primary: '#271310'
  on-primary: '#ffffff'
  primary-container: '#3e2723'
  on-primary-container: '#ae8d87'
  inverse-primary: '#e3beb8'
  secondary: '#1b6d24'
  on-secondary: '#ffffff'
  secondary-container: '#a0f399'
  on-secondary-container: '#217128'
  tertiary: '#001a2f'
  on-tertiary: '#ffffff'
  tertiary-container: '#002f4f'
  on-tertiary-container: '#439ae2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#e3beb8'
  on-primary-fixed: '#2b1613'
  on-primary-fixed-variant: '#5b403c'
  secondary-fixed: '#a3f69c'
  secondary-fixed-dim: '#88d982'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005312'
  tertiary-fixed: '#cfe5ff'
  tertiary-fixed-dim: '#99cbff'
  on-tertiary-fixed: '#001d34'
  on-tertiary-fixed-variant: '#004a78'
  background: '#f3faff'
  on-background: '#071e27'
  surface-variant: '#cfe6f2'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-desktop: 32px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system for this traceability platform is built upon three pillars: **Precision**, **Origin**, and **Immutable Trust**. It balances the organic, earthy nature of the coffee industry with the rigorous, technical demands of blockchain logistics.

The visual style is **Corporate / Modern** with a lean toward **Industrial Functionalism**. It avoids unnecessary decoration in favor of a structured dashboard environment that prioritizes data density and legibility. The interface should feel like a high-precision tool—reliable enough for an export manager and transparent enough for a global buyer.

- **Primary Motif:** Structured data grids and linear process flows.
- **Visual Tone:** Professional, authoritative, and secure.
- **Atmosphere:** A "Clean Room" for agriculture—where tradition meets high-tech verification.

## Colors

The palette is grounded in the physical reality of the product while signaling technical sophistication.

- **Deep Coffee Brown (Primary):** Represents the product, heritage, and the "ground" of the business. Used for primary navigation and key headers.
- **Leaf Green (Secondary):** Denotes agriculture, growth, and "Success" states for blockchain verification.
- **Technical Blue (Tertiary):** Used specifically for blockchain-related elements: hashes, TxIDs, and integrity check indicators.
- **Industrial Gray (Neutral):** Provides the structural framework for data tables, borders, and secondary text.
- **Functional Accents:** High-contrast oranges are reserved for "Pending" or "In Transit" statuses to ensure immediate visibility in the workflow.

## Typography

This design system utilizes **Inter** for all UI elements to ensure maximum readability in high-density data environments. It is a workhorse typeface that remains clear even at small sizes in complex tables.

For technical strings—specifically **Blockchain Hashes, TxIDs, and Batch Numbers**—we introduce **JetBrains Mono**. This monospaced font ensures that every character in a hash is distinct (preventing confusion between '0' and 'O'), reinforcing the system's focus on integrity.

- **Headlines:** Bold and tight-tracking for a strong hierarchy.
- **Data Labels:** Small-caps or bold weights to differentiate from dynamic user data.
- **Technical Strings:** Monospaced and slightly reduced in size to accommodate long hash strings within table cells.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid grid**. The sidebar remains fixed, while the main content area utilizes a 12-column fluid grid for data dashboards.

- **Data Density:** High. Use a base 8px unit for spacing, but allow for 4px increments in dense data tables to maximize information visibility without scrolling.
- **Workflow Stepper:** A horizontal or vertical "Process Track" (as seen in the reference image) must be present at the top of detail views, showing the 8 stages from "Transporte" to "Exportación."
- **Breakpoints:**
  - **Desktop (1280px+):** Full side navigation and multi-column data cards.
  - **Tablet (768px - 1279px):** Collapsed sidebar (icons only), stacked workflow indicators.
  - **Mobile (<767px):** Single column, horizontal-scroll tables, and simplified "Current Stage" status cards.

## Elevation & Depth

To maintain an industrial and professional feel, elevation is used sparingly to define functional zones rather than to simulate physical depth.

- **Z-0 (Canvas):** The base background layer in a light gray (#F8F9FA).
- **Z-1 (Surface):** White cards with a 1px solid border (#CFD8DC). Shadows are avoided here to keep the "Technical" aesthetic clean.
- **Z-2 (Interactive):** Only applied to modals and dropdown menus. Uses a tight, neutral shadow (0px 4px 12px rgba(0,0,0,0.08)) to lift the element above the data layer.
- **Integrity Indicators:** Status badges for "Verified" should use a subtle inner glow or solid fill rather than a drop shadow to indicate they are "stamped" into the record.

## Shapes

The shape language is **Soft (0.25rem)**. 

Sharp corners feel too aggressive for a modern SaaS, but fully rounded "pill" shapes feel too consumer-focused and "playful" for an industrial traceability tool. The 4px (0.25rem) radius provides a professional balance—structured enough to imply a rigid system, but refined enough for a modern web experience.

- **Input Fields:** 4px radius.
- **Action Buttons:** 4px radius.
- **Process Cards:** 8px (rounded-lg) to distinguish them as larger organizational containers.

## Components

### 1. Verification Badges (Blockchain)
These are the most critical unique components. They must display the status of the hash.
- **Status: Verified:** Secondary Green background, white text, "Link" icon. Displays the first 8 characters of the TxID in monospaced font.
- **Status: Syncing:** Tertiary Blue outline, blue text, "Rotating" icon.

### 2. Data Tables
- **Header:** Label-caps typography, neutral gray background.
- **Rows:** Alternating subtle zebra striping for readability in large datasets.
- **Cell Content:** Body-md for text; Code-sm for IDs and Hashes.

### 3. Workflow Stepper
A progress tracker based on the 8 stages identified:
1. Transporte a Planta
2. Recepción
3. Limpieza
4. Trillado/Clasificación
5. Selección Física
6. Almacenamiento
7. Despacho
8. Exportación
- Current stage is highlighted in Primary Brown; completed stages in Secondary Green with a checkmark.

### 4. Technical Inputs
- Input fields for weights (kg), temperature (°C), and moisture (%) must include unit suffixes on the right side of the field to prevent data entry errors.

### 5. Integrity Cards
Summarized cards at the bottom of the dashboard (as per the reference image) that define "Trazabilidad Garantizada" and "Verificación de Integridad" using the Tertiary Blue color to signal security.