/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Arrays"] = factory();
	else
		root["Arrays"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./components/array.js":
/*!*****************************!*\
  !*** ./components/array.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ArrayCommands\": () => (/* binding */ ArrayCommands),\n/* harmony export */   \"ArrayDisplay\": () => (/* binding */ ArrayDisplay),\n/* harmony export */   \"CommandArrayAddCSSClass\": () => (/* binding */ CommandArrayAddCSSClass),\n/* harmony export */   \"CommandArrayIncrementValue\": () => (/* binding */ CommandArrayIncrementValue),\n/* harmony export */   \"CommandArrayPop\": () => (/* binding */ CommandArrayPop),\n/* harmony export */   \"CommandArrayPush\": () => (/* binding */ CommandArrayPush),\n/* harmony export */   \"CommandArrayRemoveAllCSSClasses\": () => (/* binding */ CommandArrayRemoveAllCSSClasses),\n/* harmony export */   \"CommandArrayResetAllPointers\": () => (/* binding */ CommandArrayResetAllPointers),\n/* harmony export */   \"CommandArraySetActive\": () => (/* binding */ CommandArraySetActive),\n/* harmony export */   \"CommandArraySetPointer\": () => (/* binding */ CommandArraySetPointer),\n/* harmony export */   \"CommandArraySetValue\": () => (/* binding */ CommandArraySetValue),\n/* harmony export */   \"CommandArraySwap\": () => (/* binding */ CommandArraySwap)\n/* harmony export */ });\n/* harmony import */ var _commands_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./commands.js */ \"./components/commands.js\");\nfunction swap(a, i, j) {\n    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;\n}\n\nclass ArrayDisplay {\n    constructor(arr, table, indices) {\n        this.arr = [...arr];\n        this.table = table;\n        if (indices == undefined)\n            this.indices = [0, this.arr.length-1];\n        else\n            this.indices = indices;\n        this.createRows();\n        this.pointers = {};\n        this.show();\n    }\n\n    setArray(arr) {\n        this.arr = [...arr];\n        this.show();\n    }\n\n    get length() {\n        return this.arr.length;\n    }\n    \n    createRows() {\n        const rows = this.table.getElementsByTagName('tr');\n        for (let i = rows.length - 1; i > 0; i--) {\n            this.table.deleteRow(i);\n        }\n\n        this.trIndices = document.createElement(\"tr\");\n        this.trIndices.classList.add(\"indices\");\n        this.table.append(this.trIndices);\n        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {\n            var td = document.createElement(\"td\");\n            td.innerHTML = i;\n            td.style.fontSize = '75%';\n            this.trIndices.appendChild(td);\n        }\n        \n        this.trValues = document.createElement(\"tr\");\n        this.trValues.classList.add(\"values\");\n        this.table.append(this.trValues);\n        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {\n            td = document.createElement(\"td\");\n            if (0 <= i && i < this.arr.length) {\n                td.innerHTML = this.arr[i];\n                td.style.border = '1px solid black';\n            }\n            this.trValues.appendChild(td);\n        }\n\n        this.trPointers = document.createElement(\"tr\");\n        this.trPointers.classList.add(\"pointers\");\n        this.table.append(this.trPointers);\n        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {\n            td = document.createElement(\"td\");\n            this.trPointers.appendChild(td);\n        }\n    }\n\n    hideIndices() {\n        this.trIndices.style.display = \"none\";\n    }\n\n    showIndices() {\n        this.trIndices.style.display = \"table-row\";\n    }\n\n    addInfoRow() {\n        this.trInfo = document.createElement(\"tr\");\n        this.trInfo.classList.add(\"info\");\n        this.table.insertBefore(this.trInfo, this.trValues);\n        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {\n            const td = document.createElement(\"td\");\n            if (0 <= i && i < this.arr.length) {\n                td.innerHTML = \"\";\n            }\n            this.trInfo.appendChild(td);\n        }\n    }\n\n    hideInfoRow() {\n        if (this.trInfo)\n            this.trInfo.style.display = \"none\";\n    }\n\n    showInfoRow() {\n        if (this.trInfo)\n            this.trInfo.style.display = \"table-row\";\n    }\n\n    setPainter(painter) {\n        this.painter = painter;\n        this.show();\n    }\n\n    show() {\n        for (let i = 0; i < this.arr.length; i++) {\n            const cell = this.valueCell(i);\n            cell.innerHTML = this.arr[i];\n            if (this.painter)\n                cell.style.backgroundColor = this.painter(this.arr, i);\n        }\n\n        for (let i = 0; i < this.indices[1] - this.indices[0] + 1; i++)\n            this.pointerCell(i).innerHTML = \"\";\n\n        for (const [variable, value] of Object.entries(this.pointers)) {\n            const cell = this.pointerCell(value);\n            if (cell)\n                cell.innerHTML += variable;\n        }\n    }\n\n    valueCell(i) {\n        return this.trValues.getElementsByTagName(\"td\")[i - this.indices[0]];\n    }\n\n    getValue(i) {\n        const str = this.valueCell(i).innerHTML;\n        if (/^-?\\d+$/.test(str))\n            return parseInt(str);\n        return str;\n    }\n\n    setValue(i, v) {\n        this.arr[i] = v;\n        this.show();\n    }\n\n    incrementValue(i, v) {\n        this.setValue(i, this.getValue(i) + v);\n    }\n\n    getValues() {\n        const values = [];\n        for (let i = 0; i < this.length; i++)\n            values.push(this.getValue(i));\n        return values;\n    }\n    \n    swap(i, j) {\n        swap(this.arr, i, j);\n        this.show();\n    }\n\n    push(v) {\n        let td;\n        td = document.createElement(\"td\");\n        td.style.border = '1px solid black';\n        td.innerHTML = v;\n        this.arr.push(v);\n        this.trValues.append(td);\n        td = document.createElement(\"td\");\n        this.trIndices.append(td);\n        td = document.createElement(\"td\");\n        this.trPointers.append(td);\n        if (this.trInfo) {\n            td = document.createElement(\"td\");\n            this.trPointers.append(td);\n        }\n    }\n\n    pop() {\n        if (this.length == 0)\n            return false;\n        const v = this.arr.pop();\n        const rows = this.table.getElementsByTagName('tr');\n        for (let i = 0; i < rows.length; i++) {\n            const lastCellIndex = rows[i].cells.length - 1;\n            rows[i].deleteCell(lastCellIndex);\n        }\n        return v;\n    }\n\n    pointerCell(i) {\n        return this.trPointers.getElementsByTagName(\"td\")[i];\n    }\n\n    getPointer(pointer) {\n        return this.pointers[pointer];\n    }\n\n    getPointers() {\n        return this.pointers;\n    }\n\n    setPointer(pointer, idx) {\n        this.pointers[pointer] = idx;\n        this.show();\n    }\n\n    resetAllPointers() {\n        this.pointers = {};\n        this.show();\n    }\n\n    containsCSSClass(i, cssClass) {\n        return this.valueCell(i).classList.contains(cssClass);\n    }\n\n    addCSSClass(i, cssClass) {\n        this.valueCell(i).classList.add(cssClass);\n    }\n\n    removeCSSClass(i, cssClass) {\n        this.valueCell(i).classList.remove(cssClass);\n    }\n\n    toggleCSSClass(i, cssClass) {\n        if (this.containsCSSClass(i, cssClass))\n            this.removeCSSClass(i, cssClass);\n        else\n            this.addCSSClass(i, cssClass);\n    }\n\n    removeAllCSSClasses(cssClass=undefined) {\n        for (let i = 0; i < this.length; i++)\n            if (cssClass != undefined)\n                this.removeCSSClass(i, cssClass);\n            else\n                 this.valueCell(i).className = \"\"\n    }\n\n    getInfoCell(i) {\n        return this.trInfo.getElementsByTagName(\"td\")[i - this.indices[0]];\n    }\n    \n    setInfo(i, info) {\n        if (!this.trInfo)\n            this.addInfoRow();\n        this.getInfoCell(i).innerHTML = info;\n    }\n\n    onValueEvent(event, handler) {\n        const row = this.trValues.cells;\n        for (let i = 0; i < row.length; i++) {\n            const cell = row[i];\n            cell.addEventListener(event, function(e) {\n                handler(cell.innerHTML, i);\n            });\n        }\n    }\n\n    removeValueListeners(event) {\n        const row = this.trValues.cells;\n        for (let i = 0; i < row.length; i++) {\n            const cell = row[i];\n            const new_cell = cell.cloneNode(true);\n            cell.parentNode.replaceChild(new_cell, cell);\n        }\n    }\n    \n    onValueEnter(handler) {\n        this.onValueEvent(\"mouseenter\", handler);\n    }\n\n    onValueLeave(handler) {\n        this.onValueEvent(\"mouseleave\", handler);\n    }\n\n    onValueClick(handler) {\n        this.onValueEvent(\"click\", handler);\n    }\n\n    editValueOnClick() {\n        const self = this;\n        this.onValueClick(function(value, index) {\n            const cell = self.valueCell(index);\n            const input = document.createElement(\"input\");\n            if (!value.startsWith(\"<input\"))\n                input.value = value;\n            input.style.boxSizing = \"border-box\";\n            input.style.width = window.getComputedStyle(cell).width;\n            document.type = \"text\";\n            cell.innerHTML = \"\";\n            cell.append(input);\n            input.focus();\n            input.onblur = function() {\n                self.setValue(index, input.value);\n            }\n        })\n    }\n}\n\nclass CommandArraySetValue {\n    constructor(arrayDisplay, i, v) {\n        this.arrayDisplay = arrayDisplay;\n        this.i = i;\n        this.v = v;\n    }\n\n    doCommand() {\n        this.oldV = this.arrayDisplay.getValue(this.i);\n        this.arrayDisplay.setValue(this.i, this.v);\n    }\n\n    undoCommand() {\n        this.arrayDisplay.setValue(this.i, this.oldV);\n    }\n}\n\nclass CommandArrayIncrementValue {\n    constructor(arrayDisplay, i, v) {\n        this.arrayDisplay = arrayDisplay;\n        this.i = i;\n        this.v = v;\n    }\n\n    doCommand() {\n        this.arrayDisplay.incrementValue(this.i, this.v);\n    }\n\n    undoCommand() {\n        this.arrayDisplay.incrementValue(this.i, -this.v);\n    }\n}\n\nclass CommandArraySwap {\n    constructor(arrayDisplay, i, j) {\n        this.arrayDisplay = arrayDisplay;\n        this.i = i;\n        this.j = j;\n    }\n\n    doCommand() {\n        this.arrayDisplay.doSwap(i, j);\n    }\n    \n    undoCommand() {\n        this.arrayDisplay.doSwap(i, j);\n    }\n}\n\nclass CommandArrayPop {\n    constructor(arrayDisplay) {\n        this.arrayDisplay = arrayDisplay;\n    }\n\n    doCommand() {\n        this.poppedValue = this.arrayDisplay.pop();\n    }\n\n    undoCommand() {\n        if (this.poppedValue !== false)\n            this.arrayDisplay.push(this.poppedValue);\n    }\n}\n\nclass CommandArrayPush {\n    constructor(arrayDisplay, v) {\n        this.arrayDisplay = arrayDisplay;\n        this.value = v;\n    }\n\n    doCommand() {\n        this.arrayDisplay.push(this.value);\n    }\n\n    undoCommand() {\n        this.arrayDisplay.pop();\n    }\n}\n\nclass CommandArrayAddCSSClass {\n    constructor(arrayDisplay, i, cssClass) {\n        this.arrayDisplay = arrayDisplay;\n        this.i = i;\n        this.cssClass = cssClass;\n    }\n\n    doCommand() {\n        this.didContain = this.arrayDisplay.containsCSSClass(this.i, this.cssClass);\n        this.arrayDisplay.addCSSClass(this.i, this.cssClass);\n    }\n\n    undoCommand() {\n        if (!this.didContain)\n            this.arrayDisplay.removeCSSClass(this.i, this.cssClass);\n    }\n}\n\nclass CommandArraySetActive {\n    constructor(arrayDisplay, i) {\n        this.commands = [new CommandArrayRemoveAllCSSClasses(arrayDisplay, \"active\"),\n                         new CommandArrayAddCSSClass(arrayDisplay, i, \"active\")];\n    }\n\n    doCommand() {\n        this.commands[0].doCommand();\n        this.commands[1].doCommand();\n    }\n\n    undoCommand() {\n        this.commands[1].undoCommand();\n        this.commands[0].undoCommand();\n    }\n}\n\n\nclass CommandArrayRemoveAllCSSClasses {\n    constructor(arrayDisplay, cssClass) {\n        this.arrayDisplay = arrayDisplay;\n        this.cssClass = cssClass;\n    }\n\n    doCommand() {\n        this.didContain = new Array(this.arrayDisplay.length);\n        for (let i = 0; i < this.arrayDisplay.length; i++) {\n            this.didContain[i] = this.arrayDisplay.containsCSSClass(i, this.cssClass);\n            this.arrayDisplay.removeCSSClass(i, this.cssClass);\n        }\n    }\n\n    undoCommand() {\n        for (let i = 0; i < this.arrayDisplay.length; i++) {\n            if (this.didContain[i])\n                this.arrayDisplay.addCSSClass(i, this.cssClass);\n        }\n    }\n}\n\nclass CommandArraySetPointer {\n    constructor(arrayDisplay, pointer, value) {\n        this.arrayDisplay = arrayDisplay;\n        this.pointer = pointer;\n        this.value = value;\n    }\n\n    doCommand() {\n        this.oldValue = this.arrayDisplay.getPointer(this.pointer);\n        this.arrayDisplay.setPointer(this.pointer, this.value);\n    }\n\n    undoCommand() {\n        this.arrayDisplay.setPointer(this.pointer, this.oldValue);\n    }\n}\n\nclass CommandArrayResetAllPointers {\n    constructor(arrayDisplay) {\n        this.arrayDisplay = arrayDisplay;\n    }\n\n    doCommand() {\n        this.oldPointers = this.arrayDisplay.getPointers();\n        this.arrayDisplay.resetAllPointers();\n    }\n\n    undoCommand() {\n        for (const [variable, value] of Object.entries(this.oldPointers))\n            this.arrayDisplay.setPointer(variable, value);\n    }\n}\n\n\n\nclass ArrayCommands extends _commands_js__WEBPACK_IMPORTED_MODULE_0__.Commands {\n    constructor(commands) {\n        super(commands);\n    }\n}\n\n\n//# sourceURL=webpack://algoedu.js/./components/array.js?");

