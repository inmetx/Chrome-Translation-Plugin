"use strict";

setTimeout(() => {
  fetch("./release-notes/en.html").then(response => response.text()).then(responseText => {
    try {
      window.scrollTo(0, 0);
      var releaseNotesElem = document.getElementById("release_notes");
      if (releaseNotesElem) {
        releaseNotesElem.innerHTML = responseText;
      }
      var msgElem = document.getElementById("_msgHasBeenUpdated");
      if (msgElem) {
        msgElem.textContent = twpI18n.getMessage("msgHasBeenUpdated");
        msgElem.innerHTML = msgElem.textContent.replace("#EXTENSION_NAME#", "<b>" + chrome.runtime.getManifest().name + "</b>").replace("#EXTENSION_VERSION#", "<b>" + chrome.runtime.getManifest().version + "</b>");
      }

      // donation options
      try {
        const handleDonationOptions = () => {
          // 使用getElementById可能更可靠，因为$可能未定义
          const currencyElem = document.getElementById("_currency") || $("#_currency");
          const donateInUSDElem = document.getElementById("_donateInUSD") || $("#_donateInUSD");
          const donateInBRLElem = document.getElementById("_donateInBRL") || $("#_donateInBRL");
          
          // 防御性检查，确保所有元素都存在
          if (!currencyElem || !donateInUSDElem || !donateInBRLElem) {
            console.debug("Donation elements not found, skipping donation setup");
            return;
          }
          
          try {
            // 根据浏览器语言设置默认货币
            if (navigator.language === "pt-BR") {
              currencyElem.value = "BRL";
              if (donateInUSDElem) donateInUSDElem.style.display = "none";
            } else {
              currencyElem.value = "USD";
              if (donateInBRLElem) donateInBRLElem.style.display = "none";
            }
            
            // 添加货币切换事件
            currencyElem.onchange = e => {
              try {
                if (e.target.value === "BRL") {
                  if (donateInUSDElem) donateInUSDElem.style.display = "none";
                  if (donateInBRLElem) donateInBRLElem.style.display = "block";
                } else {
                  if (donateInUSDElem) donateInUSDElem.style.display = "block";
                  if (donateInBRLElem) donateInBRLElem.style.display = "none";
                }
              } catch (innerError) {
                console.debug("Non-critical error in currency change event:", innerError);
              }
            };
          } catch (setupError) {
            console.debug("Non-critical error in donation options setup:", setupError);
          }
        };
        
        // 执行捐赠选项设置
        handleDonationOptions();
      } catch (error) {
        console.error("Error setting up donation options:", error);
      }

      try {
        const donationOverflow = document.getElementById("donationOverflow");
        if (donationOverflow) {
          setTimeout(() => {
            try {
              if (donationOverflow) {
                donationOverflow.style.display = "none";
              }
            } catch (e) {
              console.debug("Non-critical error hiding donation overflow:", e);
            }
          }, 1000);
          donationOverflow.style.display = "block";
        }
      } catch (overflowError) {
        console.debug("Non-critical error setting up donation overflow:", overflowError);
      }
    } catch (error) {
      console.error("Error updating release notes:", error);
    }
  });
}, 800);
var $ = document.querySelector.bind(document);
var sideBarIsVisible = false;
twpConfig.onReady().then(() => {
  // https://github.com/FilipePS/Traduzir-paginas-web/issues/774
  if (sessionStorage !== null) {
    return twpI18n.updateUiMessages(sessionStorage.getItem("temporaryUiLanguage"));
  } else {
    return twpI18n.updateUiMessages();
  }
}).then(() => {
  twpI18n.translateDocument();
  document.querySelector("[data-i18n='msgDefaultLanguage']").textContent = twpI18n.getMessage("msgDefaultLanguage") + " - Default language";
  var temporaryUiLanguage = null;
  if (sessionStorage !== null) {
    temporaryUiLanguage = sessionStorage.getItem("temporaryUiLanguage");
    sessionStorage.removeItem("temporaryUiLanguage");
  }
  if (platformInfo.isMobile.any) {
    let style = document.createElement("style");
    style.textContent = ".desktopOnly {display: none !important}";
    document.head.appendChild(style);
  }
  if (!chrome.pageAction) {
    let style = document.createElement("style");
    style.textContent = ".firefox-only {display: none !important}";
    document.head.appendChild(style);
  }
  $("#btnOpenMenu").onclick = e => {
    $("#menuContainer").classList.toggle("change");
    if (sideBarIsVisible) {
      $("#sideBar").style.display = "none";
      sideBarIsVisible = false;
    } else {
      $("#sideBar").style.display = "block";
      sideBarIsVisible = true;
    }
  };
});

