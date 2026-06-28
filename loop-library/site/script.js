const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const THEME_STORAGE_KEY = "loop-library-theme";

function readStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      `切换到${isDark ? "浅色" : "深色"}模式`,
    );
  }

  if (themeColor) {
    themeColor.setAttribute("content", isDark ? "#101010" : "#faf8f7");
  }

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies for this page view.
    }
  }
}

applyTheme(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });
}

themeMedia.addEventListener("change", (event) => {
  if (!readStoredTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

const searchInput = document.querySelector("#loop-search");
const loopRows = [...document.querySelectorAll(".loop-row")];
const categoryFilters = [
  ...document.querySelectorAll("[data-category-filter]"),
];
const sortSelect = document.querySelector("#loop-sort");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const pagination = document.querySelector("#library-pagination");
const paginationPrevious = document.querySelector("#pagination-previous");
const paginationNext = document.querySelector("#pagination-next");
const paginationStatus = document.querySelector("#pagination-status");
const toast = document.querySelector("#toast");
const PAGE_SIZE = 25;

const loopTableBody = document.querySelector(".loop-table tbody");
const loopRowPositions = new Map(
  loopRows.map((row, index) => [row, index]),
);
const SORT_OPTIONS = new Set([
  "featured",
  "newest",
  "oldest",
  "alphabetical",
]);

let activeSort = "featured";

if (sortSelect) {
  sortSelect.addEventListener("pointerdown", () => {
    sortSelect.classList.add("is-pointer-focused");
  });
  sortSelect.addEventListener("keydown", () => {
    sortSelect.classList.remove("is-pointer-focused");
  });
  sortSelect.addEventListener("blur", () => {
    sortSelect.classList.remove("is-pointer-focused");
  });
}

function rowTitle(row) {
  return normalize(row.querySelector(".loop-title-link")?.textContent ?? "");
}

function compareNewest(a, b) {
  const publishedDifference = (b.dataset.published ?? "").localeCompare(
    a.dataset.published ?? "",
  );

  if (publishedDifference !== 0) {
    return publishedDifference;
  }

  return loopRowPositions.get(b) - loopRowPositions.get(a);
}

function comparePopular(a, b) {
  const upvoteDifference =
    Number(b.dataset.upvotes || 0) - Number(a.dataset.upvotes || 0);

  return upvoteDifference !== 0 ? upvoteDifference : compareNewest(a, b);
}

function compareOldest(a, b) {
  const publishedDifference = (a.dataset.published ?? "").localeCompare(
    b.dataset.published ?? "",
  );

  if (publishedDifference !== 0) {
    return publishedDifference;
  }

  return loopRowPositions.get(a) - loopRowPositions.get(b);
}

function compareFeatured(a, b) {
  const featuredDifference =
    Number(b.dataset.featured === "true") -
    Number(a.dataset.featured === "true");

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return comparePopular(a, b);
}

function applySort(sort) {
  activeSort = SORT_OPTIONS.has(sort) ? sort : "featured";

  if (sortSelect) {
    sortSelect.value = activeSort;
  }

  loopRows.sort((a, b) => {
    if (activeSort === "alphabetical") {
      return rowTitle(a).localeCompare(rowTitle(b), undefined, {
        sensitivity: "base",
      });
    }

    if (activeSort === "newest") {
      return compareNewest(a, b);
    }

    return activeSort === "oldest" ? compareOldest(a, b) : compareFeatured(a, b);
  });

  if (loopTableBody) {
    loopRows.forEach((row) => loopTableBody.append(row));
  }
}

applySort(activeSort);

// Snapshot each row's searchable text before the prompt toggle is injected
// below. Read the loop content rather than the whole row so search does not
const rowSearchText = new Map(
  loopRows.map((row) => {
    const content = row.querySelector(".cell-loop") ?? row;
    return [row, normalize(`${row.dataset.search ?? ""} ${content.textContent}`)];
  }),
);

const promptPreviews = loopRows
  .map((row, index) => {
    const prompt = row.querySelector("[data-prompt]");

    if (!prompt) {
      return null;
    }

    const loopSlug =
      row
        .querySelector(".loop-title-link")
        ?.getAttribute("href")
        ?.split("/")
        .filter(Boolean)
        .at(-1) || `item-${index + 1}`;
    const button = document.createElement("button");
    const preview = { button, prompt, row };

    prompt.id = `loop-prompt-${loopSlug}`;
    prompt.classList.add("is-collapsible");
    button.className = "loop-prompt-toggle";
    button.type = "button";
    button.hidden = true;
    button.textContent = "展开";
    button.setAttribute("aria-controls", prompt.id);
    button.setAttribute("aria-expanded", "false");
    prompt.insertAdjacentElement("afterend", button);

    button.addEventListener("click", () => {
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      const nextExpanded = !isExpanded;

      button.setAttribute("aria-expanded", String(nextExpanded));
      button.textContent = nextExpanded ? "收起" : "展开";
      prompt.classList.toggle("is-expanded", nextExpanded);
    });

    return preview;
  })
  .filter(Boolean);

function syncPromptToggle({ button, prompt, row }) {
  if (row.hidden) {
    return;
  }

  if (button.getAttribute("aria-expanded") === "true") {
    button.hidden = false;
    return;
  }

  button.hidden = prompt.scrollHeight <= prompt.clientHeight + 1;
}

function syncVisiblePromptToggles() {
  promptPreviews.forEach(syncPromptToggle);
}

let activeCategory = "all";
let currentPage = 1;
let toastTimer;

function normalize(value) {
  return value.toLowerCase().trim();
}

function updateLibrary() {
  if (!searchInput || !resultsCount || !emptyState) {
    return;
  }

  const query = normalize(searchInput.value);
  const matchingRows = loopRows.filter((row) => {
    const searchableText = rowSearchText.get(row) ?? "";
    const matchesSearch =
      query.length === 0 || searchableText.includes(query);
    const matchesCategory =
      activeCategory === "all" || row.dataset.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const totalMatches = matchingRows.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, totalMatches);
  const pageRows = new Set(matchingRows.slice(pageStart, pageEnd));

  loopRows.forEach((row) => {
    row.hidden = !pageRows.has(row);
  });

  if (totalMatches === 0) {
    resultsCount.textContent = "显示 0 个 loop";
  } else if (totalMatches === 1) {
    resultsCount.textContent = "显示 1 个 loop";
  } else {
    resultsCount.textContent = `显示第 ${pageStart + 1}–${pageEnd} 个，共 ${totalMatches} 个 loop`;
  }

  emptyState.hidden = totalMatches !== 0;

  if (
    pagination &&
    paginationPrevious &&
    paginationNext &&
    paginationStatus
  ) {
    pagination.hidden = totalPages <= 1;
    paginationPrevious.disabled = currentPage === 1;
    paginationNext.disabled = currentPage === totalPages;
    paginationStatus.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
  }

  window.requestAnimationFrame(syncVisiblePromptToggles);
}

// Keep the library's state shareable without discarding tracking or other
// query parameters owned by the surrounding site.
function syncUrlState(method = "replace") {
  if (typeof window.history?.replaceState !== "function") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const query = searchInput?.value.trim() ?? "";

  if (query) {
    params.set("q", query);
  } else {
    params.delete("q");
  }

  if (activeCategory && activeCategory !== "all") {
    params.set("category", activeCategory);
  } else {
    params.delete("category");
  }

  if (activeSort !== "featured") {
    params.set("sort", activeSort);
  } else {
    params.delete("sort");
  }

  if (currentPage > 1) {
    params.set("page", String(currentPage));
  } else {
    params.delete("page");
  }

  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${
    window.location.hash
  }`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl === currentUrl) {
    return;
  }

  if (method === "push" && typeof window.history.pushState === "function") {
    window.history.pushState(null, "", nextUrl);
  } else {
    window.history.replaceState(null, "", nextUrl);
  }
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);

  if (searchInput) {
    searchInput.value = params.get("q") ?? "";
  }

  applyCategory(params.get("category") ?? "all");
  applySort(params.get("sort") ?? "featured");

  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
}

function focusFirstVisibleLoop() {
  const firstVisibleTitle = loopRows
    .find((row) => !row.hidden)
    ?.querySelector(".loop-title-link");

  if (!firstVisibleTitle) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      firstVisibleTitle.focus({ preventScroll: true });
      firstVisibleTitle.scrollIntoView({ behavior: "instant", block: "start" });
    });
  });
}

if (searchInput) {
  const resetSearchPage = () => {
    currentPage = 1;
    updateLibrary();
    syncUrlState("replace");
  };

  searchInput.addEventListener("input", resetSearchPage);
  searchInput.addEventListener("search", resetSearchPage);
}

function applyCategory(category) {
  const known = categoryFilters.some(
    (filter) => filter.dataset.categoryFilter === category,
  );
  activeCategory = known ? category : "all";

  categoryFilters.forEach((candidate) => {
    const isActive = candidate.dataset.categoryFilter === activeCategory;
    candidate.classList.toggle("is-active", isActive);
    candidate.setAttribute("aria-pressed", String(isActive));
  });
}

categoryFilters.forEach((filter) => {
  filter.addEventListener("click", () => {
    applyCategory(filter.dataset.categoryFilter);
    currentPage = 1;
    updateLibrary();
    syncUrlState("push");
  });
});

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    applySort(sortSelect.value);
    currentPage = 1;
    updateLibrary();
    syncUrlState("push");
  });
}

const clearFiltersButton = document.querySelector("#clear-filters");

if (clearFiltersButton) {
  clearFiltersButton.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
    }

    applyCategory("all");
    currentPage = 1;
    updateLibrary();
    syncUrlState("push");
    searchInput?.focus();
  });
}

if (paginationPrevious) {
  paginationPrevious.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      updateLibrary();
      syncUrlState("push");
      focusFirstVisibleLoop();
    }
  });
}

if (paginationNext) {
  paginationNext.addEventListener("click", () => {
    currentPage += 1;
    updateLibrary();
    syncUrlState("push");
    focusFirstVisibleLoop();
  });
}

readUrlState();
updateLibrary();
syncUrlState("replace");

window.addEventListener("popstate", () => {
  readUrlState();
  updateLibrary();
});

let promptResizeFrame;
window.addEventListener("resize", () => {
  window.cancelAnimationFrame(promptResizeFrame);
  promptResizeFrame = window.requestAnimationFrame(syncVisiblePromptToggles);
});

function showToast(message) {
  if (!toast) {
    return;
  }

  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the selection-based copy path.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();

  if (!copied) {
    throw new Error("复制不可用。");
  }
}

function showCopyFallback(button, text) {
  const shareActions = button.closest(".share-actions");

  if (!shareActions) {
    showToast("复制失败。此浏览器不支持复制。");
    return;
  }

  let fallback = shareActions.querySelector(".copy-fallback");

  if (!fallback) {
    fallback = document.createElement("label");
    fallback.className = "copy-fallback";

    const label = document.createElement("span");
    label.textContent = "手动复制这条帖子";

    const textArea = document.createElement("textarea");
    textArea.setAttribute("readonly", "");
    textArea.rows = 4;

    fallback.append(label, textArea);
    shareActions.append(fallback);
  }

  const textArea = fallback.querySelector("textarea");
  textArea.value = text;
  textArea.focus();
  textArea.select();
  showToast("复制失败。下方已选中帖子内容。");
}

document.querySelectorAll(".copy-button").forEach((button) => {
  const label = button.querySelector("span");
  const defaultLabel = label?.textContent;
  let copyLabelResetTimer;

  button.addEventListener("click", async () => {
    const copyRoot = button.closest("[data-copy-root]");
    const prompt = copyRoot?.querySelector("[data-prompt]")?.textContent.trim();

    if (!prompt || !label || !defaultLabel) {
      return;
    }

    try {
      await copyText(prompt.replace(/\s+/g, " "));
      label.textContent = "已复制";
      showToast("Loop 已复制到剪贴板。");
      window.clearTimeout(copyLabelResetTimer);
      copyLabelResetTimer = window.setTimeout(() => {
        label.textContent = defaultLabel;
      }, 1800);
    } catch {
      showToast("复制失败。请改为选择提示词文本。");
    }
  });
});

document.querySelectorAll("[data-copy-social-post]").forEach((button) => {
  const label = button.querySelector("span");
  const postText = button.dataset.postText;
  const postUrl = button.dataset.postUrl;
  const defaultLabel = label?.textContent;
  let copyLabelResetTimer;

  button.addEventListener("click", async () => {
    if (!label || !postText || !postUrl || !defaultLabel) {
      return;
    }

    const socialPost = `${postText}\n\n${postUrl}`;

    try {
      await copyText(socialPost);
      label.textContent = "已复制";
      button.classList.add("is-copied");
      showToast("社交帖子已复制到剪贴板。");
      window.clearTimeout(copyLabelResetTimer);
      copyLabelResetTimer = window.setTimeout(() => {
        label.textContent = defaultLabel;
        button.classList.remove("is-copied");
      }, 1800);
    } catch {
      showCopyFallback(button, socialPost);
    }
  });
});

const voteControls = [...document.querySelectorAll("[data-vote-controls]")];
const LOOP_LIBRARY_PATH = window.location.pathname === "/loop-library" ||
  window.location.pathname.startsWith("/loop-library/")
  ? "/loop-library"
  : "";
const VOTE_API_URL = `${LOOP_LIBRARY_PATH}/api/votes`;
const VOTE_SESSION_KEY = "ll_session";
const OAUTH_NONCE_KEY = "ll_oauth_nonce";
let voteViewer = null;
let viewerVotes = {};
let loginDialog;

function voteLoginUrl(provider) {
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `${LOOP_LIBRARY_PATH}/auth/${provider}?${new URLSearchParams({
    return_to: returnTo,
  })}`;
}

function readVoteSessionToken() {
  try {
    return window.sessionStorage.getItem(VOTE_SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function clearVoteSessionToken() {
  try {
    window.sessionStorage.removeItem(VOTE_SESSION_KEY);
  } catch {
    // Storage may be unavailable in hardened browser modes.
  }
}

function oauthNonce() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function beginGithubLogin(link) {
  const nonce = oauthNonce();
  try {
    window.sessionStorage.setItem(OAUTH_NONCE_KEY, nonce);
    const url = new URL(link.href, window.location.href);
    url.searchParams.set("client_nonce", nonce);
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const body = await response.json();
    if (!response.ok || !body.authorizationUrl) {
      throw new Error(body.error || "GitHub 登录暂时不可用。");
    }
    window.location.assign(body.authorizationUrl);
  } catch (error) {
    try {
      window.sessionStorage.removeItem(OAUTH_NONCE_KEY);
    } catch {
      // Storage may be unavailable in hardened browser modes.
    }
    link.removeAttribute("aria-disabled");
    showToast(error.message || "GitHub 登录暂时不可用。");
  }
}

function createLoginDialog() {
  if (loginDialog) {
    return loginDialog;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "login-dialog";
  dialog.setAttribute("aria-labelledby", "vote-login-title");

  const panel = document.createElement("div");
  panel.className = "login-dialog-panel";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "社区投票";
  const title = document.createElement("h2");
  title.id = "vote-login-title";
  title.textContent = "登录后投票";
  const explanation = document.createElement("p");
  explanation.textContent =
    "使用 GitHub 登录。每个账号对每个 loop 有一票，并且可以随时更改。";
  const providers = document.createElement("div");
  providers.className = "login-providers";

  const githubLink = document.createElement("a");
  githubLink.className = "login-provider login-provider-github";
  githubLink.href = voteLoginUrl("github");
  githubLink.textContent = "使用 GitHub 继续";
  githubLink.addEventListener("click", (event) => {
    event.preventDefault();
    if (githubLink.getAttribute("aria-disabled") === "true") return;
    githubLink.setAttribute("aria-disabled", "true");
    beginGithubLogin(githubLink);
  });
  providers.append(githubLink);

  const cancel = document.createElement("button");
  cancel.className = "login-cancel";
  cancel.type = "button";
  cancel.textContent = "暂不";
  cancel.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  panel.append(eyebrow, title, explanation, providers, cancel);
  dialog.append(panel);
  document.body.append(dialog);
  loginDialog = dialog;
  return dialog;
}

function showLoginDialog() {
  const dialog = createLoginDialog();
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

window.addEventListener("pageshow", () => {
  loginDialog?.querySelector(".login-provider-github")
    ?.removeAttribute("aria-disabled");
});

function updateVoteControls(control, counts = {}, viewerVote = 0) {
  const upvote = control.querySelector('[data-vote-value="1"]');
  const downvote = control.querySelector('[data-vote-value="-1"]');
  const upvoteCount = upvote?.querySelector("[data-vote-count]");
  const downvoteCount = downvote?.querySelector("[data-vote-count]");
  const row = control.closest(".loop-row");

  if (upvoteCount) upvoteCount.textContent = String(counts.upvotes || 0);
  if (downvoteCount) downvoteCount.textContent = String(counts.downvotes || 0);
  if (row) row.dataset.upvotes = String(counts.upvotes || 0);
  upvote?.setAttribute("aria-pressed", String(viewerVote === 1));
  downvote?.setAttribute("aria-pressed", String(viewerVote === -1));
  control.classList.toggle("has-upvote", viewerVote === 1);
  control.classList.toggle("has-downvote", viewerVote === -1);
}

function clearViewerVoteSelection() {
  voteControls.forEach((control) => {
    control.classList.remove("has-upvote", "has-downvote");
    control.querySelectorAll(".vote-button").forEach((button) => {
      button.setAttribute("aria-pressed", "false");
    });
  });
}

function setVotingUiVisible(visible) {
  voteControls.forEach((control) => {
    control.hidden = !visible;
    control.querySelectorAll(".vote-button").forEach((button) => {
      button.disabled = !visible;
    });
  });
  if (!visible) {
    document.querySelector("[data-vote-account]")?.remove();
  }
}

function renderVoteAccount() {
  const existing = document.querySelector("[data-vote-account]");
  if (existing) existing.remove();
  if (!voteViewer) return;

  const account = document.createElement("div");
  account.className = "vote-account";
  account.dataset.voteAccount = "";
  const label = document.createElement("span");
  label.textContent = `以 GitHub 身份投票：${voteViewer.username}`;
  const logout = document.createElement("button");
  logout.type = "button";
  logout.textContent = "退出登录";
  logout.addEventListener("click", () => {
    clearVoteSessionToken();
    voteViewer = null;
    viewerVotes = {};
    renderVoteAccount();
    clearViewerVoteSelection();
    showToast("已退出登录。");
  });
  account.append(label, logout);

  const anchor = document.querySelector(".results-line") ||
    document.querySelector(".detail-actions");
  anchor?.insertAdjacentElement("afterend", account);
}

async function loadVotes() {
  if (voteControls.length === 0) return;

  try {
    const response = await fetch(VOTE_API_URL, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("投票暂时不可用");
    const body = await response.json();
    voteViewer = null;
    viewerVotes = {};
    const sessionToken = readVoteSessionToken();
    if (sessionToken) {
      try {
        const sessionResponse = await fetch(`${LOOP_LIBRARY_PATH}/auth/session`, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionToken }),
        });
        if (!sessionResponse.ok) {
          if (sessionResponse.status < 500) clearVoteSessionToken();
        } else {
          const sessionBody = await sessionResponse.json();
          if (sessionBody.viewer) {
            voteViewer = sessionBody.viewer;
            viewerVotes = sessionBody.viewerVotes || {};
          } else {
            clearVoteSessionToken();
          }
        }
      } catch {
        // Public totals and the launch gate remain usable when restoring an
        // existing session is temporarily unavailable.
      }
    }
    voteControls.forEach((control) => {
      const slug = control.dataset.loopSlug;
      updateVoteControls(
        control,
        body.votes?.[slug],
        viewerVotes[slug] || 0,
      );
    });
    setVotingUiVisible(body.uiEnabled === true);
    applySort(activeSort);
    updateLibrary();
    if (body.uiEnabled === true) renderVoteAccount();
  } catch {
    setVotingUiVisible(false);
  }
}

voteControls.forEach((control) => {
  control.querySelectorAll("[data-vote-value]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!voteViewer) {
        showLoginDialog();
        return;
      }

      const slug = control.dataset.loopSlug;
      const selectedValue = Number(button.dataset.voteValue);
      const nextValue = viewerVotes[slug] === selectedValue ? 0 : selectedValue;
      control.querySelectorAll(".vote-button").forEach((candidate) => {
        candidate.disabled = true;
      });

      try {
        const response = await fetch(
          `${LOOP_LIBRARY_PATH}/api/loops/${encodeURIComponent(slug)}/vote`,
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              value: nextValue,
              sessionToken: readVoteSessionToken(),
            }),
          },
        );
        const body = await response.json();
        if (response.status === 401) {
          clearVoteSessionToken();
          voteViewer = null;
          viewerVotes = {};
          renderVoteAccount();
          clearViewerVoteSelection();
          showLoginDialog();
          return;
        }
        if (!response.ok) throw new Error(body.error || "投票失败");
        viewerVotes[slug] = body.vote;
        updateVoteControls(control, body.counts, body.vote);
        applySort(activeSort);
        updateLibrary();
        showToast(body.vote === 0 ? "已撤销投票。" : "投票已记录。");
      } catch (error) {
        showToast(error.message || "投票失败。请重试。");
      } finally {
        control.querySelectorAll(".vote-button").forEach((candidate) => {
          candidate.disabled = false;
        });
      }
    });
  });
});

const authError = new URLSearchParams(window.location.search).get("auth_error");
if (authError) {
  showToast("登录未完成。请重试。");
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete("auth_error");
  window.history.replaceState(null, "", cleanUrl);
}

loadVotes();

const skillCopyButton = document.querySelector("[data-copy-skill-command]");
const skillInstallCommand = document.querySelector(
  "[data-skill-install-command]",
);

if (skillCopyButton && skillInstallCommand) {
  skillCopyButton.addEventListener("click", async () => {
    const label = skillCopyButton.querySelector("span");
    const command = skillInstallCommand.textContent.replace(/\s+/g, " ").trim();

    if (!label || !command) {
      return;
    }

    try {
      await copyText(command);
      label.textContent = "已复制";
      showToast("安装命令已复制到剪贴板。");
      window.setTimeout(() => {
        label.textContent = "复制命令";
      }, 1800);
    } catch {
      showToast("复制失败。请改为选择安装命令。");
    }
  });
}

const form = document.querySelector("#loop-form");
const formStatus = document.querySelector("#form-status");
const submitButton = form?.querySelector(".submit-button");
const submitButtonLabel = submitButton?.querySelector("span");
const weeklyForm = document.querySelector("#weekly-form");
const weeklyStatus = document.querySelector("#weekly-status");
const weeklyButton = weeklyForm?.querySelector(".newsletter-button");
const weeklyButtonLabel = weeklyButton?.querySelector("span");
const formApiMeta = document.querySelector(
  'meta[name="loop-library-form-api"]',
);
const configuredFormApiOrigin = formApiMeta?.getAttribute("content") || "";
const isLocalPreview = ["localhost", "127.0.0.1"].includes(
  window.location.hostname,
);
const FORM_API_ORIGIN = isLocalPreview
  ? "http://localhost:8787"
  : configuredFormApiOrigin;

let formStartedAt = performance.now();
let idempotencyKey = makeIdempotencyKey();
let weeklyFormStartedAt = performance.now();
let weeklyIdempotencyKey = makeIdempotencyKey();
let formProtectionReady = false;
let turnstileLoadPromise;

const turnstileWidgets = {
  suggestions: {
    action: "",
    button: submitButton,
    container: document.querySelector("#loop-turnstile"),
    failureMessage:
      "反垃圾验证暂时不可用。请刷新后重试。",
    id: null,
    pendingMessage:
      "反垃圾验证仍在加载。请稍等后重试。",
    setStatus: setFormStatus,
    statusElement: formStatus,
    token: "",
  },
  weeklySignups: {
    action: "",
    button: weeklyButton,
    container: document.querySelector("#weekly-turnstile"),
    failureMessage:
      "订阅暂时不可用。请刷新后重试。",
    id: null,
    pendingMessage:
      "反垃圾验证仍在加载。请稍等后重试。",
    setStatus: setWeeklyStatus,
    statusElement: weeklyStatus,
    token: "",
  },
};

function makeIdempotencyKey() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);

  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) =>
    byte.toString(16).padStart(2, "0"),
  );

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
}

function setFormStatus(message, kind = "") {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.toggle("is-success", kind === "success");
  formStatus.classList.toggle("is-error", kind === "error");
}

function setWeeklyStatus(message, kind = "") {
  if (!weeklyStatus) {
    return;
  }

  weeklyStatus.textContent = message;
  weeklyStatus.classList.toggle("is-success", kind === "success");
  weeklyStatus.classList.toggle("is-error", kind === "error");
}

function optionalValue(formData, name) {
  const value = String(formData.get(name) || "").trim();
  return value || undefined;
}

function setProtectedButtonsDisabled(disabled) {
  if (submitButton) {
    submitButton.disabled = disabled;
  }

  if (weeklyButton) {
    weeklyButton.disabled = disabled;
  }
}

function setTurnstilePending(widget) {
  widget.token = "";

  if (widget.button) {
    widget.button.disabled = true;
  }
}

function setTurnstileReady(widget, token) {
  widget.token = token;

  if (
    widget.statusElement &&
    [widget.failureMessage, widget.pendingMessage].includes(
      widget.statusElement.textContent,
    )
  ) {
    widget.setStatus("");
  }

  if (widget.button) {
    widget.button.disabled = false;
  }
}

function setTurnstileUnavailable(widget) {
  setTurnstilePending(widget);
  widget.setStatus(widget.failureMessage, "error");
}

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoadPromise) {
    return turnstileLoadPromise;
  }

  turnstileLoadPromise = new Promise((resolve, reject) => {
    const callbackName = "loopLibraryTurnstileReady";
    const script = document.createElement("script");

    window[callbackName] = () => {
      delete window[callbackName];

      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error("反垃圾验证未初始化。"));
      }
    };

    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js" +
      `?render=explicit&onload=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error("反垃圾验证无法加载。"));
    };
    document.head.append(script);
  });

  return turnstileLoadPromise;
}

