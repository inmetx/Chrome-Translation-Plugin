"use strict";

/**
 * 检查Chrome运行时错误并处理它们
 * 增强版本处理常见错误场景并提供更好的调试信息
 * 
 * @param {boolean} silent 是否静默处理错误（默认为true，不输出到控制台）
 * @returns {boolean} 是否存在错误
 */
function checkedLastError(silent = true) {
  try {
    // 检查chrome API是否可用
    if (typeof chrome === 'undefined' || !chrome || !chrome.runtime) {
      return false;
    }
    
    // 检查并处理错误
    if (chrome.runtime.lastError) {
      const errorMsg = chrome.runtime.lastError.message || "未知错误";
      
      // 忽略特定的非关键错误
      if (errorMsg.includes("context invalidated") ||
          errorMsg.includes("The message port closed") || 
          errorMsg.includes("Receiving end does not exist")) {
        // 这些错误通常发生在页面重新加载或扩展上下文改变时
        if (!silent) {
          console.debug("[非关键] 运行时错误:", errorMsg);
        }
      } else {
        // 记录其他错误供调试
        if (!silent) {
          console.warn("运行时错误:", errorMsg);
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    // 处理检查错误时可能的异常
    if (!silent) {
      console.debug("checkedLastError内部错误:", e);
    }
    return false;
  }
}
//# sourceMappingURL=../maps/10.1.5.0/checkedLastError.js.map
