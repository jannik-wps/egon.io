"use strict";

import { assign } from "min-dash";

import { autocomplete, getLabel } from "./dsLabelUtil";

import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import {
  getExternalLabelMid,
  hasExternalLabel,
  isLabel,
  isLabelExternal,
} from "bpmn-js/lib/util/LabelUtil";

import { ElementTypes } from "src/app/domain/entity/common/elementTypes";
import { is } from "../util";

let dictionaryService;

let numberStash = 0;
let stashUse = false;

export function initializeLabelEditingProvider(labelingDictionary) {
  dictionaryService = labelingDictionary;
}

export function getNumberStash() {
  let number = { use: stashUse, number: numberStash };
  stashUse = false;
  return number;
}

export function toggleStashUse(use) {
  stashUse = use;
}

export function focusElement(element) {
  // Opening a Angular Dialog seems to mess with the focus logic somehow.
  // My guess is that is makes the mousedown event passive, which prevents "preventDefault" from intercepting.
  // I am not sure how to fix it, but this seems to be a workaround.
  setTimeout(() => element.focus(), 0);
}

export default function DSLabelEditingProvider(
  eventBus,
  canvas,
  directEditing,
  modeling,
  resizeHandles,
  textRenderer,
  updateLabelHandler,
) {
  this._canvas = canvas;
  this._modeling = modeling;
  this._textRenderer = textRenderer;
  this._updateLabelHandler = updateLabelHandler;

  directEditing.registerProvider(this);

  // listen to dblclick on non-root elements
  eventBus.on("element.dblclick", function (event) {
    activateDirectEdit(event.element, true);
    if (is(event.element, ElementTypes.ACTIVITY)) {
      // if we edit an activity, we do not want the standard editing box
      numberStash = event.element.businessObject.number;
      stashUse = true;
      directEditing.complete();
    }
  });

  // complete on followup canvas operation
  eventBus.on(
    [
      "element.mousedown",
      "drag.init",
      "canvas.viewbox.changing",
      "autoPlace",
      "popupMenu.open",
    ],
    function () {
      if (directEditing.isActive()) {
        directEditing.complete();
      }
    },
  );

  // cancel on command stack changes
  eventBus.on(["commandStack.changed"], function () {
    if (directEditing.isActive()) {
      directEditing.cancel();
    }
  });

  eventBus.on("directEditing.activate", function (event) {
    resizeHandles.removeResizers();
    let element = event.active.element;
    createAutocomplete(element);
  });

  eventBus.on("create.end", 500, function (event) {
    let element = event.shape,
      canExecute = event.context.canExecute,
      isTouch = event.isTouch;

    if (isTouch) {
      return;
    }

    if (!canExecute) {
      return;
    }
    if (!is(element, ElementTypes.ACTIVITY)) {
      activateDirectEdit(element);
    }
    let editingBox = document.getElementsByClassName(
      "djs-direct-editing-content",
    );
    focusElement(editingBox.item(0));
  });

  eventBus.on("autoPlace.end", 500, function (event) {
    activateDirectEdit(event.shape);
  });

  function activateDirectEdit(element, force) {
    if (
      force ||
      isAny(element, [ElementTypes.TEXTANNOTATION]) ||
      element.businessObject.type.includes(ElementTypes.DOMAINSTORY)
    ) {
      directEditing.activate(element);
    }
  }

  function createAutocomplete(element) {
    let editingBox = document.getElementsByClassName(
      "djs-direct-editing-content",
    );
    focusElement(editingBox.item(0));
    autocomplete(
      editingBox[0],
      dictionaryService.getUniqueWorkObjectNames(),
      element,
      eventBus,
    );
  }
}

DSLabelEditingProvider.$inject = [
  "eventBus",
  "canvas",
  "directEditing",
  "modeling",
  "resizeHandles",
  "textRenderer",
  "updateLabelHandler",
];

/**
 * activate direct editing for activities and text annotations.
 *
 * @param  {djs.model.Base} element
 *
 * @return {Object} an object with properties bounds (position and size), text and options
 */
DSLabelEditingProvider.prototype.activate = function (element) {
  // text
  if (element.id === "__implicitrootbase") {
    return;
  }
  let text = getLabel(element);

  if (text === undefined) {
    return;
  }

  let context = {
    text: text,
  };

  // bounds
  let bounds = this.getEditingBBox(element);

  assign(context, bounds);

  let options = {};

  // external labels
  if (isLabelExternal(element)) {
    assign(options, {
      autoResize: true,
    });
  }

  // text annotations
  if (is(element, ElementTypes.TEXTANNOTATION)) {
    assign(options, {
      resizable: true,
      autoResize: true,
    });
  }

  assign(context, {
    options: options,
  });

  return context;
};

