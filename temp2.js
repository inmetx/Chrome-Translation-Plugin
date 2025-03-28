        lastTimePressedCtrl = performance.now();
        readSelection();
        init();
        translateSelText();
      }
      lastTimePressedCtrl = performance.now();
    }
  }
  document.addEventListener("keyup", onKeyUp, true);
  let windowIsInFocus = true;
  window.addEventListener("focus", function (e) {
    windowIsInFocus = true;
    chrome.runtime.sendMessage({
      action: "thisFrameIsInFocus"
    }, checkedLastError);
  });
  window.addEventListener("blur", function (e) {
    windowIsInFocus = false;
  });
  window.addEventListener("beforeunload", function (e) {
    destroy();
  });
  function updateEventListener() {
    if (showTranslateSelectedButton == "yes" && (awaysTranslateThisSite || translateThisSite && translateThisLanguage) && (dontShowIfPageLangIsTargetLang == "yes" && originalTabLanguage !== currentTargetLanguage || dontShowIfPageLangIsTargetLang != "yes") && (dontShowIfPageLangIsUnknown == "yes" && originalTabLanguage !== "und" || dontShowIfPageLangIsUnknown != "yes")) {
      document.addEventListener("mouseup", onMouseup);
      document.addEventListener("blur", destroyIfButtonIsShowing);
      document.addEventListener("visibilitychange", destroyIfButtonIsShowing);
      document.addEventListener("keydown", destroyIfButtonIsShowing);
      document.addEventListener("mousedown", destroyIfButtonIsShowing);
      document.addEventListener("wheel", destroyIfButtonIsShowing);
      if (platformInfo.isMobile.any) {
        document.addEventListener("touchend", onTouchend);
        document.addEventListener("selectionchange", onSelectionchange);
      }
    } else {
      document.removeEventListener("mouseup", onMouseup);
      document.removeEventListener("blur", destroyIfButtonIsShowing);
      document.removeEventListener("visibilitychange", destroyIfButtonIsShowing);
      document.removeEventListener("keydown", destroyIfButtonIsShowing);
      document.removeEventListener("mousedown", destroyIfButtonIsShowing);
      document.removeEventListener("wheel", destroyIfButtonIsShowing);
      if (platformInfo.isMobile.any) {
        document.removeEventListener("touchend", onTouchend);
        document.removeEventListener("selectionchange", onSelectionchange);
      }
    }
  }
  updateEventListener();
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TranslateSelectedText") {
      readSelection();
      init();
      translateSelText();
    } else if (request.action === "anotherFrameIsInFocus") {
      if (!windowIsInFocus) {
        destroy();
      }
    } else if (request.action === "hotTranslateSelectedText") {
      var _prevSelInfo$element, _prevSelInfo$element2;
      readSelection();
      const prevSelInfo = gSelectionInfo;
      if (!(prevSelInfo !== null && prevSelInfo !== void 0 && (_prevSelInfo$element = prevSelInfo.element) !== null && _prevSelInfo$element !== void 0 && _prevSelInfo$element.focus) && !(prevSelInfo !== null && prevSelInfo !== void 0 && (_prevSelInfo$element2 = prevSelInfo.element) !== null && _prevSelInfo$element2 !== void 0 && (_prevSelInfo$element2 = _prevSelInfo$element2.parentNode) !== null && _prevSelInfo$element2 !== void 0 && _prevSelInfo$element2.focus)) return;
      if (prevSelInfo.isInputElement && prevSelInfo.readOnly) return;
      if (prevSelInfo.text) {
        backgroundTranslateSingleText(currentTextTranslatorService, "auto", currentTargetLanguage, prevSelInfo.text).then(result => {
          if (!result) return;
          destroy();
          if (prevSelInfo.element.nodeType === 3) {
            prevSelInfo.element.parentNode.focus();
          } else {
            prevSelInfo.element.focus();
          }
          document.execCommand("selectAll", false);
          if (prevSelInfo.isInputElement) {
            prevSelInfo.element.setSelectionRange(prevSelInfo.selStart, prevSelInfo.selEnd);
          } else if (prevSelInfo.isContentEditable) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(prevSelInfo.range);
          }
          document.execCommand("insertText", false, result);
        });
      }
    }
  });
});
//# sourceMappingURL=../maps/10.1.5.0/translateSelected.js.map
