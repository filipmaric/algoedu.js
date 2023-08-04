export class Commands {
    constructor(commands) {
        this.commands = commands;
        this.current = 0;
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

    next() {
        if (this.done())
            return false;
        this.doCurrentCommand();
        this.current++;
        return true;
    }

    doCurrentCommand() {
        if (Array.isArray(this.commands[this.current]))
            this.commands[this.current].forEach(command => command.doCommand());
        else
            this.commands[this.current].doCommand();
    }

    undoCurrentCommand() {
        if (Array.isArray(this.commands[this.current]))
            this.commands[this.current].slice().reverse().forEach(command => command.undoCommand());
        else
            this.commands[this.current].undoCommand();
    }

    previous() {
        if (this.current == 0)
            return false;
        --this.current;
        this.undoCurrentCommand();
        return true;
    }

    run() {
        while (!this.done()) {
            this.doCurrentCommand();
            this.current++;
        }
    }
}