function hashchange() {
  const hash = location.hash || "#languages";
  const divs = [$("#languages"), $("#sites"), $("#translations"), $("#style"), $("#hotkeys"), $("#privacy"), $("#storage"), $("#others")];
  divs.forEach(element => {
    element.style.display = "none";
  });
  document.querySelectorAll("nav a").forEach(a => {
    a.classList.remove("w3-light-grey");
  });
  $(hash).style.display = "block";
  $('a[href="' + hash + '"]').classList.add("w3-light-grey");
  
  const text = twpI18n.getMessage("lblSettings");
  $("#itemSelectedName").textContent = text;
  
  if ($("#menuContainer").classList.contains("change")) {
    $("#menuContainer").classList.toggle("change");
    $("#sideBar").style.display = "none";
    sideBarIsVisible = false;
  }
  
  if (hash === "#translations") {
    $("#translations").insertBefore($("#selectServiceContainer"), $("#translations").firstChild);
  } else if (hash === "#privacy") {
    $("#privacy").insertBefore($("#selectServiceContainer"), $("#privacy").firstChild);
  }
}

hashchange();
window.addEventListener("hashchange", hashchange);

function fillLanguageList(select) {
  let langs = twpLang.getLanguageList();
  const langsSorted = [];
  for (const i in langs) {
    langsSorted.push([i, langs[i]]);
  }
  langsSorted.sort(function (a, b) {
    return a[1].localeCompare(b[1]);
  });
  langsSorted.forEach(value => {
    const option = document.createElement("option");
    option.value = value[0];
    option.textContent = value[1];
    select.appendChild(option);
  });
}

fillLanguageList($("#selectTargetLanguage"));
fillLanguageList($("#selectTargetLanguageForText"));
fillLanguageList($("#favoriteLanguage1"));
fillLanguageList($("#favoriteLanguage2"));
fillLanguageList($("#favoriteLanguage3"));
fillLanguageList($("#addToNeverTranslateLangs"));
fillLanguageList($("#addToAlwaysTranslateLangs"));
fillLanguageList($("#addLangToTranslateWhenHovering"));

function updateDarkMode() {
  try {
    switch (twpConfig.get("darkMode")) {
      case "auto":
        if (matchMedia("(prefers-color-scheme: dark)").matches) {
          enableDarkMode();
        } else {
          disableDarkMode();
        }
        break;
      case "yes":
        enableDarkMode();
        break;
      case "no":
        disableDarkMode();
        break;
      default:
        break;
    }
  } catch(error) {
    console.error("Error in updateDarkMode:", error);
  }
}
// 初始化时忽略错误
try { updateDarkMode(); } catch(e) { console.error(e); }

// target languages
try {
  const selectUiElem = $("#selectUiLanguage");
  if (selectUiElem) {
    selectUiElem.value = (typeof temporaryUiLanguage !== 'undefined' && temporaryUiLanguage) ? temporaryUiLanguage : twpConfig.get("uiLanguage");
  }
} catch (e) {
  console.error("Error setting UI language:", e);
}
try {
  const selectUiLanguageElem = $("#selectUiLanguage");
  if (selectUiLanguageElem) {
    selectUiLanguageElem.onchange = e => {
      try {
        if (e.target.value === "default") {
          twpConfig.set("uiLanguage", "default");
        } else {
          if (sessionStorage !== null) {
            sessionStorage.setItem("temporaryUiLanguage", e.target.value);
          } else {
            return;
          }
        }
        location.reload();
      } catch (error) {
        console.error("Error in UI language change:", error);
      }
    };
  }
} catch (error) {
  console.error("Error setting up UI language selector:", error);
}

