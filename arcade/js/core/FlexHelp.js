const ALPHABET = "abcdefghijklmnop".split('')

const BASE = 0
const SIDE = 1
const CAST = 2
const ENPA = 3
const CAPT = 4
const PLY2 = 5
const FULL = 6

const SIDE_WHITE = 1
const SIDE_BLACK = 0

function GET_SIDE(flexfen) {
    return flexfen.split(' ')[1].toUpperCase() == "W" ? "WHITE" : "BLACK"
}

function HEX(i) {
    return Math.floor(i).toString(16)
}

function KEY(xz, yz) {
    return ALPHABET[xz] + Math.floor(yz + 1).toString(16)
}

function UCI_KEY0(move) {
    return move.substr(0, 2)
}

function UCI_KEY1(move) {
    return move.substr(2, 2)
}

function UCI_KEY1CAP(move) {
    return move.substr(2)
}

function FLIP_KEY(key) {
    return KEY(7 - FILE_INDEX(key), 7 - RANK_INDEX(key))
}

function FILE(key) {
    return key.split('')[0]
}

function RANK(key) {
    return parseInt(key.split('')[1], 16)
}

function FILE_INDEX(key) {
    return ALPHABET.indexOf(FILE(key))
}

function RANK_INDEX(key) {
    return RANK(key) - 1
}

function KEY_INDEX(key, X, Y) {
    return FILE_INDEX(key) + (Y - 1 - RANK_INDEX(key)) * X
}

function REVERSE(s){
    return s.split('').reverse().join('')
}

function FLIP_CASE(letter) {
    return (letter === letter.toUpperCase()) ? letter.toLowerCase() : letter.toUpperCase()
}

function FLIP_TEXT(text) {
    return text.split('').map(
        letter => FLIP_CASE(letter)
    ).join('')
}

function FLIP_FEN_BASE(boardText) {
    return boardText.split('/').reverse().map(
        rankText => FLIP_TEXT(REVERSE(rankText))
    ).join('/')
}

function FLIP_FEN_COLOR(color_letter) {
    return (color_letter === 'b') ? 'w' : 'b'
}

function FLIP_FEN_CASTLING(castling_text) {
    return FLIP_TEXT(castling_text).split('').sort().join('')
}

function FLIP_FEN(fen) {
    const fenParts = fen.split(' ')
    fenParts[0] = FLIP_FEN_BASE(fenParts[0])
    fenParts[1] = FLIP_FEN_COLOR(fenParts[1])
    fenParts[2] = FLIP_FEN_CASTLING(fenParts[2])
    return fenParts.join(' ')
}

function FLIP_LINE(line) {
    return line.split(' ').map(move => FLIP_KEY(UCI_KEY0(move)) + FLIP_KEY(UCI_KEY1(move))).join(' ')
}

function SIMPLIFY_FEN_BASE(fenBase) {
    return fenBase
        .replace(/16/g, "................")
        .replace(/15/g, "...............")
        .replace(/14/g, "..............")
        .replace(/13/g, ".............")
        .replace(/12/g, "............")
        .replace(/11/g, "...........")
        .replace(/10/g, "..........")
        .replace(/9/g, ".........")
        .replace(/8/g, "........")
        .replace(/7/g, ".......")
        .replace(/6/g, "......")
        .replace(/5/g, ".....")
        .replace(/4/g, "....")
        .replace(/3/g, "...")
        .replace(/2/g, "..")
        .replace(/1/g, ".")
}

function FLATTEN_FEN_BASE(fenBase) {
    return SIMPLIFY_FEN_BASE(fenBase).replace(/\//g, '')
}

function LOOKUP(fen, key) {
    const simpleFen = SIMPLIFY_FEN_BASE(fen)
    const tempFen = simpleFen.split('/')
    const Y = tempFen.length
    const X = tempFen[0].length
    return simpleFen.replace(/\//g, '').split('')[KEY_INDEX(key, X, Y)]
}

function FOR_EACH_KEY(X, Y, onSquare) {
    for (let xz = 0; xz < X; xz++) {
        for (let yz = 0; yz < Y; yz++) {
            onSquare(xz, yz, KEY(xz, yz))
        }
    }
}

function FOR_EACH_FILE(X, yz, onSquare) {
    for (let xz = 0; xz < X; xz++) {
        onSquare(xz, yz, KEY(xz, yz))
    }
}

function FOR_EACH_RANK(xz, Y, onSquare) {
    for (let yz = 0; yz < Y; yz++) {
        onSquare(xz, yz, KEY(xz, yz))
    }
}

function SAMPLE_FROM(array) {
    return array[Math.floor((Math.random()*array.length))]
}
