const APP_DEFAULT_STATE = {
  currentUser: null,
  currentUnitIndex: 0,
  currentChapterIndex: 0,
  currentKanjiIndex: 0,
  favorites: [],
  learned: [],
  weeklyHistory: [],
  justLoggedInByOtp: false
};

window.appState = {
  ...APP_DEFAULT_STATE,
  ...(window.appState || {})
};

const state = window.appState;

const loginPage = document.getElementById("loginPage");
const mainPage = document.getElementById("mainPage");
const authMessage = document.getElementById("authMessage");

const otpTabBtn = document.getElementById("otpTabBtn");
const passwordTabBtn = document.getElementById("passwordTabBtn");
const otpPanel = document.getElementById("otpPanel");
const passwordPanel = document.getElementById("passwordPanel");

const setPasswordModal = document.getElementById("setPasswordModal");
const newPassword = document.getElementById("newPassword");
const passwordModalMessage = document.getElementById("passwordModalMessage");

const unitList = document.getElementById("unitList");
const chapterList = document.getElementById("chapterList");
const kanjiList = document.getElementById("kanjiList");

const summaryUnit = document.getElementById("summaryUnit");
const summaryChapter = document.getElementById("summaryChapter");
const summaryLearned = document.getElementById("summaryLearned");
const summaryFavorites = document.getElementById("summaryFavorites");

const currentUnitBadge = document.getElementById("currentUnitBadge");
const currentChapterBadge = document.getElementById("currentChapterBadge");

const kanjiChar = document.getElementById("kanjiChar");
const readingLine = document.getElementById("readingLine");
const meaningLine = document.getElementById("meaningLine");

const vocabKana = document.getElementById("vocabKana");
const vocabKanji = document.getElementById("vocabKanji");
const vocabZh = document.getElementById("vocabZh");

const readingExampleKanji = document.getElementById("readingExampleKanji");
const writingExampleKanji = document.getElementById("writingExampleKanji");
const readPractice = document.getElementById("readPractice");
const writePractice = document.getElementById("writePractice");
const chapterReadExamples = document.getElementById("chapterReadExamples");
const chapterWriteExamples = document.getElementById("chapterWriteExamples");

const favoritesList = document.getElementById("favoritesList");
const weeklyReviewBox = document.getElementById("weeklyReviewBox");
const reviewSubtitle = document.getElementById("reviewSubtitle");

const savePasswordBtn = document.getElementById("savePasswordBtn");
const skipPasswordBtn = document.getElementById("skipPasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const favoriteBtn = document.getElementById("favoriteBtn");
const learnedBtn = document.getElementById("learnedBtn");
const openReviewPageBtn = document.getElementById("openReviewPageBtn");
const openFavoritesPageBtn = document.getElementById("openFavoritesPageBtn");
const backFromFavoritesBtn = document.getElementById("backFromFavoritesBtn");
const backFromReviewBtn = document.getElementById("backFromReviewBtn");
const speakWordBtn = document.getElementById("speakWordBtn");

const studyView = document.getElementById("studyView");
const favoritesView = document.getElementById("favoritesView");
const reviewView = document.getElementById("reviewView");

function setText(el, value) {
  if (el) el.textContent = value ?? "";
}

function setHtml(el, html) {
  if (el) el.innerHTML = html;
}

function showElement(el) {
  el?.classList.remove("hidden");
}

function hideElement(el) {
  el?.classList.add("hidden");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampIndex(value, maxLength) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n >= maxLength) return 0;
  return n;
}

function isValidKey(key) {
  return /^\d+-\d+-\d+$/.test(String(key || ""));
}

function sanitizeKey(key) {
  return isValidKey(key) ? String(key) : null;
}

function resetStudyState(keepUser = true) {
  const currentUser = keepUser ? state.currentUser : null;
  Object.assign(state, APP_DEFAULT_STATE, { currentUser });
}

function setAuthMessage(message, isError = true) {
  if (!authMessage) return;
  authMessage.textContent = message || "";
  authMessage.style.color = isError ? "#cb577a" : "#55906f";
}
window.setAuthMessage = setAuthMessage;