try {
  const btnApplyUiLanguageElem = $("#btnApplyUiLanguage");
  if (btnApplyUiLanguageElem) {
    btnApplyUiLanguageElem.onclick = () => {
      try {
        if (typeof temporaryUiLanguage !== 'undefined' && temporaryUiLanguage) {
          twpConfig.set("uiLanguage", temporaryUiLanguage === "default" ? "default" : twpLang.fixUILanguageCode(temporaryUiLanguage));
          // timeout prevents: TypeError: NetworkError when attempting to fetch resource.
          setTimeout(() => location.reload(), 100);
        } else if (sessionStorage === null) {
          const selectUiLanguageElem = $("#selectUiLanguage");
          if (selectUiLanguageElem) {
            const lang = selectUiLanguageElem.value;
            twpConfig.set("uiLanguage", lang === "default" ? "default" : twpLang.fixUILanguageCode(lang));
            // timeout prevents: TypeError: NetworkError when attempting to fetch resource.
            setTimeout(() => location.reload(), 100);
          }
        }
      } catch (error) {
        console.error("Error applying UI language:", error);
      }
    };
  }
} catch (error) {
  console.error("Error setting up apply button:", error);
}

const targetLanguage = twpConfig.get("targetLanguage");
$("#selectTargetLanguage").value = targetLanguage;
$("#selectTargetLanguage").onchange = e => {
  twpConfig.setTargetLanguage(e.target.value);
  location.reload();
};

const targetLanguageTextTranslation = twpConfig.get("targetLanguageTextTranslation");
$("#selectTargetLanguageForText").value = targetLanguageTextTranslation;
$("#selectTargetLanguageForText").onchange = e => {
  twpConfig.setTargetLanguage(e.target.value, true);
  twpConfig.setTargetLanguage(targetLanguage, false);
  location.reload();
};

const targetLanguages = twpConfig.get("targetLanguages");
$("#favoriteLanguage1").value = targetLanguages[0];
$("#favoriteLanguage2").value = targetLanguages[1];
$("#favoriteLanguage3").value = targetLanguages[2];

$("#favoriteLanguage1").onchange = e => {
  targetLanguages[0] = e.target.value;
  twpConfig.set("targetLanguages", targetLanguages);
  if (targetLanguages.indexOf(twpConfig.get("targetLanguage")) == -1) {
    twpConfig.set("targetLanguage", targetLanguages[0]);
  }
  if (targetLanguages.indexOf(twpConfig.get("targetLanguageTextTranslation")) == -1) {
    twpConfig.set("targetLanguageTextTranslation", targetLanguages[0]);
  }
  location.reload();
};

$("#favoriteLanguage2").onchange = e => {
  targetLanguages[1] = e.target.value;
  twpConfig.set("targetLanguages", targetLanguages);
  if (targetLanguages.indexOf(twpConfig.get("targetLanguage")) == -1) {
    twpConfig.set("targetLanguage", targetLanguages[0]);
  }
  if (targetLanguages.indexOf(twpConfig.get("targetLanguageTextTranslation")) == -1) {
    twpConfig.set("targetLanguageTextTranslation", targetLanguages[0]);
  }
  location.reload();
};

$("#favoriteLanguage3").onchange = e => {
  targetLanguages[2] = e.target.value;
  twpConfig.set("targetLanguages", targetLanguages);
  if (targetLanguages.indexOf(twpConfig.get("targetLanguage")) == -1) {
    twpConfig.set("targetLanguage", targetLanguages[0]);
  }
  if (targetLanguages.indexOf(twpConfig.get("targetLanguageTextTranslation")) == -1) {
    twpConfig.set("targetLanguageTextTranslation", targetLanguages[0]);
  }
  location.reload();
};

// Never translate these languages
function createNodeToNeverTranslateLangsList(langCode, langName) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = langCode;
  li.textContent = langName;
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeLangFromNeverTranslate(langCode);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

