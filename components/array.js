import {  render } from './util.js';

function swap(a, i, j) {
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
}

export class ArrayDisplay {
    constructor(arr, table, indices) {
        this.arr = [...arr];
        this.table = table;
        if (indices == undefined)
            this.indices = [0, this.arr.length-1];
        else
            this.indices = indices;
        this.createRows();
        this.pointers = {};
        this.show();
    }

    setArray(arr) {
        this.arr = [...arr];
        this.indices = [0, this.arr.length - 1];
        this.createRows();
        this.show();
    }

    get length() {
        return this.arr.length;
    }
    
    createRows() {
        // delete all table rows
        const rows = this.table.getElementsByTagName('tr');
        const numRows = rows.length;
        for (let i = 0; i < numRows; i++)
            this.table.deleteRow(-1);

        // min and max index
        const [min, max] = this.indices;

        // create indices row
        this.trIndices = document.createElement("tr");
        this.trIndices.classList.add("indices");
        this.table.append(this.trIndices);
        for (let i = min; i <= max; i++) {
            var td = document.createElement("td");
            td.innerHTML = i;
            td.classList.add("index");
            this.trIndices.appendChild(td);
        }

        // crate values row
        this.trValues = document.createElement("tr");
        this.trValues.classList.add("values");
        this.table.append(this.trValues);
        for (let i = min; i <= max; i++) {
            td = document.createElement("td");
            if (0 <= i && i < this.arr.length) {
                td.innerHTML = this.arr[i];
                td.style.border = '1px solid black';
                td.classList.add("value");
            }
            this.trValues.appendChild(td);
        }

        // create pointers row
        this.trPointers = document.createElement("tr");
        this.trPointers.classList.add("pointers");
        this.table.append(this.trPointers);
        for (let i = min; i <= max; i++) {
            td = document.createElement("td");
            this.trPointers.appendChild(td);
        }
    }

    hideIndices() {
        this._hideIndices = true;
        this.show();
    }

    showIndices() {
        this._hideIndices = false;
        this.show();
    }

    addInfoRow() {
        // min and max index
        const [min, max] = this.indices;
        
        this.trInfo = document.createElement("tr");
        this.trInfo.classList.add("info");
        this.table.insertBefore(this.trInfo, this.trValues);
        for (let i = min; i <= max; i++) {
            const td = document.createElement("td");
            if (0 <= i && i < this.arr.length) {
                td.innerHTML = "";
                td.classList.add("info");
            }
            this.trInfo.appendChild(td);
        }
    }

    hideInfoRow() {
        if (this.trInfo)
            this.trInfo.style.display = "none";
    }

    showInfoRow() {
        if (this.trInfo)
            this.trInfo.style.display = "table-row";
    }

    setPainter(painter) {
        this.painter = painter;
        this.show();
    }

    show() {
        // show or hide indices
        this.trIndices.style.display = this._hideIndices ? "none" : "table-row";
        
        // fill value cells
        for (let i = 0; i < this.arr.length; i++) {
            const cell = this.valueCell(i);
            if (cell == undefined)
                continue;
            cell.innerHTML = render(this.arr[i]);
            
            if (this.painter)
                cell.style.backgroundColor = this.painter(this.arr, i);
        }

        // min and max index
        const [min, max] = this.indices;

        // reset all pointer cells
        for (let i = min; i <= max; i++)
            this.pointerCell(i).innerHTML = "";

        // set pointers
        for (const [variable, value] of Object.entries(this.pointers)) {
            const cell = this.pointerCell(value);
            if (cell == undefined)
                continue;
            cell.innerHTML += variable;
        }
    }

    valueCell(i) {
        // min and max index
        const [min, max] = this.indices;
        return this.trValues.getElementsByTagName("td")[i - min];
    }

    getValue(i) {
        const str = this.valueCell(i).innerHTML;
        if (/^-?\d+$/.test(str))
            return parseInt(str);
        return str;
    }

    setValue(i, v) {
        this.arr[i] = v;
        this.show();
    }

    incrementValue(i, v) {
        this.setValue(i, this.getValue(i) + v);
    }

    getValues() {
        const values = [];
        for (let i = 0; i < this.length; i++)
            values.push(this.getValue(i));
        return values;
    }
    
    swap(i, j) {
        swap(this.arr, i, j);
        this.show();
    }