function renderTurnstile(turnstile, widget, siteKey) {
  if (!widget.container || !widget.action) {
    throw new Error("反垃圾验证未配置。");
  }

  widget.id = turnstile.render(widget.container, {
    sitekey: siteKey,
    action: widget.action,
    appearance: "interaction-only",
    execution: "render",
    size: "flexible",
    theme:
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    callback(token) {
      setTurnstileReady(widget, token);
    },
    "expired-callback"() {
      setTurnstilePending(widget);
    },
    "error-callback"() {
      setTurnstileUnavailable(widget);
    },
  });
}

function resetTurnstile(widget) {
  setTurnstilePending(widget);

  if (window.turnstile && widget.id !== null) {
    window.turnstile.reset(widget.id);
  }
}

async function initializeFormProtection() {
  if (
    !FORM_API_ORIGIN ||
    !form ||
    !weeklyForm ||
    !submitButton ||
    !weeklyButton
  ) {
    return;
  }

  setProtectedButtonsDisabled(true);

  try {
    const [configResponse, turnstile] = await Promise.all([
      fetch(`${FORM_API_ORIGIN}/config`, {
        headers: { Accept: "application/json" },
      }),
      loadTurnstile(),
    ]);
    const config = await configResponse.json();

    if (
      !configResponse.ok ||
      !config.turnstileSiteKey ||
      !config.actions?.suggestions ||
      !config.actions?.weeklySignups
    ) {
      throw new Error(
        config.error || "反垃圾验证暂时不可用。",
      );
    }

    turnstileWidgets.suggestions.action = config.actions.suggestions;
    turnstileWidgets.weeklySignups.action = config.actions.weeklySignups;
    renderTurnstile(
      turnstile,
      turnstileWidgets.suggestions,
      config.turnstileSiteKey,
    );
    renderTurnstile(
      turnstile,
      turnstileWidgets.weeklySignups,
      config.turnstileSiteKey,
    );
    formProtectionReady = true;
  } catch {
    setFormStatus(
      "提交暂时不可用。请刷新后重试。",
      "error",
    );
    setWeeklyStatus(
      "订阅暂时不可用。请刷新后重试。",
      "error",
    );
  }
}

