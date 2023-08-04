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
        this.show();
    }

    get length() {
        return this.arr.length;
    }
    
    createRows() {
        const rows = this.table.getElementsByTagName('tr');
        for (let i = rows.length - 1; i > 0; i--) {
            this.table.deleteRow(i);
        }

        this.trIndices = document.createElement("tr");
        this.trIndices.classList.add("indices");
        this.table.append(this.trIndices);
        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {
            var td = document.createElement("td");
            td.innerHTML = i;
            td.style.fontSize = '75%';
            this.trIndices.appendChild(td);
        }
        
        this.trValues = document.createElement("tr");
        this.trValues.classList.add("values");
        this.table.append(this.trValues);
        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {
            td = document.createElement("td");
            if (0 <= i && i < this.arr.length) {
                td.innerHTML = this.arr[i];
                td.style.border = '1px solid black';
            }
            this.trValues.appendChild(td);
        }

        this.trPointers = document.createElement("tr");
        this.trPointers.classList.add("pointers");
        this.table.append(this.trPointers);
        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {
            td = document.createElement("td");
            this.trPointers.appendChild(td);
        }
    }

    hideIndices() {
        this.trIndices.style.display = "none";
    }

    showIndices() {
        this.trIndices.style.display = "table-row";
    }

    addInfoRow() {
        this.trInfo = document.createElement("tr");
        this.trInfo.classList.add("info");
        this.table.insertBefore(this.trInfo, this.trValues);
        for (let i = Math.min(0, this.indices[0]); i < Math.max(this.arr.length, this.indices[1]+1); i++) {
            const td = document.createElement("td");
            if (0 <= i && i < this.arr.length) {
                td.innerHTML = "";
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
        for (let i = 0; i < this.arr.length; i++) {
            const cell = this.valueCell(i);
            cell.innerHTML = this.arr[i];
            if (this.painter)
                cell.style.backgroundColor = this.painter(this.arr, i);
        }

        for (let i = 0; i < this.indices[1] - this.indices[0] + 1; i++)
            this.pointerCell(i).innerHTML = "";

        for (const [variable, value] of Object.entries(this.pointers)) {
            const cell = this.pointerCell(value);
            if (cell)
                cell.innerHTML += variable;
        }
    }

    valueCell(i) {
        return this.trValues.getElementsByTagName("td")[i - this.indices[0]];
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

    push(v) {
        let td;
        td = document.createElement("td");
        td.style.border = '1px solid black';
        td.innerHTML = v;
        this.arr.push(v);
        this.trValues.append(td);
        td = document.createElement("td");
        this.trIndices.append(td);
        td = document.createElement("td");
        this.trPointers.append(td);
        if (this.trInfo) {
            td = document.createElement("td");
            this.trPointers.append(td);
        }
    }

    pop() {
        if (this.length == 0)
            return false;
        const v = this.arr.pop();
        const rows = this.table.getElementsByTagName('tr');
        for (let i = 0; i < rows.length; i++) {
            const lastCellIndex = rows[i].cells.length - 1;
            rows[i].deleteCell(lastCellIndex);
        }
        return v;
    }

    pointerCell(i) {
        return this.trPointers.getElementsByTagName("td")[i];
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
        return this.trInfo.getElementsByTagName("td")[i - this.indices[0]];
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

export class CommandArrayPop {
    constructor(arrayDisplay) {
        this.arrayDisplay = arrayDisplay;
    }

    doCommand() {
        this.poppedValue = this.arrayDisplay.pop();
    }

    undoCommand() {
        if (this.poppedValue !== false)
            this.arrayDisplay.push(this.poppedValue);
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
