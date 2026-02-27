(() => {
  // ── Language options ──────────────────────────────────────────────
  const LANGUAGES = [
    { code: "en-US", label: "English (US)" },
    { code: "en-GB", label: "English (UK)" },
    { code: "de-DE", label: "Deutsch" },
    { code: "es-ES", label: "Español" },
    { code: "fr-FR", label: "Français" },
    { code: "it-IT", label: "Italiano" },
    { code: "pt-BR", label: "Português (BR)" },
    { code: "nl-NL", label: "Nederlands" },
    { code: "pl-PL", label: "Polski" },
    { code: "ru-RU", label: "Русский" },
    { code: "tr-TR", label: "Türkçe" },
    { code: "zh-CN", label: "中文 (简体)" },
    { code: "ja-JP", label: "日本語" },
    { code: "ko-KR", label: "한국어" },
    { code: "ar-SA", label: "العربية" },
    { code: "hi-IN", label: "हिन्दी" },
    { code: "uk-UA", label: "Українська" },
    { code: "cs-CZ", label: "Čeština" },
    { code: "sv-SE", label: "Svenska" },
    { code: "da-DK", label: "Dansk" },
  ];

  const DEFAULT_LANG = "en-US";

  // ── Build widget UI ───────────────────────────────────────────────
  const widget = document.createElement("div");
  widget.id = "stt-widget";
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    display: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  // Language selector
  const select = document.createElement("select");
  select.id = "stt-lang-select";
  select.style.cssText = `
    padding: 5px 8px;
    border-radius: 8px;
    border: 1px solid #555;
    background: #1a1a2e;
    color: #e0e0e0;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    max-width: 160px;
    transition: border-color 0.2s;
  `;
  select.addEventListener("focus", () => (select.style.borderColor = "#4895ef"));
  select.addEventListener("blur", () => (select.style.borderColor = "#555"));

  LANGUAGES.forEach(({ code, label }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    select.appendChild(opt);
  });

  // Timeout selector
  const TIMEOUTS = [
    { value: 0, label: "No timeout" },
    { value: 30, label: "30s" },
    { value: 60, label: "1 min" },
    { value: 120, label: "2 min" },
    { value: 300, label: "5 min" },
  ];
  const DEFAULT_TIMEOUT = 60;

  const timeoutSelect = document.createElement("select");
  timeoutSelect.id = "stt-timeout-select";
  timeoutSelect.style.cssText = `
    padding: 5px 8px;
    border-radius: 8px;
    border: 1px solid #555;
    background: #1a1a2e;
    color: #e0e0e0;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    max-width: 160px;
    transition: border-color 0.2s;
  `;
  timeoutSelect.addEventListener("focus", () => (timeoutSelect.style.borderColor = "#4895ef"));
  timeoutSelect.addEventListener("blur", () => (timeoutSelect.style.borderColor = "#555"));

  TIMEOUTS.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = `⏱ ${label}`;
    timeoutSelect.appendChild(opt);
  });
  timeoutSelect.value = DEFAULT_TIMEOUT;

  // Mic button
  const btn = document.createElement("button");
  btn.id = "stt-mic-btn";
  btn.textContent = "🎙️";
  btn.style.cssText = `
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid #333;
    background: #1a1a2e;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  `;
  btn.addEventListener("mouseenter", () => {
    if (!isRecording) btn.style.borderColor = "#4895ef";
  });
  btn.addEventListener("mouseleave", () => {
    if (!isRecording) btn.style.borderColor = "#333";
  });

  // Status indicator
  const status = document.createElement("div");
  status.id = "stt-status";
  status.style.cssText = `
    font-size: 11px;
    color: #888;
    text-align: right;
    min-height: 16px;
    transition: color 0.2s;
  `;

  widget.appendChild(select);
  widget.appendChild(timeoutSelect);
  widget.appendChild(btn);
  widget.appendChild(status);
  document.body.appendChild(widget);

  // ── State ─────────────────────────────────────────────────────────
  let isRecording = false;
  let activeElement = null;
  let pulseInterval = null;
  let inactivityTimer = null;
  let lastActivity = 0;

  // ── Load saved language preference ────────────────────────────────
  function detectBrowserLang() {
    const browserLang = navigator.language; // e.g. "de-DE", "en-US"
    // Exact match?
    if (LANGUAGES.some((l) => l.code === browserLang)) return browserLang;
    // Match by prefix? e.g. "de" → "de-DE"
    const prefix = browserLang.split("-")[0];
    const match = LANGUAGES.find((l) => l.code.startsWith(prefix + "-"));
    return match ? match.code : "en-US";
  }

  if (chrome.storage) {
    chrome.storage.local.get(["sttLang", "sttTimeout"], (result) => {
      select.value = result.sttLang || detectBrowserLang();
      recognition.lang = select.value;
      timeoutSelect.value = result.sttTimeout ?? DEFAULT_TIMEOUT;
    });
  } else {
    select.value = detectBrowserLang();
  }

  // ── Save language on change ───────────────────────────────────────
  select.addEventListener("change", () => {
    recognition.lang = select.value;
    if (chrome.storage) {
      chrome.storage.local.set({ sttLang: select.value });
    }
    // Restart recognition with new language if currently recording
    if (isRecording) {
      recognition.manualStop = true;
      recognition.stop();
      setTimeout(() => {
        recognition.manualStop = false;
        recognition.start();
      }, 200);
    }
  });

  // ── Save timeout on change ────────────────────────────────────────
  timeoutSelect.addEventListener("change", () => {
    if (chrome.storage) {
      chrome.storage.local.set({ sttTimeout: parseInt(timeoutSelect.value) });
    }
    resetInactivityTimer();
  });

  // ── Inactivity timer ──────────────────────────────────────────────
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    const seconds = parseInt(timeoutSelect.value);
    if (!seconds || !isRecording) return;
    inactivityTimer = setTimeout(() => {
      if (isRecording) {
        toggleRecognition();
        setStatus("⏱ Auto-stop");
      }
    }, seconds * 1000);
  }

  // ── Text insertion ────────────────────────────────────────────────
  function insertTextAtCursor(text) {
    const el = document.activeElement;
    if (!el) return;
    const tag = el.tagName.toLowerCase();

    if (tag === "input" || tag === "textarea") {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;
      el.value = val.slice(0, start) + text + val.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    } else if (el.getAttribute("contenteditable") === "true") {
      const sel = window.getSelection();
      if (!sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Trigger framework-compatible events
    el.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  }

  // ── Speech Recognition setup ──────────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API not available in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = DEFAULT_LANG;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = true;
  recognition.manualStop = false;

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    insertTextAtCursor(transcript);
    setStatus("✓");
    resetInactivityTimer();
    setTimeout(() => {
      if (isRecording) setStatus("● REC");
    }, 1500);
  };

  recognition.onerror = (event) => {
    console.error("STT error:", event.error);
    if (event.error === "not-allowed") {
      setStatus("⚠ Mic blocked");
    } else if (event.error === "no-speech") {
      setStatus("…");
    } else {
      setStatus(`⚠ ${event.error}`);
    }
  };

  recognition.onend = () => {
    if (!recognition.manualStop && isRecording) {
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          // already running
        }
      }, 100);
    }
  };

  // ── UI helpers ────────────────────────────────────────────────────
  function setStatus(text) {
    status.textContent = text;
  }

  function setRecordingUI(recording) {
    if (recording) {
      btn.style.background = "#c0392b";
      btn.style.borderColor = "#e74c3c";
      btn.style.boxShadow = "0 0 16px rgba(231, 76, 60, 0.5)";
      setStatus("● REC");
      // Pulse animation
      let pulse = true;
      pulseInterval = setInterval(() => {
        btn.style.boxShadow = pulse
          ? "0 0 20px rgba(231, 76, 60, 0.7)"
          : "0 0 10px rgba(231, 76, 60, 0.3)";
        pulse = !pulse;
      }, 800);
    } else {
      btn.style.background = "#1a1a2e";
      btn.style.borderColor = "#333";
      btn.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
      setStatus("");
      if (pulseInterval) {
        clearInterval(pulseInterval);
        pulseInterval = null;
      }
    }
  }

  // ── Toggle ────────────────────────────────────────────────────────
  function toggleRecognition() {
    if (isRecording) {
      recognition.manualStop = true;
      recognition.stop();
      isRecording = false;
      setRecordingUI(false);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    } else {
      recognition.lang = select.value;
      recognition.manualStop = false;
      try {
        recognition.start();
      } catch (e) {
        // already started
      }
      isRecording = true;
      setRecordingUI(true);
      resetInactivityTimer();
    }
  }

  // ── Button events ─────────────────────────────────────────────────
  btn.addEventListener("mousedown", () => {
    activeElement = document.activeElement;
  });
  btn.addEventListener("click", () => {
    if (activeElement) activeElement.focus();
    toggleRecognition();
  });

  // ── Double-Alt shortcut ─────────────────────────────────────────
  let lastAltUp = 0;
  document.addEventListener("keyup", (e) => {
    if (e.key !== "Alt") return;
    const now = Date.now();
    if (now - lastAltUp < 400) {
      e.preventDefault();
      widget.style.display = "flex";
      toggleRecognition();
      lastAltUp = 0;
    } else {
      lastAltUp = now;
    }
  });

  // ── Message from background (toolbar icon) ────────────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "toggleRecognition") {
      widget.style.display = "flex";
      toggleRecognition();
      sendResponse({ ok: true });
    }
  });
})();
