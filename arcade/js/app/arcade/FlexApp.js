function bind_move_hints(x, y) {
    return function(flexfen) { return FlexEngineJs.getMoves(x, y, "AUTO", flexfen) }
}

function bind_bestmove(x, y) {
    return function(flexfen) { return FlexEngineJs.getBestMove(x, y, "AUTO", flexfen) }
}

class FlexApp {
    constructor(staleDom, wrapDom, flexDom, X, Y, flexGame, config) {
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

        let that = this

        this.flexTBL = new EmbedChannel(function(message) {
            that.onTBLMessage(message)
        }, bind_move_hints(X, Y))

        this.flexUCI = new EmbedChannel(function(message) {
            that.onUCIMessage(message)
        }, bind_bestmove(X, Y))

        this.flexGame = flexGame
        let snap = this.flexGame.snaps[this.flexGame.snaps.length - 1]

        this.setCanResetFlag()
        this.initSnapshot(snap)
        this.showSnapshot(snap)

        if (snap.board == "PLAY") {
            if (this.config.playAs == GET_SIDE(snap.flexfen)) {
                this.flexTBL.write(snap.flexfen)
            } else {
                this.flexBoard.showLoader()
                this.flexUCI.write(snap.flexfen)
            }
        }
    }

    setCanResetFlag() {
        if (this.config.playAs == "WHITE") {
            this.canResetFlag = this.flexGame.snaps.length == 1
        } else {
            this.canResetFlag = this.flexGame.snaps.length <= 2
        }
    }

    showMarks(snap) {
        this.flexBoard.lastLayer.highlight(snap.marks, CONFIG.THEME.LAST)
    }

    showBoard(snap) {
        if (snap.board == "PLAY") {
            this.markPlay()
        } else if (snap.board == "WIN") {
            this.markWin()
        } else if (snap.board == "STALE") {
            this.markStale()
        } else {
            this.markEnd()
        }
    }

    showCheck(snap, frame) {
        this.flexBoard.clearCheck()
        if (snap.check) {
            this.flexBoard.markCheck(GET_KING(snap.flexfen), frame)
        }
    }

    markWin() {
        this.canResetFlag = true
        this.flexBoard.hideLoader()
        document.body.style.backgroundColor = CONFIG.THEME.WIN
        this.staleDom.style.visibility = "hidden";
    }

