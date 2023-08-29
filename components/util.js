export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function random(a, b) {
    if (b === undefined) {
        b = a;
        a = 0;
    }
    return a + Math.floor(Math.random() * (b - a + 1));
}

export function render(text) {
    if (text === Infinity)
        return "∞";
    else if (text === undefined)
        return "?";
    else
        return text;
}
