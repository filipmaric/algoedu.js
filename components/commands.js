export class Commands {
    constructor(commands) {
        this.commands = commands;
        this.current = 0;
    }

    get length() {
        return this.commands.length;
    }

    reset() {
        while (this.inProgress()) {
            this.current--;
            this.undoCurrentCommand();
        }
    }

    inProgress() {
        return this.current > 0;
    }

    done() {
        return this.current >= this.commands.length;
    }

    next(quick=false) {
        if (this.done())
            return false;
        this.doCurrentCommand(quick);
        this.current++;
        return true;
    }

    doCurrentCommand(quick=false) {
        if (Array.isArray(this.commands[this.current]))
            this.commands[this.current].forEach(command => command.doCommand(quick));
        else
            this.commands[this.current].doCommand(quick);
    }

    undoCurrentCommand(quick=false) {
        if (Array.isArray(this.commands[this.current]))
            this.commands[this.current].slice().reverse().forEach(command => command.undoCommand(quick));
        else
            this.commands[this.current].undoCommand(quick);
    }

    previous(quick=false) {
        if (this.current == 0)
            return false;
        --this.current;
        this.undoCurrentCommand(quick);
        return true;
    }

    run() {
        while (!this.done()) {
            this.doCurrentCommand();
            this.current++;
        }
    }

    gotoCommand(k) {
        if (this.current < k) {
            while (this.next(this.current < k - 1) && this.current < k);
        } else if (this.current > k) {
            while (this.previous(this.current > k + 1) && this.current > k);
        }
    }
}

export class CommandSetElementContent {
    constructor(element, content) {
        this.element = element;
        this.content = content;
    }

    doCommand() {
        this.oldContent = this.element.innerHTML;
        this.element.innerHTML = this.content;
    }

    undoCommand() {
        this.element.innerHTML = this.oldContent;
    }
}


