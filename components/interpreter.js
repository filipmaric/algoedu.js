import { ArrayDisplay, CommandArraySetPointer, CommandArraySet, CommandArraySetValue, CommandArrayPush, CommandArraySetActive, CommandArrayResetActive } from './array.js';
import { CommandSetElementContent, Commands } from './commands.js';
import { parse } from 'acorn';
import { HighlightJS as hljs } from 'highlight.js/lib/core';
import { default as javascript } from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/github.css';


hljs.registerLanguage('javascript', javascript);

export { Commands };

class CommandHighlight {
    constructor(element, cssClass, fromChar, toChar, status) {
        this.element = element;
        this.cssClass = cssClass;
        this.fromChar = fromChar;
        this.toChar = toChar;
        this.status = status;
    }

    doCommand(quick) {
        this.oldContent = this.element.innerHTML;
        if (quick)
            return;
        let text = this.element.textContent;
        let css = this.cssClass;
        if (this.status != undefined)
            css += " " + this.status;
        text = text.substring(0, this.fromChar) + 
               '\n//mark\n' + 
               text.substring(this.fromChar, this.toChar) + 
               '\n//endmark\n' + 
               text.substring(this.toChar);
        const highlightedText = hljs.highlight(text, {language: 'javascript'}).value
        this.element.innerHTML = highlightedText.replace("\n<span class=\"hljs-comment\">//mark</span>\n", "<span class=\"" + css + "\">").
                                                 replace("\n<span class=\"hljs-comment\">//endmark</span>\n", "</span>");
    }

    undoCommand(quick) {
        this.element.innerHTML = this.oldContent;
    }
}

class CommandNoHighlight {
    constructor(element) {
        this.element = element;
    }

    doCommand() {
        this.oldContent = this.element.innerHTML;
        this.element.innerHTML = hljs.highlight(this.element.textContent, {language: 'javascript'}).value;
    }

    undoCommand() {
        this.element.innerHTML = this.oldContent;
    }
}

function findWatch(watches, variable) {
    for (let i = watches.length - 1; i >= 0; i--)
        if (watches[i].has(variable))
            return watches[i].get(variable);
    return null;
}

class CommandWatchNewArray {
    constructor(watches, container, name, length, hideIndices) {
        this.watches = watches;
        this.container = container;
        this.name = name;
        this.length = length;
        this.hideIndices = hideIndices;
    }

    doCommand() {
        const watches = this.watches[this.watches.length - 1];
        if (watches.has(this.name))
            return;        
        this.watch = document.createElement("div");
        this.container.append(this.watch);
        const variableDisplay = document.createElement("span");
        variableDisplay.innerHTML = this.name + ":";
        this.watch.append(variableDisplay);
        const tbl = document.createElement("table");
        tbl.classList.add("array");
        this.watch.append(tbl);
        const display = new ArrayDisplay(new Array(length), tbl);
        if (this.hideIndices)
            display.hideIndices();
        watches.set(this.name, {watch: this.watch, value: display});
    }

    undoCommand() {
        const watches = this.watches[this.watches.length - 1];
        watches.delete(this.name);
        this.container.removeChild(this.watch);
    }
}

class CommandWatchNewVariable {
    constructor(watches, container, name) {
        this.watches = watches;
        this.container = container;
        this.name = name;
    }

    doCommand() {
        const watches = this.watches[this.watches.length - 1];
        if (watches.has(this.name))
            return;
        this.watch = document.createElement("div");
        this.container.append(this.watch);
        const variableDisplay = document.createElement("span");
        variableDisplay.innerHTML = this.name + ":";
        this.watch.append(variableDisplay);
        const valueDisplay = document.createElement("span");
        valueDisplay.innerHTML = "";
        this.watch.append(valueDisplay);
        watches.set(this.name, {watch: this.watch, value: valueDisplay});
    }

    undoCommand() {
        const watches = this.watches[this.watches.length - 1];
        watches.delete(this.name);
        this.container.removeChild(this.watch);
    }
}

class CommandWatchDelete {
    constructor(watches, variable) {
        this.watches = watches;
        this.variable = variable;
    }