    reverse() {
        this.arr.reverse();
        this.show();
    }

    addColumn(v, where) {
        const [min, max] = this.indices;
        let td;
        // add value cell
        td = document.createElement("td");
        td.style.border = '1px solid black';
        td.classList.add("value");
        this.trValues[where](td);
        // add index cell
        td = document.createElement("td");
        td.innerHTML = max;
        td.classList.add("index");
        this.trIndices[where](td);
        // add pointer cell
        td = document.createElement("td");
        this.trPointers[where](td);
        // add info cell
        if (this.trInfo) {
            td = document.createElement("td");
            td.classList.add("info");
            this.trPointers[where](td);
        }
    }

    // TODO: push, pop, shift, and unshift might not work propeperly if indices are not [0, arr.length - 1]
    push(v) {
        this.arr.push(v);
        // min and max index
        const [min, max] = this.indices;
        if (this.arr.length - 1 > max) {
            this.indices = [min, this.arr.length - 1];
            this.addColumn(v, "append");
        }
        this.show();
    }

    removeColumn(index) {
        const rows = this.table.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++)
            rows[i].deleteCell(index);
    }

    pop() {
        if (this.length == 0)
            return false;
        const v = this.arr.pop();
        // min and max index
        const [min, max] = this.indices;
        if (this.arr.length - 1 < max) {
            this.indices = [min, this.arr.length - 1];
            this.removeColumn(-1);
        }
        this.show();
        return v;
    }

    shift() {
        if (this.length == 0)
            return false;
        const v = this.arr.shift();
        this.removeColumn(0);
        // min and max index
        const [min, max] = this.indices;
        if (this.arr.length - 1 < max) {
            this.indices = [min, this.arr.length - 1];
        }
        this.show();
        return v;
    }

    unshift(v) {
        this.arr.unshift(v);
        this.addColumn(v, "prepend");
        // min and max index
        const [min, max] = this.indices;
        if (this.arr.length - 1 < max) {
            this.indices = [min, this.arr.length - 1];
        }
        this.show();
    }

    pointerCell(i) {
        // min and max index
        const [min, max] = this.indices;
        return this.trPointers.getElementsByTagName("td")[i - min];
    }

    getPointer(pointer) {
        return this.pointers[pointer];
    }

    getPointers() {
        return this.pointers;
    }

    setPointer(pointer, idx) {
        this.pointers[pointer] = idx;
        this.show();
    }

    resetAllPointers() {
        this.pointers = {};
        this.show();
    }

    getCSSProperty(i, property, value) {
        return this.valueCell(i).style[property];
    }

    setCSSProperty(i, property, value) {
        this.valueCell(i).style[property] = value;
    }

    containsCSSClass(i, cssClass) {
        return this.valueCell(i).classList.contains(cssClass);
    }

    addCSSClass(i, cssClass) {
        this.valueCell(i).classList.add(cssClass);
    }

    removeCSSClass(i, cssClass) {
        this.valueCell(i).classList.remove(cssClass);
    }

    toggleCSSClass(i, cssClass) {
        if (this.containsCSSClass(i, cssClass))
            this.removeCSSClass(i, cssClass);
        else
            this.addCSSClass(i, cssClass);
    }

    removeAllCSSClasses(cssClass=undefined) {
        for (let i = 0; i < this.length; i++)
            if (cssClass != undefined)
                this.removeCSSClass(i, cssClass);
        else
            this.valueCell(i).className = ""
    }

    getInfoCell(i) {
        const [min, max] = this.indices;
        return this.trInfo.getElementsByTagName("td")[i - min];
    }
    
    setInfo(i, info) {
        if (!this.trInfo)
            this.addInfoRow();
        this.getInfoCell(i).innerHTML = info;
    }

    onValueEvent(event, handler) {
        const row = this.trValues.cells;
        for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            cell.addEventListener(event, function(e) {
                handler(cell.innerHTML, i);
            });
        }
    }

    removeValueListeners(event) {
        const row = this.trValues.cells;
        for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            const new_cell = cell.cloneNode(true);
            cell.parentNode.replaceChild(new_cell, cell);
        }
    }
    
    onValueEnter(handler) {
        this.onValueEvent("mouseenter", handler);
    }

    onValueLeave(handler) {
        this.onValueEvent("mouseleave", handler);
    }

    onValueClick(handler) {
        this.onValueEvent("click", handler);
    }

    editValueOnClick() {
        const self = this;
        this.onValueClick(function(value, index) {
            const cell = self.valueCell(index);
            const input = document.createElement("input");
            if (!value.startsWith("<input"))
                input.value = value;
            input.style.boxSizing = "border-box";
            input.style.width = window.getComputedStyle(cell).width;
            document.type = "text";
            cell.innerHTML = "";
            cell.append(input);
            input.focus();
            input.onblur = function() {
                self.setValue(index, input.value);
            }
        })
    }
}

