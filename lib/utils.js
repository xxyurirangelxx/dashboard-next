export const parseCurrencyToCents = (val) => {
    if (typeof val !== 'string' || val.trim() === '') return 0;
    const cleaned = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
    if (cleaned === '') return 0;
    const floatValue = parseFloat(cleaned);
    if (isNaN(floatValue)) {
        console.warn(`Não foi possível converter o valor: ${val}`);
        return 0;
    }
    return Math.round(floatValue * 100);
};

export const formatCurrencyBRL = (cents) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export function hexToRgba(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = '0x' + hex[1] + hex[1];
        g = '0x' + hex[2] + hex[2];
        b = '0x' + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = '0x' + hex[1] + hex[2];
        g = '0x' + hex[3] + hex[4];
        b = '0x' + hex[5] + hex[6];
    }
    return `rgba(${+r},${+g},${+b},${alpha})`;
}

export function darkenHex(hex, percent) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    r = parseInt(r * (100 - percent) / 100);
    g = parseInt(g * (100 - percent) / 100);
    b = parseInt(b * (100 - percent) / 100);
    r = r < 0 ? 0 : r;
    g = g < 0 ? 0 : g;
    b = b < 0 ? 0 : b;
    const toHex = c => ('00' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