function openPasswordModal() {
  showElement(setPasswordModal);
}

function closePasswordModal() {
  hideElement(setPasswordModal);
  setText(passwordModalMessage, "");
  if (newPassword) newPassword.value = "";
}

function showMainPage() {
  hideElement(loginPage);
  showElement(mainPage);
  showStudyView();
  renderAll();
}

function showStudyView() {
  showElement(studyView);
  hideElement(favoritesView);
  hideElement(reviewView);
}

function showFavoritesView() {
  hideElement(studyView);
  showElement(favoritesView);
  hideElement(reviewView);
  renderFavoritesPage();
}

function showReviewView() {
  hideElement(studyView);
  hideElement(favoritesView);
  showElement(reviewView);
  renderChapterReview();
}

function getSafeUnits() {
  return safeArray(window.bookData);
}

function getCurrentUnit() {
  const units = getSafeUnits();
  return units.length ? units[state.currentUnitIndex] || units[0] : null;
}

function getCurrentChapter() {
  const unit = getCurrentUnit();
  const chapters = safeArray(unit?.chapters);
  return chapters.length ? chapters[state.currentChapterIndex] || chapters[0] : null;
}

function getCurrentKanji() {
  const chapter = getCurrentChapter();
  const items = safeArray(chapter?.kanjiItems);
  return items.length ? items[state.currentKanjiIndex] || items[0] : null;
}

function resetIndexesIfNeeded() {
  const units = getSafeUnits();
  if (!units.length) {
    state.currentUnitIndex = 0;
    state.currentChapterIndex = 0;
    state.currentKanjiIndex = 0;
    return;
  }

  state.currentUnitIndex = clampIndex(state.currentUnitIndex, units.length);

  const chapters = safeArray(getCurrentUnit()?.chapters);
  if (!chapters.length) {
    state.currentChapterIndex = 0;
    state.currentKanjiIndex = 0;
    return;
  }

  state.currentChapterIndex = clampIndex(state.currentChapterIndex, chapters.length);

  const items = safeArray(getCurrentChapter()?.kanjiItems);
  if (!items.length) {
    state.currentKanjiIndex = 0;
    return;
  }

  state.currentKanjiIndex = clampIndex(state.currentKanjiIndex, items.length);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodeJsString(value) {
  return encodeURIComponent(String(value ?? ""));
}

function getCurrentKey() {
  return `${state.currentUnitIndex}-${state.currentChapterIndex}-${state.currentKanjiIndex}`;
}

function parseKey(key) {
  if (!isValidKey(key)) return [0, 0, 0];
  return String(key).split("-").map((part) => Number(part));
}

function renderUnits() {
  if (!unitList) return;
  unitList.innerHTML = "";

  const units = getSafeUnits();
  if (!units.length) {
    unitList.innerHTML = '<div class="empty-box">请先在 data.js 中添加单元内容</div>';
    return;
  }

  units.forEach((unit, index) => {
    const div = document.createElement("div");
    div.className = `list-item${index === state.currentUnitIndex ? " active" : ""}`;
    div.textContent = unit?.unitTitle || `单元 ${index + 1}`;
    div.addEventListener("click", async () => {
      state.currentUnitIndex = index;
      state.currentChapterIndex = 0;
      state.currentKanjiIndex = 0;
      renderAll();
      await persistProgress();
    });
    unitList.appendChild(div);
  });
}

function renderChapters() {
  if (!chapterList) return;
  chapterList.innerHTML = "";

  const chapters = safeArray(getCurrentUnit()?.chapters);
  if (!chapters.length) {
    chapterList.innerHTML = '<div class="empty-box">当前单元暂无章节</div>';
    return;
  }

  chapters.forEach((chapter, index) => {
    const div = document.createElement("div");
    div.className = `list-item${index === state.currentChapterIndex ? " active" : ""}`;
    div.textContent = chapter?.chapterTitle || `章节 ${index + 1}`;
    div.addEventListener("click", async () => {
      state.currentChapterIndex = index;
      state.currentKanjiIndex = 0;
      renderAll();
      await persistProgress();
    });
    chapterList.appendChild(div);
  });
}

function renderKanjiList() {
  if (!kanjiList) return;
  kanjiList.innerHTML = "";

  const items = safeArray(getCurrentChapter()?.kanjiItems);
  if (!items.length) {
    kanjiList.innerHTML = '<div class="empty-box">当前章节暂无汉字</div>';
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = `kanji-pill${index === state.currentKanjiIndex ? " active" : ""}`;
    div.textContent = item?.kanji || "—";
    div.addEventListener("click", async () => {
      state.currentKanjiIndex = index;
      renderDetail();
      renderKanjiList();
      await persistProgress();
    });
    kanjiList.appendChild(div);
  });
}