export class CommandArraySetValue {
    constructor(arrayDisplay, i, v) {
        this.arrayDisplay = arrayDisplay;
        this.i = i;
        this.v = v;
    }

    doCommand() {
        this.oldV = this.arrayDisplay.getValue(this.i);
        this.arrayDisplay.setValue(this.i, this.v);
    }

    undoCommand() {
        this.arrayDisplay.setValue(this.i, this.oldV);
    }
}

export class CommandArraySet {
    constructor(arrayDisplay, arr) {
        this.arrayDisplay = arrayDisplay;
        this.arr = arr;
    }

    doCommand() {
        this.oldArr = this.arrayDisplay.arr;
        this.arrayDisplay.setArray(this.arr);
    }

    undoCommand() {
        this.arrayDisplay.setArray(this.oldArr);
    }
}

export class CommandArrayIncrementValue {
    constructor(arrayDisplay, i, v) {
        this.arrayDisplay = arrayDisplay;
        this.i = i;
        this.v = v;
    }

    doCommand() {
        this.arrayDisplay.incrementValue(this.i, this.v);
    }

    undoCommand() {
        this.arrayDisplay.incrementValue(this.i, -this.v);
    }
}

export class CommandArraySwap {
    constructor(arrayDisplay, i, j) {
        this.arrayDisplay = arrayDisplay;
        this.i = i;
        this.j = j;
    }

    doCommand() {
        this.arrayDisplay.doSwap(i, j);
    }
    
    undoCommand() {
        this.arrayDisplay.doSwap(i, j);
    }
}

export class CommandArrayReverse {
    constructor(arrayDisplay) {
        this.arrayDisplay = arrayDisplay;
    }

    doCommand() {
        this.arrayDisplay.reverse();
    }
    
    undoCommand() {
        this.arrayDisplay.reverse();
    }
}

export class CommandArrayPop {
    constructor(arrayDisplay) {
        this.arrayDisplay = arrayDisplay;
    }

    doCommand() {
        this.poppedStyle = this.arrayDisplay.valueCell(this.arrayDisplay.length - 1).style;
        this.poppedValue = this.arrayDisplay.pop();
    }

    undoCommand() {
        if (this.poppedValue !== false) {
            this.arrayDisplay.push(this.poppedValue);
            for (const property in this.poppedStyle) {
                try {
                    this.arrayDisplay.valueCell(this.arrayDisplay.length - 1).style[property] = this.poppedStyle[property];
                } catch(e) {
                }
            }
        }
    }
}

export class CommandArrayShift {
    constructor(arrayDisplay) {
        this.arrayDisplay = arrayDisplay;
    }

    doCommand() {
        this.poppedStyle = this.arrayDisplay.valueCell(0).style;
        this.poppedValue = this.arrayDisplay.shift();
    }

    undoCommand() {
        if (this.poppedValue !== false) {
            this.arrayDisplay.unshift(this.poppedValue);
            for (const property in this.poppedStyle) {
                try {
                    this.arrayDisplay.valueCell(0).style[property] = this.poppedStyle[property];
                } catch(e) {
                }
            }
        }
    }
}

export class CommandArrayPush {
    constructor(arrayDisplay, v) {
        this.arrayDisplay = arrayDisplay;
        this.value = v;
    }

    doCommand() {
        this.arrayDisplay.push(this.value);
    }

    undoCommand() {
        this.arrayDisplay.pop();
    }
}

export class CommandArrayUnshift {
    constructor(arrayDisplay, v) {
        this.arrayDisplay = arrayDisplay;
        this.value = v;
    }

    doCommand() {
        this.arrayDisplay.unshift(this.value);
    }

