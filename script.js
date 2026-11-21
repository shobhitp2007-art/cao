
/* ============================================
   BOOTHLAB
   Booth's Signed Binary Multiplication Simulator
============================================ */


/* ============================================
   1. GET HTML ELEMENTS
============================================ */

const multiplicandInput = document.getElementById("multiplicand");
const multiplierInput = document.getElementById("multiplier");
const bitWidthInput = document.getElementById("bit-width");

const startBtn = document.getElementById("start-btn");
const previousBtn = document.getElementById("previous-btn");
const nextBtn = document.getElementById("next-btn");
const autoBtn = document.getElementById("auto-btn");
const resetBtn = document.getElementById("reset-btn");

const regA = document.getElementById("reg-a");
const regQ = document.getElementById("reg-q");
const regM = document.getElementById("reg-m");
const regQMinus = document.getElementById("reg-qminus");

const iterationDisplay = document.getElementById("iteration");

const currentOperation = document.getElementById("current-operation");
const operationDescription = document.getElementById("operation-description");

const bitPairDisplay = document.getElementById("bit-pair");
const statusDisplay = document.getElementById("status");

const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

const binaryResult = document.getElementById("binary-result");
const decimalResult = document.getElementById("decimal-result");


/* ============================================
   2. SIMULATION VARIABLES
============================================ */

let history = [];

let currentStep = 0;
let activeWidth = 0;

let autoTimer = null;

let finalProductBits = "";
let finalProductDecimal = null;


/* ============================================
   3. BINARY CONVERSION FUNCTIONS
============================================ */

// Convert a number into an unsigned n-bit value.

function toUnsigned(value, width) {

    const modulus = 1n << BigInt(width);

    let result = value % modulus;

    if (result < 0n) {
        result += modulus;
    }

    return result;
}


// Convert a number into signed two's complement.

function toSigned(value, width) {

    const unsignedValue = toUnsigned(value, width);

    const signBit = 1n << BigInt(width - 1);

    const modulus = 1n << BigInt(width);

    if (unsignedValue >= signBit) {
        return unsignedValue - modulus;
    }

    return unsignedValue;
}


// Convert a signed number into binary.

function toBinary(value, width) {

    return toUnsigned(value, width)
        .toString(2)
        .padStart(width, "0");

}


/* ============================================
   4. SAVE SIMULATION STATE
============================================ */

function saveState(
    A,
    Q,
    M,
    QMinus,
    iteration,
    pair,
    operation,
    description
) {

    history.push({

        a: A,
        q: Q,
        m: M,

        qMinus: QMinus,

        iteration: iteration,

        pair: pair,

        operation: operation,

        description: description

    });

}


/* ============================================
   5. MAIN BOOTH ALGORITHM
============================================ */

function runBoothAlgorithm(MValue, QValue, width) {

    history = [];

    activeWidth = width;

    currentStep = 0;


    // Accumulator and M have one extra bit
    // to handle signed arithmetic safely.

    const accumulatorWidth = width + 1;


    // Initialise registers.

    let A = 0n;

    let M = BigInt(MValue);

    let Q = toUnsigned(BigInt(QValue), width);

    let QMinus = 0n;


    // Save initial register state.

    const initialPair =
        String(Q & 1n) + String(QMinus);


    saveState(

        A,
        Q,
        M,
        QMinus,

        0,

        initialPair,

        "Ready to Begin",

        "Registers have been initialized. Press Next Step to execute the first iteration."

    );


    // Execute the algorithm for n iterations.

    for (let i = 1; i <= width; i++) {


        // STEP 1: Examine Q0 and Q-1.

        const Q0 = Q & 1n;

        const pair = String(Q0) + String(QMinus);


        // STEP 2: Perform the required operation.

        let operation;

        let description;


        if (pair === "01") {

            // A = A + M

            A = toSigned(A + M, accumulatorWidth);

            operation = "A = A + M";

            description =
                "Q₀Q₋₁ = 01. Add M to A, then perform an arithmetic right shift.";

        }

        else if (pair === "10") {

            // A = A - M

            A = toSigned(A - M, accumulatorWidth);

            operation = "A = A - M";

            description =
                "Q₀Q₋₁ = 10. Subtract M from A, then perform an arithmetic right shift.";

        }

        else {

            // No operation.

            operation = "No Operation";

            description =
                "Q₀Q₋₁ = " + pair +
                ". No addition or subtraction is required. Perform an arithmetic right shift.";

        }


        // STEP 3: Perform arithmetic right shift.


        // Save the old Q0 as the new Q-1.

        const newQMinus = Q & 1n;


        // Transfer the last bit of A into Q.

        const ALastBit = toUnsigned(A, accumulatorWidth) & 1n;


        const newQ =
            (Q >> 1n) |
            (ALastBit << BigInt(width - 1));


        // Arithmetic right shift of A.
        // BigInt right shift preserves the sign.

        const newA = toSigned(
            A >> 1n,
            accumulatorWidth
        );


        // Update registers.

        A = newA;

        Q = newQ;

        QMinus = newQMinus;


        // STEP 4: Save the completed iteration.

        saveState(

            A,
            Q,
            M,
            QMinus,

            i,

            pair,

            operation,

            description +
            " The displayed registers show the values after shifting."

        );

    }


    // STEP 5: Calculate final product.

    const finalState = history[width];


    // Combine A and Q.
    // Remove the extra sign-extension bit.

    const combinedBits =
        toBinary(finalState.a, width + 1) +
        toBinary(finalState.q, width);

    finalProductBits = combinedBits.slice(1);


    // Convert the combined binary product to signed decimal.

    let unsignedProduct = BigInt("0b" + finalProductBits);

    const productSignBit = 1n << BigInt(2 * width - 1);

    const productModulus = 1n << BigInt(2 * width);


    if (unsignedProduct >= productSignBit) {

        unsignedProduct -= productModulus;

    }

    finalProductDecimal = unsignedProduct;

}


