const SHOW_HINT_MILLIS = 500

class PuzzleApp {
    constructor(wrapDom, flexDom, puzzleCsv, config) {
        const defaultConfig = {
            onHumanMoveRegistered: this.onHumanMoveRegistered.bind(this),
            onEngineMoveRegistered: this.onEngineMoveRegistered.bind(this)
        }
        this.config = {...defaultConfig, ...config}

        this.flexBoard = new FlexBoard(flexDom, 8, 8, this.config)

        let that = this

        this.flexTBL = new EmbedChannel(function (message) {
            that.onTBLMessage(message)
        }, function(fen) { return FlexEngineJs.getMoves(8, 8, "AUTO", fen) })

        this.flexUCI = new EmbedChannel(function (message) {
            that.onUCIMessage(message)
        }, function(fen) { return FishEngineJs.getBestMove(fen) })

        this.setup(puzzleCsv)
    }

    top(array) {
        return array[array.length - 1]
    }

    whiten(puzzleTokens) {
        if (puzzleTokens[1].split(' ')[1] === 'w') {
            puzzleTokens[1] = FLIP_FEN(puzzleTokens[1])
            puzzleTokens[2] = FLIP_LINE(puzzleTokens[2])
        }
        return puzzleTokens
    }

    setup(puzzleCsv) {
        this.puzzleTokens = this.whiten(puzzleCsv.split(','))

        this.elo = parseInt(this.puzzleTokens[0])
        this.fidefen = this.puzzleTokens[1]
        this.line = this.puzzleTokens[2].split(' ').map(move => move.substr(0, 4))
        this.index = parseInt(this.puzzleTokens[3]) // index of last step within the line
        this.state = this.puzzleTokens[4] // 'online', 'offline'

        this.localHistory = []

        for(let moveIndex = 0; moveIndex < this.index; moveIndex++) {
            this.fidefen = FlexEngineJs.getBoardAfter(8, 8, "AUTO", this.fidefen + '#' + this.line[moveIndex])
            if (moveIndex % 2 === 0) {
                this.localHistory.push(this.fidefen)
            }
        }
        this.flexBoard.position(this.fidefen)
        this.flexBoard.highlightMove(this.line[this.index - 1])

        this.virgin = (this.state === "online")

        if (this.state === "online") {
            this.markOnline()
        } else {
            this.markOffline()
        }

        if (this.index < this.line.length) {
            this.flexTBL.write(this.fidefen)
        } else {
            this.markSolved()
        }

        //this.logPuzzleStatus()
    }

    isOffroad() {
        if (this.index === this.line.length) {
            return false
        }
        let onlineHistoryLength = (this.index + 1) / 2
        return this.localHistory.length > onlineHistoryLength
    }

    markSolved() {
        document.body.style.backgroundColor = ACCENT
    }

    markOnline() {
        document.body.style.backgroundColor = WHITE
    }

    markOffline() {
        document.body.style.backgroundColor = FRAME
    }

    requestEngineMove(fidefen) {
        this.flexBoard.disableMoves()
        this.flexBoard.showLoader()
        this.flexUCI.write(fidefen, 100)
    }

    logPuzzleStatus() {
        console.log(this.index + "/" + this.line.length + " " + this.state + " " + this.localHistory.length)
    }

    isMoveGood(move, fidefen) {
          const good = this.line[this.index]
          return (move === good) || ((this.index === this.line.length - 1) && (FlexEngineJs.getStatus(8, 8, "AUTO", fidefen) === "CHECKMATE"))
    }