function renderExampleCards(list) {
  const items = safeArray(list);
  if (!items.length) {
    return '<div class="empty-box">暂无例句</div>';
  }

  return items.map((item, index) => {
    const speakTextValue = item?.kanji || item?.sentence || "";
    const speakButton = speakTextValue
      ? `<button class="icon-btn" type="button" onclick="window.speakText(decodeURIComponent('${encodeJsString(speakTextValue)}'))">🔊</button>`
      : "";

    return `
      <div class="example-card">
        <div class="example-top">
          <div class="example-text">
            <div><strong>${index + 1}.</strong> ${escapeHtml(item?.kanji || item?.sentence || "-")}</div>
            ${item?.kana ? `<div class="example-kana">${escapeHtml(item.kana)}</div>` : ""}
            ${item?.zh ? `<div class="example-zh">${escapeHtml(item.zh)}</div>` : ""}
          </div>
          ${speakButton}
        </div>
      </div>
    `;
  }).join("");
}

function renderPracticeCards(list, type = "read") {
  const items = safeArray(list);
  if (!items.length) {
    return '<div class="empty-box">暂无练习</div>';
  }

  return items.map((q, index) => `
    <div class="practice-card">
      <div class="practice-question"><strong>${index + 1}.</strong> ${escapeHtml(q?.question || "-")}</div>
      <div class="practice-row">
        <input class="practice-input" id="${type}Input${index}" placeholder="输入答案" />
        <button
          class="white-btn"
          type="button"
          onclick="window.checkPracticeAnswer('${type}', ${index}, decodeURIComponent('${encodeJsString(q?.answer || "")}'))"
        >
          提交
        </button>
      </div>
      <div id="${type}Result${index}" class="practice-result"></div>
    </div>
  `).join("");
}

function updateActionButtons() {
  const currentKey = getCurrentKey();
  if (favoriteBtn) {
    favoriteBtn.textContent = state.favorites.includes(currentKey) ? "★ 已收藏" : "☆ 收藏夹";
  }
  if (learnedBtn) {
    learnedBtn.textContent = state.learned.includes(currentKey) ? "✓ 已学习" : "✓ 标记已学习";
  }
}

function renderReadingButtons(readingText) {
  if (!readingLine) return;

  const parts = String(readingText || "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    readingLine.textContent = "-";
    return;
  }

  readingLine.innerHTML = parts.map((part) => `
    <button
      type="button"
      class="reading-speak-btn"
      onclick="window.speakText(decodeURIComponent('${encodeJsString(part)}'))"
    >
      ${escapeHtml(part)}
    </button>
  `).join("");
}

function renderEmptyDetail() {
  setText(currentUnitBadge, "未设置");
  setText(currentChapterBadge, "未设置");
  setText(summaryUnit, "-");
  setText(summaryChapter, "-");
  setText(summaryLearned, String(state.learned.length));
  setText(summaryFavorites, String(state.favorites.length));

  setText(kanjiChar, "—");
  setText(readingLine, "-");
  setText(meaningLine, "-");
  setText(vocabKana, "-");
  setText(vocabKanji, "-");
  setText(vocabZh, "-");

  setHtml(readingExampleKanji, '<div class="empty-box">暂无内容</div>');
  setHtml(writingExampleKanji, '<div class="empty-box">暂无内容</div>');
  setHtml(readPractice, '<div class="empty-box">暂无内容</div>');
  setHtml(writePractice, '<div class="empty-box">暂无内容</div>');
  setHtml(chapterReadExamples, '<div class="empty-box">暂无内容</div>');
  setHtml(chapterWriteExamples, '<div class="empty-box">暂无内容</div>');

  updateActionButtons();
}