/***/ }),

/***/ "./components/commands.js":
/*!********************************!*\
  !*** ./components/commands.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Commands\": () => (/* binding */ Commands)\n/* harmony export */ });\nclass Commands {\n    constructor(commands) {\n        this.commands = commands;\n        this.current = 0;\n    }\n\n    reset() {\n        while (this.inProgress()) {\n            this.current--;\n            this.undoCurrentCommand();\n        }\n    }\n\n    inProgress() {\n        return this.current > 0;\n    }\n\n    done() {\n        return this.current >= this.commands.length;\n    }\n\n    next() {\n        if (this.done())\n            return false;\n        this.doCurrentCommand();\n        this.current++;\n        return true;\n    }\n\n    doCurrentCommand() {\n        if (Array.isArray(this.commands[this.current]))\n            this.commands[this.current].forEach(command => command.doCommand());\n        else\n            this.commands[this.current].doCommand();\n    }\n\n    undoCurrentCommand() {\n        if (Array.isArray(this.commands[this.current]))\n            this.commands[this.current].slice().reverse().forEach(command => command.undoCommand());\n        else\n            this.commands[this.current].undoCommand();\n    }\n\n    previous() {\n        if (this.current == 0)\n            return false;\n        --this.current;\n        this.undoCurrentCommand();\n        return true;\n    }\n\n    run() {\n        while (!this.done()) {\n            this.doCurrentCommand();\n            this.current++;\n        }\n    }\n}\n\n\n//# sourceURL=webpack://algoedu.js/./components/commands.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./components/array.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});