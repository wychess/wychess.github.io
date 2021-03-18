function arrayRemove(arr, value) {
    return arr.filter(function(ele){
        return ele != value;
    });
}

function isAlpha(ch){
    return (typeof ch === "string") && (ch.length === 1) && (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z")
}

function isLower(c) {
    return c >= "a" && c <= "z"
}

function isUpper(c) {
    return c >= "A" && c <= "Z"
}

function toLower(c) {
    return c.toLowerCase()
}

function toUpper(c) {
    return c.toUpperCase()
}
