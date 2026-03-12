// --- Global Variables ---
let array = [];
let delay = 50;
let isSorting = false;

// --- DOM Elements ---
const container = document.getElementById("visualization-container");
const generateBtn = document.getElementById("generate-array-btn");
const sizeSlider = document.getElementById("array-size");
const speedSlider = document.getElementById("sort-speed");
const speedValueText = document.getElementById("speed-value");

// Buttons
const algButtons = document.querySelectorAll(".alg-btn");
const bubbleBtn = document.getElementById("bubble-sort-btn");
const selectionBtn = document.getElementById("selection-sort-btn");
const insertionBtn = document.getElementById("insertion-sort-btn");
const mergeBtn = document.getElementById("merge-sort-btn");
const quickBtn = document.getElementById("quick-sort-btn");

// --- Initialization ---

// Create initial array when page loads
window.onload = function() {
    generateRandomArray();
};

// Generate button click
generateBtn.addEventListener("click", function() {
    generateRandomArray();
});

// Size slider change
sizeSlider.addEventListener("input", function() {
    generateRandomArray();
});

// Speed slider change
speedSlider.addEventListener("input", function() {
    delay = parseInt(speedSlider.value);
    speedValueText.innerText = delay;
});


// --- Helper Functions ---

// 1. Generate a random array
function generateRandomArray() {
    // Clear old array
    array = [];
    container.innerHTML = "";
    
    // Get size from slider
    let size = parseInt(sizeSlider.value);
    
    // Create new array elements
    for (let i = 0; i < size; i++) {
        // Random number between 5 and 100
        let randomHeight = Math.floor(Math.random() * 95) + 5;
        array.push(randomHeight);
        
        // Create div for the bar
        let bar = document.createElement("div");
        bar.classList.add("bar");
        
        // Set height using percentage so it fits the container
        bar.style.height = randomHeight + "%";
        
        // Make the width responsive based on the container size
        // 100% width divided by number of bars, minus the margin space
        bar.style.width = (100 / size) + "%";
        
        container.appendChild(bar);
    }
}

// 2. Sleep function for animation delay
function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

// 3. Disable/Enable UI buttons during sorting
function setButtonsState(disabled) {
    isSorting = disabled;
    generateBtn.disabled = disabled;
    sizeSlider.disabled = disabled;
    
    for (let i = 0; i < algButtons.length; i++) {
        algButtons[i].disabled = disabled;
    }
}

// 4. Mark all bars as sorted (green) at the end
async function finishVisualization() {
    let bars = document.getElementsByClassName("bar");
    for (let i = 0; i < bars.length; i++) {
        bars[i].className = "bar sorted"; // strictly separated class
        await sleep(10); // simple visual wave
    }
    setButtonsState(false);
}

// 5. Swap heights of two DOM bars AND the array values
function swap(i, j, bars) {
    let tempValue = array[i];
    array[i] = array[j];
    array[j] = tempValue;
    
    // update DOM using simple inline style for height only
    bars[i].style.height = array[i] + "%";
    bars[j].style.height = array[j] + "%";
}


// --- Algorithms Event Listeners ---

bubbleBtn.addEventListener("click", async function() {
    if (isSorting) return;
    setButtonsState(true);
    await bubbleSort();
    if (isSorting) await finishVisualization();
});

selectionBtn.addEventListener("click", async function() {
    if (isSorting) return;
    setButtonsState(true);
    await selectionSort();
    if (isSorting) await finishVisualization();
});

insertionBtn.addEventListener("click", async function() {
    if (isSorting) return;
    setButtonsState(true);
    await insertionSort();
    if (isSorting) await finishVisualization();
});

mergeBtn.addEventListener("click", async function() {
    if (isSorting) return;
    setButtonsState(true);
    await mergeSortStart();
    if (isSorting) await finishVisualization();
});

quickBtn.addEventListener("click", async function() {
    if (isSorting) return;
    setButtonsState(true);
    await quickSortStart();
    if (isSorting) await finishVisualization();
});


// --- Sorting Algorithm Implementations ---
// Using strict loops, no string literals or mapping logic where not needed

// Bubble Sort
async function bubbleSort() {
    let bars = document.getElementsByClassName("bar");
    let n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            // Apply CSS class for comparison
            bars[j].className = "bar comparing";
            bars[j + 1].className = "bar comparing";
            await sleep(delay);
            
            if (array[j] > array[j + 1]) {
                // Apply CSS class for swapping
                bars[j].className = "bar swapping";
                bars[j + 1].className = "bar swapping";
                
                swap(j, j + 1, bars);
                await sleep(delay);
            }
            
            // Remove colored classes
            bars[j].className = "bar";
            bars[j + 1].className = "bar";
        }
        // Last element is sorted
        bars[n - 1 - i].className = "bar sorted";
    }
    bars[0].className = "bar sorted";
}