const neverTranslateLangs = twpConfig.get("neverTranslateLangs");
neverTranslateLangs.sort((a, b) => a.localeCompare(b));
neverTranslateLangs.forEach(langCode => {
  const langName = twpLang.codeToLanguage(langCode);
  const li = createNodeToNeverTranslateLangsList(langCode, langName);
  $("#neverTranslateLangs").appendChild(li);
});

$("#addToNeverTranslateLangs").onchange = e => {
  const langCode = e.target.value;
  const langName = twpLang.codeToLanguage(langCode);
  const li = createNodeToNeverTranslateLangsList(langCode, langName);
  $("#neverTranslateLangs").appendChild(li);
  twpConfig.addLangToNeverTranslate(langCode);
};

// Always translate these languages
function createNodeToAlwaysTranslateLangsList(langCode, langName) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = langCode;
  li.textContent = langName;
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeLangFromAlwaysTranslate(langCode);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

const alwaysTranslateLangs = twpConfig.get("alwaysTranslateLangs");
alwaysTranslateLangs.sort((a, b) => a.localeCompare(b));
alwaysTranslateLangs.forEach(langCode => {
  const langName = twpLang.codeToLanguage(langCode);
  const li = createNodeToAlwaysTranslateLangsList(langCode, langName);
  $("#alwaysTranslateLangs").appendChild(li);
});

$("#addToAlwaysTranslateLangs").onchange = e => {
  const langCode = e.target.value;
  const langName = twpLang.codeToLanguage(langCode);
  const li = createNodeToAlwaysTranslateLangsList(langCode, langName);
  $("#alwaysTranslateLangs").appendChild(li);
  twpConfig.addLangToAlwaysTranslate(langCode);
};

// langsToTranslateWhenHovering
function createNodeToLangsToTranslateWhenHoveringList(langCode, langName) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = langCode;
  li.textContent = langName;
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeLangFromTranslateWhenHovering(langCode);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

const langsToTranslateWhenHovering = twpConfig.get("langsToTranslateWhenHovering");
langsToTranslateWhenHovering.sort((a, b) => a.localeCompare(b));
langsToTranslateWhenHovering.forEach(langCode => {
  const langName = twpLang.codeToLanguage(langCode);
  const li = createNodeToLangsToTranslateWhenHoveringList(langCode, langName);
  $("#langsToTranslateWhenHovering").appendChild(li);
});

$("#addLangToTranslateWhenHovering").onchange = e => {
  const langCode = e.target.value;
  const langName = twpLang.codeToLanguage(langCode);
  const li = createNodeToLangsToTranslateWhenHoveringList(langCode, langName);
  $("#langsToTranslateWhenHovering").appendChild(li);
  twpConfig.addLangToTranslateWhenHovering(langCode);
};

// Always translate these Sites
function createNodeToAlwaysTranslateSitesList(hostname) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = hostname;
  li.textContent = hostname;
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeSiteFromAlwaysTranslate(hostname);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

const alwaysTranslateSites = twpConfig.get("alwaysTranslateSites");
alwaysTranslateSites.sort((a, b) => a.localeCompare(b));
alwaysTranslateSites.forEach(hostname => {
  const li = createNodeToAlwaysTranslateSitesList(hostname);
  $("#alwaysTranslateSites").appendChild(li);
});

$("#addToAlwaysTranslateSites").onclick = e => {
  const hostname = prompt("Enter the site hostname", "www.site.com");
  if (!hostname) return;
  const li = createNodeToAlwaysTranslateSitesList(hostname);
  $("#alwaysTranslateSites").appendChild(li);
  twpConfig.addSiteToAlwaysTranslate(hostname);
};

// Never translate these Sites
function createNodeToNeverTranslateSitesList(hostname) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = hostname;
  li.textContent = hostname;
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeSiteFromNeverTranslate(hostname);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

const neverTranslateSites = twpConfig.get("neverTranslateSites");
neverTranslateSites.sort((a, b) => a.localeCompare(b));
neverTranslateSites.forEach(hostname => {
  const li = createNodeToNeverTranslateSitesList(hostname);
  $("#neverTranslateSites").appendChild(li);
});

