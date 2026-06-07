const birthdayPage = {
  letter: [
    "It's your day!!! HARI INI HARIMUUUUU!!! YEYYYY. Selamat ulang tahun yaa My Baby Sweety Pretty Cinnamon Apple Girl <3 ",
    "Semoga panjang umur, bahagia selalu, mimpinya tercapai dan harapannya dikabulkann.",
    "I'm sad that we can't celebrate your birthday together :( but it's okay since kita masih bisa call-an tiap hari yayy :>",
    "Terakhir, semoga kamu suka dengan hadiah yang kubuat ini, masih ada beberapa kejutan lainnya yang aku selipkan di laman spesial ini. Happy Birthdayy"
  ],
  puzzleWords: [
    {
      number: 1,
      answer: "THALIA",
      clue: "Siapa yang lagi ulang tahun",
      row: 2,
      col: 5,
      direction: "down"
    },
    {
      number: 2,
      answer: "PETITENGET",
      clue: "Pantai yang \"Kita\" banget",
      row: 3,
      col: 3,
      direction: "down"
    },
    {
      number: 3,
      answer: "LIVINGWORLD",
      clue: "Mall favorit kita",
      row: 6,
      col: 2,
      direction: "across"
    },
    {
      number: 4,
      answer: "UGM",
      clue: "Kampus Impian Kamu!!",
      row: 5,
      col: 7,
      direction: "down"
    },
    {
      number: 5,
      answer: "FEBRUARI",
      clue: "Di bulan apa kita jadian?",
      row: 3,
      col: 10,
      direction: "down"
    },
    {
      number: 6,
      answer: "TARUH",
      clue: "Judul lagu yang lagi keputer di background",
      row: 12,
      col: 3,
      direction: "across"
    }
  ]
};

const giftClaimConfig = {
  phoneNumber: "6281933056054",
  message: "Haii, aku mau claim voucher hadiah ulang tahunku yaa"
};
const CROSSWORD_STORAGE_KEY = "webbirthday-crossword-progress-v1";

const screens = Array.from(document.querySelectorAll(".screen"));
const music = document.getElementById("background-music");
const openingMainImage = document.getElementById("opening-main-image");
const openingSubcopy = document.getElementById("opening-subcopy");
const openingActions = document.getElementById("opening-actions");
const acceptButton = document.getElementById("accept-button");
const declineButton = document.getElementById("decline-button");
const letterText = document.getElementById("letter-text");
const letterProgress = document.getElementById("letter-progress");
const nextLetterButton = document.getElementById("next-letter");
const crossword = document.getElementById("crossword");
const acrossClues = document.getElementById("across-clues");
const downClues = document.getElementById("down-clues");
const puzzleNote = document.getElementById("puzzle-note");
const openFinalButton = document.getElementById("open-final");
const claimMessage = document.getElementById("claim-message");

let letterIndex = 0;
let puzzleSolved = false;
let openingDeclined = false;
let activeDirection = "across";
const cellMap = new Map();

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.body.classList.add("intro-ready");
  });
});

function showScreen(id) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setPuzzleMessage(message) {
  if (puzzleNote) puzzleNote.textContent = message;
}

function tryPlayMusic() {
  if (!music) return;
  music.volume = 0.34;
  music.play().catch(() => {
    // Browser biasanya menunggu interaksi user sebelum audio boleh mulai.
  });
}

function buildWhatsAppLink() {
  const normalizedNumber = giftClaimConfig.phoneNumber.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(giftClaimConfig.message);
  return `https://wa.me/${normalizedNumber}?text=${encodedMessage}`;
}

