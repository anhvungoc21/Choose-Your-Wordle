import targetWords from "./targetWords.js";
import dictionary from "./dictionary.js";
import { MAX_TILES_COUNT, MIN_TILES_COUNT, TILES_PER_ROW } from "./config.js";

// Elements:
const guessGrid = document.querySelector("[data-guess-grid]");
const alertContainer = document.querySelector("[data-alert-container]");
const keyboard = document.querySelector("[data-keyboard]");
const winCounter = document.querySelector("[data-win-count]");
const lossCounter = document.querySelector("[data-loss-count]");
const modal = document.querySelector(".modal");
const overlay = document.querySelector(".modal-overlay");

// Buttons
const btnDecreaseRow = document.querySelector(".btn--decrease-row");
const btnIncreaseRow = document.querySelector(".btn--increase-row");
const rowCountSpan = document.querySelector("[data-row-count]");
const btnUnlimited = document.getElementById("switch-unlim");
const btnDarkMode = document.getElementById("switch-dark");
const btnCloseModal = document.querySelector(".btn--close-modal");

// STATE
let targetWord = "";

const state = {
  unlimited: false,
  wordIndex: 0,
  playerRecord: {
    wins: 0,
    losses: 0,
  },
};

const decreaseRow = function () {
  const tiles = guessGrid.querySelectorAll(".tile");
  const activeTiles = guessGrid.querySelectorAll("[data-state]");
  if (
    tiles.length === MIN_TILES_COUNT ||
    tiles.length === activeTiles.length + TILES_PER_ROW
  )
    return;
  for (let i = tiles.length - 5; i < tiles.length; i++) {
    tiles[i].classList.add("removed");
    tiles[i].addEventListener("transitionend", () => {
      tiles[i].remove();
    });
  }
  // Update row count
  rowCountSpan.dataset.rowCount =
    (tiles.length - TILES_PER_ROW) / TILES_PER_ROW;
  rowCountSpan.textContent = `${rowCountSpan.dataset.rowCount}`;

  btnDecreaseRow.blur();
};

const increaseRow = function () {
  const tiles = guessGrid.querySelectorAll(".tile");
  if (tiles.length === MAX_TILES_COUNT) return;
  guessGrid.insertAdjacentHTML(
    "beforeend",
    `
      <div class="tile"></div>
      <div class="tile"></div>
      <div class="tile"></div>
      <div class="tile"></div>
      <div class="tile"></div>
    `
  );
  // Update row count
  rowCountSpan.dataset.rowCount =
    (tiles.length + TILES_PER_ROW) / TILES_PER_ROW;
  rowCountSpan.textContent = `${rowCountSpan.dataset.rowCount}`;
  btnIncreaseRow.blur();
};
// Event listeners
const beginUserInteraction = function () {
  document.addEventListener("keydown", handleKeyPress);
  document.addEventListener("click", handleMouseClick);
  btnDecreaseRow.addEventListener("click", function () {
    decreaseRow();
  });
  btnIncreaseRow.addEventListener("click", increaseRow);
  btnUnlimited.addEventListener("click", toggleUnlim);
  btnDarkMode.addEventListener("click", toggleDarkMode);
};

const endUserInteraction = function () {
  document.removeEventListener("keydown", handleKeyPress);
  document.removeEventListener("click", handleMouseClick);
};

///////////////////////////////////////////////////////////////
// Helpers
const getActiveTiles = function () {
  return guessGrid.querySelectorAll("[data-state='active']");
};

// Local Storage
const checkLocalStorage = function () {
  const visited = JSON.parse(localStorage.getItem("AVpastVisitor"));
  if (visited === null) {
    displayModal();
    // Mark user as visited, so that modal doesn't show again in next sessions
    localStorage.setItem("AVpastVisitor", JSON.stringify(true));
    return;
  }
  const data = JSON.parse(localStorage.getItem("AVWordleData"));
  if (data === null) return;
  if (data.unlimited === false) return;

  // State
  state.unlimited = data.unlimited;
  state.wordIndex = data.wordIndex;
  state.playerRecord = data.playerRecord;

  // UI
  btnUnlimited.checked = true;
  winCounter.textContent = winCounter.dataset.winCount = data.playerRecord.wins;
  lossCounter.textContent = lossCounter.dataset.winCount =
    data.playerRecord.losses;
};

const saveToLocalStorage = function () {
  localStorage.setItem("AVWordleData", JSON.stringify(state));
};

const generateWord = function () {
  if (state.unlimited === true) {
    // Unlimited mode
    targetWord = "";
    targetWord = targetWords[state.wordIndex];
  } else {
    // Play by day
    const startDate = new Date("March 27, 2022"); // Date of project creation!
    const daysSince = Math.floor(
      (Date.now() - startDate) / (1000 * 60 * 60 * 24)
    );
    targetWord = targetWords[daysSince];
  }
};