/**
 * get the editing bounding box based on the element's size and position
 *
 * @param  {djs.model.Base} element
 *
 * @return {Object} an object containing information about position
 *                  and size (fixed or minimum and/or maximum)
 */
DSLabelEditingProvider.prototype.getEditingBBox = function (element) {
  let canvas = this._canvas;

  let target = element.label || element;

  let bbox = canvas.getAbsoluteBBox(target);

  let mid = {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };

  // default position
  let bounds = { x: bbox.x, y: bbox.y };

  /** The cavnas is an Object from BPMN, the IDE might say, that zoom is deprecated,
   * because it thinks canvas is the standard HTMLElement. -> Needs to stay toom **/
  let zoom = canvas.zoom();
  let defaultStyle = this._textRenderer.getDefaultStyle(),
    externalStyle = this._textRenderer.getExternalStyle();

  // take zoom into account
  let externalFontSize = externalStyle.fontSize * zoom,
    externalLineHeight = externalStyle.lineHeight,
    defaultFontSize = defaultStyle.fontSize * zoom,
    defaultLineHeight = defaultStyle.lineHeight;

  let style = {
    fontFamily: this._textRenderer.getDefaultStyle().fontFamily,
    fontWeight: this._textRenderer.getDefaultStyle().fontWeight,
  };

  // adjust for groups
  if (is(element, ElementTypes.GROUP)) {
    assign(bounds, {
      minWidth: bbox.width / 2.5 > 125 ? bbox.width / 2.5 : 125,
      maxWidth: bbox.width,
      minHeight: 30 * zoom,
      x: bbox.x,
      y: bbox.y,
    });

    assign(style, {
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
      paddingTop: 7 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 5 * zoom + "px",
      paddingRight: 5 * zoom + "px",
      textAlign: "left",
    });
  }

  // internal labels for tasks and collapsed call activities,
  // sub processes and participants
  if (
    /^domainStory:actor\w*/.test(element.type) ||
    /^domainStory:workObject\w*/.test(element.type)
  ) {
    assign(bounds, {
      width: bbox.width,
      minHeight: 30,
      y: bbox.y + bbox.height - 20,
      x: bbox.x,
    });

    assign(style, {
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
      paddingTop: 7 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 5 * zoom + "px",
      paddingRight: 5 * zoom + "px",
    });
  }

  let width = 90 * zoom,
    paddingTop = 7 * zoom,
    paddingBottom = 4 * zoom;

  // external labels for events, data elements, gateways and connections
  if (target.labelTarget) {
    assign(bounds, {
      width: width,
      height: bbox.height + paddingTop + paddingBottom,
      x: mid.x - width / 2,
      y: bbox.y - paddingTop,
    });

    assign(style, {
      fontSize: externalFontSize + "px",
      lineHeight: externalLineHeight,
      paddingTop: paddingTop + "px",
      paddingBottom: paddingBottom + "px",
    });
  }

  // external label not yet created
  if (
    isLabelExternal(target) &&
    !hasExternalLabel(target) &&
    !isLabel(target)
  ) {
    let externalLabelMid = getExternalLabelMid(element);

    let absoluteBBox = canvas.getAbsoluteBBox({
      x: externalLabelMid.x,
      y: externalLabelMid.y,
      width: 0,
      height: 0,
    });

    let height = externalFontSize + paddingTop + paddingBottom;

    assign(bounds, {
      width: width,
      height: height,
      x: absoluteBBox.x - width / 2,
      y: absoluteBBox.y - height / 2,
    });

    assign(style, {
      fontSize: externalFontSize + "px",
      lineHeight: externalLineHeight,
      paddingTop: paddingTop + "px",
      paddingBottom: paddingBottom + "px",
    });
  }

  // text annotations
  if (is(element, ElementTypes.TEXTANNOTATION)) {
    assign(bounds, {
      width: bbox.width,
      height: bbox.height,
      minWidth: 30 * zoom,
      minHeight: 10 * zoom,
    });

    assign(style, {
      textAlign: "left",
      paddingTop: 7 * zoom + "px",
      paddingBottom: 7 * zoom + "px",
      paddingLeft: 5 * zoom + "px",
      paddingRight: 5 * zoom + "px",
      fontSize: defaultFontSize + "px",
      lineHeight: defaultLineHeight,
    });
  }

  return { bounds: bounds, style: style };
};

DSLabelEditingProvider.prototype.update = function (
  element,
  newLabel,
  activeContextText,
  bounds,
) {
  let newBounds, bbox;

  if (is(element, ElementTypes.TEXTANNOTATION)) {
    bbox = this._canvas.getAbsoluteBBox(element);

    newBounds = {
      x: element.x,
      y: element.y,
      width: (element.width / bbox.width) * bounds.width,
      height: (element.height / bbox.height) * bounds.height,
    };
  }

  this._modeling.updateLabel(element, newLabel, newBounds);
};