    markStale() {
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

    repetitionCheck(flexfen, plyCount) {
        const fenCore = flexfen.split(' ')[0]
        if (this.flexGame.repetitionLookup.hasOwnProperty(fenCore)) {
            this.flexGame.repetitionLookup[fenCore].push(plyCount)
            if (this.flexGame.repetitionLookup[fenCore].length == 3) {
                return true
            }
        } else {
            this.flexGame.repetitionLookup[fenCore] = [plyCount]
        }
        return false
    }

    takeBackRepetitionCheck(flexfen, plyCount) {
        const fenCore = flexfen.split(' ')[0]
        if (this.flexGame.repetitionLookup.hasOwnProperty(fenCore)) {
            if (this.flexGame.repetitionLookup[fenCore].indexOf(plyCount) != -1) {
                this.flexGame.repetitionLookup[fenCore].pop()
            }
        }
    }

    extraTermination(fen, plyCount) {
        const terminateInsufficientMaterial = this.insufficientMaterial(fen)
        const terminateCapture = this.captureCheck(fen)
        const terminateRepetition = this.repetitionCheck(fen, plyCount)
        return terminateInsufficientMaterial || terminateRepetition || terminateCapture
    }

    getBoardMarker(player, flexfen, status, plyCount) {
        if (this.extraTermination(flexfen, plyCount)) {
            return "DRAW"
        } else if (status == "STALEMATE") {
            return "STALE"
        } else if ((player == "HUMAN") && (status == "CHECKMATE")) {
            return "WIN"
        } else if ((player == "ENGINE") && (status == "CHECKMATE")) {
            return "END"
        } else {
            return "PLAY"
        }
    }

    pushSnapshot(player, key0, key1) {
        const fromfen = this.flexGame.snaps[this.flexGame.snaps.length - 1].flexfen
        const plyCount = this.flexGame.snaps.length + 1

        const flexfen = FlexEngineJs.getBoardAfter(this.X, this.Y, "AUTO", fromfen + '#' + key0 + key1)
        const status = FlexEngineJs.getStatus(this.X, this.Y, "AUTO", flexfen)
        const marks = this.flexBoard.lastLayer.mark
        const check = (status == "CHECKMATE") || (status == "CHECK")
        const board = this.getBoardMarker(player, flexfen, status, plyCount)

        const snap = {
            flexfen: flexfen,
            marks: marks,
            status: status,
            check: check,
            board: board
        }

        this.flexGame.snaps.push(snap)
        this.flexGame.log.push(key0 + key1)

        return snap
    }

    initSnapshot(snap) {
        this.flexBoard.position(snap.flexfen)
        this.flexBoard.dropLayer.clear()
        this.flexBoard.hintLayer.clear()
        this.showMarks(snap)
    }

    showSnapshot(snap) {
        this.showBoard(snap)
        this.showCheck(snap, snap.status == "CHECK")
    }

    storeSnapshot(snap) {
        ActivityJs.setSnap(JSON.stringify(this.flexGame))
        if (snap.board != "PLAY") {
            this.storeLog(snap.board)
        }
    }

    storeLog(termString) {
        const snap = this.flexGame.snaps[this.flexGame.snaps.length - 1]
        if ((termString == "REROLL") && (snap.board != "PLAY")) {
            return
        }
        const datetime = (new Date()).toLocaleString()
        const logline = datetime + " :: " + this.flexGame.log.join(" ") + " :: " + termString
        ActivityJs.appendLog(logline)
    }

    onHumanMoveRegistered(key0, key1) {
        this.setCanResetFlag()

        this.flexBoard.disableMoves()
        this.flexBoard.dropLayer.clear()
        this.flexBoard.hintLayer.clear()

        const snap = this.pushSnapshot("HUMAN", key0, key1)
        this.showSnapshot(snap)
        this.storeSnapshot(snap)

        if (snap.board == "PLAY") {
            this.flexBoard.showLoader()
            this.flexUCI.write(snap.flexfen)
        }
    }


    onEngineMoveRegistered(key0, key1) {
        this.flexBoard.hideLoader()
        this.setCanResetFlag()

        const snap = this.pushSnapshot("ENGINE", key0, key1)
        this.showSnapshot(snap)
        this.storeSnapshot(snap)

        if (snap.board == "PLAY") {
            this.flexTBL.write(snap.flexfen)
        }
    }

    onTBLMessage(message) {
        let moves = this.flexBoard.parseLine(message)
        this.flexBoard.allowMoves(moves)
    }

    onUCIMessage(message) {
        let m = message.split(' ')
        if (m[0] === 'bestmove') {
            let key0 = m[1].substr(0,2)
            let key1 = m[1].substr(2,4)
            this.flexBoard.makeEngineMove(key0, key1)
        } else if (m[0] === 'CHECKMATE') {
            // TODO: make sure that branch is obsolete
            this.markWin()
        } else if (m[0] === 'STALEMATE') {
            // TODO: make sure that branch is obsolete
            this.markPat()
        } else if (m[0] === 'RESIGN') {
            // TODO: make sure that branch is obsolete
            this.markWin()
        }
    }

    canTakeBack() {
        if (this.config.playAs == "WHITE") {
            return this.flexGame.snaps.length > 1
        } else {
            return this.flexGame.snaps.length > 2
        }
    }

    takeBackStep() {
        const flexfen = this.flexGame.snaps[this.flexGame.snaps.length - 1].flexfen
        const plyCount = this.flexGame.snaps.length
        this.takeBackRepetitionCheck(flexfen, plyCount)
        this.flexGame.snaps.pop()
    }

    takeBack() {
        if (!this.canTakeBack()) {
            return
        }
        const snapTerm = this.flexGame.snaps[this.flexGame.snaps.length - 1]
        if (!((["PLAY", "CHECK"].indexOf(snapTerm.status) == -1) && (this.config.playAs != GET_SIDE(snapTerm.flexfen)))) {
            this.takeBackStep()
        }
        this.takeBackStep()
        this.flexGame.log.push("takeback")

        const snap = this.flexGame.snaps[this.flexGame.snaps.length - 1]
        this.storeSnapshot(snap)
        this.initSnapshot(snap)
        this.showSnapshot(snap)

        this.flexTBL.write(snap.flexfen)
        if (!this.canTakeBack()) {
            this.canResetFlag = true
        }
    }
}
