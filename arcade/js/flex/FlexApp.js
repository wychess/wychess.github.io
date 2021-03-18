class EmbedChannel {
  constructor(onMessage, writer) {
    this.writer = writer
    this.onMessage = onMessage
  }

  write(message, delay=0) {
    let that = this
    setTimeout(function(){ that.doWrite(message) }, delay)
  }

  doWrite(message) {
    const rep = this.writer(message)
    const lines = rep.split('\n')
    for(let index in lines) {
      this.onMessage(lines[index])
    }
  }
}

function bind_move_hints(x, y) {
    return function(fen) { return FlexJs.get_move_hints(x, y, fen) }
}

function bind_bestmove(x, y) {
    return function(fen) { return FlexJs.get_bestmove(x, y, fen) }
}

class FlexApp {
    constructor(flexDom, X, Y, config) {
        const defaultConfig = {
            onPositionRegistered: this.onPositionRegistered.bind(this),
            onHumanMoveRegistered: this.onHumanMoveRegistered.bind(this),
            onEngineMoveRegistered: this.onEngineMoveRegistered.bind(this)
        }
        this.config = {...defaultConfig, ...config}
        this.flexBoard = new FlexBoard(flexDom, X, Y, this.config)

        let that = this

        //this.waitForPremoves = false

        this.flexTBL = new EmbedChannel(function(message) {
            that.onTBLMessage(message)
        }, bind_move_hints(X, Y))

        this.flexUCI = new EmbedChannel(function(message) {
            that.onUCIMessage(message)
        }, bind_bestmove(X, Y))

        const fen = FlexGen(X, Y)
        this.flexBoard.fen(fen)

//        console.log("INIT " + this.flexBoard.dump())

        this.pliesSinceLastCapture = 0
        this.repetitionLookup = {}
    }

    markWin() {
        this.flexBoard.hideLoader()
        document.body.style.backgroundColor = ACCENT
    }

    markEnd() {
        this.flexBoard.hideLoader()
        document.body.style.backgroundColor = FRAME
    }

    insufficientMaterial(fen) {
        let minimFen = flattenFen(fen).replace(/\./g, '').split('').sort().join('')
        return ['BKbk', 'BKk', 'BKkn',
                 'Kbk',  'Kk',  'Kkn',
                'KNbk', 'KNk', 'KNkn'].indexOf(minimFen) !== -1
    }

    captureCheck(fen, key) {
        if (LOOKUP(fen, key) !== '.') {
            this.pliesSinceLastCapture = 0
        } else {
            this.pliesSinceLastCapture += 1
        }
        return this.pliesSinceLastCapture == 64
    }

    repetitionCheck(fen) {
        const pos = fen.split(' ')[0]
        const sid = fen.split(' ')[1]
        if (this.repetitionLookup.hasOwnProperty(pos)) {
            this.repetitionLookup[pos] += 1
            if (this.repetitionLookup[pos] == 3) {
                return true
            }
        } else {
            this.repetitionLookup[pos] = 1
        }
        return false
    }

    extraTermination(fen0, fen1, key0, key1) {
        const terminateInsufficientMaterial = this.insufficientMaterial(fen1)
        const terminateCapture = this.captureCheck(fen0, key1)
        const terminateRepetition = this.repetitionCheck(fen1)
        return terminateInsufficientMaterial || terminateRepetition || terminateCapture
    }


    onPositionRegistered(fen) {
        this.flexTBL.write(fen)
    }

    onHumanMoveRegistered(fen0, fen1, key0, key1) {
        this.flexBoard.allowMoves({})
        this.flexBoard.dropLayer.clear()
        this.flexBoard.hintLayer.clear()

        //this.waitForPremoves = true
        //this.flexTBL.write(fen1)
        //this.waitForPremoves = false

        if (this.extraTermination(fen0, fen1, key0, key1)) {
            this.markEnd()
            return
        }
        this.flexBoard.showLoader()
        this.flexUCI.write(fen1, 100)
//        console.log('AFTER HUMAN ' + fen1)
    }

    onEngineMoveRegistered(fen0, fen1, key0, key1) {
        this.flexBoard.hideLoader()
        const targetPieceSymbol = LOOKUP(fen0, key1)
        if (targetPieceSymbol !== '.') {
            this.flexBoard.hintLayer.showCapture(key1, targetPieceSymbol)
        }
        if (this.extraTermination(fen0, fen1, key0, key1)) {
            this.markEnd()
            return
        }
        //if (this.flexBoard.premove != null) {
        //    const preKey0 = this.flexBoard.premove[0]
        //    const preKey1 = this.flexBoard.premove[1]
        //    this.flexBoard.premove = null
        //    if (this.flexBoard.makeHumanMove(preKey0, preKey1)) {
        //        return
        //    }
        //}
        this.flexTBL.write(fen1)
//        console.log('AFTER ENGINE ' + fen1)
    }

    onTBLMessage(message) {
//        console.log('TBL MESSAGE: ' + message)
        let moves = {}
        let texts = message.split(' ')
        for(let i in texts) {
            let move = texts[i]
            if (move.length >= 4) {
                const from = move.substr(0,2)
                if (!moves.hasOwnProperty(from)) {
                    moves[from] = []
                }
                moves[from].push(move.substr(2))
            }
        }

        //if (this.waitForPremoves) {
        //    this.flexBoard.allowPremoves(moves)
        //} else {
        this.flexBoard.allowMoves(moves)

        if (Object.keys(moves).length === 0) {
            this.markEnd()
        }
        //}
    }

    onUCIMessage(message) {
//        console.log('UCI MESSAGE: ' + message)
        let m = message.split(' ')
        if (m[0] === 'bestmove') {
            let key0 = m[1].substr(0,2)
            let key1 = m[1].substr(2,4)
            this.flexBoard.makeEngineMove(key0, key1)
        } else if (m[0] === 'CHECKMATE') {
            this.markWin()
        } else if (m[0] === 'STALEMATE') {
            this.markWin()
        } else if (m[0] === 'RESIGN') {
            this.markWin()
        }

    }
}