    doCommand() {
        this.watch = this.watches.get(this.variable);
        this.watches.delete(this.variable);
        this.parent = this.watch.watch.parentElement;
        this.parent.removeChild(this.watch.watch);
    }

    undoCommand() {
        this.watches.set(this.variable, this.watch);
        this.parent.append(this.watch.watch);
    }
}

class CommandWatchSetVariableValue {
    constructor(watches, variable, value) {
        this.watches = watches;
        this.variable = variable;
        this.value = value;
    }

    doCommand() {
        const watch = findWatch(this.watches, this.variable);
        this.command = new CommandSetElementContent(watch.value, this.value);
        this.command.doCommand();
    }

    undoCommand() {
        this.command.undoCommand();
    }
}

class CommandWatchSetArrayValue {
    constructor(watches, arr, index, value) {
        this.watches = watches;
        this.arr = arr;
        this.index = index;
        this.value = value; 
    }

    doCommand() {
        const watch = findWatch(this.watches, this.arr).value;
        this.commands = [new CommandArraySetValue(watch, this.index, this.value),
                         new CommandArraySetActive(watch, this.index)];
        this.commands.forEach(command => {
            command.doCommand();
        });
    }

    undoCommand() {
        this.commands.forEach(command => {
            command.undoCommand();
        });
    }
}

class CommandWatchResetArrayValue {
    constructor(watches, arr, index) {
        this.watches = watches;
        this.arr = arr;
        this.index = index;
    }

    doCommand() {
        const watch = findWatch(this.watches, this.arr).value;
        if (watch == null)
            return;
        this.command = new CommandArrayResetActive(watch, this.index);
        this.command.doCommand();
    }

    undoCommand() {
        if (this.command)
            this.command.undoCommand();
    }
}

class CommandWatchSetArray {
    constructor(watches, arr, value) {
        this.watches = watches;
        this.arr = arr;
        this.value = value; 
    }

    doCommand() {
        const watch = findWatch(this.watches, this.arr).value;
        this.command = new CommandArraySet(watch, this.value);
        this.command.doCommand();
    }

    undoCommand() {
        this.command.undoCommand();
    }
}

class CommandWatchArrayPush {
    constructor(watches, arr, value) {
        this.watches = watches;
        this.arr = arr;
        this.value = value;
    }

    doCommand() {
        const watch = findWatch(this.watches, this.arr).value;
        this.command = new CommandArrayPush(watch, this.value);
        this.command.doCommand();
    }

    undoCommand() {
        this.command.undoCommand();
    }
}

class CommandWatchArraySetPointer {
    constructor(watches, arr, variable, value) {
        this.watches = watches;
        this.arr = arr;
        this.variable = variable;
        this.value = value;
    }

    doCommand() {
        const watch = findWatch(this.watches, this.arr).value;
        this.command = new CommandArraySetPointer(watch, this.variable, this.value);
        this.command.doCommand();
    }

    undoCommand() {
        this.command.undoCommand();
    }
}

class CommandWatchNewScope {
    constructor(watches) {
        this.watches = watches;
    }

    doCommand() {
        this.watches.push(new Map());
    }

    undoCommand() {
        this.watches.pop();
    }
}

class CommandWatchDeleteScope {
    constructor(watches) {
        this.watches = watches;
    }

    doCommand() {
        this.watch = this.watches.pop();
        this.commands = [];
        for (const [variable, element] of this.watch) {
            const command = new CommandWatchDelete(this.watch, variable);
            this.commands.push(command);
            command.doCommand();
        }
    }

    undoCommand() {
        this.watches.push(this.watch);
        this.commands.forEach(command => {
            command.undoCommand();
        });
    }
}


export class Debugger {
    constructor(container, code, codeElement) {
        this.watches = [new Map()];
        this.container = container;
        this.codeElement = codeElement;
        this.stepCommands = [];
        this.nextStepCommands = [];
        this.commands = [];
        this.pointers = new Map();
        this.skipVariables = undefined;
        this.breakpointChar = 0;
        this.hideIndicesArrays = new Set();

        const highlightedCode = hljs.highlight(code, { language: 'javascript' }).value;
        this.codeElement.innerHTML = highlightedCode;        
    }

