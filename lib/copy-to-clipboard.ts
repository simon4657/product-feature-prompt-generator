"use client";

function copyWithSelection(text: string) {
  const textarea = document.createElement("textarea");
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const savedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  textarea.style.opacity = "0";
  textarea.style.fontSize = "16px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  textarea.remove();

  if (savedRange && selection) {
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }
  activeElement?.focus();

  if (!copied) throw new Error("瀏覽器拒絕複製內容。");
}

function copyWithEditableElement(text: string) {
  const element = document.createElement("div");
  const selection = document.getSelection();
  const range = document.createRange();

  element.textContent = text;
  element.contentEditable = "true";
  element.style.position = "fixed";
  element.style.inset = "0 auto auto -9999px";
  element.style.whiteSpace = "pre-wrap";
  document.body.appendChild(element);

  range.selectNodeContents(element);
  selection?.removeAllRanges();
  selection?.addRange(range);
  const copied = document.execCommand("copy");
  selection?.removeAllRanges();
  element.remove();

  if (!copied) throw new Error("瀏覽器拒絕複製內容。");
}

export async function copyToClipboard(text: string) {
  if (!text) throw new Error("沒有可複製的內容。");

  try {
    // Run synchronously while the browser still recognizes the button click.
    copyWithSelection(text);
    return;
  } catch {
    // Some modern browsers disable execCommand but allow the Clipboard API.
  }

  try {
    copyWithEditableElement(text);
    return;
  } catch {
    // iOS and embedded browsers differ in which selectable element they accept.
  }

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  throw new Error("此瀏覽器不支援自動複製。");
}