const resetGrid = function () {
  /// Reset grid
  const filledTiles = guessGrid.querySelectorAll("[data-letter]");
  filledTiles.forEach((tile) => {
    delete tile.dataset.state;
    delete tile.dataset.letter;
    tile.textContent = "";
  });

  // Reset keyboard
  const filledKeys = keyboard.querySelectorAll("[data-key]");
  filledKeys.forEach((key) => {
    key.classList.remove("wrong", "correct", "wrong-pos");
  });
};

//////////////////////////////////////////////////////////////////
// USER CONFIGURATION FUNCTIONS

const toggleDarkMode = function () {
  const css = document.querySelector("[rel='stylesheet']");
  if (css.href.includes("light-theme")) {
    css.href = "./src/css/dark-theme.css";
  } else {
    css.href = "./src/css/light-theme.css";
  }
};

const toggleUnlim = function () {
  // Change state
  if (state.unlimited === false) {
    state.unlimited = true;
  } else {
    state.unlimited = false;
  }

  // Reset board
  generateWord();
  resetGrid();
  beginUserInteraction();
};

/////////////////////////////////////////////////////////////
// Alerts and Modals

const createAlert = function (message, duration = 1000) {
  const alert = document.createElement("div");
  alert.textContent = message;
  alert.classList.add("alert");
  alertContainer.append(alert);
  setTimeout(() => {
    alert.classList.add("hide");
    alert.addEventListener("transitionend", () => alert.remove()); // Delete old alerts at the end of transition
  }, duration);
};

const displayAlert = function (message, duration = 1000) {
  const alert = alertContainer.querySelector(".alert");

  // Checks for existing alert. If yes, destroy immediately then setTimeout again
  if (alert === null) {
    createAlert(message, duration);
  } else {
    alert.remove();
    createAlert(message, duration);
  }
};

const displayModal = function () {
  // Add event listener to close button & overlay;
  btnCloseModal.addEventListener("click", function () {
    modal.classList.add("hidden");
    overlay.style.opacity = 0;
    removeEventListener("click", btnCloseModal);
    overlay.style["pointer-events"] = "none";
    overlay.style["z-index"] = 0;
  });
  overlay.addEventListener("click", function () {
    modal.classList.add("hidden");
    overlay.style.opacity = 0;
    removeEventListener("click", overlay);
    overlay.style["pointer-events"] = "none";
    overlay.style["z-index"] = 1;
  });

  // Hide protruding buttons:
  btnUnlimited.style.display = "none";

  // Display modal
  modal.classList.remove("hidden");

  // Display overlay & Allow clicks on overlay
  overlay.style["pointer-events"] = "initial";
  overlay.style["z-index"] = 2;
  overlay.style.opacity = 1;
};

//////////////////////////////////////////////////////////////////
// CHECK WIN-LOSE

const checkWinLoseStandard = function (guess, tiles) {
  // Win
  if (guess === targetWord) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const timeTillTomorrow = 24 * 60 * 60 * 1000 - (new Date() - todayStart);
    const hours = Math.floor(timeTillTomorrow / 1000 / 60 / 60);
    const minutes = Math.floor(
      (timeTillTomorrow - hours * 1000 * 60 * 60) / 1000 / 60
    );
    displayAlert(
      `You Win! Time until next word: ${hours} hours and ${minutes} minutes`,
      5000
    );
    danceTiles(tiles);
    endUserInteraction();
    return;
  }

  // Loss
  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    displayAlert(`The word was ${targetWord.toUpperCase()}!`, 2000);
    endUserInteraction();
  }
};

const checkWinLoseUnlim = function (guess, tiles) {
  // Win Unlim
  if (guess === targetWord) {
    danceTiles(tiles);
    displayAlert(`You Win!`, 2000);

    // Update state

    winCounter.dataset.winCount = parseInt(winCounter.dataset.winCount) + 1;
    winCounter.textContent = winCounter.dataset.winCount;
    state.playerRecord.wins++;
    state.wordIndex++;
    generateWord();
    saveToLocalStorage();

    // Next word
    setTimeout(() => {
      resetGrid();
    }, 3000);
    return;
  }

  // Loss Unlim
  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
  if (remainingTiles.length === 0) {
    displayAlert(`The word was ${targetWord.toUpperCase()}!`, 2000);

    // Update state
    lossCounter.dataset.lossCount = parseInt(lossCounter.dataset.lossCount) + 1;
    lossCounter.textContent = lossCounter.dataset.lossCount;
    state.playerRecord.losses++;
    state.wordIndex++;
    generateWord();
    saveToLocalStorage();

    // Next word
    setTimeout(() => {
      resetGrid();
    }, 3000);

    return;
  }
};