function formatRetryHint(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }

  if (seconds < 90) {
    const rounded = Math.max(1, Math.ceil(seconds));
    return ` 请约 ${rounded} 秒后重试。`;
  }

  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return ` 请约 ${minutes} 分钟后重试。`;
}

async function postProtectedForm(path, body, fallbackMessage) {
  const response = await fetch(`${FORM_API_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let responseBody = {};
  try {
    responseBody = await response.json();
  } catch {
    responseBody = {};
  }

  if (!response.ok) {
    let message = responseBody.error || fallbackMessage;

    if (response.status === 429) {
      message += formatRetryHint(Number(response.headers.get("Retry-After")));
    }

    throw new Error(message);
  }
}

if (form && submitButton && submitButtonLabel) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus("");

    if (!form.checkValidity()) {
      form.reportValidity();
      setFormStatus(
        "请检查必填字段和你输入的可选值。",
        "error",
      );
      return;
    }

    const formData = new FormData(form);

    if (performance.now() - formStartedAt < 1200) {
      setFormStatus(
        "请花一点时间检查这个 loop，然后再次提交。",
        "error",
      );
      return;
    }

    if (!formProtectionReady) {
      setFormStatus(
        "提交暂时不可用。请刷新后重试。",
        "error",
      );
      return;
    }

    if (!turnstileWidgets.suggestions.token) {
      setFormStatus(
        turnstileWidgets.suggestions.pendingMessage,
        "error",
      );
      return;
    }

    const payload = {
      loop_title: String(formData.get("loop_title")).trim(),
      instructions: String(formData.get("instructions")).trim(),
    };

    const name = optionalValue(formData, "name");
    const xHandle = optionalValue(formData, "x_handle");
    const sourceUrl = optionalValue(formData, "source_url");

    if (name) {
      payload.name = name;
    }

    if (xHandle) {
      payload.x_handle = xHandle;
    }

    if (sourceUrl) {
      payload.source_url = sourceUrl;
    }

    submitButton.disabled = true;
    submitButtonLabel.textContent = "发送中";

    try {
      await postProtectedForm(
        "/suggestions",
        {
          payload,
          permission: formData.get("permission") === "on",
          honeypot: String(formData.get("company") || "").trim(),
          idempotency_key: idempotencyKey,
          turnstile_token: turnstileWidgets.suggestions.token,
        },
        "无法提交这个建议。",
      );

      form.reset();
      setFormStatus(
        "已收到。这个 loop 已进入私有审阅队列。",
        "success",
      );
      idempotencyKey = makeIdempotencyKey();
      formStartedAt = performance.now();
      resetTurnstile(turnstileWidgets.suggestions);
    } catch (error) {
      resetTurnstile(turnstileWidgets.suggestions);
      setFormStatus(
        error.message || "出了点问题。请稍后重试。",
        "error",
      );
    } finally {
      submitButton.disabled = !turnstileWidgets.suggestions.token;
      submitButtonLabel.textContent = "提交 loop";
    }
  });
}

if (weeklyForm && weeklyButton && weeklyButtonLabel) {
  weeklyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setWeeklyStatus("");

    if (!weeklyForm.checkValidity()) {
      weeklyForm.reportValidity();
      setWeeklyStatus("请输入有效邮箱地址。", "error");
      return;
    }

    const formData = new FormData(weeklyForm);

    if (performance.now() - weeklyFormStartedAt < 800) {
      setWeeklyStatus("请稍等片刻，然后再次提交。", "error");
      return;
    }

    if (!formProtectionReady) {
      setWeeklyStatus(
        "订阅暂时不可用。请刷新后重试。",
        "error",
      );
      return;
    }

    if (!turnstileWidgets.weeklySignups.token) {
      setWeeklyStatus(
        turnstileWidgets.weeklySignups.pendingMessage,
        "error",
      );
      return;
    }

    weeklyButton.disabled = true;
    weeklyButtonLabel.textContent = "添加中";

    try {
      await postProtectedForm(
        "/weekly-signups",
        {
          payload: { email: String(formData.get("email")).trim() },
          honeypot: String(
            formData.get("newsletter_company") || "",
          ).trim(),
          idempotency_key: weeklyIdempotencyKey,
          turnstile_token: turnstileWidgets.weeklySignups.token,
        },
        "无法提交订阅。",
      );
      weeklyForm.reset();
      setWeeklyStatus(
        "你已加入列表。请留意收件箱中的精选 loop。",
        "success",
      );
      weeklyIdempotencyKey = makeIdempotencyKey();
      weeklyFormStartedAt = performance.now();
      resetTurnstile(turnstileWidgets.weeklySignups);
    } catch (error) {
      resetTurnstile(turnstileWidgets.weeklySignups);
      setWeeklyStatus(
        error.message || "出了点问题。请稍后重试。",
        "error",
      );
    } finally {
      weeklyButton.disabled = !turnstileWidgets.weeklySignups.token;
      weeklyButtonLabel.textContent = "每周通知我";
    }
  });
}

initializeFormProtection();