    undoCommand() {
        this.arrayDisplay.shift();
    }
}

export class CommandArrayAddCSSClass {
    constructor(arrayDisplay, i, cssClass) {
        this.arrayDisplay = arrayDisplay;
        this.i = i;
        this.cssClass = cssClass;
    }

    doCommand() {
        this.didContain = this.arrayDisplay.containsCSSClass(this.i, this.cssClass);
        this.arrayDisplay.addCSSClass(this.i, this.cssClass);
    }

    undoCommand() {
        if (!this.didContain)
            this.arrayDisplay.removeCSSClass(this.i, this.cssClass);
    }
}

export class CommandArrayRemoveCSSClass {
    constructor(arrayDisplay, i, cssClass) {
        this.arrayDisplay = arrayDisplay;
        this.i = i;
        this.cssClass = cssClass;
    }

    doCommand() {
        this.didContain = this.arrayDisplay.containsCSSClass(this.i, this.cssClass);
        this.arrayDisplay.removeCSSClass(this.i, this.cssClass);
    }

    undoCommand() {
        if (this.didContain)
            this.arrayDisplay.addCSSClass(this.i, this.cssClass);
    }
}

export class CommandArraySetCSSProperty {
    constructor(arrayDisplay, i, property, value) {
        this.arrayDisplay = arrayDisplay;
        this.i = i;
        this.property = property;
        this.value = value;
    }

    doCommand() {
        this.oldValue = this.arrayDisplay.getCSSProperty(this.i, this.property);
        this.arrayDisplay.setCSSProperty(this.i, this.property, this.value);
    }

    undoCommand() {
        this.arrayDisplay.setCSSProperty(this.i, this.property, this.oldValue);
    }
}


export class CommandArraySetActive {
    constructor(arrayDisplay, i) {
        this.commands = [new CommandArrayRemoveAllCSSClasses(arrayDisplay, "active"),
                         new CommandArrayAddCSSClass(arrayDisplay, i, "active")];
    }

    doCommand() {
        this.commands[0].doCommand();
        this.commands[1].doCommand();
    }

    undoCommand() {
        this.commands[1].undoCommand();
        this.commands[0].undoCommand();
    }
}

export class CommandArrayResetActive {
    constructor(arrayDisplay, i) {
        this.command = new CommandArrayRemoveCSSClass(arrayDisplay, i, "active");
    }

    doCommand() {
        this.command.doCommand();
    }

    undoCommand() {
        this.command.undoCommand();
    }
}

export class CommandArrayRemoveAllCSSClasses {
    constructor(arrayDisplay, cssClass) {
        this.arrayDisplay = arrayDisplay;
        this.cssClass = cssClass;
    }

    doCommand() {
        this.didContain = new Array(this.arrayDisplay.length);
        for (let i = 0; i < this.arrayDisplay.length; i++) {
            this.didContain[i] = this.arrayDisplay.containsCSSClass(i, this.cssClass);
            this.arrayDisplay.removeCSSClass(i, this.cssClass);
        }
    }

    undoCommand() {
        for (let i = 0; i < this.arrayDisplay.length; i++) {
            if (this.didContain[i])
                this.arrayDisplay.addCSSClass(i, this.cssClass);
        }
    }
}

export class CommandArraySetPointer {
    constructor(arrayDisplay, pointer, value) {
        this.arrayDisplay = arrayDisplay;
        this.pointer = pointer;
        this.value = value;
    }

    doCommand() {
        this.oldValue = this.arrayDisplay.getPointer(this.pointer);
        this.arrayDisplay.setPointer(this.pointer, this.value);
    }

    undoCommand() {
        this.arrayDisplay.setPointer(this.pointer, this.oldValue);
    }
}

export class CommandArrayResetAllPointers {
    constructor(arrayDisplay) {
        this.arrayDisplay = arrayDisplay;
    }

    doCommand() {
        this.oldPointers = this.arrayDisplay.getPointers();
        this.arrayDisplay.resetAllPointers();
    }

    undoCommand() {
        for (const [variable, value] of Object.entries(this.oldPointers))
            this.arrayDisplay.setPointer(variable, value);
    }
}

import { Commands } from './commands.js';

export class ArrayCommands extends Commands {
    constructor(commands) {
        super(commands);
    }
}