/* ============================================
   6. DISPLAY CURRENT REGISTERS
============================================ */

function displayStep() {

    if (history.length === 0) {
        return;
    }

    const state = history[currentStep];

    const width = activeWidth;

    const accumulatorWidth = width + 1;


    // Display register values.

    regA.textContent =
        toBinary(state.a, accumulatorWidth);

    regQ.textContent =
        toBinary(state.q, width);

    regM.textContent =
        toBinary(state.m, accumulatorWidth);

    regQMinus.textContent =
        String(state.qMinus);


    // Display iteration number.

    iterationDisplay.textContent =
        state.iteration;


    // Display current operation.

    currentOperation.textContent =
        state.operation;

    operationDescription.textContent =
        state.description;


    // Display Q0 and Q-1 combination.

    bitPairDisplay.textContent =
        state.pair.split("").join(" ");


    // Update status.

    if (currentStep === 0) {

        statusDisplay.textContent = "READY TO START";

    }

    else if (currentStep === width) {

        statusDisplay.textContent = "COMPLETED";

    }

    else {

        statusDisplay.textContent = "IN PROGRESS";

    }


    // Update progress bar.

    const percentage =
        Math.round((state.iteration / width) * 100);

    progressText.textContent = percentage + "%";

    progressFill.style.width = percentage + "%";


    // Display final result only after completion.

    if (currentStep === width) {

        binaryResult.textContent =
            finalProductBits;

        decimalResult.textContent =
            String(finalProductDecimal);

    }

    else {

        binaryResult.textContent = "--------";

        decimalResult.textContent = "--";

    }


    // Enable and disable buttons.

    previousBtn.disabled = (currentStep === 0);

    nextBtn.disabled = (currentStep === width);

    autoBtn.disabled = (currentStep === width);

}


/* ============================================
   7. START SIMULATION
============================================ */

startBtn.addEventListener("click", function () {

    stopAutoPlay();


    // Read input values.

    const mText = multiplicandInput.value.trim();

    const qText = multiplierInput.value.trim();

    const width = Number(bitWidthInput.value);


    // Check empty fields.

    if (mText === "" || qText === "") {

        alert("Please enter both numbers.");

        return;

    }


    const m = Number(mText);

    const q = Number(qText);


    // Validate integers.

    if (!Number.isSafeInteger(m) || !Number.isSafeInteger(q)) {

        alert("Please enter valid whole numbers.");

        return;

    }


    // Calculate signed range.

    const minimum = -(2 ** (width - 1));

    const maximum = (2 ** (width - 1)) - 1;


    // Check input range.

    if (
        m < minimum ||
        m > maximum ||
        q < minimum ||
        q > maximum
    ) {

        alert(
            "For " + width + "-bit signed numbers, enter values between " +
            minimum + " and " + maximum + "."
        );

        return;

    }


    // Run the algorithm.

    runBoothAlgorithm(m, q, width);


    // Display initial state.

    currentStep = 0;

    displayStep();

});


/* ============================================
   8. NEXT STEP BUTTON
============================================ */

nextBtn.addEventListener("click", function () {

    stopAutoPlay();

    if (currentStep < activeWidth && history.length > 0) {

        currentStep++;

        displayStep();

    }

});


/* ============================================
   9. PREVIOUS STEP BUTTON
============================================ */

previousBtn.addEventListener("click", function () {

    stopAutoPlay();

    if (currentStep > 0) {

        currentStep--;

        displayStep();

    }

});


/* ============================================
   10. AUTO PLAY
============================================ */

function stopAutoPlay() {

    if (autoTimer !== null) {

        clearInterval(autoTimer);

        autoTimer = null;

    }

    autoBtn.textContent = "Auto Play";

}


autoBtn.addEventListener("click", function () {


    // Do not run without a simulation.

    if (history.length === 0 || currentStep >= activeWidth) {

        return;

    }


    // Pause if already running.

    if (autoTimer !== null) {

        stopAutoPlay();

        return;

    }


    autoBtn.textContent = "Pause";


    // Automatically execute one step at a time.

    autoTimer = setInterval(function () {


        if (currentStep < activeWidth) {

            currentStep++;

            displayStep();

        }


        // Stop after the final iteration.

        if (currentStep >= activeWidth) {

            stopAutoPlay();

        }

    }, 800);

});


/* ============================================
   11. RESET SIMULATION
============================================ */

resetBtn.addEventListener("click", function () {

    stopAutoPlay();


    history = [];

    currentStep = 0;

    activeWidth = 0;


    finalProductBits = "";

    finalProductDecimal = null;


    // Reset registers.

    regA.textContent = "---------";

    regQ.textContent = "--------";

    regM.textContent = "---------";

    regQMinus.textContent = "0";


    // Reset operation display.

    iterationDisplay.textContent = "0";

    currentOperation.textContent = "Awaiting Input";

    operationDescription.textContent =
        "Start the simulation to view the operations.";

    bitPairDisplay.textContent = "0 0";


    // Reset status and progress.

    statusDisplay.textContent = "WAITING TO START";

    progressText.textContent = "0%";

    progressFill.style.width = "0%";


    // Clear final result.

    binaryResult.textContent = "--------";

    decimalResult.textContent = "--";


    // Disable navigation buttons.

    previousBtn.disabled = true;

    nextBtn.disabled = true;

    autoBtn.disabled = true;

});


/* ============================================
   12. INITIAL PAGE STATE
============================================ */

resetBtn.click();

