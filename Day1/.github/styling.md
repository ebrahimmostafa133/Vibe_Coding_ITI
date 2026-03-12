# Styling Guidelines: Sorting Visualizer

The Sorting Visualizer must look good but you DO NOT use complex styles. Stick to the absolute basics of CSS. Separate the styles completely from the HTML and JS logic.

## 1. Color Palette (Dark Theme)
- **Background**: Deep, premium dark mode. Use shades like `#0f172a` (slate-900) or `#111827` (gray-900).
- **Text**: Contrast text with `#f8fafc` (slate-50) for headings and `#94a3b8` (slate-400) for secondary text.
- **Primary Accent**: Electric neon or vibrant colors.
  - Buttons: A gradient combining purple and cyan (e.g., `#8b5cf6` to `#06b6d4`).
- **Array Bars**: 
  - **Default**: Cyan (`#06b6d4`) or vibrant blue (`#3b82f6`).
  - **Comparing**: Yellow (`#eab308`) to indicate active observation.
  - **Swapping**: Red (`#ef4444`) to indicate movement.
  - **Sorted**: Neon Green (`#22c55e`) to indicate completion.

## 2. Typography
- Use modern sans-serif fonts such as Google Fonts 'Inter', 'Outfit', or 'Poppins'.
- Use distinct font weights: Bold (700) for titles, Medium (500) for buttons and labels.

## 3. UI Components
- **Buttons / Controls**:
  - Glassmorphism effect: Semi-transparent background with a subtle backdrop blur (`backdrop-filter: blur(10px)`).
  - Borders should be subtle (`1px solid rgba(255,255,255,0.1)`).
  - Hover effects: Scale up slightly (`transform: scale(1.05)`), increase brightness, and add a soft box-shadow glow based on the button color.
  - Active states: Scale down (`transform: scale(0.95)`).

## 4. Layout & Spacing
- Use Flexbox or CSS Grid for a robust, responsive layout.
- Center the main visualizer frame in the viewport.
- The control panel should sit above or below the bars neatly, possibly in a floating container with rounded corners.

## 5. Animations & Transitions
- Elements transitions: Apply smooth CSS transitions (`transition: all 0.3s ease`) to buttons, sliders, and bar color changes.
- Array bars: Animate colors smoothly, but height changes should happen instantly or with very minimal transitions to not visibly disrupt the sorting step logic.