function renderDetail() {
  const unit = getCurrentUnit();
  const chapter = getCurrentChapter();
  const item = getCurrentKanji();

  if (!unit || !chapter || !item) {
    renderEmptyDetail();
    return;
  }

  setText(currentUnitBadge, unit.unitTitle || "未分组");
  setText(currentChapterBadge, chapter.chapterTitle || "未分课");

  setText(summaryUnit, unit.unitTitle || "-");
  setText(summaryChapter, chapter.chapterTitle || "-");
  setText(summaryLearned, String(state.learned.length));
  setText(summaryFavorites, String(state.favorites.length));

  setText(kanjiChar, item.kanji || "—");
  renderReadingButtons(item.reading || "-");
  setText(meaningLine, item.meaning || "-");

  setText(vocabKana, item.vocabKana || "-");
  setText(vocabKanji, item.vocabKanji || "-");
  setText(vocabZh, item.vocabZh || "-");

  setHtml(readingExampleKanji, renderExampleCards(item.readExamples));
  setHtml(writingExampleKanji, renderExampleCards(item.writeExamples));
  setHtml(readPractice, renderPracticeCards(item.readPracticeList, "read"));
  setHtml(writePractice, renderPracticeCards(item.writePracticeList, "write"));

  setHtml(chapterReadExamples, renderExampleCards(chapter.chapterReadExamples));
  setHtml(chapterWriteExamples, renderExampleCards(chapter.chapterWriteExamples));

  updateActionButtons();
}

function moveNext() {
  const items = safeArray(getCurrentChapter()?.kanjiItems);
  if (!items.length) return;

  state.currentKanjiIndex = state.currentKanjiIndex < items.length - 1
    ? state.currentKanjiIndex + 1
    : 0;

  renderDetail();
  renderKanjiList();
}

function movePrev() {
  const items = safeArray(getCurrentChapter()?.kanjiItems);
  if (!items.length) return;

  state.currentKanjiIndex = state.currentKanjiIndex > 0
    ? state.currentKanjiIndex - 1
    : items.length - 1;

  renderDetail();
  renderKanjiList();
}

function toggleFavorite() {
  const key = getCurrentKey();

  if (state.favorites.includes(key)) {
    state.favorites = state.favorites.filter((item) => item !== key);
  } else {
    state.favorites = [...new Set([...state.favorites, key])];
  }

  renderFavoritesPage();
  renderDetail();
}

function toggleLearned() {
  const key = getCurrentKey();
  if (!state.learned.includes(key)) {
    state.learned = [...new Set([...state.learned, key])];
  }
  renderDetail();
}

function renderFavoritesPage() {
  if (!favoritesList) return;

  const validFavorites = state.favorites
    .map((key) => sanitizeKey(key))
    .filter(Boolean);

  if (validFavorites.length !== state.favorites.length) {
    state.favorites = validFavorites;
  }

  if (!state.favorites.length) {
    favoritesList.innerHTML = '<div class="empty-box">还没有收藏内容</div>';
    return;
  }

  const html = state.favorites.map((key) => {
    const [u, c, k] = parseKey(key);
    const unit = getSafeUnits()[u];
    const chapter = safeArray(unit?.chapters)[c];
    const item = safeArray(chapter?.kanjiItems)[k];

    if (!item) return "";

    return `
      <div class="favorite-card">
        <div class="favorite-title">${escapeHtml(item.kanji || "—")}｜${escapeHtml(item.vocabKanji || item.reading || "")}</div>
        <div class="favorite-meta">
          ${escapeHtml(unit?.unitTitle || "-")} / ${escapeHtml(chapter?.chapterTitle || "-")}<br/>
          ${escapeHtml(item.meaning || "-")}
        </div>
        <div class="button-row">
          <button class="white-btn" type="button" onclick="window.openFavoriteByKey('${key}')">进入学习</button>
          <button class="white-btn danger-text" type="button" onclick="window.removeFavoriteByKey('${key}')">移除收藏</button>
        </div>
      </div>
    `;
  }).filter(Boolean).join("");

  favoritesList.innerHTML = html || '<div class="empty-box">还没有收藏内容</div>';
}