    breakpoint(lineNo) {
        const sum = arr => arr.reduce((total, current) => total + current, 0);
        const code = this.codeElement.textContent;
        const lines = code.split("\n");
        this.breakpointChar = sum(lines.slice(0, lineNo - 1).map(line => line.length));
    }

    newScope() {
        this.stepCommands.push(new CommandWatchNewScope(this.watches));
    }

    deleteScope() {
        this.stepCommands.push(new CommandWatchDeleteScope(this.watches));
    }

    pointer(variable, array) {
        this.pointers.set(variable, array);
    }

    skipVariable(variable) {
        if (this.skipVariables == undefined)
            this.skipVariables = new Set();
        this.skipVariables.add(variable);
    }

    shouldSkip(variable) {
        return this.skipVariables != undefined && this.skipVariables.has(variable);
    }

    hideIndices(arr) {
        this.hideIndicesArrays.add(arr);
    }
    
    newArray(arr, length=0) {
        if (this.shouldSkip(arr))
            return;
        this.stepCommands.push(new CommandWatchNewArray(this.watches, this.container, arr, length, this.hideIndicesArrays.has(arr)));
    }
    
    newVar(variable) {
        if (this.shouldSkip(variable))
            return;

        if (this.pointers.has(variable))
            return;

        this.stepCommands.push(new CommandWatchNewVariable(this.watches, this.container, variable));
    }

    setVarValue(variable, value) {
        if (this.shouldSkip(variable))
            return;
        if (this.pointers.has(variable)) {
            const arr = this.pointers.get(variable);
            this.stepCommands.push(new CommandWatchArraySetPointer(this.watches, arr, variable, value));
        } else {
            this.stepCommands.push(new CommandWatchSetVariableValue(this.watches, variable, value));
        }
    }

    setArray(arr, value) {
        if (this.shouldSkip(arr))
            return;
        this.stepCommands.push(new CommandWatchSetArray(this.watches, arr, value));
    }

    setArrayValue(arr, index, value) {
        if (this.shouldSkip(arr))
            return;
        this.stepCommands.push(new CommandWatchSetArrayValue(this.watches, arr, index, value));
        this.nextStepCommands.push(new CommandWatchResetArrayValue(this.watches, arr, index));
    }

    arrayPush(arr, values) {
        values.forEach(v => {
            this.stepCommands.push(new CommandWatchArrayPush(this.watches, arr, v));
        });
    }

    evalCondition(node, status) {
        this.highlight(node.start, node.end, status);
    }

    startStatement(node) {
        if (node.start >= this.breakpointChar)
            this.shouldBreak = true;
        this.highlight(node.start, node.end);
    }

    endStatement(node) {
        if (this.shouldBreak && this.stepCommands.length > 0) {
            this.commands.push(this.stepCommands);
            this.stepCommands = [];
            if (this.nextStepCommands.length > 0)
                this.stepCommands.push(...this.nextStepCommands);
            this.nextStepCommands = [];
        }
    }

    endProgram() {
        this.noHighlight();
    }
    
    highlight(fromChar, toChar, status) {
        this.stepCommands.push(new CommandHighlight(this.codeElement, "highlighted", fromChar, toChar, status));
    }

    noHighlight() {
        this.commands.push(new CommandNoHighlight(this.codeElement));
    }
}

const ops = {
    ADD: '+',
    SUB: '-',
    MUL: '*',
    DIV: '/',
    ADDEQ: '+=',
    SUBEQ: '-=',
    MULEQ: '*=',
    DIVEQ: '/=',
    ASSIGN: '=',
    MOD: '%',
    EQ: "==",
    LE: "<=",
    LT: "<",
    GE: ">=",
    GT: ">",
    PP: "++",
    MM: "--"
}

export class Interpreter {
    static Parse(program) {
        return parse(program, {ecmaVersion: 2020}).body
    }

    
    constructor() {
        this.scopes = [new Map()];
        this.listeners = [];
    }

