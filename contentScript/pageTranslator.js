"use strict";

const startMark = "@%";
const endMark = "#$";
const startMark0 = "@ %";
const endMark0 = "# $";
const bingMarkFrontPart = '<mstrans:dictionary translation="';
const bingMarkSecondPart = '"></mstrans:dictionary>';
let currentIndex;
let compressionMap;

function filterKeywordsInText(textContext, sortedCustomDictionary, currentPageTranslatorService) {
  if (sortedCustomDictionary.size > 0) {
    for (let keyWord of sortedCustomDictionary.keys()) {
      while (true) {
        let index = textContext.toLowerCase().indexOf(keyWord);
        if (index === -1) {
          break;
        } else {
          textContext = removeExtraDelimiter(textContext);
          let previousIndex = index - 1;
          let nextIndex = index + keyWord.length;
          let previousChar = previousIndex === -1 ? "\n" : textContext.charAt(previousIndex);
          let nextChar = nextIndex === textContext.length ? "\n" : textContext.charAt(nextIndex);
          let placeholderText = "";
          let keyWordWithCase = textContext.substring(index, index + keyWord.length);
          if (isPunctuationOrDelimiter(previousChar) && isPunctuationOrDelimiter(nextChar)) {
            if (currentPageTranslatorService === "bing") {
              let customValue = sortedCustomDictionary.get(keyWord);
              if (customValue === "") customValue = keyWordWithCase;
              customValue = " " + customValue.substring(0, 1) + "#n%o#" + customValue.substring(1) + " ";
              placeholderText = bingMarkFrontPart + customValue + bingMarkSecondPart;
            } else {
              placeholderText = startMark + handleHitKeywords(keyWordWithCase, true) + endMark;
            }
          } else {
            placeholderText = "#n%o#";
            for (let c of Array.from(keyWordWithCase)) {
              placeholderText += c;
              placeholderText += "#n%o#";
            }
          }
          let frontPart = textContext.substring(0, index);
          let backPart = textContext.substring(index + keyWord.length);
          textContext = frontPart + placeholderText + backPart;
        }
      }
      textContext = textContext.replaceAll("#n%o#", "");
    }
  }
  return textContext;
}

async function handleCustomWords(translated, originalText, customDictionary, currentPageTranslatorService, currentSourceLanguage, currentTargetLanguage) {
  try {
    if (customDictionary.size > 0 && currentPageTranslatorService !== "bing") {
      // If the translation is a single word and exists in the dictionary, return it directly
      let customValue = customDictionary.get(originalText.trim());
      if (customValue) return customValue;
      translated = removeExtraDelimiter(translated);
      translated = translated.replaceAll(startMark0, startMark);
      translated = translated.replaceAll(endMark0, endMark);
      while (true) {
        let startIndex = translated.indexOf(startMark);
        let endIndex = translated.indexOf(endMark);
        if (startIndex === -1 && endIndex === -1) {
          break;
        } else {
          let placeholderText = translated.substring(startIndex + startMark.length, endIndex);
          // At this point placeholderText is actually currentIndex , the real value is in compressionMap
          let keyWord = handleHitKeywords(placeholderText, false);
          if (keyWord === "undefined") {
            throw new Error("undefined");
          }
          let frontPart = translated.substring(0, startIndex);
          let backPart = translated.substring(endIndex + endMark.length);
          let customValue = customDictionary.get(keyWord.toLowerCase());
          customValue = customValue === "" ? keyWord : customValue;
          // Highlight custom words, make it have a space before and after it
          frontPart = isPunctuationOrDelimiter(frontPart.charAt(frontPart.length - 1)) ? frontPart : frontPart + " ";
          backPart = isPunctuationOrDelimiter(backPart.charAt(0)) ? backPart : " " + backPart;
          translated = frontPart + customValue + backPart;
        }
      }
    }
  } catch (e) {
    return await backgroundTranslateSingleText(currentPageTranslatorService, currentSourceLanguage, currentTargetLanguage, originalText);
  }
  return translated;
}

// True: Store the keyword in the Map and return the index
// False: Extract keywords by index
function handleHitKeywords(value, mode) {
  if (mode) {
    if (currentIndex === undefined) {
      currentIndex = 1;
      compressionMap = new Map();
      compressionMap.set(currentIndex, value);
    } else {
      compressionMap.set(++currentIndex, value);
    }
    return String(currentIndex);
  } else {
    return String(compressionMap.get(Number(value)));
  }
}

