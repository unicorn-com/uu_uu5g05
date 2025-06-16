const EMPTY_RECT = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

function getMetrics(dialogElement) {
  let dialogRect = dialogElement.getBoundingClientRect();
  let dialogParentRect = dialogElement.parentNode.getBoundingClientRect();
  let headerEl = dialogElement.querySelector("[data-uu5-modal-header]");
  let collapseButtonEl = dialogElement.querySelector("[data-uu5-modal-header-cb]");
  let headerRect = EMPTY_RECT;
  let headerPaddingTop = 0;
  let headerCollapsedWidth = 0;
  let actionGroupMarginRightCollapseStart = 0;
  let anchorGroupMarginRightCollapseEnd = 0;
  let actionGroupRemovableMarginLeft = 0;
  let collapseButtonRect = EMPTY_RECT;
  let collapseButtonOffsetRight = 0;
  let actionGroupWidth = 0;
  let actionGroupInitialMarginLeft = 0;
  if (headerEl) {
    headerRect = headerEl.getBoundingClientRect();
    let headerCS = getComputedStyle(headerEl);
    headerPaddingTop = parseFloat(headerCS.paddingTop) || 0;
    let actionGroupEl;
    let actionGroupRect = EMPTY_RECT;
    if (collapseButtonEl) {
      collapseButtonRect = collapseButtonEl.getBoundingClientRect();
      collapseButtonOffsetRight =
        headerRect.right -
        (parseFloat(headerCS.paddingRight) || 0) -
        (parseFloat(headerCS.borderRightWidth) || 0) -
        collapseButtonRect.right;
      actionGroupEl = collapseButtonEl.parentNode.parentNode; // :-/
      actionGroupRect = actionGroupEl.getBoundingClientRect();
    }
    headerCollapsedWidth = headerRect.width - actionGroupRect.width + collapseButtonRect.width;

    let actionGroupFirstChildRect = actionGroupEl?.firstChild.getBoundingClientRect() || EMPTY_RECT;
    anchorGroupMarginRightCollapseEnd = collapseButtonEl ? collapseButtonRect.right - actionGroupRect.right : 0;
    actionGroupMarginRightCollapseStart = anchorGroupMarginRightCollapseEnd + collapseButtonOffsetRight;
    actionGroupRemovableMarginLeft = collapseButtonEl ? collapseButtonRect.left - actionGroupFirstChildRect.left : 0;
    actionGroupWidth = actionGroupRect.width;
    actionGroupInitialMarginLeft = actionGroupEl ? parseFloat(getComputedStyle(actionGroupEl).marginLeft) : 0;
  }
  return {
    dialogRect,
    headerRect,
    headerPaddingTop,
    headerCollapsedWidth,
    dialogParentRect,
    actionGroupMarginRightCollapseStart,
    anchorGroupMarginRightCollapseEnd,
    actionGroupRemovableMarginLeft,
    collapseButtonOffsetRight,
    actionGroupWidth,
    actionGroupInitialMarginLeft,
  };
}

export { getMetrics };
