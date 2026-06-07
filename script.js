const birthdayPage = {
  letter: [
    "It's your day!!! HARI INI HARIMUUUUU!!! YEYYYY. Selamat ulang tahun yaa My Baby Sweety Pretty Cinnamon Apple Girl <3 ",
    "Semoga panjang umur, bahagia selalu, mimpinya tercapai dan harapannya dikabulkann.",
    "I'm sad that we can't celebrate your birthday together :( but it's okay since kita masih bisa call-an tiap hari yayy :>",
    "Terakhir, semoga kamu suka dengan hadiah yang kubuat ini, masih ada beberapa kejutan lainnya yang aku selipkan di laman spesial ini. Happy Birthdayy"
  ],
  memories: [
    {
      title: "Momen random yang masih aku inget",
      text: "Ada hal kecil yang mungkin kamu lupa, tapi entah kenapa masih nyangkut di kepalaku sampai sekarang."
    },
    {
      title: "Hal dari kamu yang bikin aku senyum",
      text: "Cara kamu cerita, cara kamu bereaksi, dan cara kamu jadi lucu tanpa sadar. Itu selalu punya tempat sendiri."
    },
    {
      title: "Hari yang rasanya sederhana",
      text: "Bukan karena tempatnya spesial, tapi karena waktu itu ada kamu di sana. Kadang sesimpel itu."
    }
  ],
  puzzleWords: [
    {
      number: 1,
      answer: "KAMU",
      clue: "Orang yang jadi alasan halaman ini dibuat.",
      row: 1,
      col: 1,
      direction: "across"
    },
    {
      number: 2,
      answer: "KENANGAN",
      clue: "Hal-hal kecil yang masih aku simpan tentang kita.",
      row: 1,
      col: 1,
      direction: "down"
    },
    {
      number: 3,
      answer: "RUMAH",
      clue: "Rasa nyaman yang kadang muncul bukan karena tempat, tapi karena orangnya.",
      row: 5,
      col: 4,
      direction: "across"
    },
    {
      number: 4,
      answer: "MANIS",
      clue: "Kata yang cocok buat momen kecil yang susah dijelasin.",
      row: 3,
      col: 10,
      direction: "down"
    },
    {
      number: 5,
      answer: "MONOKROM",
      clue: "Lagu yang sudah disiapkan jadi musik latar halaman ini.",
      row: 9,
      col: 2,
      direction: "across"
    }
  ]
};

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
const memoryGrid = document.getElementById("memory-grid");
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
const gridSize = 11;
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

function tryPlayMusic() {
  if (!music) return;
  music.volume = 0.34;
  music.play().catch(() => {
    // Browser biasanya menunggu interaksi user sebelum audio boleh mulai.
  });
}

function renderLetter() {
  letterText.textContent = birthdayPage.letter[letterIndex];
  letterProgress.innerHTML = birthdayPage.letter
    .map((_, index) => `<span class="letter-dot${index === letterIndex ? " is-active" : ""}"></span>`)
    .join("");
  nextLetterButton.textContent = letterIndex === birthdayPage.letter.length - 1 ? "Lihat kenangan" : "Lanjut";
}

function renderMemories() {
  memoryGrid.innerHTML = birthdayPage.memories
    .map((memory, index) => `
      <article class="memory-card">
        <span>${index + 1}</span>
        <h3>${memory.title}</h3>
        <p>${memory.text}</p>
      </article>
    `)
    .join("");
}

function cellKey(row, col) {
  return `${row}-${col}`;
}

function buildCellMap() {
  birthdayPage.puzzleWords.forEach((word) => {
    [...word.answer].forEach((letter, index) => {
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

function renderClues() {
  const renderList = (direction) => birthdayPage.puzzleWords
    .filter((word) => word.direction === direction)
    .map((word) => `<li value="${word.number}">${word.clue}</li>`)
    .join("");

  acrossClues.innerHTML = renderList("across");
  downClues.innerHTML = renderList("down");
}

function renderCrossword() {
  buildCellMap();
  const cells = [];

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
  renderClues();
}

function getInputAt(row, col) {
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
  const nextInput = getNeighbor(currentInput, activeDirection, 1);
  if (nextInput) nextInput.focus();
}

function checkPuzzle() {
  const inputs = Array.from(crossword.querySelectorAll("input"));
  const allCorrect = inputs.every((input) => input.value.toUpperCase() === input.dataset.answer);

  inputs.forEach((input) => {
    const hasValue = input.value.trim().length > 0;
    const isCorrect = input.value.toUpperCase() === input.dataset.answer;
    input.classList.toggle("is-filled", hasValue && isCorrect);
    input.classList.toggle("is-wrong", hasValue && !isCorrect);
  });

  if (allCorrect && !puzzleSolved) {
    puzzleSolved = true;
    puzzleNote.textContent = "Nah, karena kamu berhasil nyelesain ini, berarti kamu layak buka hadiah terakhir.";
    openFinalButton.classList.remove("is-hidden");
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
  tryPlayMusic();
  setOpeningState(true);
});

nextLetterButton.addEventListener("click", () => {
  if (letterIndex < birthdayPage.letter.length - 1) {
    letterIndex += 1;
    renderLetter();
    return;
  }

  renderMemories();
  showScreen("timeline");
});

document.getElementById("timeline-next").addEventListener("click", () => {
  showScreen("puzzle");
});

document.querySelectorAll(".nav-back").forEach((button) => {
  button.addEventListener("click", () => {
    const targetScreen = button.dataset.backTo;
    if (targetScreen === "opening") setOpeningState(openingDeclined);
    if (targetScreen) showScreen(targetScreen);
  });
});

crossword.addEventListener("input", (event) => {
  if (!event.target.matches("input")) return;
  syncDirectionFromInput(event.target);
  event.target.value = event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase();
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

openFinalButton.addEventListener("click", () => {
  showScreen("final");
});

document.getElementById("claim-button").addEventListener("click", () => {
  claimMessage.textContent = "Hadiah berhasil diklaim. Sekarang tinggal bilang mau makan apa dan kapan.";
  burstConfetti();
});

renderCrossword();
setOpeningState(false);
