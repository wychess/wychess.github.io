function bind_move_hints(x, y) {
    return function(flexfen) { return FlexEngineJs.getMoves(x, y, "AUTO", flexfen) }
}

function bind_bestmove(x, y) {
    return function(flexfen) { return FlexEngineJs.getBestMove(x, y, "AUTO", flexfen) }
}

class FlexApp {
    constructor(staleDom, wrapDom, flexDom, X, Y, fensCsv, config) {
        const defaultConfig = {
            onHumanMoveRegistered: this.onHumanMoveRegistered.bind(this),
            onEngineMoveRegistered: this.onEngineMoveRegistered.bind(this)
        }
        this.config = {...defaultConfig, ...config}

        this.X = X
        this.Y = Y

        this.staleDom = staleDom
        this.wrapDom = wrapDom
        this.flexBoard = new FlexBoard(flexDom, X, Y, this.config)
        this.markPlay()

        let that = this

        this.flexTBL = new EmbedChannel(function(message) {
            that.onTBLMessage(message)
        }, bind_move_hints(X, Y))

        this.flexUCI = new EmbedChannel(function(message) {
            that.onUCIMessage(message)
        }, bind_bestmove(X, Y))

        this.history = fensCsv.split(';')
        this.canResetFlag = history.length === 1
        this.flexfen = this.history[this.history.length - 1]
        this.flexBoard.position(this.flexfen)

        this.pliesSinceLastCapture = 0
        this.repetitionLookup = {}

        if (this.config.playAs == GET_SIDE(this.flexfen)) {
            this.flexTBL.write(this.flexfen)
        } else {
            this.flexBoard.showLoader()
            this.flexUCI.write(this.flexfen, 100)
        }
    }

    markWin() {
        this.canResetFlag = true
        this.flexBoard.hideLoader()
        document.body.style.backgroundColor = CONFIG.THEME.WIN
        this.staleDom.style.visibility = "hidden";
    }

    markPat() {
        this.canResetFlag = true
        this.flexBoard.hideLoader()
        this.staleDom.style.visibility = "visible";
    }

    markEnd() {
        this.canResetFlag = true
        this.flexBoard.disableMoves()
        this.flexBoard.hideLoader()
        document.body.style.backgroundColor = CONFIG.THEME.ECHEC
        this.staleDom.style.visibility = "hidden";
    }

    markPlay() {
        document.body.style.backgroundColor = CONFIG.THEME.TABLE
        this.flexBoard.unmarkCheck()
        this.staleDom.style.visibility = "hidden";
    }

    insufficientMaterial(fen) {
        let minimFen = FLATTEN_FEN_BASE(fen.split(' ')[0]).replace(/\./g, '').split('').sort().join('')
        return ['BKbk', 'BKk', 'BKkn',
                 'Kbk',  'Kk',  'Kkn',
                'KNbk', 'KNk', 'KNkn'].indexOf(minimFen) !== -1
    }

    captureCheck(fen) {
        this.pliesSinceLastCapture = parseInt(fen.split(' ')[4])
        return this.pliesSinceLastCapture === 50
    }

    repetitionCheck(flexfen) {
        const fenCore = flexfen.split(' ')[0]
        if (this.repetitionLookup.hasOwnProperty(fenCore)) {
            this.repetitionLookup[fenCore] += 1
            if (this.repetitionLookup[fenCore] === 3) {
                return true
            }
        } else {
            this.repetitionLookup[fenCore] = 1
        }
        return false
    }

    extraTermination(fen) {
        const terminateInsufficientMaterial = this.insufficientMaterial(fen)
        const terminateCapture = this.captureCheck(fen)
        const terminateRepetition = this.repetitionCheck(fen)
        return terminateInsufficientMaterial || terminateRepetition || terminateCapture
    }

    onHumanMoveRegistered(key0, key1) {
        this.canResetFlag = false

        this.flexBoard.disableMoves()
        this.flexBoard.dropLayer.clear()
        this.flexBoard.hintLayer.clear()

        this.flexfen = FlexEngineJs.getBoardAfter(this.X, this.Y, "AUTO", this.flexfen + '#' + key0 + key1)

        const status = FlexEngineJs.getStatus(this.X, this.Y, "AUTO", this.flexfen)
        if (status == "CHECKMATE") {
            this.markWin()
            this.flexBoard.markCheck(GET_KING(this.flexfen), false)
            return
        }

        if (status == "STALEMATE") {
            this.markPat()
            return
        }

        if (this.extraTermination(this.flexfen)) {
            this.markEnd()
            return
        }

        this.markPlay()

        this.flexBoard.showLoader()
        this.flexUCI.write(this.flexfen, 100)
    }

    onEngineMoveRegistered(key0, key1) {
        this.canResetFlag = false
        this.flexBoard.hideLoader()

        this.flexfen = FlexEngineJs.getBoardAfter(this.X, this.Y, "AUTO", this.flexfen + '#' + key0 + key1)

        this.history.push(this.flexfen)

        ActivityJs.setHistory(this.X, this.Y, this.history.join(';'))

        const status = FlexEngineJs.getStatus(this.X, this.Y, "AUTO", this.flexfen)
        if (status == "CHECKMATE") {
            this.markEnd()
            this.flexBoard.markCheck(GET_KING(this.flexfen), false)
            return
        }

        if (status == "STALEMATE") {
            this.markPat()
            return
        }

        if (this.extraTermination(this.flexfen)) {
            this.markEnd()
            return
        }

        if (status == "CHECK") {
            this.flexBoard.markCheck(GET_KING(this.flexfen), true)
        }

        this.flexTBL.write(this.flexfen)
    }

    onTBLMessage(message) {
        let moves = this.flexBoard.parseLine(message)
        this.flexBoard.allowMoves(moves)

        if (Object.keys(moves).length === 0) {
            this.markEnd()
        }
    }

    onUCIMessage(message) {
        let m = message.split(' ')
        if (m[0] === 'bestmove') {
            let key0 = m[1].substr(0,2)
            let key1 = m[1].substr(2,4)
            this.flexBoard.makeEngineMove(key0, key1)
        } else if (m[0] === 'CHECKMATE') {
            this.markWin()
        } else if (m[0] === 'STALEMATE') {
            this.markPat()
        } else if (m[0] === 'RESIGN') {
            this.markWin()
        }
    }

    canTakeBack() {
        if (this.config.playAs == "WHITE") {
            return this.history.length > 1
        } else {
            return this.history.length > 2
        }
    }

    takeBack() {
        if (!this.canTakeBack()) {
            return
        }
        this.markPlay()
        this.history.pop()
        this.flexfen = this.history[this.history.length - 1]
        this.flexBoard.position(this.flexfen)
        this.flexTBL.write(this.flexfen)
        if (!this.canTakeBack()) {
            this.canResetFlag = true
        }
        ActivityJs.setHistory(this.X, this.Y, this.history.join(';'))
    }
}
