import targetWords from "./targetWords.js";
import dictionary from "./dictionary.js";

// Today's random word:
const startDate = new Date("March 27, 2022"); // Date of project creation!
const daysSince = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));
const targetWord = targetWords[daysSince];

// Elements:
const guessGrid = document.querySelector("[data-guess-grid]");
const alertContainer = document.querySelector("[data-alert-container]");
const keyboard = document.querySelector("[data-keyboard]");

// Event listeners
const beginUserInteraction = function () {
  document.addEventListener("keydown", handleKeyPress);
  document.addEventListener("click", handleMouseClick);
};

const endUserInteraction = function () {
  document.removeEventListener("keydown", handleKeyPress);
  document.removeEventListener("click", handleMouseClick);
};

beginUserInteraction();

// Create & display fading alert for various messages
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

const checkWinLose = function (guess, tiles) {
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
    displayAlert(`The word was ${targetWord.toUpperCase()}`, 10000);
    endUserInteraction();
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
            checkWinLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true } // listener is envoked once, then removed
  );
};

const getActiveTiles = () =>
  guessGrid.querySelectorAll("[data-state='active']");

const pressKey = function (key) {
  const activeTiles = getActiveTiles();
  if (activeTiles.length === 5) return;

  // Add to first element which does not have a key already
  const nextTile = guessGrid.querySelector(":not([data-letter])");
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
    return;
  }
  // Submitting data:
  if (e.target?.matches("[data-enter]")) {
    submitGuess();
    return;
  }
  // Deleting data:
  if (e.target.matches("[data-delete]")) {
    deleteKey();
    return;
  }
}