function markWeeklyHistory() {
  state.weeklyHistory.push({
    key: getCurrentKey(),
    time: new Date().toISOString()
  });
}

function renderChapterReview() {
  if (!weeklyReviewBox || !reviewSubtitle) return;

  const unit = getCurrentUnit();
  const chapter = getCurrentChapter();
  const review = unit?.review;

  reviewSubtitle.textContent = unit?.unitTitle
    ? `${unit.unitTitle}${chapter?.chapterTitle ? ` / ${chapter.chapterTitle}` : ""} · 整章复习`
    : "当前章节暂无复习内容";

  if (!review) {
    weeklyReviewBox.innerHTML = '<div class="empty-box">这一章还没有复习内容</div>';
    return;
  }

  const readHtml = safeArray(review.readQuestions).map((q, i) => `
    <div class="review-card">
      <h4 class="review-group-title">读法 ${i + 1}</h4>
      <div class="practice-question">${escapeHtml(q?.sentence || "-")}</div>
      <div class="practice-row">
        <input class="practice-input" id="reviewRead${i}" placeholder="输入答案" />
        <button
          class="white-btn"
          type="button"
          onclick="window.checkReviewAnswer('reviewRead${i}', decodeURIComponent('${encodeJsString(q?.answer || "")}'), 'reviewReadResult${i}')"
        >
          提交
        </button>
      </div>
      <div id="reviewReadResult${i}" class="practice-result"></div>
    </div>
  `).join("");

  const writeHtml = safeArray(review.writeQuestions).map((q, i) => `
    <div class="review-card">
      <h4 class="review-group-title">写法 ${i + 1}</h4>
      <div class="practice-question">${escapeHtml(q?.sentence || "-")}</div>
      <div class="practice-row">
        <input class="practice-input" id="reviewWrite${i}" placeholder="输入答案" />
        <button
          class="white-btn"
          type="button"
          onclick="window.checkReviewAnswer('reviewWrite${i}', decodeURIComponent('${encodeJsString(q?.answer || "")}'), 'reviewWriteResult${i}')"
        >
          提交
        </button>
      </div>
      <div id="reviewWriteResult${i}" class="practice-result"></div>
    </div>
  `).join("");

  weeklyReviewBox.innerHTML = `
    <div class="section-title">1. 汉字の読み方を書いてください</div>
    ${readHtml || '<div class="empty-box">暂无读法复习</div>'}
    <div class="section-title">2. 汉字を書いてください</div>
    ${writeHtml || '<div class="empty-box">暂无写法复习</div>'}
  `;
}

function renderAll() {
  resetIndexesIfNeeded();
  renderUnits();
  renderChapters();
  renderKanjiList();
  renderDetail();
  renderFavoritesPage();

  if (reviewView && !reviewView.classList.contains("hidden")) {
    renderChapterReview();
  }
}

async function persistProgress() {
  if (!state.currentUser?.id || typeof window.saveUserProgress !== "function") {
    return;
  }

  await window.saveUserProgress(state.currentUser.id, {
    currentUnitIndex: state.currentUnitIndex,
    currentChapterIndex: state.currentChapterIndex,
    currentKanjiIndex: state.currentKanjiIndex,
    favorites: state.favorites,
    learned: state.learned,
    weeklyHistory: state.weeklyHistory
  });
}