function isPunctuationOrDelimiter(str) {
  if (typeof str !== "string") return false;
  if (str === "\n" || str === " ") return true;
  const regex = /[\$\uFFE5\^\+=`~<>{}\[\]|\u00A0|\u2002|\u2003|\u2009|\u200C|\u200D|\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3010|\u3011|\u007e!-#%-\x2A,-/:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/g;
  return regex.test(str);
}

// get a sorted dictionary
function sortDictionary(customDictionary) {
  return new Map([...customDictionary.entries()].sort((a, b) => String(b[0]).length - String(a[0]).length));
}

// Remove useless newlines, spaces inside, which may affect our semantics
function removeExtraDelimiter(textContext) {
  textContext = textContext.replaceAll("\n", " ");
  textContext = textContext.replace(/  +/g, " ");
  return textContext;
}
function backgroundTranslateHTML(translationService, sourceLanguage, targetLanguage, sourceArray2d, dontSortResults) {
  return new Promise((resolve) => {
    try {
      // 检查chrome API是否可用
      if (typeof chrome === 'undefined' || !chrome || !chrome.runtime) {
        console.debug("Chrome API不可用，无法执行HTML翻译");
        resolve([]);
        return;
      }

      // 设置超时处理
      const timeoutId = setTimeout(() => {
        console.debug("HTML翻译请求超时，超过12秒未收到响应");
        resolve([]);
      }, 12000);

      // 发送翻译请求
      chrome.runtime.sendMessage({
        action: "translateHTML",
        translationService,
        sourceLanguage,
        targetLanguage,
        sourceArray2d,
        dontSortResults
      }, response => {
        // 清除超时
        clearTimeout(timeoutId);
        
        // 检查运行时错误
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          // 处理错误并提供降级处理
          if (errorMsg.includes("context invalidated") || 
              errorMsg.includes("The message port closed")) {
            console.debug("HTML翻译时出现非关键错误:", errorMsg);
          } else {
            console.debug("HTML翻译时出现错误:", errorMsg);
          }
          resolve([]);
          return;
        }
        
        // 确保响应有效
        if (!response) {
          console.debug("HTML翻译未返回有效结果");
          resolve([]);
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.debug("HTML翻译请求发生异常:", error);
      resolve([]);
    }
  });
}
function backgroundTranslateText(translationService, sourceLanguage, targetLanguage, sourceArray) {
  return new Promise((resolve) => {
    try {
      // 检查chrome API是否可用
      if (typeof chrome === 'undefined' || !chrome || !chrome.runtime) {
        console.debug("Chrome API不可用，无法执行文本翻译");
        resolve([]);
        return;
      }

      // 设置超时处理
      const timeoutId = setTimeout(() => {
        console.debug("文本翻译请求超时，超过10秒未收到响应");
        resolve([]);
      }, 10000);

      // 发送翻译请求
      chrome.runtime.sendMessage({
        action: "translateText",
        translationService,
        sourceLanguage,
        targetLanguage,
        sourceArray
      }, response => {
        // 清除超时
        clearTimeout(timeoutId);
        
        // 检查运行时错误
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          // 处理错误并提供降级服务
          if (errorMsg.includes("context invalidated") || 
              errorMsg.includes("The message port closed")) {
            console.debug("文本翻译时出现非关键错误:", errorMsg);
          } else {
            console.debug("文本翻译时出现错误:", errorMsg);
          }
          resolve([]);
          return;
        }
        
        // 确保响应有效
        if (!response) {
          console.debug("文本翻译未返回有效结果");
          resolve([]);
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      console.debug("文本翻译请求发生异常:", error);
      resolve([]);
    }
  });
}
function backgroundTranslateSingleText(translationService, sourceLanguage, targetLanguage, source) {
  return new Promise((resolve) => {
    try {
      // 检查chrome是否可用
      if (typeof chrome === 'undefined' || !chrome || !chrome.runtime) {
        console.debug("Chrome API不可用，无法执行翻译");
        resolve(null);
        return;
      }

      // 设置超时处理，防止消息挂起
      const timeoutId = setTimeout(() => {
        console.debug("翻译请求超时，超过8秒未收到响应");
        resolve(null);
      }, 8000);

      // 发送翻译请求
      chrome.runtime.sendMessage(
        {
          action: "translateSingleText",
          translationService,
          sourceLanguage,
          targetLanguage,
          source
        },
        response => {
          // 清除超时计时器
          clearTimeout(timeoutId);
          
          // 检查运行时错误
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            // 非关键错误可以忽略
            if (errorMsg.includes("context invalidated") || 
                errorMsg.includes("The message port closed")) {
              console.debug("翻译时出现非关键错误:", errorMsg);
            } else {
              // 记录其他错误
              console.debug("翻译时出现错误:", errorMsg);
            }
            resolve(null);
            return;
          }
          
          // 处理翻译结果
          if (!response) {
            resolve(null);
          } else if (typeof response === 'string') {
            // 兼容直接返回字符串的情况
            resolve(response);
          } else if (response.translated) {
            // 兼容返回对象的情况
            resolve(response.translated);
          } else {
            resolve(null);
          }
        }
      );
    } catch (error) {
      console.debug("翻译请求发生异常:", error);
      resolve(null);
    }
  });
}
var pageTranslator = {};
function getTabHostName() {
  return new Promise(resolve => {
    try {
      // 检查chrome API是否可用
      if (typeof chrome === 'undefined' || !chrome || !chrome.runtime) {
        console.debug("Chrome API不可用，无法获取主机名");
        resolve("");
        return;
      }

      // 设置超时处理
      const timeoutId = setTimeout(() => {
        console.debug("获取主机名请求超时");
        resolve("");
      }, 5000);

      // 发送请求
      chrome.runtime.sendMessage({
        action: "getTabHostName"
      }, result => {
        // 清除超时
        clearTimeout(timeoutId);
        
        // 处理错误
        if (chrome.runtime.lastError) {
          const errorMsg = chrome.runtime.lastError.message;
          // 非关键错误可以忽略
          if (errorMsg.includes("context invalidated") || 
              errorMsg.includes("The message port closed")) {
            console.debug("获取主机名时出现非关键错误:", errorMsg);
          } else {
            console.debug("获取主机名时出现错误:", errorMsg);
          }
          resolve("");
          return;
        }
        
        // 确保结果是有效的
        resolve(result || "");
      });
    } catch (error) {
      console.debug("获取主机名请求发生异常:", error);
      resolve("");
    }
  });
}
Promise.all([twpConfig.onReady(), getTabHostName()]).then(function (_) {
  const tabHostName = _[1];
  // "sup" não será traduzido https://github.com/FilipePS/Traduzir-paginas-web/issues/647
  /* prettier-ignore */
  const htmlTagsInlineText = ["#text", "a", "abbr", "acronym", "b", "bdo", "big", "cite", "dfn", "em", "i", "label", "q", "s", "small", "span", "strong", "sub", /*"sup",*/"u", "tt", "var"];
  /* prettier-ignore */
  const htmlTagsInlineIgnore = ["br", "code", "kbd", "wbr"]; // and input if type is submit or button, and <pre> depending on settings
  /* prettier-ignore */
  const htmlTagsNoTranslate = ["title", "script", "style", "textarea", "svg", "template", "math", "mjx-container", "tex-math" // https://github.com/FilipePS/Traduzir-paginas-web/issues/704
  ];
  if (location.hostname === "pdf.translatewebpages.org") {
    const index = htmlTagsInlineText.indexOf("span");
    if (index !== -1) {
      htmlTagsInlineText.splice(index, 1);
    }
  }

  // https://github.com/FilipePS/Traduzir-paginas-web/issues/609
  if (twpConfig.get("translateTag_pre") !== "yes" && !(document.body.childElementCount === 1 && document.body.firstChild.nodeName.toLocaleLowerCase() === "pre")) {
    htmlTagsInlineIgnore.push("pre");
  }
  twpConfig.onChanged((name, newvalue) => {
    switch (name) {
      case "translateTag_pre":
        const index = htmlTagsInlineIgnore.indexOf("pre");
        if (index !== -1) {
          htmlTagsInlineIgnore.splice(index, 1);
        }
        if (newvalue !== "yes" && !(document.body.childElementCount === 1 && document.body.firstChild.nodeName.toLocaleLowerCase() === "pre")) {
          htmlTagsInlineIgnore.push("pre");
        }
        break;
      case "dontSortResults":
        dontSortResults = newvalue == "yes" ? true : false;
        break;
    }
  });

  //TODO FOO
  if (twpConfig.get("popupPanelSection") <= 1) {
    twpConfig.set("targetLanguage", twpConfig.get("targetLanguages")[0]);
  }

  // Pieces are a set of nodes separated by inline tags that form a sentence or paragraph.
  let piecesToTranslate = [];
  let originalTabLanguage = "und";
  let currentPageLanguage = "und";
  let pageLanguageState = "original";
  let currentSourceLanguage = "auto";
  let currentTargetLanguage = twpConfig.get("targetLanguage");
  let currentPageTranslatorService = twpConfig.get("pageTranslatorService");
  let customDictionary = sortDictionary(twpConfig.get("customDictionary"));
  let dontSortResults = twpConfig.get("dontSortResults") == "yes" ? true : false;
  let fooCount = 0;
  let originalPageTitle;
  let attributesToTranslate = [];
  let translateNewNodesTimerHandler;
  let newNodes = [];
  let removedNodes = [];
  let nodesToRestore = [];
  function translateNewNodes() {
    try {
      newNodes.forEach(nn => {
        if (removedNodes.indexOf(nn) != -1) return;
        let newPiecesToTranslate = getPiecesToTranslate(nn);
        for (const i in newPiecesToTranslate) {
          const newNodes = newPiecesToTranslate[i].nodes;
          let finded = false;
          for (const ntt of piecesToTranslate) {
            if (ntt.nodes.some(n1 => newNodes.some(n2 => n1 === n2))) {
              finded = true;
            }
          }
          if (!finded) {
            piecesToTranslate.push(newPiecesToTranslate[i]);
          }
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      newNodes = [];
      removedNodes = [];
    }
  }
  const mutationObserver = new MutationObserver(function (mutations) {
    const piecesToTranslate = [];
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(addedNode => {
        const nodeName = addedNode.nodeName.toLowerCase();
        if (!isNoTranslateNode(addedNode)) {
          if (htmlTagsInlineText.indexOf(nodeName) == -1) {
            if (htmlTagsInlineIgnore.indexOf(nodeName) == -1) {
              piecesToTranslate.push(addedNode);
            }
          }
        }
      });
      mutation.removedNodes.forEach(removedNode => {
        removedNodes.push(removedNode);
      });
    });
    piecesToTranslate.forEach(ptt => {
      if (newNodes.indexOf(ptt) == -1) {
        newNodes.push(ptt);
      }
    });
  });
  function enableMutatinObserver() {
    disableMutatinObserver();
    if (twpConfig.get("translateDynamicallyCreatedContent") == "yes") {
      translateNewNodesTimerHandler = setInterval(translateNewNodes, 2000);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  function disableMutatinObserver() {
    clearInterval(translateNewNodesTimerHandler);
    newNodes = [];
    removedNodes = [];
    mutationObserver.disconnect();
    mutationObserver.takeRecords();
  }
  let pageIsVisible = document.visibilityState == "visible";
  // isto faz com que partes do youtube não sejam traduzidas
  // new IntersectionObserver(entries => {
  //         if (entries[0].isIntersecting && document.visibilityState == "visible") {
  //             pageIsVisible = true
  //         } else {
  //             pageIsVisible = false
  //         }

  //         if (pageIsVisible && pageLanguageState === "translated") {
  //             enableMutatinObserver()
  //         } else {
  //             disableMutatinObserver()
  //         }
  //     }, {
  //         root: null
  //     })
  //     .observe(document.body)

  const handleVisibilityChange = function () {
    if (document.visibilityState == "visible") {
      pageIsVisible = true;
    } else {
      pageIsVisible = false;
    }
    if (pageIsVisible && pageLanguageState === "translated") {
      enableMutatinObserver();
    } else {
      disableMutatinObserver();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange, false);

  /**
   *
   * @param {HTMLElement} node
   * @returns
   */
  function isNoTranslateNode(node) {
    const nodeName = node.nodeName.toLowerCase();
    const index = htmlTagsNoTranslate.indexOf(nodeName);

    //https://github.com/FilipePS/Traduzir-paginas-web/issues/704
    if (nodeName === "span" && node.classList.contains("mjx-chtml")) {
      return true;
    } else if (index === -1) {
      return false;
    } else {
      // https://github.com/FilipePS/Traduzir-paginas-web/issues/654
      if (nodeName === "script" && node.getAttribute("data-spotim-module") === "spotim-launcher" && [...node.childNodes].find(node => node.nodeType === 1)) {
        return false;
      } else {
        return true;
      }
    }
  }
  function getPiecesToTranslate(root = document.documentElement) {
    const piecesToTranslate = [{
      isTranslated: false,
      parentElement: null,
      topElement: null,
      bottomElement: null,
      nodes: []
    }];
    let index = 0;
    let currentParagraphSize = 0;
    const getAllNodes = function (node, lastHTMLElement = null, lastSelectOrDataListElement = null) {
      if (node.nodeType == 1 || node.nodeType == 11) {
        if (node.nodeType == 11) {
          lastHTMLElement = node.host;
          lastSelectOrDataListElement = null;
        } else if (node.nodeType == 1) {
          lastHTMLElement = node;
          const nodeName = node.nodeName.toLowerCase();
          if (nodeName === "select" || nodeName === "datalist") lastSelectOrDataListElement = node;
          if (htmlTagsInlineIgnore.indexOf(nodeName) !== -1 || isNoTranslateNode(node) || node.classList.contains("notranslate") || node.getAttribute("translate") === "no" || node.isContentEditable || node.classList.contains("CodeMirror") ||
          // https://www.w3schools.com/html/tryit.asp
          node.classList.contains("material-icons") ||
          // https://github.com/FilipePS/Traduzir-paginas-web/issues/481
          node.classList.contains("material-symbols-outlined") || nodeName.startsWith("br-") ||
          // https://github.com/FilipePS/Traduzir-paginas-web/issues/627
          node.getAttribute("id") === "branch-select-menu" ||
          // https://github.com/FilipePS/Traduzir-paginas-web/issues/570
          location.hostname === "twitter.com" && nodeName === "a" && (node.matches ? node.matches("article a") : true) // https://github.com/FilipePS/Traduzir-paginas-web/issues/449
          ) {
            if (piecesToTranslate[index].nodes.length > 0) {
              currentParagraphSize = 0;
              piecesToTranslate[index].bottomElement = lastHTMLElement;
              piecesToTranslate.push({
                isTranslated: false,
                parentElement: null,
                topElement: null,
                bottomElement: null,
                nodes: []
              });
              index++;
            }
            return;
          }
        }
        function getAllChilds(childNodes) {
          Array.from(childNodes).forEach(_node => {
            const nodeName = _node.nodeName.toLowerCase();
            if (_node.nodeType == 1) {
              lastHTMLElement = _node;
              if (nodeName === "select" || nodeName === "datalist") lastSelectOrDataListElement = _node;
            }
            if (htmlTagsInlineText.indexOf(nodeName) == -1) {
              if (piecesToTranslate[index].nodes.length > 0) {
                currentParagraphSize = 0;
                piecesToTranslate[index].bottomElement = lastHTMLElement;
                piecesToTranslate.push({
                  isTranslated: false,
                  parentElement: null,
                  topElement: null,
                  bottomElement: null,
                  nodes: []
                });
                index++;
              }
              getAllNodes(_node, lastHTMLElement, lastSelectOrDataListElement);
              if (piecesToTranslate[index].nodes.length > 0) {
                currentParagraphSize = 0;
                piecesToTranslate[index].bottomElement = lastHTMLElement;
                piecesToTranslate.push({
                  isTranslated: false,
                  parentElement: null,
                  topElement: null,
                  bottomElement: null,
                  nodes: []
                });
                index++;
              }
            } else {
              getAllNodes(_node, lastHTMLElement, lastSelectOrDataListElement);
            }
          });
        }
        getAllChilds(node.childNodes);
        if (!piecesToTranslate[index].bottomElement) {
          piecesToTranslate[index].bottomElement = node;
        }
        if (node.shadowRoot) {
          getAllChilds(node.shadowRoot.childNodes);
          if (!piecesToTranslate[index].bottomElement) {
            piecesToTranslate[index].bottomElement = node;
          }
        }
      } else if (node.nodeType == 3) {
        if (node.textContent.trim().length > 0) {
          if (!piecesToTranslate[index].parentElement) {
            if (node && node.parentNode && node.parentNode.nodeName.toLowerCase() === "option" && lastSelectOrDataListElement) {
              piecesToTranslate[index].parentElement = lastSelectOrDataListElement;
              piecesToTranslate[index].bottomElement = lastSelectOrDataListElement;
              piecesToTranslate[index].topElement = lastSelectOrDataListElement;
            } else {
              let temp = node.parentNode;
              const nodeName = temp.nodeName.toLowerCase();
              while (temp && temp != root && (htmlTagsInlineText.indexOf(nodeName) != -1 || htmlTagsInlineIgnore.indexOf(nodeName) != -1)) {
                temp = temp.parentNode;
              }
              if (temp && temp.nodeType === 11) {
                temp = temp.host;
              }
              piecesToTranslate[index].parentElement = temp;
            }
          }
          if (!piecesToTranslate[index].topElement) {
            piecesToTranslate[index].topElement = lastHTMLElement;
          }
          if (currentParagraphSize > 1000) {
            currentParagraphSize = 0;
            piecesToTranslate[index].bottomElement = lastHTMLElement;
            const pieceInfo = {
              isTranslated: false,
              parentElement: null,
              topElement: lastHTMLElement,
              bottomElement: null,
              nodes: []
            };
            pieceInfo.parentElement = piecesToTranslate[index].parentElement;
            piecesToTranslate.push(pieceInfo);
            index++;
          }
          currentParagraphSize += node.textContent.length;
          piecesToTranslate[index].nodes.push(node);
          piecesToTranslate[index].bottomElement = null;
        }
      }
    };
    getAllNodes(root);
    if (piecesToTranslate.length > 0 && piecesToTranslate[piecesToTranslate.length - 1].nodes.length == 0) {
      piecesToTranslate.pop();
    }
    return piecesToTranslate;
  }
  function getAttributesToTranslate(root = document.body) {
    const attributesToTranslate = [];
    const placeholdersElements = root.querySelectorAll("input[placeholder], textarea[placeholder]");
    const altElements = root.querySelectorAll('area[alt], img[alt], input[type="image"][alt]');
    const valueElements = root.querySelectorAll('input[type="button"], input[type="submit"], input[type="reset"]');
    const titleElements = root.querySelectorAll("body [title]");
    function hasNoTranslate(elem) {
      if (elem && (elem.classList.contains("notranslate") || elem.getAttribute("translate") === "no")) {
        return true;
      }
    }
    placeholdersElements.forEach(e => {
      if (hasNoTranslate(e)) return;
      const txt = e.getAttribute("placeholder");
      if (txt && txt.trim()) {
        attributesToTranslate.push({
          node: e,
          original: txt,
          attrName: "placeholder"
        });
      }
    });
    altElements.forEach(e => {
      if (hasNoTranslate(e)) return;
      const txt = e.getAttribute("alt");
      if (txt && txt.trim()) {
        attributesToTranslate.push({
          node: e,
          original: txt,
          attrName: "alt"
        });
      }
    });
    valueElements.forEach(e => {
      if (hasNoTranslate(e)) return;
      const txt = e.getAttribute("value");
      if (e.type == "submit" && !txt) {
        attributesToTranslate.push({
          node: e,
          original: "Submit Query",
          attrName: "value"
        });
      } else if (e.type == "reset" && !txt) {
        attributesToTranslate.push({
          node: e,
          original: "Reset",
          attrName: "value"
        });
      } else if (txt && txt.trim()) {
        attributesToTranslate.push({
          node: e,
          original: txt,
          attrName: "value"
        });
      }
    });
    titleElements.forEach(e => {
      if (hasNoTranslate(e)) return;
      const txt = e.getAttribute("title");
      if (txt && txt.trim()) {
        attributesToTranslate.push({
          node: e,
          original: txt,
          attrName: "title"
        });
      }
    });
    return attributesToTranslate;
  }

  // encapsular o texto faz com que do video suma
  // ao utilizar função como Pai.removeChild(filho)
  // pode ser gerado um erro ao encapsular
  function encapsulateTextNode(node) {
    const fontNode = document.createElement("font");
    fontNode.setAttribute("style", "vertical-align: inherit;");
    fontNode.textContent = node.textContent;
    node.replaceWith(fontNode);
    return fontNode;
  }
  function translateTextContent(node, parentNode, text, toRestore) {
    toRestore.translatedText = text;
    if (location.hostname === "pdf.translatewebpages.org") {
      if (parentNode && parentNode.nodeName.toLowerCase() === "span" && parentNode.getAttribute("role") === "presentation") {
        const oldClientWidth = node.parentNode.clientWidth;
        node.textContent = text;
        const newClientWidth = node.parentNode.clientWidth;
        const transformMatch = parentNode.style.transform.match(/[0-9]+[\.]{1,1}[0-9]*/);
        const currentScaleX = transformMatch ? parseFloat(transformMatch[0]) : 1.0;
        toRestore.originalScale = currentScaleX;
        parentNode.style.transform = `scaleX(${currentScaleX * Math.min(currentScaleX, oldClientWidth / newClientWidth)})`;
      } else {
        node.textContent = text;
      }
    } else {
      node.textContent = text;
    }
  }
  function translateResults(piecesToTranslateNow, results) {
    if (dontSortResults) {
      for (let i = 0; i < results.length; i++) {
        for (let j = 0; j < results[i].length; j++) {
          if (piecesToTranslateNow[i].nodes[j]) {
            const nodes = piecesToTranslateNow[i].nodes;
            let translated = results[i][j] + " ";
            // In some case, results items count is over original node count
            // Rest results append to last node
            if (piecesToTranslateNow[i].nodes.length - 1 === j && results[i].length > j) {
              const restResults = results[i].slice(j + 1);
              translated += restResults.join(" ");
            }
            const originalTextNode = nodes[j];
            const parentNode = nodes[j].parentNode;
            if (showOriginal.isEnabled) {
              nodes[j] = encapsulateTextNode(nodes[j]);
              showOriginal.add(nodes[j]);
            }
            const toRestore = {
              node: nodes[j],
              original: originalTextNode,
              originalText: originalTextNode.textContent,
              translatedText: translated,
              originalScale: null,
              parentNode
            };
            nodesToRestore.push(toRestore);
            const originalText = originalTextNode.textContent;
            handleCustomWords(translated, nodes[j].textContent, customDictionary, currentPageTranslatorService, currentSourceLanguage, currentTargetLanguage).then(results => {
              // results = `${originalText.match(/^\s*/)[0]}${results.trim()}${
              //   originalText.match(/\s*$/)[0]
              // }`;
              translateTextContent(nodes[j], parentNode, results, toRestore);
            });
          }
        }
      }
    } else {
      for (const i in piecesToTranslateNow) {
        for (const j in piecesToTranslateNow[i].nodes) {
          if (results[i][j]) {
            const nodes = piecesToTranslateNow[i].nodes;
            const translated = results[i][j] + " ";
            const originalTextNode = nodes[j];
            const parentNode = nodes[j].parentNode;
            if (showOriginal.isEnabled) {
              nodes[j] = encapsulateTextNode(nodes[j]);
              showOriginal.add(nodes[j]);
            }
            const toRestore = {
              node: nodes[j],
              original: originalTextNode,
              originalText: originalTextNode.textContent,
              translatedText: translated,
              parentNode
            };
            nodesToRestore.push(toRestore);
            const originalText = originalTextNode.textContent;
            handleCustomWords(translated, nodes[j].textContent, customDictionary, currentPageTranslatorService, currentSourceLanguage, currentTargetLanguage).then(results => {
              // results = `${originalText.match(/^\s*/)[0]}${results.trim()}${
              //   originalText.match(/\s*$/)[0]
              // }`;
              translateTextContent(nodes[j], parentNode, results, toRestore);
            });
          }
        }
      }
    }
    mutationObserver.takeRecords();
  }
  function translateAttributes(attributesToTranslateNow, results) {
    for (const i in attributesToTranslateNow) {
      const ati = attributesToTranslateNow[i];
      ati.node.setAttribute(ati.attrName, results[i]);
    }
  }
  function translationRoutine() {
    try {
      if (piecesToTranslate && pageIsVisible) {
        (function () {
          if (piecesToTranslate.length < 1) return;
          const innerHeight = window.innerHeight;
          function isInScreen(element) {
            try {
              if (!element || !element.getBoundingClientRect) return false;
              const rect = element.getBoundingClientRect();
              if (rect.top > 0 && rect.top <= innerHeight || rect.bottom > 0 && rect.bottom <= innerHeight) {
                return true;
              }
              return false;
            } catch (error) {
              console.debug("检查元素是否在屏幕内时出错:", error);
              return false;
            }
          }
          function topIsInScreen(element) {
            try {
              if (!element || !element.getBoundingClientRect) {
                return false;
              }
              const rect = element.getBoundingClientRect();
              if (rect.top > 0 && rect.top <= innerHeight) {
                return true;
              }
              return false;
            } catch (error) {
              console.debug("检查元素顶部是否在屏幕内时出错:", error);
              return false;
            }
          }
          function bottomIsInScreen(element) {
            try {
              if (!element || !element.getBoundingClientRect) {
                return false;
              }
              const rect = element.getBoundingClientRect();
              if (rect.bottom > 0 && rect.bottom <= innerHeight) {
                return true;
              }
              return false;
            } catch (error) {
              console.debug("检查元素底部是否在屏幕内时出错:", error);
              return false;
            }
          }
          try {
            const currentFooCount = fooCount;
            const piecesToTranslateNow = [];
            piecesToTranslate.forEach(ptt => {
              try {
                if (!ptt.isTranslated) {
                  if (bottomIsInScreen(ptt.topElement) || topIsInScreen(ptt.bottomElement)) {
                    ptt.isTranslated = true;
                    piecesToTranslateNow.push(ptt);
                  }
                }
              } catch (error) {
                console.debug("处理翻译段落时出错:", error);
              }
            });
            const attributesToTranslateNow = [];
            attributesToTranslate.forEach(ati => {
              try {
                if (!ati.isTranslated) {
                  if (isInScreen(ati.node)) {
                    ati.isTranslated = true;
                    attributesToTranslateNow.push(ati);
                  }
                }
              } catch (error) {
                console.debug("处理属性翻译时出错:", error);
              }
            });
            if (piecesToTranslateNow.length > 0) {
              try {
                // 对每个节点进行安全处理，避免一个错误干扰整体翻译
                const safeSourceArray2d = piecesToTranslateNow.map(ptt => {
                  try {
                    return ptt.nodes.map(node => {
                      try {
                        if (node && node.textContent) {
                          return filterKeywordsInText(node.textContent, customDictionary, currentPageTranslatorService);
                        }
                        return "";
                      } catch (e) {
                        console.debug("处理节点文本时出错:", e);
                        return "";
                      }
                    });
                  } catch (e) {
                    console.debug("处理翻译段落时出错:", e);
                    return [];
                  }
                });

                backgroundTranslateHTML(currentPageTranslatorService, currentSourceLanguage, currentTargetLanguage, safeSourceArray2d, dontSortResults).then(results => {
                  try {
                    if (pageLanguageState === "translated" && currentFooCount === fooCount) {
                      translateResults(piecesToTranslateNow, results);
                    }
                  } catch (error) {
                    console.debug("处理HTML翻译结果时出错:", error);
                  }
                }).catch(error => {
                  console.debug("HTML翻译过程中出错:", error);
                });
              } catch (error) {
                console.debug("请求HTML翻译时出错:", error);
              }
            }
            if (attributesToTranslateNow.length > 0) {
              try {
                // 安全处理原始属性值
                const safeAttributes = attributesToTranslateNow.map(ati => {
                  try {
                    return ati.original || "";
                  } catch (e) {
                    console.debug("处理属性原始值时出错:", e);
                    return "";
                  }
                });

                backgroundTranslateText(currentPageTranslatorService, currentSourceLanguage, currentTargetLanguage, safeAttributes).then(results => {
                  try {
                    if (pageLanguageState === "translated" && currentFooCount === fooCount) {
                      translateAttributes(attributesToTranslateNow, results);
                    }
                  } catch (error) {
                    console.debug("处理文本翻译结果时出错:", error);
                  }
                }).catch(error => {
                  console.debug("文本翻译过程中出错:", error);
                });
              } catch (error) {
                console.debug("请求文本翻译时出错:", error);
              }
            }
          } catch (error) {
            console.debug("翻译循环主要处理过程中出错:", error);
          }
        })();
      }
    } catch (e) {
      console.debug("翻译循环顶层出错:", e);
    }
    
    try {
      clearTimeout(translationRoutine_handler);
      translationRoutine_handler = setTimeout(translationRoutine, 300);
    } catch (e) {
      console.debug("设置翻译循环定时器时出错:", e);
      // 确保循环不会中断，即使设置定时器失败
      setTimeout(translationRoutine, 1000);
    }
  }
  translationRoutine();
  function translatePageTitle() {
    try {
      // 安全获取title元素
      const title = document.querySelector("title");
      if (!title) {
        console.debug("页面没有title元素");
        return;
      }
      
      // 检查是否设置了不翻译属性
      if (title.classList && title.classList.contains("notranslate") || 
          title.getAttribute && title.getAttribute("translate") === "no") {
        return;
      }
      
      // 检查标题是否为空
      if (!document.title || document.title.trim().length < 1) {
        console.debug("页面标题为空");
        return;
      }
      
      // 保存原始标题
      originalPageTitle = document.title;
      
      // 设置超时处理
      const titleTranslationTimeout = setTimeout(() => {
        console.debug("标题翻译请求超时");
      }, 5000);
      
      // 翻译标题
      backgroundTranslateSingleText(
        currentPageTranslatorService, 
        currentSourceLanguage, 
        currentTargetLanguage, 
        originalPageTitle
      ).then(result => {
        // 清除超时
        clearTimeout(titleTranslationTimeout);
        
        // 更新标题
        if (result) {
          try {
            document.title = result;
          } catch (error) {
            console.debug("设置页面标题时出错:", error);
          }
        }
      }).catch(error => {
        // 清除超时
        clearTimeout(titleTranslationTimeout);
        console.debug("翻译页面标题时出错:", error);
      });
    } catch (error) {
      console.debug("处理页面标题翻译时出错:", error);
    }
  }
  const pageLanguageStateObservers = [];
  pageTranslator.onPageLanguageStateChange = function (callback) {
    pageLanguageStateObservers.push(callback);
  };
  var translationRoutine_handler = null;
  pageTranslator.translatePage = function (targetLanguage) {
    fooCount++;
    pageTranslator.restorePage();
    showOriginal.enable();
    chrome.runtime.sendMessage({
      action: "removeTranslationsWithError"
    }, checkedLastError);
    if (targetLanguage) {
      currentTargetLanguage = targetLanguage;
    }
    customDictionary = sortDictionary(twpConfig.get("customDictionary"));

    // https://github.com/FilipePS/Traduzir-paginas-web/issues/619
    if (location.hostname === "sberbank.com" || location.hostname === "www.sberbank.com") {
      document.body.classList.remove("notranslate");
    }
    if (location.hostname === "pdf.translatewebpages.org") {
      document.getElementById("scaleSelect").value = "1.5";
      document.getElementById("scaleSelect").dispatchEvent(new Event("change"));
    }
    piecesToTranslate = getPiecesToTranslate();
    attributesToTranslate = getAttributesToTranslate();
    pageLanguageState = "translated";
    chrome.runtime.sendMessage({
      action: "setPageLanguageState",
      pageLanguageState
    }, checkedLastError);
    pageLanguageStateObservers.forEach(callback => callback(pageLanguageState));
    currentPageLanguage = currentTargetLanguage;
    translatePageTitle();
    enableMutatinObserver();
    translationRoutine();
  };
  pageTranslator.restorePage = function () {
    fooCount++;
    piecesToTranslate = [];
    showOriginal.disable();
    disableMutatinObserver();
    pageLanguageState = "original";
    chrome.runtime.sendMessage({
      action: "setPageLanguageState",
      pageLanguageState
    }, checkedLastError);
    pageLanguageStateObservers.forEach(callback => callback(pageLanguageState));
    currentPageLanguage = originalTabLanguage;
    if (originalPageTitle) {
      document.title = originalPageTitle;
    }
    originalPageTitle = null;
    for (const ntr of nodesToRestore) {
      if (ntr.node === ntr.original) {
        if (ntr.node.textContent === ntr.translatedText) {
          ntr.node.textContent = ntr.originalText;
        }
      } else {
        ntr.node.replaceWith(ntr.original);
      }
      if (ntr.originalScale) {
        ntr.parentNode.style.transform = `scaleX(${ntr.originalScale}`;
      }
    }
    nodesToRestore = [];

    //TODO não restaurar atributos que foram modificados
    for (const ati of attributesToTranslate) {
      if (ati.isTranslated) {
        ati.node.setAttribute(ati.attrName, ati.original);
      }
    }
    attributesToTranslate = [];
  };
  pageTranslator.swapTranslationService = function (newServiceName) {
    currentPageTranslatorService = newServiceName;
    if (pageLanguageState === "translated") {
      pageTranslator.translatePage();
    }
  };
  pageTranslator.improveTranslation = function (info) {
    currentPageTranslatorService = info.pageTranslatorService;
    dontSortResults = info.dontSortResults === "yes" ? true : false;
    currentSourceLanguage = info.sourceLanguage;
    if (pageLanguageState === "translated") {
      pageTranslator.translatePage(info.targetLanguage);
    }
  };
  let alreadyGotTheLanguage = false;
  const observers = [];
  pageTranslator.onGetOriginalTabLanguage = function (callback) {
    if (alreadyGotTheLanguage) {
      callback(originalTabLanguage);
    } else {
      observers.push(callback);
    }
  };
  let textContentLanguageDetectionPromise = null;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translatePage") {
      if (request.targetLanguage === "original") {
        pageTranslator.restorePage();
      } else {
        pageTranslator.translatePage(request.targetLanguage);
      }
    } else if (request.action === "restorePage") {
      pageTranslator.restorePage();
    } else if (request.action === "getOriginalTabLanguage") {
      pageTranslator.onGetOriginalTabLanguage(function () {
        sendResponse(originalTabLanguage);
      });
      return true;
    } else if (request.action === "getCurrentPageLanguage") {
      sendResponse(currentPageLanguage);
    } else if (request.action === "getCurrentPageLanguageState") {
      sendResponse(pageLanguageState);
    } else if (request.action === "getCurrentPageTranslatorService") {
      sendResponse(currentPageTranslatorService);
    } else if (request.action === "swapTranslationService") {
      pageTranslator.swapTranslationService(request.newServiceName);
    } else if (request.action === "toggle-translation") {
      if (pageLanguageState === "translated") {
        pageTranslator.restorePage();
      } else {
        pageTranslator.translatePage();
      }
    } else if (request.action === "autoTranslateBecauseClickedALink") {
      if (twpConfig.get("autoTranslateWhenClickingALink") === "yes") {
        pageTranslator.onGetOriginalTabLanguage(function () {
          if (pageLanguageState === "original" && originalTabLanguage !== currentTargetLanguage && twpConfig.get("neverTranslateLangs").indexOf(originalTabLanguage) === -1 && twpConfig.get("neverTranslateSites").indexOf(tabHostName) === -1) {
            pageTranslator.translatePage();
          }
        });
      }
    } else if (request.action === "restorePagesWithServiceNames") {
      if (request.serviceNames.includes(currentPageTranslatorService)) {
        pageTranslator.restorePage();
        currentPageTranslatorService = request.newServiceName;
      }
    } else if (request.action === "improveTranslation") {
      pageTranslator.improveTranslation(request);
    } else if (request.action === "getCurrentSourceLanguage") {
      sendResponse(currentSourceLanguage);
    } else if (request.action === "getDontSortResults") {
      sendResponse(dontSortResults);
    } else if (request.action === "cleanUp") {
      pageTranslator.restorePage();
    } else if (request.action === "currentTargetLanguage") {
      sendResponse(currentTargetLanguage);
    } else if (request.action === "detectLanguageUsingTextContent") {
      if (textContentLanguageDetectionPromise) {
        textContentLanguageDetectionPromise.then(result => sendResponse(result));
      } else {
        textContentLanguageDetectionPromise = new Promise(resolve => {
          chrome.i18n.detectLanguage(document.body.innerText.trim().slice(0, 1000), result => {
            // checkedLastError();
            if (result && result.languages && result.languages.length > 0) {
              resolve(result.languages[0].language);
              sendResponse(result.languages[0].language);
            } else {
              sendResponse("und");
            }
          });
        });
      }
      return true;
    }
  });

  // Requests the detection of the tab language in the background
  if (window.self === window.top) {
    // is main frame
    const onTabVisible = function () {
      chrome.runtime.sendMessage({
        action: "detectTabLanguage"
      }, result => {
        checkedLastError();
        result = result || "und";
        if (result === "und") {
          originalTabLanguage = result;
          if ((twpConfig.get("alwaysTranslateSites").indexOf(tabHostName) !== -1 || location.hostname === "pdf.translatewebpages.org" && twpConfig.get("neverTranslateSites").indexOf(tabHostName) === -1) && !platformInfo.isMobile.any) {
            pageTranslator.translatePage();
          }
        } else {
          const langCode = twpLang.fixTLanguageCode(result);
          if (langCode) {
            originalTabLanguage = langCode;
          }
          if (location.hostname === "pdftohtml.translatewebpages.org" && location.href.indexOf("?autotranslate") !== -1 && twpConfig.get("neverTranslateSites").indexOf(tabHostName) === -1 || location.hostname === "pdf.translatewebpages.org" && twpConfig.get("neverTranslateSites").indexOf(tabHostName) === -1) {
            pageTranslator.translatePage();
          } else {
            if (location.hostname !== "translate.googleusercontent.com" && location.hostname !== "translate.google.com" && location.hostname !== "translate.yandex.com" && location.hostname !== "www.deepl.com" && location.hostname !== "translated.turbopages.org" && !location.hostname.endsWith("translate.goog") && location.hostname !== "sberbank.com" && location.hostname !== "www.sberbank.com" // https://github.com/FilipePS/Traduzir-paginas-web/issues/619
            ) {
              if (pageLanguageState === "original" &&
              // !platformInfo.isMobile.any &&
              !chrome.extension.inIncognitoContext) {
                if (twpConfig.get("neverTranslateSites").indexOf(tabHostName) === -1) {
                  if (langCode && langCode !== currentTargetLanguage && twpConfig.get("alwaysTranslateLangs").indexOf(langCode) !== -1) {
                    pageTranslator.translatePage();
                  } else if (twpConfig.get("alwaysTranslateSites").indexOf(tabHostName) !== -1 && !platformInfo.isMobile.any) {
                    pageTranslator.translatePage();
                  }
                }
              }
            }
          }
        }
        observers.forEach(callback => callback(originalTabLanguage));
        alreadyGotTheLanguage = true;
      });
    };
    setTimeout(function () {
      if (document.visibilityState == "visible") {
        onTabVisible();
      } else {
        const handleVisibilityChange = function () {
          if (document.visibilityState == "visible") {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            onTabVisible();
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange, false);
      }
    }, 150);
  } else {
    // is subframe (iframe)
    chrome.runtime.sendMessage({
      action: "getMainFrameTabLanguage"
    }, result => {
      checkedLastError();
      originalTabLanguage = result || "und";
      observers.forEach(callback => callback(originalTabLanguage));
      alreadyGotTheLanguage = true;
    });
    chrome.runtime.sendMessage({
      action: "getMainFramePageLanguageState"
    }, result => {
      checkedLastError();
      if (result === "translated" && pageLanguageState === "original" && twpConfig.get("enableIframePageTranslation") === "yes") {
        pageTranslator.translatePage();
      }
    });
  }
  showOriginal.enabledObserverSubscribe(function () {
    if (pageLanguageState !== "original") {
      pageTranslator.translatePage();
    }
  });
});

