const ALPHABET = 'abcdefghijklmnop'.split('')

function KEY(x, y) {
    return ALPHABET[x] + Math.floor(y + 1).toString()
}

function FILE(key) {
    return key.split('')[0]
}

function RANK(key) {
    return parseInt(key.split('')[1])
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

function simplifyFen(fen) {
    return fen.split(' ')[0]
        .replace(/16/g, '................')
        .replace(/15/g, '...............')
        .replace(/14/g, '..............')
        .replace(/13/g, '.............')
        .replace(/12/g, '............')
        .replace(/11/g, '...........')
        .replace(/10/g, '..........')
        .replace(/9/g, '.........')
        .replace(/8/g, '........')
        .replace(/7/g, '.......')
        .replace(/6/g, '......')
        .replace(/5/g, '.....')
        .replace(/4/g, '....')
        .replace(/3/g, '...')
        .replace(/2/g, '..')
        .replace(/1/g, '.')
}

function flattenFen(fen) {
    return simplifyFen(fen).replace(/\//g, '')
}

function LOOKUP(fen, key) {
    const simpleFen = simplifyFen(fen)
    const tempFen = simpleFen.split('/')
    const Y = tempFen.length
    const X = tempFen[0].length
    return simpleFen.replace(/\//g, '').split('')[KEY_INDEX(key, X, Y)]
}

function forEachSquare(X, Y, onSquare) {
    for (let x = 0; x < X; x++) {
        for (let y = 0; y < Y; y++) {
            onSquare(x, y, KEY(x, y))
        }
    }
}

function restyle(dom, width, height, left, top) {
    dom.style.width = width + 'px'
    dom.style.height = height + 'px'
    dom.style.left = left + 'px'
    dom.style.top = top + 'px'
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class GenericLayer {
    constructor(dom, X, Y, zIndex) {
        this.X = X
        this.Y = Y
        this.squares = {}
        this.mark = []
        this.createDom(zIndex)
        dom.appendChild(this.layerDom)
    }

    createDom(zIndex) {
        this.layerDom = div({style: "pointer-events: none; z-index: " + zIndex})
        this.layerDom.style.position = 'absolute'
        let that = this
        forEachSquare(this.X, this.Y, function (x, y, key) {
            let squareDom = div()
            squareDom.style.position = 'absolute'
            squareDom.style.visibility = 'hidden'
            squareDom.style.zIndex = zIndex
            that.layerDom.appendChild(squareDom)
            that.squares[key] = squareDom
        })
    }

    onResize(width, height, left, top, squareSize) {
        restyle(this.layerDom, width, height, left, top)
        let that = this
        forEachSquare(this.X, this.Y, function (x, y, key) {
            restyle(that.squares[key], squareSize, squareSize, (x * squareSize), ((that.Y - y - 1) * squareSize))
        })
    }

    clear() {
        for (let index in this.mark) {
            this.squares[this.mark[index]].style.visibility = 'hidden'
        }
        this.mark = []
    }

    show(key, color) {
        this.squares[key].style.backgroundColor = color
        this.squares[key].style.visibility = 'visible'
        this.mark.push(key)
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class MoveLayer {
    constructor(flexBoard, dom, X, Y, zIndex) {
        this.flexBoard = flexBoard
        this.X = X
        this.Y = Y
        this.createVectorDom(zIndex)
        dom.appendChild(this.layerDom)
        dom.appendChild(this.source)
    }

    createVectorDom(zIndex) {
        this.layerDom = svg({
            'preserveAspectRatio': 'none',
            'viewBox': "0 0 " + (100 * this.X) + " " + (100 * this.Y),
            'style': 'position: absolute; pointer-events: none; z-index: ' + zIndex
        })
        this.source = div({style: "position: absolute; background-color: " + ACCENT + "; visibility: hidden; z-index: " + zIndex})
    }

    onResize(width, height, left, top, size) {
        this.squareSize = size
        restyle(this.layerDom, width, height, left, top)
    }

    doDot(x, y, color) {
        const sx = 100 * (x + 0.5)
        const sy = 100 * (this.Y - y - 0.5)
        this.layerDom.appendChild(circle(sx, sy, ACCENT, 20))
    }

    doDotKey(key, color) {
        this.doDot(ALPHABET.indexOf(key.split('')[0]), parseInt(key.split('')[1]) - 1, color)
    }

    doMenuDot(x, y) {
        const sx = 100 * (x + 0.5)
        const sy = 100 * (this.Y - y - 0.5)
        let outer = circle(sx, sy, FRAME, 20)
        let inner = circle(sx, sy, ACCENT, 18)
        this.layerDom.appendChild(outer)
        this.layerDom.appendChild(inner)
        return inner
    }

    doPickDot(x, y) {
        const sx = 100 * (x + 0.5)
        const sy = 100 * (this.Y - y - 0.5)
        let outer = circle(sx, sy, FRAME, 20)
        let inner = circle(sx, sy, FRAME, 18)
        this.layerDom.appendChild(outer)
        this.layerDom.appendChild(inner)
        return inner
    }

    doCap(x, y, color) {
        const sx = 100 * (x + 0.5)
        const sy = 100 * (this.Y - y - 0.5)
        this.layerDom.appendChild(circle(sx, sy, color, 50))
    }

    doCapKey(key, color) {
        this.doCap(ALPHABET.indexOf(key.split('')[0]), parseInt(key.split('')[1]) - 1, color)
    }

    doBox(key, color) {
        let x = FILE_INDEX(key)
        let y = this.Y - 1 - RANK_INDEX(key)
        this.layerDom.appendChild(box(x * 100, y*100, (x+1) * 100, (y+1) * 100, color))
    }

    clear() {
        this.layerDom.innerHTML = ''
        this.source.style.visibility = 'hidden'
    }

    showMovesFrom(key, hints) {
        return this.showColorMovesFrom(key, hints, ACCENT, ACCENT_75)
    }

    //showPremovesFrom(key, hints) {
    //    return this.showColorMovesFrom(key, hints, FRAME_75, FRAME_50)
    //}

    showColorMovesFrom(key, hints, dotColor, capColor) {
        let targetSquares = []
        if (hints.hasOwnProperty(key)) {
            this.doBox(key, dotColor)
            for (let toIndex in hints[key]) {
                let targetExt = hints[key][toIndex]
                if (targetExt.length === 2) {
                    this.doDotKey(targetExt, dotColor)
                    targetSquares.push(targetExt)
                    // hack TODO
                    //if (this.flexBoard.pieces.hasOwnProperty(targetExt)) {
                    //    this.doCapKey(targetExt)
                    //} else {
                    //    this.doDotKey(targetExt)
                    //}
                } else {
                    let cap = targetExt.substr(0, 2)
                    this.doCapKey(cap, capColor)
                    targetSquares.push(cap)
                }
            }
        }
        return targetSquares
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class ChessLayer {
    constructor(flexBoard, dom, X, Y, zIndex) {
        this.flexBoard = flexBoard

        this.X = X
        this.Y = Y

        this.zIndex = zIndex

        this.pieceImages = {}
        this.squareWraps = {}

        //this.isMove = true
        //this.isPremove = false

        this.moves = {}
        this.sourceKey = null
        this.fingerOverKey = null

        this.createDom(zIndex)
        dom.appendChild(this.layerDom)
    }

    registerMouseEvent(mouseEvent) {
        this.mouseX = mouseEvent.clientX
        this.mouseY = mouseEvent.clientY
    }

    calculateMouseShift(mouseEvent) {
        const shift = {x: mouseEvent.clientX - this.mouseX,
                       y: mouseEvent.clientY - this.mouseY}
        this.registerMouseEvent(mouseEvent)
        return shift
    }

    registerTouchEvent(touchEvent) {
        this.touchX = touchEvent.changedTouches[0].pageX
        this.touchY = touchEvent.changedTouches[0].pageY
    }

    registerBoardPointer(touchEvent) {
        const box = this.layerDom.getBoundingClientRect()
        this.boardPointerX = this.touchX - box.left
        this.boardPointerY = this.touchY - box.top
    }

    calculateTouchShift(touchEvent) {
        const shift = {x: touchEvent.changedTouches[0].pageX - this.touchX,
                       y: touchEvent.changedTouches[0].pageY - this.touchY}
        this.boardPointerX += shift.x
        this.boardPointerY += shift.y
        this.registerTouchEvent(touchEvent)
        return shift
    }

    getFingerOverKey() {
        const file_index = Math.floor(this.boardPointerX / this.squareSize)
        const rank_index = this.Y - 1 - Math.floor(this.boardPointerY / this.squareSize)
        if ((file_index >= 0) && (file_index < this.X) && (rank_index >= 0) && (rank_index < this.Y)) {
            return KEY(file_index, rank_index)
        } else {
            return null
        }
    }

    getElementOffset(element) {
        var out = element.parentNode.getBoundingClientRect()
        var box = element.getBoundingClientRect()
        var top = box.top - out.top
        var left = box.left - out.left
        return { top: top, left: left };
    }

    shiftDraggedPiece(pieceImage, shift) {
        const offset = this.getElementOffset(pieceImage)
        pieceImage.style.left = (offset.left + shift.x) + 'px'
        pieceImage.style.top = (offset.top + shift.y) + 'px'
    }

    resetDraggedPiece(pieceImage) {
        pieceImage.style.left = '0px'
        pieceImage.style.top = '0px'
    }

    acceptSource(key) {
        return this.moves.hasOwnProperty(key)
    }

    acceptTarget(key) {
        return this.targetSquares.indexOf(key) != -1
    }

    enableMoveFromSource(key) {
//        if (this.isMove) {
        this.targetSquares = this.flexBoard.moveLayer.showMovesFrom(key, this.moves)
//        } else if (this.isPremove) {
//            this.targetSquares = this.flexBoard.moveLayer.showPremovesFrom(key, this.moves)
//        }
        this.squareWraps[key].style.zIndex = this.zIndex + 1
        this.pieceImages[key].style.zIndex = this.zIndex + 1
        this.sourceKey = key
    }

    markTargetIfAcceptable(key) {
        this.flexBoard.dropLayer.clear()
        if (this.acceptTarget(key)) {
            //if (this.isMove) {
            this.flexBoard.dropLayer.show(key, ACCENT)
            //} else if (this.isPremove) {
            //    this.flexBoard.dropLayer.show(key, FRAME_75)
            //}
        }
    }

    enableMoveFromSourceWithMouse(key, mouseEvent) {
        this.enableMoveFromSource(key)
        this.registerMouseEvent(mouseEvent)
        window.onmousemove = this.onMouseMove.bind(this)
    }

    enableMoveFromSourceWithTouch(key, touchEvent) {
        this.enableMoveFromSource(key)
        this.registerTouchEvent(touchEvent)
        this.registerBoardPointer()
        window.ontouchmove = this.onTouchMove.bind(this)
    }

    clearPreviousSource() {
        this.flexBoard.moveLayer.clear()
        this.squareWraps[this.sourceKey].style.zIndex = this.zIndex
        this.pieceImages[this.sourceKey].style.zIndex = this.zIndex
        this.targetSquares = null
    }

    disablePreviousSource() {
        this.clearPreviousSource()
        this.sourceKey = null
    }

    acceptSourceTarget(sourceKey, targetKey) {
        //if (this.isMove) {
        this.flexBoard.makeHumanMove(sourceKey, targetKey)
        //} else if (this.isPremove) {
        //    this.flexBoard.makeHumanPremove(sourceKey, targetKey)
        //}
    }

    getOnMouseDown(key) {
        const onMouseDown = function(mouseEvent) {
            mouseEvent.preventDefault()
            if (this.sourceKey != null) {
                if (this.sourceKey == key) {
                    // toggle selected source square
                    this.disablePreviousSource()
                } else if (this.acceptSource(key)) {
                    // change selected source square
                    this.disablePreviousSource()
                    this.enableMoveFromSourceWithMouse(key, mouseEvent)
                } else if (this.acceptTarget(key)) {
                    // make move
                    this.clearPreviousSource()
                    this.acceptSourceTarget(this.sourceKey, key);
                    this.sourceKey = null
                } else {
                    // ignore
                }
            } else if (this.acceptSource(key)) {
                this.enableMoveFromSourceWithMouse(key, mouseEvent)
            } else {
                //ignore
            }
        }
        return onMouseDown.bind(this)
    }

    getOnMouseOver(key) {
        const onMouseOver = function(mouseEvent) {
            mouseEvent.preventDefault()
            if (this.sourceKey != null) {
                this.markTargetIfAcceptable(key)
            } else {
                this.flexBoard.moveLayer.clear()
                if (this.acceptSource(key)) {
                    //if (this.isMove) {
                    this.flexBoard.moveLayer.showMovesFrom(key, this.moves)
                    //} else if (this.isPremove) {
                    //    this.flexBoard.moveLayer.showPremovesFrom(key, this.moves)
                    //}
                }
            }
        }
        return onMouseOver.bind(this)
    }

    onMouseMove(mouseEvent) {
        mouseEvent.preventDefault()
        const shift = this.calculateMouseShift(mouseEvent)
        let pieceImage = this.pieceImages[this.sourceKey]
        this.shiftDraggedPiece(pieceImage, shift)
    }

    getOnMouseUp(key) {
        const onMouseUp = function(mouseEvent) {
            mouseEvent.preventDefault()
            window.onmousemove = null
            if (this.sourceKey == null) {
                return
            } else {
                this.resetDraggedPiece(this.pieceImages[this.sourceKey])
                if (this.acceptTarget(key)) {
                    this.clearPreviousSource()
                    this.acceptSourceTarget(this.sourceKey, key)
                    this.flexBoard.dropLayer.clear()
                    this.sourceKey = null
                }
            }
        }
        return onMouseUp.bind(this)
    }

    getOnTouchDown(key) {
        const onTouchDown = function(touchEvent) {
            touchEvent.preventDefault()
            if (this.sourceKey != null) {
                if (this.sourceKey == key) {
                    // toggle selected source square
                    this.disablePreviousSource()
                } else if (this.acceptSource(key)) {
                    // change selected source square
                    this.disablePreviousSource()
                    this.enableMoveFromSourceWithTouch(key, touchEvent)
                } else if (this.acceptTarget(key)) {
                    // make move
                    this.clearPreviousSource()
                    this.acceptSourceTarget(this.sourceKey, key);
                    this.sourceKey = null
                } else {
                    // ignore
                }
            } else if (this.acceptSource(key)) {
                this.enableMoveFromSourceWithTouch(key, touchEvent)
            } else {
                //ignore
            }
        }
        return onTouchDown.bind(this)
    }

    onTouchMove(touchEvent) {
        touchEvent.preventDefault()
        const shift = this.calculateTouchShift(touchEvent)
        let pieceImage = this.pieceImages[this.sourceKey]
        this.shiftDraggedPiece(pieceImage, shift)
        this.fingerOverKey = this.getFingerOverKey()
        this.markTargetIfAcceptable(this.fingerOverKey)
    }

    onTouchUp(touchEvent) {
        touchEvent.preventDefault()
        window.ontouchmove = null
        if (this.sourceKey == null) {
            return
        } else {
            this.resetDraggedPiece(this.pieceImages[this.sourceKey])
            if (this.acceptTarget(this.fingerOverKey)) {
                this.clearPreviousSource()
                this.acceptSourceTarget(this.sourceKey, this.fingerOverKey)
                this.fingerOverKey = null
                this.flexBoard.dropLayer.clear()
                this.sourceKey = null
            }
        }
    }

    createDom(zIndex) {
        this.layerDom = div({style: "position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: " + zIndex})
        let that = this
        forEachSquare(this.X, this.Y, function (x, y, key) {
            let squareWrap = div()
            squareWrap.style.position = 'absolute'
            squareWrap.style.zIndex = zIndex
            that.layerDom.appendChild(squareWrap)
            that.squareWraps[key] = squareWrap

            squareWrap.addEventListener('mousedown', that.getOnMouseDown(key))
            squareWrap.addEventListener('mouseover', that.getOnMouseOver(key))
            squareWrap.addEventListener('mouseup', that.getOnMouseUp(key))

            squareWrap.addEventListener('touchstart', that.getOnTouchDown(key))
        })
        document.ontouchend = this.onTouchUp.bind(this)
    }

    onResize(width, height, left, top, squareSize) {
        this.squareSize = squareSize
        restyle(this.layerDom, width, height, left, top)
        let that = this
        forEachSquare(this.X, this.Y, function (x, y, key) {
            restyle(that.squareWraps[key], squareSize, squareSize, (x * squareSize), ((that.Y - y - 1) * squareSize))
        })
    }

    clear(key) {
        this.squareWraps[key].innerHTML = ''
    }

    show(key, pieceSymbol) {
        const piece = (isUpper(pieceSymbol)) ? ('w' + pieceSymbol) : ('b' + toUpper(pieceSymbol))

        let pieceDom = img({
            src: 'img/chesspieces/staunty/' + piece + '.png',
            style: 'position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: ' + this.zIndex
        })

        this.squareWraps[key].innerHTML = ''
        this.squareWraps[key].appendChild(pieceDom)
        this.pieceImages[key] = pieceDom
    }

    move(key0, key1, promotion) {
        let pieceImage = this.pieceImages[key0]
        this.squareWraps[key0].innerHTML = ''
        delete this.pieceImages[key0]
        if (promotion != null) {
            this.show(key1, promotion)
        } else {
            this.squareWraps[key1].innerHTML = ''
            this.squareWraps[key1].appendChild(pieceImage)
            this.pieceImages[key1] = pieceImage
        }
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class MenuLayer {
    constructor(flexBoard, dom, X, Y, MIN_X, MIN_Y, MAX_X, MAX_Y, zIndex, changeResolution, startActivityIntent) {
        this.flexBoard = flexBoard

        this.X = X
        this.Y = Y
        this.markedKey = KEY(this.X - 1, this.Y - 1)

        this.MIN_X = MIN_X
        this.MIN_Y = MIN_Y

        this.MAX_X = MAX_X
        this.MAX_Y = MAX_Y

        this.zIndex = zIndex

        this.changeResolution = changeResolution
        this.startActivityIntent = startActivityIntent

        this.squareWraps = {}

        this.dots = {}

        this.createDom(zIndex)
        dom.appendChild(this.layerDom)
        dom.appendChild(this.frameDom)
    }

    reframe(x, y) {
        this.frameDom.style.left = (this.left - this.frameThickness) + 'px'
        this.frameDom.style.top = (this.top + (this.MAX_Y - this.Y) * this.squareSize - this.frameThickness) + 'px'
        this.frameDom.style.width = (this.X * this.squareSize + 2 * this.frameThickness) + 'px'
        this.frameDom.style.height = (this.Y * this.squareSize + 2 * this.frameThickness) + 'px'

        let that = this
        that.flexBoard.moveLayer.clear(x, y)
        forEachSquare(this.MAX_X, this.MAX_Y, function (xx, yy, key) {
            if (that.isValid(xx + 1, yy + 1)) {
                that.dots[key] = that.flexBoard.moveLayer.doMenuDot(xx, yy)
            }
        })
    }

    isValid(x, y) {
        return ((x >= this.MIN_X) && (y >= this.MIN_Y) && (x <= this.MAX_X) && (y <= this.MAX_Y))
    }

    onSquareClick(key) {
        const x = FILE_INDEX(key) + 1
        const y = RANK_INDEX(key) + 1
        if (!this.isValid(x, y)) {
            return
        }
        this.changeResolution(x, y)
        this.startActivityIntent(this.X, this.Y)
    }

    onSquareOver(key) {
            const x = FILE_INDEX(key) + 1
            const y = RANK_INDEX(key) + 1
            if (!this.isValid(x, y)) {
                return
            }
            this.X = x
            this.Y = y
            this.reframe(this.X, this.Y)
            this.dots[this.markedKey].setAttribute('fill', ACCENT)
            this.markedKey = key
            this.dots[this.markedKey].setAttribute('fill', FRAME)
            this.flexBoard.dropLayer.clear()
            this.flexBoard.dropLayer.show(key, ACCENT)
    }


    createDom(zIndex) {
        this.layerDom = div({style: "position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: " + zIndex})
        let that = this
        forEachSquare(this.MAX_X, this.MAX_Y, function (x, y, key) {
            let squareWrap = div()
            squareWrap.style.position = 'absolute'
            squareWrap.style.zIndex = zIndex
            that.layerDom.appendChild(squareWrap)
            that.squareWraps[key] = squareWrap
            squareWrap.addEventListener('click', function () {
                that.onSquareClick(key)
            })
            squareWrap.addEventListener('mouseover', function () {
                if (that.dots.hasOwnProperty(key)) {
                  that.onSquareOver(key)
                }
            })
        })
        this.frameDom = div({style: "position: absolute; pointer-events: none; bottom: 0; left: 0; z-index: " + (2 * zIndex)})
        this.frameDom.style.border = '3px solid ' + FRAME
    }

    onResize(width, height, left, top, squareSize, frameThickness) {
        restyle(this.layerDom, width, height, left, top)
        let that = this
        forEachSquare(this.MAX_X, this.MAX_Y, function (x, y, key) {
            restyle(that.squareWraps[key], squareSize, squareSize, (x * squareSize), ((that.MAX_Y - y - 1) * squareSize))
        })
        this.left = left
        this.top = top
        this.squareSize = squareSize
        this.frameThickness = frameThickness
        this.reframe(this.X, this.Y)
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class HintLayer {
    constructor(flexBoard, dom, X, Y, zIndex) {
        this.flexBoard = flexBoard

        this.X = X
        this.Y = Y

        this.zIndex = zIndex

        this.createDom(zIndex)
        dom.appendChild(this.layerDom)

//        this.markers = {}
        this.captures = {}
    }

    createDom(zIndex) {
        this.layerDom = div({style: "position: absolute; pointer-events: none; top: 0; bottom: 0; left: 0; right: 0; z-index: " + zIndex})
    }

    restyleCapture(key, dom) {
        const captureSize = this.squareSize / 3
        dom.style.width = captureSize + 'px'
        dom.style.height = captureSize + 'px'
        dom.style.left = (((FILE_INDEX(key) + 1) * this.squareSize - captureSize)) + 'px'
        dom.style.top = ((this.Y - 1 - RANK_INDEX(key)) * this.squareSize) + 'px'
    }
/*
    restyleMarker(key, dom) {
        const markerSize = this.squareSize / 2
        dom.style.width = markerSize + 'px'
        dom.style.height = markerSize + 'px'
        dom.style.left = (((FILE_INDEX(key) + 1) * this.squareSize - markerSize)) + 'px'
        dom.style.top = ((this.Y - RANK_INDEX(key) - 1) * this.squareSize - markerSize) + 'px'
    }
*/
    onResize(width, height, left, top, squareSize, frame) {
        restyle(this.layerDom, width, height, left, top)
        this.left = left + frame
        this.top = top + frame
        this.squareSize = squareSize
        //for (let key in this.markers) {
        //    this.restyleMarker(key, this.markers[key])
        //}
        for (let key in this.captures) {
            this.restyleCapture(key, this.captures[key])
        }
    }

    clear() {
        //this.markers = {}
        this.captures = {}
        this.layerDom.innerHTML = ''
    }

/*
    showMarker(key, markerType) {
        let markerDom = img({src: 'img/markers/wychess-marker-' + markerType + '.png', style: 'position: absolute;'})
        this.layerDom.appendChild(markerDom)
        this.restyleMarker(key, markerDom)
        this.markers[key] = markerDom
    }
*/
    showCapture(key, pieceSymbol) {
        const piece = (isUpper(pieceSymbol)) ? ('w' + pieceSymbol) : ('b' + toUpper(pieceSymbol))
        let pieceDom = img({
            src: 'img/chesspieces/staunty/' + piece + '.png',
            style: 'position: absolute; pointer-events: none;'
        })
        this.layerDom.appendChild(pieceDom)
        this.restyleCapture(key, pieceDom)
        const DISPLAY_MILLIS = 3000
        setTimeout(function() {
            pieceDom.style.opacity = 0
            pieceDom.style.transition = 'opacity 0.5s'
        }, DISPLAY_MILLIS)
        this.captures[key] = pieceDom
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class FlexBoard {
    constructor(flexDom, X, Y, config) {
        const defaultConfig = {
          onPositionRegistered: this.defaultOnPositionRegistered.bind(this),
          onHumanMoveRegistered: this.defaultOnHumanMoveRegistered.bind(this),
          onEngineMoveRegistered: this.defaultOnEngineMoveRegistered.bind(this),
          marginPercent: 3
        }
        this.config = {...defaultConfig, ...config}

        this.sideToMove = 0

        this.X = X
        this.Y = Y

        this.hints = {}

        this.pieces = {}
        this.squares = {}
        this.squareMetas = {}

        this.outerDom = flexDom
        this.innerDom = this.createInnerDom()
        this.boardDom = this.createBoardDom()
        this.outerDom.appendChild(this.innerDom)
        this.innerDom.appendChild(this.boardDom)
        this.loaderDom = this.createLoaderDom()
        this.outerDom.appendChild(this.loaderDom)

        this.dropLayer = new GenericLayer(this.innerDom, X, Y, 100)
        this.lastLayer = new GenericLayer(this.innerDom, X, Y, 200)
        this.moveLayer = new MoveLayer(this, this.innerDom, X, Y, 300)
        this.hintLayer = new HintLayer(this, this.innerDom, X, Y, 400)

        this.innerDom.appendChild(this.dropLayer.layerDom)
        this.innerDom.appendChild(this.lastLayer.layerDom)
        this.innerDom.appendChild(this.moveLayer.layerDom)
        this.innerDom.appendChild(this.hintLayer.layerDom)

        //this.lastMove = null

        this.actAsMenu = config.hasOwnProperty('startActivityIntent')

        if (!this.actAsMenu) {
            this.chessLayer = new ChessLayer(this, this.innerDom, X, Y, 500)
            this.innerDom.appendChild(this.chessLayer.layerDom)
        } else {
            this.menuLayer = new MenuLayer(this, this.innerDom, config.defaultX, config.defaultY, config.minX, config.minY, this.X, this.Y, 500, config.changeResolution, config.startActivityIntent)
            this.innerDom.appendChild(this.menuLayer.layerDom)
            this.innerDom.appendChild(this.menuLayer.frameDom)
        }

        window.addEventListener('resize', this.onResize.bind(this))
        this.ON_RESIZE_DEBOUNCE_MILLIS = 1000

        this.onResizeDebounced()
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    defaultOnPositionRegistered(fen) {

    }

    defaultOnHumanMoveRegistered(fen0, fen1, key0, key1) {

    }

    defaultOnEngineMoveRegistered(fen0, fen1, key0, key1) {

    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    makeMoveAnd(key0, key1, moveFunction, moveCallback) {
        const fen0 = this.dump()
        if (!moveFunction(key0, key1)) {
            return false
        }
        const fen1 = this.dump()
        moveCallback(fen0, fen1, key0, key1)
        return true
    }

    makeHumanMove(key0, key1) {
        return this.makeMoveAnd(key0, key1, this.makeMove.bind(this), this.config.onHumanMoveRegistered)
    }

    //makeHumanPremove(key0, key1) {
    //    this.lastLayer.clear()
    //    if (this.lastMove != null) {
    //        this.lastLayer.show(lastMove[0], LAST)
    //        this.lastLayer.show(lastMove[1], LAST)
    //    }
    //    this.lastLayer.show(key0, FRAME_50)
    //    this.lastLayer.show(key1, FRAME_50)
    //    return this.premove = [key0, key1]
    //}

    makeEngineMove(key0, key1) {
        return this.makeMoveAnd(key0, key1, this.makeMoveUnsafe.bind(this), this.config.onEngineMoveRegistered)
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    createInnerDom() {
        const MP = this.config.marginPercent + '%'
        return div({style: "position: absolute; left: " + MP + "; right: " + MP + "; top: " + MP + "; bottom: " + MP + ";"})
    }

    createBoardDom() {
        let boardDom = div({style: "z-index: 0"})
        boardDom.style.position = 'absolute'
        boardDom.style.top = '0px'
        boardDom.style.left = '0px'
        boardDom.style.border = '3px solid ' + FRAME
        let that = this
        this.forEachSquare(function (x, y, key) {
            let squareDom = div({style: "z-index: 1"})
            squareDom.style.position = 'absolute'
            that.squares[key] = squareDom
            boardDom.append(squareDom)
            let isWhite = (x + that.Y - y) % 2 === 1
            if (isWhite) {
                squareDom.style.backgroundColor = WHITE
            } else {
                squareDom.style.backgroundColor = BLACK
            }
        })
        return boardDom
    }

    createLoaderDom() {
        return img({src: 'img/loader.gif', style: "position: absolute; visibility: hidden;"})
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    showLoader() {
        this.loaderDom.style.visibility = 'visible'
    }

    hideLoader() {
        this.loaderDom.style.visibility = 'hidden'
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    forEachSquare(onSquare) {
        forEachSquare(this.X, this.Y, onSquare)
    }

    onResize() {
        this.onResizeMillis = Date.now()
        setTimeout(this.onResizeDebounceCheck.bind(this), this.ON_RESIZE_DEBOUNCE_MILLIS)
    }

    onResizeDebounceCheck() {
        if (this.onResizeMillis < Date.now() - this.ON_RESIZE_DEBOUNCE_MILLIS) {
            this.onResizeDebounced()
        } else {
            setTimeout(this.onResizeDebounceCheck.bind(this), this.ON_RESIZE_DEBOUNCE_MILLIS)
        }
    }

    onResizeDebounced() {
        const frame = 3

        const outerWidth = this.outerDom.offsetWidth
        const outerHeight = this.outerDom.offsetHeight

        const innerWidth = this.innerDom.offsetWidth - 2 * frame
        const innerHeight = this.innerDom.offsetHeight - 2 * frame

        const outerMarginTop = (outerHeight - innerHeight) / 2
        const outerMarginLeft = (outerWidth - innerWidth) / 2

        const outerRatio = innerHeight / innerWidth
        const boardRatio = this.Y / this.X

        const MAX_LOADER_SIZE = 100

        if (outerRatio > boardRatio) {
            this.squareSize = Math.floor(innerWidth / this.X)

            this.boardWidth = this.squareSize * this.X
            this.boardHeight = this.squareSize * this.Y

            this.topMargin = (innerHeight - this.boardHeight) / 2
            this.leftMargin = (innerWidth - this.boardWidth) / 2

            this.loaderSpace = outerMarginTop + this.topMargin
            this.loaderSize = Math.min(Math.min(MAX_LOADER_SIZE, this.loaderSpace / 2), this.loaderSpace * 0.8)
            this.loaderLeft = (outerWidth - this.loaderSize) / 2
            this.loaderTop = (outerMarginTop + this.topMargin - this.loaderSize) / 2
        } else {
            this.squareSize = Math.floor(innerHeight / this.Y)

            this.boardWidth = this.squareSize * this.X
            this.boardHeight = this.squareSize * this.Y

            this.topMargin = 0
            this.leftMargin = (innerWidth - this.boardWidth) / 2

            this.loaderSpace = outerMarginLeft + this.leftMargin
            this.loaderSize = Math.min(Math.min(MAX_LOADER_SIZE, this.loaderSpace / 2), this.loaderSpace * 0.8)
            this.loaderLeft = (outerMarginLeft + this.leftMargin - this.loaderSize) / 2
            this.loaderTop = (outerHeight - this.loaderSize) / 2
        }

        this.boardDom.style.width = 2 * frame + this.boardWidth + 'px'
        this.boardDom.style.height = 2 * frame + this.boardHeight + 'px'

        this.boardDom.style.top = this.topMargin + 'px'
        this.boardDom.style.left = this.leftMargin + 'px'

        let that = this
        this.forEachSquare(function (x, y, key) {
            const squareSize = that.squareSize
            restyle(that.squares[key], squareSize, squareSize, (x * squareSize), ((that.Y - y - 1) * squareSize))
        })

        this.dropLayer.onResize(this.boardWidth, this.boardHeight,
            frame + this.leftMargin, frame + this.topMargin, this.squareSize)
        this.lastLayer.onResize(this.boardWidth, this.boardHeight,
            frame + this.leftMargin, frame + this.topMargin, this.squareSize)
        this.moveLayer.onResize(this.boardWidth, this.boardHeight,
            frame + this.leftMargin, frame + this.topMargin, this.squareSize)
        this.hintLayer.onResize(this.boardWidth, this.boardHeight,
            frame + this.leftMargin, frame + this.topMargin, this.squareSize, frame)

        if (!this.actAsMenu) {
            this.chessLayer.onResize(this.boardWidth, this.boardHeight,
                frame + this.leftMargin, frame + this.topMargin, this.squareSize)
        } else {
            this.menuLayer.onResize(this.boardWidth, this.boardHeight,
                frame + this.leftMargin, frame + this.topMargin, this.squareSize, frame)
        }

        restyle(this.loaderDom, this.loaderSize, this.loaderSize, this.loaderLeft, this.loaderTop)
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    dump() {
        let note = []
        let line = []
        let empty = 0
        for (let y = this.Y - 1; y >= 0; y--) {
            for (let x = 0; x < this.X; x++) {
                let key = KEY(x, y)
                if (this.pieces.hasOwnProperty(key)) {
                    if (empty > 0) {
                        line.push(empty)
                        empty = 0
                    }
                    line.push(this.pieces[key])
                } else {
                    empty += 1
                }
            }
            if (empty > 0) {
                line.push(empty)
                empty = 0
            }
            note.push(line.join(''))
            line = []
        }
        return note.join('/') + ' ' + ((this.sideToMove == 0) ? "w" : "b") + ' - - 0 ' + Math.floor((this.plyCount + 1) / 2)
    }

    fen(flexfen) {
        if (typeof flexfen === "undefined") {
            return this.dump()
        }

        const fenSplit = flexfen.split(' ')
        if (fenSplit.length != 6) {
          this.plyCount = 1
        } else {
          this.plyCount = parseInt(fenSplit[5]) * 2 - ((fenSplit[1] == 'w') ? 1 : 0)
        }

        const boardArray = flattenFen(flexfen.split(' ')[0]).split('')

        if (boardArray.length != this.X * this.Y) {
            throw "Corrupted FEN"
        }

        let that = this
        this.forEachSquare(function (x, y, key) {
            const pieceSymbol = boardArray[x + (that.Y - y - 1) * that.X]
            let piece = ''
            if (pieceSymbol == '.') {
                return
            }
            that.pieces[key] = pieceSymbol
            that.chessLayer.show(key, pieceSymbol)
        })

        this.hints = {}

        this.dropLayer.clear()
        this.moveLayer.clear()
        this.lastLayer.clear()

        this.config.onPositionRegistered(this.dump())
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    isOnPromoteRank(key) {
        const rank = RANK(key)
        return (rank === 1) || (rank === this.Y)
    }

    promoteIfPossible(key) {
        if (this.isOnPromoteRank(key)) {
            if (this.pieces[key] === 'p') {
                this.pieces[key] = 'q'
                return 'q'
            }
            if (this.pieces[key] === 'P') {
                this.pieces[key] = 'Q'
                return 'Q'
            }
        }
        return null
    }

    makeMove(key0, key1) {
        if (!this.hints.hasOwnProperty(key0)) {
            return false
        } else if (
            (this.hints[key0].indexOf(key1) === -1)
            &&
            (this.hints[key0].indexOf(key1 + 'x') === -1)) {
            return false
        }
        return this.makeMoveUnsafe(key0, key1)
    }

    makeMoveUnsafe(key0, key1) {
        try {
            this.pieces[key1] = this.pieces[key0]
            delete this.pieces[key0]

            const promotion = this.promoteIfPossible(key1)

            this.sideToMove = 1 - this.sideToMove

            //this.lastMove = [key0, key1]
            this.lastLayer.clear()
            this.lastLayer.show(key0, LAST)
            this.lastLayer.show(key1, LAST)

            this.chessLayer.move(key0, key1, promotion)

            this.plyCount += 1

            this.chessLayer.clickKey = null

            return true
        } catch (e) {
            return false
        }
    }

    allowMoves(moves) {
        this.hints = moves
        //this.chessLayer.isPremove = false
        //this.chessLayer.isMove = true
        this.chessLayer.moves = moves
    }

    //allowPremoves(moves) {
    //    this.chessLayer.isMove = false
    //    this.chessLayer.isPremove = true
    //    this.chessLayer.moves = moves
    //}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// compatibility with chessboardjs

    position(fenString) {
        if ((typeof fenString == "undefined") || (fenString === null)) {
            return this.dump()
        } else {
            this.fen(fenString)
        }
    }
}