function applySavedProgress(saved) {
  resetStudyState(true);

  if (!saved || typeof saved !== "object") {
    renderAll();
    return;
  }

  state.currentUnitIndex = Number(saved.current_unit_index || 0);
  state.currentChapterIndex = Number(saved.current_chapter_index || 0);
  state.currentKanjiIndex = Number(saved.current_kanji_index || 0);
  state.favorites = safeArray(saved.favorites)
    .map((key) => sanitizeKey(key))
    .filter(Boolean);
  state.learned = safeArray(saved.learned)
    .map((key) => sanitizeKey(key))
    .filter(Boolean);
  state.weeklyHistory = safeArray(saved.weekly_history)
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      key: sanitizeKey(item.key) || getCurrentKey(),
      time: item.time || new Date().toISOString()
    }));

  resetIndexesIfNeeded();
  renderAll();
}

window.openFavoriteByKey = async function(key) {
  const [u, c, k] = parseKey(key);
  state.currentUnitIndex = u;
  state.currentChapterIndex = c;
  state.currentKanjiIndex = k;
  showStudyView();
  renderAll();
  await persistProgress();
};

window.removeFavoriteByKey = async function(key) {
  state.favorites = state.favorites.filter((item) => item !== key);
  renderFavoritesPage();
  renderDetail();
  await persistProgress();
};

window.checkPracticeAnswer = function(type, index, answer) {
  const input = document.getElementById(`${type}Input${index}`);
  const resultBox = document.getElementById(`${type}Result${index}`);
  if (!input || !resultBox) return;

  const userAnswer = input.value.trim();
  if (!userAnswer) {
    resultBox.textContent = "请先输入答案";
    resultBox.style.color = "#cb577a";
    return;
  }

  if (userAnswer === answer) {
    resultBox.textContent = "✅ 正确";
    resultBox.style.color = "#55906f";
  } else {
    resultBox.textContent = `❌ 不对，正确答案：${answer}`;
    resultBox.style.color = "#cb577a";
  }
};

window.checkReviewAnswer = function(inputId, answer, resultId) {
  const input = document.getElementById(inputId);
  const resultBox = document.getElementById(resultId);
  if (!input || !resultBox) return;

  const userAnswer = input.value.trim();
  if (!userAnswer) {
    resultBox.textContent = "请先输入答案";
    resultBox.style.color = "#cb577a";
    return;
  }

  if (userAnswer === answer) {
    resultBox.textContent = "✅ 正确";
    resultBox.style.color = "#55906f";
  } else {
    resultBox.textContent = `❌ 正确答案：${answer}`;
    resultBox.style.color = "#cb577a";
  }
};
let japaneseVoices = [];

function loadJapaneseVoices() {
  const voices = window.speechSynthesis.getVoices();
  japaneseVoices = voices.filter(v => v.lang && v.lang.includes("ja"));
}

if ("speechSynthesis" in window) {
  loadJapaneseVoices();
  window.speechSynthesis.onvoiceschanged = loadJapaneseVoices;
}