// 添加全局错误处理
window.addEventListener('error', function(event) {
  try {
    // 防止错误显示在控制台
    event.preventDefault();
    
    // 记录错误但不影响用户体验
    let errorMsg = "";
    if (event.error) {
      if (event.error.stack) {
        errorMsg = event.error.message + "\n" + event.error.stack;
      } else {
        errorMsg = event.error.message || String(event.error);
      }
    } else {
      errorMsg = event.message || "未知错误";
    }
    
    console.debug('页面翻译器捕获到错误:', errorMsg);
  } catch (e) {
    console.debug('处理错误事件时出错');
  }
});

// 处理未捕获的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
  // 防止未处理的Promise拒绝显示在控制台
  event.preventDefault();
  
  // 记录错误但不影响用户体验
  try {
    // 尝试获取更详细的错误信息
    let errorInfo = "";
    if (event.reason) {
      if (typeof event.reason === 'object' && event.reason.stack) {
        errorInfo = event.reason.message + "\n" + event.reason.stack;
      } else {
        errorInfo = String(event.reason);
      }
    }
    console.debug('页面翻译器捕获到未处理的Promise拒绝:', errorInfo);
  } catch (e) {
    console.debug('处理Promise拒绝时出错');
  }
});

//# sourceMappingURL=../maps/10.1.5.0/pageTranslator.js.map