const checkTile = function (tile, index, keyboardKey) {
  const letter = tile.dataset.letter;
  // Flip is removed so that tile flips back.
  tile.classList.remove("flip");

  // Check for letter validity
  if (targetWord[index] === letter) {
    tile.dataset.state = "correct";
    keyboardKey.classList.add("correct");
  } else if (targetWord.includes(letter)) {
    tile.dataset.state = "wrong-pos";
    keyboardKey.classList.add("wrong-pos");
  } else {
    tile.dataset.state = "wrong";
    keyboardKey.classList.add("wrong");
  }
};

////////////////////////////////////////////////////////////
// ANIMATIONS
const popTile = function (tile) {
  tile.classList.add("pop");
  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("pop");
    },
    { once: true }
  );
};

// Shaking animation when guess submission is invalid
const shakeTiles = function (tiles) {
  tiles.forEach((tile) => {
    tile.classList.add("shake");
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake");
      },
      { once: true }
    );
  });
};

// Dancing animation when player wins
const danceTiles = function (tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance");
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance");
        },
        { once: true }
      );
    }, (index * 500) / 5);
  });
};

// Flip one tile in a valid guess
const flipTile = function (tile, index, array, guess) {
  const letter = tile.dataset.letter;
  const keyboardKey = keyboard.querySelector(`[data-key="${letter}"i]`);

  // For each letter, set delay according to index
  setTimeout(() => {
    tile.classList.add("flip");
  }, index * 250);

  // The transition actually has 2 parts, flipping 90deg to hide, then flipping back,
  // creating the illusion of a full rotation.
  tile.addEventListener(
    "transitionend",
    () => {
      checkTile(tile, index, keyboardKey);
      if (index === array.length - 1) {
        // At the second stage of flipping the final letter, listen for transition end.
        tile.addEventListener(
          "transitionend",
          () => {
            beginUserInteraction();
            if (state.unlimited === false) {
              checkWinLoseStandard(guess, array);
            } else {
              checkWinLoseUnlim(guess, array);
            }
          },
          { once: true }
        );
      }
    },
    { once: true } // listener is envoked once, then removed
  );
};

/////////////////////////////////////////////////////////////////
///// EVENT HANDLERS

const pressKey = function (key) {
  const activeTiles = getActiveTiles();
  if (activeTiles.length === 5) return;

  // Add to first element which does not have a key already
  const nextTile = guessGrid.querySelector(":not([data-letter])");
  popTile(nextTile);
  nextTile.dataset.state = "active";
  nextTile.dataset.letter = key.toLowerCase();
  nextTile.textContent = key.toLowerCase();
};

const deleteKey = function () {
  const activeTiles = getActiveTiles();
  const lastActiveTile = activeTiles[activeTiles.length - 1];

  if (lastActiveTile === undefined) return;
  lastActiveTile.textContent = "";
  delete lastActiveTile.dataset.state;
  delete lastActiveTile.dataset.letter;
};

const submitGuess = function () {
  const activeTiles = [...getActiveTiles()];

  // Check word length
  if (activeTiles.length !== 5) {
    shakeTiles(activeTiles);
    displayAlert("Not enough letters!");
    return;
  }

  // Check word validity
  const guess = activeTiles.reduce(
    (word, tile) => word + tile.dataset.letter,
    ""
  );
  if (!dictionary.includes(guess)) {
    displayAlert("Not in word list!");
    shakeTiles(activeTiles);
    return;
  }

  // If guess is valid, pause user interaction and flip all tiles.
  endUserInteraction();
  activeTiles.forEach((...params) => flipTile(...params, guess));
};

function handleKeyPress(e) {
  // Entering data:
  if (e.key.match(/^[a-z]$/i)) {
    pressKey(e.key);
    return;
  }
  // Submitting data:
  if (e.key === "Enter") {
    submitGuess();
    return;
  }
  // Deleting data:
  if (e.key === "Backspace") {
    deleteKey();
    return;
  }
}

function handleMouseClick(e) {
  // Entering data:
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key);
    e.target.blur();
    return;
  }
  // Submitting data:
  if (e.target?.matches("[data-enter]")) {
    submitGuess();
    e.target.blur();
    return;
  }
  // Deleting data:
  if (e.target.closest(".key")?.matches("[data-delete]")) {
    deleteKey();
    e.target.closest(".key").blur();
    return;
  }
}

///////////////////////////////////////////////////////////
// INIT
const init = function () {
  checkLocalStorage();
  generateWord();
  beginUserInteraction();
};

init();