function saveCrosswordProgress() {
  if (!crossword) return;

  try {
    const progress = Array.from(crossword.querySelectorAll("input")).reduce((result, input) => {
      const key = cellKey(Number(input.dataset.row), Number(input.dataset.col));
      result[key] = input.value.toUpperCase();
      return result;
    }, {});

    window.localStorage.setItem(CROSSWORD_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Gagal menyimpan progress crossword:", error);
  }
}

function loadCrosswordProgress() {
  if (!crossword) return;

  try {
    const raw = window.localStorage.getItem(CROSSWORD_STORAGE_KEY);
    if (!raw) return;

    const progress = JSON.parse(raw);
    if (!progress || typeof progress !== "object") return;

    Array.from(crossword.querySelectorAll("input")).forEach((input) => {
      const key = cellKey(Number(input.dataset.row), Number(input.dataset.col));
      const savedValue = typeof progress[key] === "string" ? progress[key] : "";
      input.value = savedValue.replace(/[^A-Z]/g, "").slice(0, 1);
    });
  } catch (error) {
    console.error("Gagal memuat progress crossword:", error);
  }
}

function renderLetter() {
  letterText.textContent = birthdayPage.letter[letterIndex];
  letterProgress.innerHTML = birthdayPage.letter
    .map((_, index) => `<span class="letter-dot${index === letterIndex ? " is-active" : ""}"></span>`)
    .join("");
  nextLetterButton.textContent = letterIndex === birthdayPage.letter.length - 1 ? "Ke teka-teki" : "Lanjut";
}

function cellKey(row, col) {
  return `${row}-${col}`;
}

function normalizeAnswer(answer) {
  return String(answer || "").trim().toUpperCase();
}

function validatePuzzleWords() {
  const grid = new Map();

  for (const word of birthdayPage.puzzleWords) {
    const answer = normalizeAnswer(word.answer);
    const directionValid = word.direction === "across" || word.direction === "down";

    if (!directionValid) {
      throw new Error(`Direction tidak valid untuk nomor ${word.number}.`);
    }

    if (!answer || /[^A-Z]/.test(answer)) {
      throw new Error(`Jawaban nomor ${word.number} harus berupa huruf A-Z saja.`);
    }

    if (word.row < 1 || word.col < 1) {
      throw new Error(`Posisi nomor ${word.number} harus dimulai dari row/col minimal 1.`);
    }

    [...answer].forEach((letter, index) => {
      const row = word.direction === "down" ? word.row + index : word.row;
      const col = word.direction === "across" ? word.col + index : word.col;
      const key = cellKey(row, col);
      const existing = grid.get(key);

      if (existing && existing !== letter) {
        throw new Error(`Jawaban nomor ${word.number} bentrok dengan huruf lain di ${key}.`);
      }

      grid.set(key, letter);
    });
  }
}

function buildCellMap() {
  cellMap.clear();
  birthdayPage.puzzleWords.forEach((word) => {
    const answer = normalizeAnswer(word.answer);

    [...answer].forEach((letter, index) => {
      const row = word.direction === "down" ? word.row + index : word.row;
      const col = word.direction === "across" ? word.col + index : word.col;
      const key = cellKey(row, col);
      const existing = cellMap.get(key) || { row, col, letter, numbers: [] };

      existing.letter = letter;
      if (index === 0) existing.numbers.push(word.number);
      cellMap.set(key, existing);
    });
  });
}

function getGridSize() {
  return birthdayPage.puzzleWords.reduce((max, word) => {
    const answer = normalizeAnswer(word.answer);
    const endRow = word.direction === "down" ? word.row + answer.length - 1 : word.row;
    const endCol = word.direction === "across" ? word.col + answer.length - 1 : word.col;
    return Math.max(max, endRow, endCol);
  }, 0);
}

function renderClues() {
  if (!acrossClues || !downClues) return;

  const renderList = (direction) => birthdayPage.puzzleWords
    .filter((word) => word.direction === direction)
    .map((word) => `<li value="${word.number}">${word.clue}</li>`)
    .join("");

  acrossClues.innerHTML = renderList("across");
  downClues.innerHTML = renderList("down");
}

function renderCrossword() {
  if (!crossword) return;

  try {
    validatePuzzleWords();
    buildCellMap();
    const cells = [];
    const gridSize = getGridSize();

    for (let row = 1; row <= gridSize; row += 1) {
      for (let col = 1; col <= gridSize; col += 1) {
        const cell = cellMap.get(cellKey(row, col));

        if (!cell) {
          cells.push('<div class="cell is-empty"></div>');
          continue;
        }

        const number = cell.numbers.length ? `<span class="cell-number">${cell.numbers.join("/")}</span>` : "";
        cells.push(`
          <label class="cell">
            ${number}
            <input type="text" maxlength="1" autocomplete="off" inputmode="text" aria-label="Baris ${row}, kolom ${col}" data-answer="${cell.letter}" data-row="${row}" data-col="${col}">
          </label>
        `);
      }
    }

    crossword.innerHTML = cells.join("");
    crossword.style.gridTemplateColumns = `repeat(${gridSize}, var(--crossword-cell-size))`;
    crossword.style.gridTemplateRows = `repeat(${gridSize}, var(--crossword-cell-size))`;
    if (openFinalButton) openFinalButton.classList.add("is-hidden");
    puzzleSolved = false;
    setPuzzleMessage("Isi semua kotak, lalu hadiah terakhir kebuka.");
    renderClues();
    loadCrosswordProgress();
    checkPuzzle();
  } catch (error) {
    crossword.innerHTML = "";
    crossword.style.gridTemplateColumns = "";
    crossword.style.gridTemplateRows = "";
    if (openFinalButton) openFinalButton.classList.add("is-hidden");
    puzzleSolved = false;
    setPuzzleMessage(error instanceof Error ? error.message : "Teka-teki silang belum bisa dimuat.");
    console.error(error);
  }
}

function getInputAt(row, col) {
  if (!crossword) return null;
  return crossword.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
}

function getCoordinates(input) {
  return {
    row: Number(input.dataset.row),
    col: Number(input.dataset.col)
  };
}

function getNeighbor(input, direction, step) {
  const { row, col } = getCoordinates(input);
  const nextRow = direction === "down" ? row + step : row;
  const nextCol = direction === "across" ? col + step : col;
  return getInputAt(nextRow, nextCol);
}

function hasNeighbor(input, direction) {
  return Boolean(getNeighbor(input, direction, -1) || getNeighbor(input, direction, 1));
}

function syncDirectionFromInput(input) {
  const hasAcross = hasNeighbor(input, "across");
  const hasDown = hasNeighbor(input, "down");

  if (hasAcross && !hasDown) {
    activeDirection = "across";
    return;
  }

  if (hasDown && !hasAcross) {
    activeDirection = "down";
  }
}

function moveToNextInput(currentInput) {
  let nextInput = getNeighbor(currentInput, activeDirection, 1);

  while (nextInput) {
    const value = nextInput.value.trim().toUpperCase();
    const expected = nextInput.dataset.answer;

    if (!value) {
      nextInput.focus();
      return;
    }

    if (value !== expected) {
      nextInput.focus();
      return;
    }

    nextInput = getNeighbor(nextInput, activeDirection, 1);
  }
}

function checkPuzzle() {
  if (!crossword) return;
  const inputs = Array.from(crossword.querySelectorAll("input"));
  const hasAnyWrong = inputs.some((input) => input.value.trim() && input.value.toUpperCase() !== input.dataset.answer);
  const allFilled = inputs.every((input) => input.value.trim().length > 0);
  const allCorrect = inputs.every((input) => input.value.toUpperCase() === input.dataset.answer);

  inputs.forEach((input) => {
    const hasValue = input.value.trim().length > 0;
    const isCorrect = input.value.toUpperCase() === input.dataset.answer;
    input.classList.toggle("is-filled", hasValue && isCorrect);
    input.classList.toggle("is-wrong", hasValue && !isCorrect);
  });

  if (!allFilled) {
    setPuzzleMessage("Isi semua kotak dulu ya.");
    if (openFinalButton) openFinalButton.classList.add("is-hidden");
    puzzleSolved = false;
    return;
  }

  if (hasAnyWrong) {
    setPuzzleMessage("Masih ada jawaban yang belum pas. Coba cek lagi.");
    if (openFinalButton) openFinalButton.classList.add("is-hidden");
    puzzleSolved = false;
    return;
  }

  if (allCorrect && !puzzleSolved) {
    puzzleSolved = true;
    setPuzzleMessage("Nah, karena kamu berhasil nyelesain ini, berarti kamu layak buka hadiah terakhir.");
    if (openFinalButton) openFinalButton.classList.remove("is-hidden");
    burstConfetti();
  }
}

function burstConfetti() {
  const colors = ["#d65f7c", "#f0836d", "#7aa58d", "#89a9d8", "#d9a441"];
  const confettiLayer = document.createElement("div");

  confettiLayer.style.position = "fixed";
  confettiLayer.style.inset = "0";
  confettiLayer.style.pointerEvents = "none";
  confettiLayer.style.zIndex = "20";
  document.body.appendChild(confettiLayer);

  for (let index = 0; index < 90; index += 1) {
    const piece = document.createElement("span");
    const size = 6 + Math.random() * 8;
    const startX = 10 + Math.random() * 80;
    const drift = -90 + Math.random() * 180;

    piece.style.position = "absolute";
    piece.style.left = `${startX}%`;
    piece.style.top = "-20px";
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.4}px`;
    piece.style.borderRadius = "2px";
    piece.style.background = colors[index % colors.length];
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    piece.style.transition = `transform ${1600 + Math.random() * 800}ms ease-out, top ${1600 + Math.random() * 800}ms ease-in, opacity 500ms ease`;
    confettiLayer.appendChild(piece);

    requestAnimationFrame(() => {
      piece.style.top = "105vh";
      piece.style.opacity = "0.4";
      piece.style.transform = `translateX(${drift}px) rotate(${540 + Math.random() * 360}deg)`;
    });
  }

  window.setTimeout(() => confettiLayer.remove(), 2600);
}

function setOpeningState(isDeclined) {
  openingDeclined = isDeclined;
  openingMainImage.src = isDeclined ? "./img/whyno.gif" : "./img/doyouacceptthisgift.png";
  openingMainImage.alt = isDeclined ? "Why no" : "Will you accept this gift";
  openingSubcopy.classList.toggle("is-hidden", !isDeclined);
  declineButton.classList.toggle("is-hidden", isDeclined);
  openingActions.classList.toggle("is-single", isDeclined);
}

acceptButton.addEventListener("click", () => {
  tryPlayMusic();
  setOpeningState(false);
  renderLetter();
  showScreen("letter");
});

declineButton.addEventListener("click", () => {
  setOpeningState(true);
});

nextLetterButton.addEventListener("click", () => {
  if (letterIndex < birthdayPage.letter.length - 1) {
    letterIndex += 1;
    renderLetter();
    return;
  }

  showScreen("puzzle");
});

document.querySelectorAll(".nav-back").forEach((button) => {
  button.addEventListener("click", () => {
    const targetScreen = button.dataset.backTo;
    if (targetScreen === "opening") setOpeningState(openingDeclined);
    if (targetScreen) showScreen(targetScreen);
  });
});

if (crossword) {
  crossword.addEventListener("input", (event) => {
    if (!event.target.matches("input")) return;
    syncDirectionFromInput(event.target);
    event.target.value = event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase();
    saveCrosswordProgress();
    if (event.target.value) moveToNextInput(event.target);
    checkPuzzle();
  });

  crossword.addEventListener("keydown", (event) => {
    if (!event.target.matches("input")) return;

    if (event.key === "ArrowRight") {
      activeDirection = "across";
      event.preventDefault();
      const nextInput = getNeighbor(event.target, "across", 1);
      if (nextInput) nextInput.focus();
      return;
    }

    if (event.key === "ArrowLeft") {
      activeDirection = "across";
      event.preventDefault();
      const previousInput = getNeighbor(event.target, "across", -1);
      if (previousInput) previousInput.focus();
      return;
    }

    if (event.key === "ArrowDown") {
      activeDirection = "down";
      event.preventDefault();
      const nextInput = getNeighbor(event.target, "down", 1);
      if (nextInput) nextInput.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      activeDirection = "down";
      event.preventDefault();
      const previousInput = getNeighbor(event.target, "down", -1);
      if (previousInput) previousInput.focus();
      return;
    }

    if (event.key !== "Backspace" || event.target.value) return;
    event.preventDefault();
    event.target.value = "";
    saveCrosswordProgress();
    checkPuzzle();
    const previousInput = getNeighbor(event.target, activeDirection, -1);
    if (previousInput) previousInput.focus();
  });

  crossword.addEventListener("focusin", (event) => {
    if (!event.target.matches("input")) return;
    syncDirectionFromInput(event.target);
  });

  crossword.addEventListener("click", (event) => {
    if (!event.target.matches("input")) return;
    syncDirectionFromInput(event.target);
  });
}

openFinalButton.addEventListener("click", () => {
  showScreen("final");
});

document.getElementById("claim-button").addEventListener("click", () => {
  claimMessage.textContent = "Hadiah berhasil diklaim. Sekarang tinggal bilang mau makan apa dan kapan.";
  burstConfetti();
  window.setTimeout(() => {
    window.location.href = buildWhatsAppLink();
  }, 400);
});

renderCrossword();
setOpeningState(false);