function getBestVoice() {
  if (!japaneseVoices.length) loadJapaneseVoices();

  // 优先级排序（更自然）
  return japaneseVoices.find(v => v.name.includes("Google")) ||
         japaneseVoices.find(v => v.name.includes("Microsoft")) ||
         japaneseVoices[0] ||
         null;
}
window.speakText = function(text) {
  if (!text) return;

  if (!("speechSynthesis" in window)) {
    console.warn("浏览器不支持语音");
    return;
  }

  // ⭐ 先做“日语优化处理”（关键）
  let processedText = String(text)
    .replace(/\s+/g, " ")
    .replace(/、/g, "、 ")
    .replace(/。/g, "。 ")
    .replace(/\//g, "、 "); // 多读音更自然

  const utter = new SpeechSynthesisUtterance(processedText);

  // ⭐ 核心调参（非常关键）
  utter.lang = "ja-JP";

  utter.rate = 0.78;   // 🔥 更慢 → 更像人
  utter.pitch = 1.05;  // 🔥 稍微高一点 → 更自然
  utter.volume = 1;

  // ⭐ 选最优 voice（增强版）
  const voices = speechSynthesis.getVoices();

  const voice =
    voices.find(v => v.name.includes("Google") && v.lang.includes("ja")) ||
    voices.find(v => v.name.includes("Microsoft") && v.lang.includes("ja")) ||
    voices.find(v => v.lang.includes("ja")) ||
    null;

  if (voice) {
    utter.voice = voice;
    console.log("使用语音:", voice.name);
  } else {
    console.log("⚠️ 没有找到日语语音");
  }

  // ⭐ 停顿优化（非常重要）
  utter.onstart = () => {
    speechSynthesis.cancel();
  };

  // ⭐ 防止叠音
  speechSynthesis.cancel();

  // ⭐ 微延迟 → 更自然（关键技巧）
  setTimeout(() => {
    speechSynthesis.speak(utter);
  }, 80);
};




window.onOtpLoginSuccess = function(user, savedProgress) {
  state.currentUser = user || null;
  state.justLoggedInByOtp = true;
  applySavedProgress(savedProgress);
  state.currentUser = user || null;
  state.justLoggedInByOtp = true;
  showMainPage();
  openPasswordModal();
};

window.onPasswordLoginSuccess = function(user, savedProgress) {
  state.currentUser = user || null;
  applySavedProgress(savedProgress);
  state.currentUser = user || null;

  if (state.justLoggedInByOtp) {
    return;
  }

  showMainPage();
};

window.onUserLoggedOut = function() {
  resetStudyState(false);

  hideElement(mainPage);
  showElement(loginPage);
  closePasswordModal();
  setAuthMessage("");

  const emailInput = document.getElementById("email");
  const codeInput = document.getElementById("code");
  const passwordEmailInput = document.getElementById("passwordEmail");
  const passwordInput = document.getElementById("password");

  if (emailInput) emailInput.value = "";
  if (codeInput) codeInput.value = "";
  if (passwordEmailInput) passwordEmailInput.value = "";
  if (passwordInput) passwordInput.value = "";

  renderAll();
};

otpTabBtn?.addEventListener("click", () => {
  otpTabBtn.classList.add("active");
  passwordTabBtn?.classList.remove("active");
  showElement(otpPanel);
  hideElement(passwordPanel);
});

passwordTabBtn?.addEventListener("click", () => {
  passwordTabBtn.classList.add("active");
  otpTabBtn?.classList.remove("active");
  showElement(passwordPanel);
  hideElement(otpPanel);
});

savePasswordBtn?.addEventListener("click", async () => {
  setText(passwordModalMessage, "");
  const pwd = newPassword?.value.trim() || "";

  if (pwd.length < 6) {
    setText(passwordModalMessage, "密码至少 6 位");
    return;
  }

  const ok = await window.setPasswordForCurrentUser?.(pwd);
  if (ok) {
    state.justLoggedInByOtp = false;
    closePasswordModal();
    showMainPage();
  } else {
    setText(passwordModalMessage, "设置密码失败");
  }
});

skipPasswordBtn?.addEventListener("click", () => {
  state.justLoggedInByOtp = false;
  closePasswordModal();
  showMainPage();
});

logoutBtn?.addEventListener("click", async () => {
  state.justLoggedInByOtp = false;
  await window.logoutUser?.();
});

prevBtn?.addEventListener("click", async () => {
  movePrev();
  markWeeklyHistory();
  await persistProgress();
});

nextBtn?.addEventListener("click", async () => {
  moveNext();
  markWeeklyHistory();
  await persistProgress();
});

favoriteBtn?.addEventListener("click", async () => {
  toggleFavorite();
  await persistProgress();
});

learnedBtn?.addEventListener("click", async () => {
  toggleLearned();
  await persistProgress();
});

openFavoritesPageBtn?.addEventListener("click", showFavoritesView);
openReviewPageBtn?.addEventListener("click", showReviewView);
backFromFavoritesBtn?.addEventListener("click", showStudyView);
backFromReviewBtn?.addEventListener("click", showStudyView);

speakWordBtn?.addEventListener("click", () => {
  const item = getCurrentKanji();
  if (item?.vocabKanji) {
    window.speakText(item.vocabKanji);
  } else if (item?.kanji) {
    window.speakText(item.kanji);
  }
});

window.applySavedProgress = applySavedProgress;
window.renderAll = renderAll;

renderAll();
