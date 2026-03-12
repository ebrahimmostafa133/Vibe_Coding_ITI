# Sorting Algorithms Visualizer Instructions

Generate a web application that visualizes sorting algorithms using HTML, CSS, and Vanilla JavaScript.

## Core Requirements
1. **Structure (`index.html`)**:
   - Header with title "Sorting Visualizer".
   - Controls container with:
     - "Generate New Array" button.
     - Slider for array size.
     - Slider for sorting speed.
     - Buttons for algorithms: Bubble Sort, Merge Sort, Quick Sort, Insertion Sort, Selection Sort.
   - Main visualization container to hold the generated array bars.

2. **Styling (`style.css`)**:
   - Follow the detailed aesthetics and guidelines described in `styling.md`.
   - Ensure the application is fully responsive.

3. **Logic (`script.js`)**:
   - Variables for array state, size, and speed.
   - Function to generate and render a random array of bars.
   - Implement sorting algorithms as asynchronous functions using simple `for` and `while` loops. 
   - **Do NOT** use complex abstractions, advanced array methods, or overly clever logic. Keep the code straightforward and easy to read for beginners.
   - Use `await new Promise(resolve => setTimeout(resolve, delay))` to create the visualization effect.
   - Update bar heights and colors dynamically during comparisons and swaps.

## Implementation Steps
1. Create and structure `index.html`.
2. Apply styles as per `styling.md` in `style.css`.
3. Write `script.js` to handle random array generation and DOM rendering.
4. Implement one sorting algorithm (e.g., Bubble Sort) to test the visualization logic.
5. Add the remaining sorting algorithms.
6. Disable control buttons during active sorting to prevent conflicts.
