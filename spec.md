# Nifty50 Options Analyzer

## Current State
New project. Empty backend, empty frontend.

## Requested Changes (Diff)

### Add
- Full Nifty50 options analyzer app with all features below

### Modify
- N/A

### Remove
- N/A

## Implementation Plan

### Backend
- Store analysis history (up to 50 entries): timestamp, spot, vix, probabilities, weekly/monthly targets
- Store user preferences: last-entered inputs, support/resistance levels
- CRUD for history entries and preferences

### Frontend
1. **Header** – title, auto-refresh badge, countdown timer
2. **Market Inputs card** (left)
   - Spot price, VIX, weekly expiry date, monthly expiry date
   - Option type (Call/Put), premium, strike (optional, auto-ATM if blank)
   - Support level (configurable, default 23000), Resistance level (configurable, default 23500)
   - Update & Analyze button
3. **Probabilities card** (right)
   - Upside / Downside / Volatile percentages
   - Doughnut chart (Chart.js via CDN script tag or npm)
4. **Weekly Expiry Analysis card**
   - Target, Stop-Loss, Delta, Expected Move, POP, R/R, Breakeven, Recommendation
5. **Monthly Expiry Analysis card** (same structure)
6. **Analysis History log** (collapsible table)
   - Last 50 entries: time, spot, VIX, upside%, downside%, volatile%, weekly target, monthly target
   - Clear history button
7. **Persistence** – load saved inputs from backend on mount; save on every analysis run
8. **Auto-refresh** – 15-minute countdown; triggers runAnalysis(); resets on manual refresh

### Probability Logic
- VIX tiers: >28 → volatile 70%; 22-28 → volatile 60%; 18-22 → moderate; 15-18 → bullish; <15 → very bullish
- Spot adjustments using user-configured support/resistance levels (not hardcoded)
- Normalize to 100%

### Target / Stop-Loss Logic
- Expected move = spot × (vix/100) / √252 × 1.2, clamped 40–300
- Delta approx: call = 0.5 - moneyness×5, put = -0.5 - moneyness×5, clamped
- Target = premium + expectedOptionMove × 1.2
- SL = premium - max(expectedOptionMove × 0.6, premium × 0.2)
- POP = (directional + 0.5×volatile) × (0.6 + 0.4×|delta|), clamped 15–85