    addVar(variable) {
        this.scopes[this.scopes.length - 1].set(variable, undefined);
    }

    getVarScope(variable) {
        for (let i = this.scopes.length - 1; i >= 0; i--)
            if (this.scopes[i].has(variable))
                return this.scopes[i];
        return null;
    }

    getVar(variable) {
        const scope = this.getVarScope(variable);
        return scope != null ? scope.get(variable) : undefined;
    }

    setVar(variable, value) {
        const scope = this.getVarScope(variable);
        if (scope != null)
            scope.set(variable, value);
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    startStatement(node) {
        this.listeners.forEach(listener => {
            listener.startStatement(node)
        });
    }

    endStatement() {
        this.listeners.forEach(listener => {
            listener.endStatement()
        });
    }
    
    visitNodes(nodes) {
        for (const node of nodes)
            this.visitNode(node)
    }

    visitNode(node) {
        switch (node.type) {
            case "Literal":
                return this.visitLiteral(node)
	    case "Identifier":
                return this.visitIdentifier(node)
            case "VariableDeclaration":
                return this.visitVariableDeclaration(node)
            case "VariableDeclarator":
                return this.visitVariableDeclarator(node)
            case 'AssignmentExpression':
                return this.visitAssignmentExpression(node)
            case 'UpdateExpression':
                return this.visitUpdateExpression(node)
            case 'BinaryExpression':
                return this.visitBinaryExpression(node)                
            case "ExpressionStatement":
                return this.visitNode(node.expression)
            case "ArrayExpression":
                return this.visitArrayExpression(node)
            case "MemberExpression":
                return this.visitMemberExpression(node)
            case "CallExpression":
                return this.visitCallExpression(node)
            case "WhileStatement":
                this.visitWhile(node);
                break;
            case "ForStatement":
                this.visitFor(node);
                break;
            case "IfStatement":
                this.visitIf(node);
                break;
            case "BlockStatement":
                this.visitBlock(node)
                break;
        }
    }

    visitLiteral(node) {
        return node.value
    }

    visitIdentifier(node) {
        const name = node.name
        const variable = this.getVar(name)
        return variable !== undefined ? variable : name;
    }

    visitVariableDeclaration(node) {
        return this.visitNodes(node.declarations)
    }

    visitVariableDeclarator(node) {
        this.startStatement(node);
        
        const id = node.id.name;
        const init = this.visitNode(node.init)
        this.addVar(id)
        this.setVar(id, init)
        
        if (Array.isArray(init)) {
            this.listeners.forEach(listener => {
                listener.newArray(id, init.length);
                listener.setArray(id, [...init]);
            });
        } else {
            this.listeners.forEach(listener => {
                listener.newVar(id);
                listener.setVarValue(id, init);
            });
        }

        this.endStatement();
        
        return init
    }

    visitCallExpression(node) {
        this.startStatement(node);
        
        const _arguments = [];
        for (const nodeArg of node.arguments)
            _arguments.push(this.visitNode(nodeArg))
        
        if (node.callee.type == "Identifier") {
            const callee = this.visitIdentifier(node.callee)
            if (callee == "print")
                console.log(..._arguments)
        } else if (node.callee.type == "MemberExpression") {
            const object = node.callee.object.name;
            const property = node.callee.property.name;
            if (object == "console" && property == "log")
                console.log(..._arguments);
            if (property == "push") {
                this.getVar(object).push(..._arguments);
                this.listeners.forEach(listener => {
                    listener.arrayPush(object, _arguments);
                });
            }
        }

        this.endStatement();
    }

    newScope() {
        this.scopes.push(new Map());
        this.listeners.forEach(listener => {
            listener.newScope();
        });
    }

    deleteScope() {
        const scope = this.scopes.pop();
        this.listeners.forEach(listener => {
            listener.deleteScope();
        });
    }

    visitBlock(node) {
        this.newScope();
        for (const child of node.body)
            this.visitNode(child);
        this.deleteScope();
    }

    visitWhile(node) {
        while (true) {
            const cond = this.visitNode(node.test);
            this.listeners.forEach(listener => {
                listener.evalCondition(node.test, cond);
                listener.endStatement();
            });
            if (!cond) break;
            this.visitNode(node.body);
        }
    }

    visitFor(node) {
        this.newScope();
        this.visitNode(node.init);
        while (true) {
            const cond = this.visitNode(node.test);
            this.listeners.forEach(listener => {
                listener.evalCondition(node.test, cond);
                listener.endStatement();
            });
            if (!cond) break;
            this.visitNode(node.body);
            this.visitNode(node.update);
        }
        this.deleteScope();
    }
    
    visitIf(node) {
        const cond = this.visitNode(node.test);
        this.listeners.forEach(listener => {
            listener.evalCondition(node.test, cond);
            listener.endStatement();
        });
        if (cond)
            this.visitNode(node.consequent);
        else if (node.alternate != null)
            this.visitNode(node.alternate);
    }

    setVariable(id, value) {
        this.setVar(id, value);
        this.listeners.forEach(listener => {
            listener.setVarValue(id, value);
        });
    }

    setArray(id, index, value) {
        const arr = this.getVar(id);
        arr[index] = value;
        this.listeners.forEach(listener => {
            listener.setArrayValue(id, index, value);
            listener.endStatement();
        });
    }
    
    visitUpdateExpression(node) {
        this.startStatement(node);
        let result;
        if (node.argument.type == "Identifier") {
            const arg = node.argument.name;
            const old = this.getVar(arg);
            switch (node.operator) {
                case ops.PP:
                    this.setVariable(arg,  old + 1);
                    result = node.prefix ? old + 1 : old;
                    break;
                case ops.MM:
                    this.setVariable(arg, old - 1);
                    result = node.prefix ? old - 1 : old;
                    break;
            }
        }
        this.endStatement();
        return result;
    }
    
    visitAssignmentExpression(node) {
        this.startStatement(node);
        
        const operator = node.operator
        const rightNode = this.visitNode(node.right)
        
        if (node.left.type == "Identifier") {
            const left = node.left.name;
            switch (operator) {
                case ops.ADDEQ:
                    this.setVariable(left, this.getVar(left) + rightNode);
                    break;
                case ops.SUBEQ:
                    this.setVariable(left, this.getVar(left) - rightNode);
                    break;
                case ops.DIVEQ:
                    this.setVariable(left, this.getVar(left) / rightNode);
                    break;
                case ops.MULEQ:
                    this.setVariable(left, this.getVar(left) * rightNode);
                    break;
                case ops.ASSIGN:
                    this.setVariable(left, rightNode);
                    break;
            }
        } else if (node.left.type == "MemberExpression") {
            const prop = this.visitNode(node.left.property);
            const obj = node.left.object.name;
            switch (operator) {
                case ops.ASSIGN:
                    this.setArray(obj, prop, rightNode);
                    break;
            }
        }

        this.endStatement();
    }
    
    visitBinaryExpression(node) {
        const leftNode = this.visitNode(node.left)
        const operator = node.operator
        const rightNode = this.visitNode(node.right)
        switch (operator) {
            case ops.ADD:
                return leftNode + rightNode
            case ops.SUB:
                return leftNode - rightNode
            case ops.DIV:
                return leftNode / rightNode
            case ops.MUL:
                return leftNode * rightNode
            case ops.MOD:
                return leftNode % rightNode
            case ops.EQ:
                return leftNode == rightNode
            case ops.LE:
                return leftNode <= rightNode
            case ops.LT:
                return leftNode < rightNode
            case ops.GE:
                return leftNode >= rightNode
            case ops.GT:
                return leftNode > rightNode
        }
    }

    visitArrayExpression(node) {
        return node.elements.map(expr => this.visitNode(expr));
    }

    visitMemberExpression(node) {
        const object = node.object.name;
        const property = this.visitNode(node.property);
        const arr = this.getVar(object);
        return arr[property];
    }
    
    run(nodes) {
        this.visitNodes(nodes)
        this.listeners.forEach(listener => {
            listener.endProgram();
        });
    }
}