$("#addToNeverTranslateSites").onclick = e => {
  const hostname = prompt("Enter the site hostname", "www.site.com");
  if (!hostname) return;
  const li = createNodeToNeverTranslateSitesList(hostname);
  $("#neverTranslateSites").appendChild(li);
  twpConfig.addSiteToNeverTranslate(hostname);
};

function createcustomDictionary(keyWord, customValue) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = keyWord;
  if (customValue !== "") {
    li.textContent = keyWord + " ------------------- " + customValue;
  } else {
    li.textContent = keyWord;
  }
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeKeyWordFromcustomDictionary(keyWord);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

let customDictionary = twpConfig.get("customDictionary");
customDictionary = new Map([...customDictionary.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
customDictionary.forEach(function (customValue, keyWord) {
  const li = createcustomDictionary(keyWord, customValue);
  $("#customDictionary").appendChild(li);
});

$("#addToCustomDictionary").onclick = e => {
  let keyWord = prompt("Enter the keyWord, Minimum two letters ", "");
  if (!keyWord || keyWord.length < 2) return;
  keyWord = keyWord.trim().toLowerCase();
  let customValue = prompt("(Optional)\nYou can enter a value to replace it , or fill in nothing.", "");
  if (!customValue) customValue = "";
  customValue = customValue.trim();
  const li = createcustomDictionary(keyWord, customValue);
  $("#customDictionary").appendChild(li);
  twpConfig.addKeyWordTocustomDictionary(keyWord, customValue);
};

// sitesToTranslateWhenHovering
function createNodeToSitesToTranslateWhenHoveringList(hostname) {
  const li = document.createElement("li");
  li.setAttribute("class", "w3-display-container");
  li.value = hostname;
  li.textContent = hostname;
  const close = document.createElement("span");
  close.setAttribute("class", "w3-button w3-transparent w3-display-right");
  close.innerHTML = "&times;";
  close.onclick = e => {
    e.preventDefault();
    twpConfig.removeSiteFromTranslateWhenHovering(hostname);
    li.remove();
  };
  li.appendChild(close);
  return li;
}

const sitesToTranslateWhenHovering = twpConfig.get("sitesToTranslateWhenHovering");
sitesToTranslateWhenHovering.sort((a, b) => a.localeCompare(b));
sitesToTranslateWhenHovering.forEach(hostname => {
  const li = createNodeToSitesToTranslateWhenHoveringList(hostname);
  $("#sitesToTranslateWhenHovering").appendChild(li);
});

$("#addSiteToTranslateWhenHovering").onclick = e => {
  const hostname = prompt("Enter the site hostname", "www.site.com");
  if (!hostname) return;
  const li = createNodeToSitesToTranslateWhenHoveringList(hostname);
  $("#sitesToTranslateWhenHovering").appendChild(li);
  twpConfig.addSiteToTranslateWhenHovering(hostname);
};

// translations options
$("#pageTranslatorService").onchange = e => {
  twpConfig.set("pageTranslatorService", e.target.value);
};
$("#pageTranslatorService").value = twpConfig.get("pageTranslatorService");

$("#textTranslatorService").onchange = e => {
  twpConfig.set("textTranslatorService", e.target.value);
};
$("#textTranslatorService").value = twpConfig.get("textTranslatorService");

$("#showOriginalTextWhenHovering").onchange = e => {
  twpConfig.set("showOriginalTextWhenHovering", e.target.value);
};
$("#showOriginalTextWhenHovering").value = twpConfig.get("showOriginalTextWhenHovering");

$("#translateTag_pre").onchange = e => {
  twpConfig.set("translateTag_pre", e.target.value);
};
$("#translateTag_pre").value = twpConfig.get("translateTag_pre");

$("#enableIframePageTranslation").onchange = e => {
  twpConfig.set("enableIframePageTranslation", e.target.value);
};
$("#enableIframePageTranslation").value = twpConfig.get("enableIframePageTranslation");

$("#dontSortResults").onchange = e => {
  twpConfig.set("dontSortResults", e.target.value);
};
$("#dontSortResults").value = twpConfig.get("dontSortResults");

$("#translateDynamicallyCreatedContent").onchange = e => {
  twpConfig.set("translateDynamicallyCreatedContent", e.target.value);
};
$("#translateDynamicallyCreatedContent").value = twpConfig.get("translateDynamicallyCreatedContent");

$("#autoTranslateWhenClickingALink").onchange = e => {
  if (e.target.value == "yes") {
    chrome.permissions.request({
      permissions: ["webNavigation"]
    }, granted => {
      if (granted) {
        twpConfig.set("autoTranslateWhenClickingALink", "yes");
      } else {
        twpConfig.set("autoTranslateWhenClickingALink", "no");
        e.target.value = "no";
      }
    });
  } else {
    twpConfig.set("autoTranslateWhenClickingALink", "no");
    chrome.permissions.remove({
      permissions: ["webNavigation"]
    });
  }
};
$("#autoTranslateWhenClickingALink").value = twpConfig.get("autoTranslateWhenClickingALink");

function enableOrDisableTranslateSelectedAdvancedOptions(value) {
  if (value === "no") {
    document.querySelectorAll("#translateSelectedAdvancedOptions input").forEach(input => {
      input.setAttribute("disabled", "");
    });
  } else {
    document.querySelectorAll("#translateSelectedAdvancedOptions input").forEach(input => {
      input.removeAttribute("disabled");
    });
  }
}

$("#showTranslateSelectedButton").onchange = e => {
  twpConfig.set("showTranslateSelectedButton", e.target.value);
  enableOrDisableTranslateSelectedAdvancedOptions(e.target.value);
};
$("#showTranslateSelectedButton").value = twpConfig.get("showTranslateSelectedButton");
enableOrDisableTranslateSelectedAdvancedOptions(twpConfig.get("showTranslateSelectedButton"));

$("#dontShowIfIsNotValidText").onchange = e => {
  twpConfig.set("dontShowIfIsNotValidText", e.target.checked ? "yes" : "no");
};
$("#dontShowIfIsNotValidText").checked = twpConfig.get("dontShowIfIsNotValidText") === "yes" ? true : false;

$("#dontShowIfPageLangIsTargetLang").onchange = e => {
  twpConfig.set("dontShowIfPageLangIsTargetLang", e.target.checked ? "yes" : "no");
};
$("#dontShowIfPageLangIsTargetLang").checked = twpConfig.get("dontShowIfPageLangIsTargetLang") === "yes" ? true : false;

$("#dontShowIfPageLangIsUnknown").onchange = e => {
  twpConfig.set("dontShowIfPageLangIsUnknown", e.target.checked ? "yes" : "no");
};
$("#dontShowIfPageLangIsUnknown").checked = twpConfig.get("dontShowIfPageLangIsUnknown") === "yes" ? true : false;

$("#dontShowIfSelectedTextIsTargetLang").onchange = e => {
  twpConfig.set("dontShowIfSelectedTextIsTargetLang", e.target.checked ? "yes" : "no");
};
$("#dontShowIfSelectedTextIsTargetLang").checked = twpConfig.get("dontShowIfSelectedTextIsTargetLang") === "yes" ? true : false;

$("#dontShowIfSelectedTextIsUnknown").onchange = e => {
  twpConfig.set("dontShowIfSelectedTextIsUnknown", e.target.checked ? "yes" : "no");
};
$("#dontShowIfSelectedTextIsUnknown").checked = twpConfig.get("dontShowIfSelectedTextIsUnknown") === "yes" ? true : false;

// style options
$("#useOldPopup").onchange = e => {
  twpConfig.set("useOldPopup", e.target.value);
  try { updateDarkMode(); } catch(e) { console.error(e); }
};
$("#useOldPopup").value = twpConfig.get("useOldPopup");

$("#darkMode").onchange = e => {
  twpConfig.set("darkMode", e.target.value);
  try { updateDarkMode(); } catch(e) { console.error(e); }
};
$("#darkMode").value = twpConfig.get("darkMode");

$("#popupBlueWhenSiteIsTranslated").onchange = e => {
  twpConfig.set("popupBlueWhenSiteIsTranslated", e.target.value);
};
$("#popupBlueWhenSiteIsTranslated").value = twpConfig.get("popupBlueWhenSiteIsTranslated");

window.scrollTo({
  top: 0
}); 