    onHumanMoveRegistered(key0, key1) {
        const nextFen = FlexEngineJs.getBoardAfter(8, 8, "AUTO", this.fidefen + '#' + key0 + key1)

        //console.log('onHumanMoveRegistered')
        //this.logPuzzleStatus()
        if (!this.isOffroad()) {
            const move = key0 + key1
            if (!this.isMoveGood(move, nextFen)) {
                if (this.state === "online") {
                    // first bad move - reject and allow easy repetition after double tap
                    this.flexBoard.position(this.fidefen)
                    this.flexBoard.highlightMove(this.line[this.index - 1])
                    this.flexTBL.write(this.fidefen)
                    this.state = "offline"
                    this.markOffline()
                    if (this.virgin) {
                        this.virgin = false
                        this.elo -= 15
                        this.flexBoard.notify(this.elo.toString())
                    }
                } else {
                    this.fidefen = nextFen
                    this.flexBoard.disableMoves()
                    // 'repeat' bad move - go offroad and play with engine if possible
                    if (FlexEngineJs.getMoves(8, 8, "AUTO", this.fidefen) !== "") {
                        // it makes sense to ask stockfish
                        this.requestEngineMove(this.fidefen)
                    } else {
                        // store white move on the top of stack to keep the take back consistent
                        this.localHistory.push(this.fidefen)
                    }
                }
            } else if (this.index === this.line.length - 1) {
                this.index += 1
                // puzzle solved
                if (this.virgin) {
                    this.virgin = false
                    this.elo += 15
                    this.flexBoard.notify(this.elo.toString())
                }
                this.markSolved()
                this.flexBoard.disableMoves()
                this.fidefen = nextFen
                // store white move on the top of stack to keep the take back consistent
                this.localHistory.push(this.fidefen)
            } else {
                // continue solving puzzle
                const reply = this.line[this.index + 1]
                this.index += 2
                this.fidefen = FlexEngineJs.getBoardAfter(8, 8, "AUTO", nextFen + '#' + reply)
                this.flexBoard.position(this.fidefen)
                this.flexBoard.highlightMove(this.line[this.index - 1])
                this.flexBoard.allowMoves({})

                this.localHistory.push(this.fidefen)
                this.flexTBL.write(this.fidefen)
                this.markOnline()
            }
        } else {
            // continue stumbling after failure
            this.fidefen = nextFen
            this.flexBoard.disableMoves()
            if (FlexEngineJs.getMoves(8, 8, "AUTO", this.fidefen) !== "") {
                this.requestEngineMove(this.fidefen)
            } else {
                this.localHistory.push(this.fidefen)
            }
        }
        //this.logPuzzleStatus()
    }

    onEngineMoveRegistered(key0, key1) {
        this.flexBoard.hideLoader()
        this.fidefen = FlexEngineJs.getBoardAfter(8, 8, "AUTO", this.fidefen + '#' + key0 + key1)
        this.localHistory.push(this.fidefen)
        this.flexTBL.write(this.fidefen)
    }

    onTBLMessage(message) {
        //console.log(message)
        const hints = this.flexBoard.parseLine(message)
        this.flexBoard.allowMoves(hints)
    }

    onUCIMessage(message) {
        let m = message.split(' ')
        if (m[0] === "bestmove") {
            this.flexBoard.makeEngineMove(UCI_KEY0(m[1]), UCI_KEY1(m[1]))
        }
    }

    canTakeBack() {
        return this.localHistory.length > 1
    }

    takeBackIndex() {
        if (this.index % 2 === 0) {
            this.index -= 1
        } else {
            this.index -= 2
        }
    }

    takeBack() {
        //console.log("takeBack")
        //this.logPuzzleStatus()
        if (this.canTakeBack()) {
            if (!this.isOffroad()) {
                this.takeBackIndex()
            }
            this.localHistory.pop()
            this.fidefen = this.top(this.localHistory)
            this.flexBoard.position(this.fidefen)
            this.flexTBL.write(this.fidefen)
            if (!this.isOffroad()) {
                this.state = "online"
                this.markOnline()
                this.flexBoard.highlightMove(this.line[this.index - 1])
            }
        }
        //this.logPuzzleStatus()
    }

    doubleTap() {
        if (this.index === this.line.length) {
            // already solved puzzle - allow reroll
            return true
        }
        //console.log('doubleTap')
        //this.logPuzzleStatus()

        if (this.state === "online") {
            // concede and display next move
            this.flexBoard.disableMoves()
            this.virgin = false
            const whiteMove = this.line[this.index]
            this.fidefen = FlexEngineJs.getBoardAfter(8, 8, "AUTO", this.fidefen + '#' + whiteMove)
            this.index += 1
            this.flexBoard.position(this.fidefen)
            this.flexBoard.highlightMove(this.line[this.index - 1])
            if (this.index < this.line.length) {
                const blackMove = this.line[this.index]
                this.fidefen = FlexEngineJs.getBoardAfter(8, 8, "AUTO", this.fidefen + '#' + blackMove)
                this.localHistory.push(this.fidefen)
                this.index += 1
                setTimeout(function() {
                    this.flexBoard.position(this.fidefen)
                    this.flexBoard.highlightMove(this.line[this.index - 1])
                }.bind(this), SHOW_HINT_MILLIS)
            } else {
                this.localHistory.push(this.fidefen)
                this.markSolved()
            }
        } else {
            // return online
            while(this.isOffroad()) {
                this.localHistory.pop()
            }
            this.fidefen = this.top(this.localHistory)
            this.state = "online"
            this.markOnline()
            this.flexBoard.position(this.fidefen)
            this.flexBoard.highlightMove(this.line[this.index - 1])
            this.flexTBL.write(this.fidefen)
        }

        //this.logPuzzleStatus()

        return false
    }
}
