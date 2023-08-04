const ctx = document.createElement("canvas").getContext("2d");

// input: r,g,b in [0,1], out: h in [0,360) and s,v in [0,1]
export function rgb2hsv(r, g, b) {
    let v=Math.max(r,g,b), c=v-Math.min(r,g,b);
    let h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); 
    return [60*(h<0?h+6:h), v&&c/v, v];
}

// read RGB from rgb or rgba string
export function parseRGB(str) {
    const m = str.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*(\d+([.]\d*)?))?\s*\)$/i);
    return m ? {
        r: parseFloat(m[1]),
        g: parseFloat(m[2]),
        b: parseFloat(m[3])
    } : null;
}

// convert color in any format to rgb
export function rgbColor(str){
    function hexToRGB(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    ctx.fillStyle = str;
    const color = ctx.fillStyle;
    if (color[0] == '#')
        return hexToRGB(color);
    else
        return parseRGB(color);
}

export function hsvColor(str) {
    const rgb = rgbColor(str);
    const hsv = rgb2hsv(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    return {h: hsv[0], s: hsv[1], v: hsv[2]};
}

// extract opacity from color string
export function getOpacity(color) {
    const defaultOpacity = 1;
    
    if (!color)
        return defaultOpacity;
    const m = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+([.]\d*)?)\s*\)$/i);
    return parseFloat(m ? m[4] : defaultOpacity);
}

// set opacity to color string
export function setOpacity(color, o) {
    const rgb = rgbColor(color);
    return "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + o + ")";
}