// Selection Sort
async function selectionSort() {
    let bars = document.getElementsByClassName("bar");
    let n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;
        bars[minIndex].className = "bar swapping"; 
        
        for (let j = i + 1; j < n; j++) {
            bars[j].className = "bar comparing";
            await sleep(delay);
            
            if (array[j] < array[minIndex]) {
                // Reset old min index color
                bars[minIndex].className = "bar";
                
                minIndex = j;
                // Highlight new min index
                bars[minIndex].className = "bar swapping";
            } else {
                bars[j].className = "bar";
            }
        }
        
        if (minIndex !== i) {
            bars[i].className = "bar swapping";
            await sleep(delay);
            swap(i, minIndex, bars);
        }
        
        bars[minIndex].className = "bar";
        bars[i].className = "bar sorted";
    }
    bars[n - 1].className = "bar sorted";
}

// Insertion Sort
async function insertionSort() {
    let bars = document.getElementsByClassName("bar");
    let n = array.length;
    
    bars[0].className = "bar sorted";
    
    for (let i = 1; i < n; i++) {
        let currentHeight = array[i];
        let j = i - 1;
        
        bars[i].className = "bar swapping";
        await sleep(delay);
        
        while (j >= 0 && array[j] > currentHeight) {
            bars[j].className = "bar comparing";
            bars[j + 1].className = "bar comparing";
            await sleep(delay);
            
            array[j + 1] = array[j];
            bars[j + 1].style.height = array[j + 1] + "%";
            
            bars[j].className = "bar sorted";
            bars[j + 1].className = "bar sorted";
            j = j - 1;
        }
        
        array[j + 1] = currentHeight;
        bars[j + 1].style.height = currentHeight + "%";
        
        bars[i].className = "bar sorted";
        bars[j + 1].className = "bar sorted";
    }
}

// Merge Sort
async function mergeSortStart() {
    await mergeSort(0, array.length - 1);
}

async function mergeSort(left, right) {
    if (left >= right) {
        return;
    }
    let middle = left + Math.floor((right - left) / 2);
    await mergeSort(left, middle);
    await mergeSort(middle + 1, right);
    await merge(left, middle, right);
}

async function merge(left, middle, right) {
    let bars = document.getElementsByClassName("bar");
    let n1 = middle - left + 1;
    let n2 = right - middle;
    
    let leftArray = new Array(n1);
    let rightArray = new Array(n2);
    
    for (let i = 0; i < n1; i++) {
        leftArray[i] = array[left + i];
        bars[left + i].className = "bar comparing";
    }
    for (let j = 0; j < n2; j++) {
        rightArray[j] = array[middle + 1 + j];
        bars[middle + 1 + j].className = "bar swapping";
    }
    
    await sleep(delay);
    
    let i = 0;
    let j = 0;
    let k = left;
    
    while (i < n1 && j < n2) {
        if (leftArray[i] <= rightArray[j]) {
            array[k] = leftArray[i];
            bars[k].style.height = array[k] + "%";
            i++;
        } else {
            array[k] = rightArray[j];
            bars[k].style.height = array[k] + "%";
            j++;
        }
        bars[k].className = "bar comparing"; 
        await sleep(delay);
        k++;
    }
    
    while (i < n1) {
        array[k] = leftArray[i];
        bars[k].style.height = array[k] + "%";
        bars[k].className = "bar comparing";
        await sleep(delay);
        i++;
        k++;
    }
    
    while (j < n2) {
        array[k] = rightArray[j];
        bars[k].style.height = array[k] + "%";
        bars[k].className = "bar comparing";
        await sleep(delay);
        j++;
        k++;
    }
    
    for (let x = left; x <= right; x++) {
        bars[x].className = "bar";
    }
}

// Quick Sort
async function quickSortStart() {
    await quickSort(0, array.length - 1);
}

async function quickSort(low, high) {
    if (low < high) {
        let partitionIndex = await partition(low, high);
        await quickSort(low, partitionIndex - 1);
        await quickSort(partitionIndex + 1, high);
    }
}

async function partition(low, high) {
    let bars = document.getElementsByClassName("bar");
    let pivot = array[high];
    
    bars[high].className = "bar swapping";
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        bars[j].className = "bar comparing";
        await sleep(delay);
        
        if (array[j] < pivot) {
            i++;
            
            bars[i].className = "bar swapping";
            bars[j].className = "bar swapping";
            await sleep(delay);
            
            swap(i, j, bars);
            
            bars[i].className = "bar";
            bars[j].className = "bar";
        } else {
            bars[j].className = "bar";
        }
    }
    
    i++;
    bars[i].className = "bar swapping";
    bars[high].className = "bar swapping";
    await sleep(delay);
    
    swap(i, high, bars);
    
    bars[i].className = "bar";
    bars[high].className = "bar";
    
    return i;
}
