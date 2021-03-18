const FlexGen = function() {
    const random = function(array) {
        return array[Math.floor((Math.random()*array.length))]
    }

    const reroll_side = function(pts, X) {
        const N = 2 * X - 1
        const INIT_SIDE = ('p'.repeat(N) + 'k').split('')
        const PIECE_EVAL = {'p': 1, 'b': 3, 'n': 3, 'r': 5, 'q': 8}
        const UPGRADE = 'bnrq'.split('')
        var side = INIT_SIDE
        var rem = pts
        while (rem > 0) {
            let index =  Math.floor((Math.random() * N))
            let old = side[index]
            if (old != 'q') {
                let up = random(UPGRADE)
                if (PIECE_EVAL[old] < PIECE_EVAL[up]) {
                    rem -= PIECE_EVAL[up] - PIECE_EVAL[old]
                    side[index] = up
                }
            }
        }
        return side
    }

    const build_pos_fen = function(whites, blacks, X, Y){
        const N = 2 * X - 1
        const C = Math.floor(X / 2)

        whites[N] = whites[X + C]
        whites[X + C] = 'k'

        blacks[N] = blacks[C]
        blacks[C] = 'k'

        const rank_Y = blacks.splice(X).join('')
        const rank_Z = blacks.join('')
        const rank_1_lower = whites.splice(X).join('')
        const rank_2_lower = whites.join('')
        const rank_1 = rank_1_lower.toUpperCase()
        const rank_2 = rank_2_lower.toUpperCase()

        const fen = rank_Z + '/' + rank_Y + '/' + ((X + '/').repeat(Y - 4)) + rank_2 + '/' + rank_1

        return fen
    }

    /*
    get_xfen_castling(rank) {
//        const indexOfAll = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
        const alphabet = 'abcdefgh'
        return rank.reduce((xfen, piece, index) => (xfen + ((piece == 'r') ? alphabet[index] : '')), '')
    }*/

    const build_fen = function(whites, blacks, X, Y) {
        const min_fen = build_pos_fen(whites, blacks, X, Y)
        const ext_fen = 'w KQkq - 0 1'
        return min_fen + ' ' + ext_fen
    }

    return function(X, Y) {
        const W_PTS = X * 5
        const B_PTS = X * 3

        const whites = reroll_side(W_PTS, X)
        const blacks = reroll_side(B_PTS, X)

        return build_pos_fen(whites, blacks, X, Y)
    }
}();

