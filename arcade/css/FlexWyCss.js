const WHITE = "#fdfdfd"
const BLACK = "#d9dbdf"
const FRAME = "#404040"
const ACCENT = "#f1bd5c"

function ALPHA(hex_rgb, alpha) {
    return 'rgba(' + [0, 1, 2].map(i => parseInt("0x" + hex_rgb.substr(2*i+1,2)).toString()).join(',') + "," + (alpha / 100.0).toString() + ")"
}

const LAST = ALPHA(ACCENT, 50)         //'rgba(241, 189, 92, 0.5)'
const ACCENT_75 = ALPHA(ACCENT, 75)   //'rgba(241, 189, 92, 0.75)'
const FRAME_50 = ALPHA(FRAME, 50)     //'rgba(64, 64, 64, 0.50)'
const FRAME_75 = ALPHA(FRAME, 75)     //'rgba(64, 64, 64, 0.75)'

const CAP_HINT = ALPHA(ACCENT, 75)
const DOT_HINT_OUTER = ACCENT // FRAME_50
const DOT_HINT_INNER = ACCENT
const DOT_MENU_OUTER = FRAME
const DOT_MENU_INNER_NORM = ALPHA(WHITE, 90)  //"rgba(255, 255, 255, 0.90)"
const DOT_MENU_INNER_PICK = FRAME
