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
        FOR_EACH_KEY(this.X, this.Y, function (xz, yz, key) {
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
        FOR_EACH_KEY(this.X, this.Y, function (xz, yz, key) {
            restyle(that.squares[key], squareSize, squareSize, (xz * squareSize), ((that.Y - yz - 1) * squareSize))
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

    highlight(keys, color) {
        this.clear()
        keys.forEach(key => this.show(key, color))
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

    doBorderDot(xz, yz, outerColor, innerColor) {
        const sx = 100 * (xz + 0.5)
        const sy = 100 * (this.Y - yz - 0.5)
        let outer = circle(sx, sy, outerColor, 20)
        let inner = circle(sx, sy, innerColor, 18)
        this.layerDom.appendChild(outer)
        this.layerDom.appendChild(inner)
        return inner
    }

    doDot(xz, yz, color) {
        const sx = 100 * (xz + 0.5)
        const sy = 100 * (this.Y - yz - 0.5)
        this.layerDom.appendChild(circle(sx, sy, color, 20))
    }

    doDotKey(key, color) {
        this.doBorderDot(ALPHABET.indexOf(key.split('')[0]), parseInt(key.split('')[1]) - 1, DOT_HINT_OUTER, color)
    }

    doMenuDot(xz, yz) {
        return this.doBorderDot(xz, yz, DOT_MENU_OUTER, DOT_MENU_INNER_NORM)
    }

    doCap(xz, yz, color) {
        const sx = 100 * (xz + 0.5)
        const sy = 100 * (this.Y - yz - 0.5)
        this.layerDom.appendChild(circle(sx, sy, color, 50))
    }

    doCapKey(key, color) {
        this.doCap(ALPHABET.indexOf(key.split('')[0]), parseInt(key.split('')[1]) - 1, color)
    }

    doBox(key, color) {
        let xz = FILE_INDEX(key)
        let yz = this.Y - 1 - RANK_INDEX(key)
        this.layerDom.appendChild(box(xz * 100, yz*100, (xz+1) * 100, (yz+1) * 100, color))
    }

    clear() {
        this.layerDom.innerHTML = ''
        this.source.style.visibility = 'hidden'
    }

    showMovesFrom(key, hints) {
        return this.showColorMovesFrom(key, hints, DOT_HINT_INNER, CAP_HINT)
    }

    showColorMovesFrom(key, hints, dotColor, capColor) {
        let targetSquares = []
        if (hints.hasOwnProperty(key)) {
            this.doBox(key, dotColor)
            for (let toIndex in hints[key]) {
                let targetKey = hints[key][toIndex]
                if (this.flexBoard.pieces.hasOwnProperty(targetKey)) {
                    this.doCapKey(targetKey, capColor)
                    targetSquares.push(targetKey)
                } else {
                    this.doDotKey(targetKey, dotColor)
                    targetSquares.push(targetKey)
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
        this.outerDom = dom

        this.X = X
        this.Y = Y

        this.zIndex = zIndex

        this.pieceImages = {}
        this.squareWraps = {}

        this.touchIdentifier = null
        touchCancelCallbacks.push(this.onTouchCancel.bind(this))
        window.ontouchcancel = touchCancel

        this.moves = {}
        this.sourceKey = null
        this.fingerOverKey = null

        this.createDom(this.zIndex)
        this.outerDom.appendChild(this.layerDom)
    }

    cancel() {
        this.sourceKey = null
        this.fingerOverKey = null
    }

    reset() {
        this.layerDom.parentNode.removeChild(this.layerDom)
        this.createDom(this.zIndex)
        this.outerDom.appendChild(this.layerDom)
        this.doOnResize()
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

    registerTouchEvent(changedTouch) {
        this.touchX = changedTouch.pageX
        this.touchY = changedTouch.pageY
    }

    registerBoardPointer(touchEvent) {
        const box = this.layerDom.getBoundingClientRect()
        this.boardPointerX = this.touchX - box.left
        this.boardPointerY = this.touchY - box.top
    }

    calculateTouchShift(changedTouch) {
        const shift = {x: changedTouch.pageX - this.touchX,
                       y: changedTouch.pageY - this.touchY}
        this.boardPointerX += shift.x
        this.boardPointerY += shift.y
        this.registerTouchEvent(changedTouch)
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
        this.targetSquares = this.flexBoard.moveLayer.showMovesFrom(key, this.moves)
        this.squareWraps[key].style.zIndex = this.zIndex + 1
        this.pieceImages[key].style.zIndex = this.zIndex + 1
        this.sourceKey = key
    }

    markTargetIfAcceptable(key) {
        this.flexBoard.dropLayer.clear()
        if (this.acceptTarget(key)) {
            this.flexBoard.dropLayer.show(key, ACCENT)
        }
    }

    enableMoveFromSourceWithMouse(key, mouseEvent) {
        this.enableMoveFromSource(key)
        this.registerMouseEvent(mouseEvent)
        window.onmousemove = this.onMouseMove.bind(this)
    }

    enableMoveFromSourceWithTouch(key, changedTouch) {
        this.enableMoveFromSource(key)
        this.registerTouchEvent(changedTouch)
        this.registerBoardPointer()
        window.ontouchmove = this.onTouchMove.bind(this)
//        throttle(this.onTouchMove.bind(this), DEFAULT_THROTTLE_RATE)
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
        this.flexBoard.makeHumanMove(sourceKey, targetKey)
    }

    getOnMouseDown(key) {
        const onMouseDown = function(mouseEvent) {
            mouseEvent.preventDefault()
            if (this.sourceKey != null) {
                if (this.sourceKey == key) {
                    // toggle selected source square
                    this.disablePreviousSource()
                } else if (this.acceptTarget(key)) {
                    // make move
                    this.clearPreviousSource()
                    this.acceptSourceTarget(this.sourceKey, key);
                    this.sourceKey = null
                } else if (this.acceptSource(key)) {
                    // change selected source square
                    this.disablePreviousSource()
                    this.enableMoveFromSourceWithMouse(key, mouseEvent)
                } else {
                    // ignore
                }
            } else if (this.acceptSource(key)) {
                this.enableMoveFromSourceWithMouse(key, mouseEvent)
            } else {
                //ignore
            }
        }.bind(this)
        return onMouseDown
    }

    getOnMouseOver(key) {
        const onMouseOver = function(mouseEvent) {
            mouseEvent.preventDefault()
            if (this.sourceKey != null) {
                this.markTargetIfAcceptable(key)
            } else {
                this.flexBoard.moveLayer.clear()
                if (this.acceptSource(key)) {
                    this.flexBoard.moveLayer.showMovesFrom(key, this.moves)
                }
            }
        }.bind(this)
        return onMouseOver
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
            if (this.sourceKey != null) {
                this.resetDraggedPiece(this.pieceImages[this.sourceKey])
                if (this.acceptTarget(key)) {
                    this.clearPreviousSource()
                    this.acceptSourceTarget(this.sourceKey, key)
                    this.flexBoard.dropLayer.clear()
                    this.sourceKey = null
                }
            }
        }.bind(this)
        return onMouseUp
    }

    getOnTouchDown(key) {
        const onTouchDown = function(touchEvent) {
            if (this.touchIdentifier != null) {
                return
            }
            const changedTouch = touchEvent.changedTouches[0]
            this.touchIdentifier = changedTouch.identifier
            window.ontouchend = this.onTouchUp.bind(this)
            if (this.sourceKey != null) {
                if (this.sourceKey == key) {
                    // toggle selected source square
                    this.disablePreviousSource()
                } else if (this.acceptTarget(key)) {
                    // make move
                    this.clearPreviousSource()
                    this.acceptSourceTarget(this.sourceKey, key);
                    this.sourceKey = null
                } else if (this.acceptSource(key)) {
                    // change selected source square
                    this.disablePreviousSource()
                    this.enableMoveFromSourceWithTouch(key, changedTouch)
                } else {
                    // ignore
                }
            } else if (this.acceptSource(key)) {
                this.enableMoveFromSourceWithTouch(key, changedTouch)
            } else {
                //ignore
            }
        }.bind(this)
        return onTouchDown
    }

    onTouchMove(touchEvent) {
        const changedTouches = Array.from(touchEvent.changedTouches).filter(t => t.identifier === this.touchIdentifier)
        if (changedTouches.length === 0) {
            return
        }
        const changedTouch = changedTouches[0]
        const shift = this.calculateTouchShift(changedTouch)
        let pieceImage = this.pieceImages[this.sourceKey]
        this.shiftDraggedPiece(pieceImage, shift)
        this.fingerOverKey = this.getFingerOverKey()
        this.markTargetIfAcceptable(this.fingerOverKey)
    }

    onTouchUp(touchEvent) {
        touchEvent.preventDefault()
        if (this.onTouchCancel(touchEvent)) {
            return
        }
        if (this.sourceKey != null) {
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

    onTouchCancel(touchEvent) {
        const changedTouches = Array.from(touchEvent.changedTouches).filter(t => t.identifier === this.touchIdentifier)
        if (changedTouches.length === 0) {
            return true
        }
        window.ontouchmove = null
        window.ontouchend = null
        this.touchIdentifier = null
        return false
    }

    createDom(zIndex) {
        this.layerDom = div({style: "position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: " + zIndex})
        let that = this
        FOR_EACH_KEY(this.X, this.Y, function (xz, yz, key) {
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
    }

    onResize(width, height, left, top, squareSize) {
        this.width = width
        this.height = height
        this.left = left
        this.top = top
        this.squareSize = squareSize
        this.doOnResize()
    }

    doOnResize() {
        restyle(this.layerDom, this.width, this.height, this.left, this.top)
        let that = this
        FOR_EACH_KEY(this.X, this.Y, function (xz, yz, key) {
            let squareSize = that.squareSize
            restyle(that.squareWraps[key], squareSize, squareSize, (xz * squareSize), ((that.Y - yz - 1) * squareSize))
        })
    }

    clear(key) {
        this.squareWraps[key].innerHTML = ''
    }

    getImage(pieceSymbol, opacity) {
        const piece = (isUpper(pieceSymbol)) ? ('w' + pieceSymbol) : ('b' + toUpper(pieceSymbol))

        let pieceDom = img({
            src: 'img/chesspieces/staunty/' + piece + '.png',
            style: 'position: absolute; width: 100%; height: 100%; pointer-events: none; z-index: ' + this.zIndex + '; opacity: ' + opacity
        })

        return pieceDom
    }

    show(key, pieceSymbol) {
        let pieceDom = this.getImage(pieceSymbol)
        this.squareWraps[key].innerHTML = ''
        this.squareWraps[key].appendChild(pieceDom)
        this.pieceImages[key] = pieceDom
    }
/*
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
*/
/*
    morph(key, pPromoted) {
        let piece = this.pieceImages[key]
        let square = this.squareWraps[key]
        let over = this.getImage(pPromoted, 0)
        piece.style.opacity = 0
        piece.style.transition = 'opacity 0.2s'
        square.appendChild(over)
        over.style.opacity = 0
        over.style.transition = 'opacity 0.2s'
        setTimeout(function() {
            piece.parentNode.removeChild(piece)
        }.bind(this), 200)
    }
*/
    promote(key0, keyPromoted, pPromoted) {
        let piece0 = this.pieceImages[key0]
        let square0 = this.squareWraps[key0]
        delete this.pieceImages[key0]
        square0.innerHTML = ''
        this.show(keyPromoted, pPromoted)
        /*
        let piece0 = this.pieceImages[key0]
        let square1 = this.squareWraps[keyPromoted]

        this.animate(key0, keyPromoted);

        const DISPLAY_MILLIS = 250

        setTimeout(function() {
            this.morph(keyPromoted, pPromoted)
        }.bind(this), DISPLAY_MILLIS)
        */
    }

    destroy(key) {
        if (this.pieceImages.hasOwnProperty(key)) {
            const piece = this.pieceImages[key]
            piece.parentNode.removeChild(piece)
        }
    }

    animate(key0, key1) {
        let piece0 = this.pieceImages[key0]
        let square1 = this.squareWraps[key1]
        square1.innerHTML = ''
        square1.appendChild(piece0)
        delete this.pieceImages[key0]
        this.pieceImages[key1] = piece0
        /*
        let piece0 = this.pieceImages[key0]
        let square1 = this.squareWraps[key1]

        const box0 = piece0.getBoundingClientRect()
        const box1 = square1.getBoundingClientRect()

        const left = box1.left - box0.left
        const top = box1.top - box0.top
        const DISPLAY_MILLIS = 200

        piece0.style.transition = 'translate(' + left + 'px, ' + top + 'px) 0.2s ease-in-out'
        setTimeout(function() {
            square1.innerHTML = ''
            square1.appendChild(piece0)
            piece0.style.left = "0px"
            piece0.style.top = "0px"
        }, DISPLAY_MILLIS)

         */
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class MenuLayer {
    constructor(flexBoard, dom, X, Y, MIN_X, MIN_Y, MAX_X, MAX_Y, zIndex, changeResolution, startActivityIntent, touchMenu) {
        this.flexBoard = flexBoard

        this.X = X
        this.Y = Y
        this.selectedKey = KEY(this.X - 1, this.Y - 1)

        this.MIN_X = MIN_X
        this.MIN_Y = MIN_Y

        this.MAX_X = MAX_X
        this.MAX_Y = MAX_Y

        this.zIndex = zIndex

        this.touchMenu = touchMenu
        this.changeResolution = changeResolution
        this.startActivityIntent = startActivityIntent

        this.squareWraps = {}

        this.dots = {}

        this.createDom(zIndex)
        dom.appendChild(this.layerDom)
        dom.appendChild(this.frameDom)

        this.onSquareOver(X - 1, Y - 1, this.selectedKey)
    }

    reframe() {
        this.frameDom.style.left = (this.left - this.frameThickness) + 'px'
        this.frameDom.style.top = (this.top + (this.MAX_Y - this.Y) * this.squareSize - this.frameThickness) + 'px'
        this.frameDom.style.width = (this.X * this.squareSize + 2 * this.frameThickness) + 'px'
        this.frameDom.style.height = (this.Y * this.squareSize + 2 * this.frameThickness) + 'px'

        this.flexBoard.dropLayer.clear()
        this.flexBoard.dropLayer.show(this.selectedKey, ACCENT)
    }

    isValid(x, y) {
        return ((x >= this.MIN_X) && (y >= this.MIN_Y) && (x <= this.MAX_X) && (y <= this.MAX_Y))
    }

    onSquareTouch(xz, yz, key) {
        if (key !== this.selectedKey) {
            this.onSquareOver(xz, yz, key)
            this.changeResolution(this.X, this.Y)
        } else {
            this.onSquareClick(xz, yz, key)
        }
    }

    onSquareClick(xz, yz, key) {
        this.X = xz + 1
        this.Y = yz + 1
        this.changeResolution(this.X, this.Y)
        this.startActivityIntent(this.X, this.Y)
    }

    onSquareOver(xz, yz, key) {
        this.X = xz + 1
        this.Y = yz + 1
        this.dots[this.selectedKey].setAttribute('fill', DOT_MENU_INNER_NORM)
        this.selectedKey = key
        this.dots[this.selectedKey].setAttribute('fill', DOT_MENU_INNER_PICK)
        this.reframe()
    }

    createDom(zIndex) {
        this.layerDom = div({style: "position: absolute; top: 0; bottom: 0; left: 0; right: 0; z-index: " + zIndex})
        let that = this
        FOR_EACH_KEY(this.MAX_X, this.MAX_Y, function (xz, yz, key) {
            let squareWrap = div()
            squareWrap.style.position = 'absolute'
            squareWrap.style.zIndex = zIndex
            that.layerDom.appendChild(squareWrap)
            that.squareWraps[key] = squareWrap
            if (!that.isValid(xz+1, yz+1)) {
                return
            }
            that.dots[key] = that.flexBoard.moveLayer.doMenuDot(xz, yz)
            if (that.touchMenu) {
                squareWrap.addEventListener('touchstart', function () {
                    that.onSquareTouch(xz, yz, key)
                })
            } else {
                squareWrap.addEventListener('click', function () {
                    that.onSquareClick(xz, yz, key)
                })
                squareWrap.addEventListener('mouseover', function () {
                    if (that.dots.hasOwnProperty(key)) {
                      that.onSquareOver(xz, yz, key)
                    }
                })
            }
        })
        this.frameDom = div({style: "position: absolute; pointer-events: none; bottom: 0; left: 0; z-index: " + (2 * zIndex)})
        this.frameDom.style.border = '3px solid ' + FRAME
    }

    onResize(width, height, left, top, squareSize, frameThickness) {
        restyle(this.layerDom, width, height, left, top)
        let that = this
        FOR_EACH_KEY(this.MAX_X, this.MAX_Y, function (xz, yz, key) {
            restyle(that.squareWraps[key], squareSize, squareSize, (xz * squareSize), ((that.MAX_Y - yz - 1) * squareSize))
        })
        this.left = left
        this.top = top
        this.squareSize = squareSize
        this.frameThickness = frameThickness
        this.reframe()
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

        this.createDom(this.zIndex)
        dom.appendChild(this.layerDom)

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

    onResize(width, height, left, top, squareSize, frame) {
        restyle(this.layerDom, width, height, left, top)
        this.left = left + frame
        this.top = top + frame
        this.squareSize = squareSize
        for (let key in this.captures) {
            this.restyleCapture(key, this.captures[key])
        }
    }

    clear() {
        this.captures = {}
        this.layerDom.innerHTML = ''
    }

    capture(key, pieceSymbol) {
        const piece = (isUpper(pieceSymbol)) ? ('w' + pieceSymbol) : ('b' + toUpper(pieceSymbol))
        let pieceDom = img({
            src: 'img/chesspieces/staunty/' + piece + '.png',
            style: 'position: absolute; pointer-events: none;'
        })
        this.layerDom.appendChild(pieceDom)
        this.restyleCapture(key, pieceDom)
        const DISPLAY_MILLIS = 1500
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
          marginPercent: 7
        }
        this.config = {...defaultConfig, ...config}

        this.X = X
        this.Y = Y
        this.XZ = X - 1
        this.YZ = Y - 1

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
        this.notifyDom = this.createNotifyDom()
        this.outerDom.appendChild(this.notifyDom)

        this.dropLayer = new GenericLayer(this.innerDom, X, Y, 100)
        this.lastLayer = new GenericLayer(this.innerDom, X, Y, 200)
        this.moveLayer = new MoveLayer(this, this.innerDom, X, Y, 300)
        this.hintLayer = new HintLayer(this, this.innerDom, X, Y, 400)

        this.innerDom.appendChild(this.dropLayer.layerDom)
        this.innerDom.appendChild(this.lastLayer.layerDom)
        this.innerDom.appendChild(this.moveLayer.layerDom)
        this.innerDom.appendChild(this.hintLayer.layerDom)

        this.actAsMenu = config.hasOwnProperty('startActivityIntent')

        if (!this.actAsMenu) {
            this.chessLayer = new ChessLayer(this, this.innerDom, X, Y, 500)
            this.innerDom.appendChild(this.chessLayer.layerDom)
        } else {
            this.menuLayer = new MenuLayer(this, this.innerDom, config.defaultX, config.defaultY, config.minX, config.minY, this.X, this.Y, 500, config.changeResolution, config.startActivityIntent, config.touchMenu)
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
        moveFunction(key0, key1)
        moveCallback(key0, key1)
        return true
    }

    makeHumanMove(key0, key1) {
        return this.makeMoveAnd(key0, key1, this.makeMoveDecode.bind(this), this.config.onHumanMoveRegistered)
    }

    makeEngineMove(key0, key1) {
        return this.makeMoveAnd(key0, key1, this.makeMoveDecode.bind(this), this.config.onEngineMoveRegistered)
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
        this.forEachSquare(function (xz, yz, key) {
            let squareDom = div({style: "z-index: 1"})
            squareDom.style.position = 'absolute'
            that.squares[key] = squareDom
            boardDom.append(squareDom)
            let isWhite = (xz + that.Y - yz) % 2 === 1
            if (isWhite) {
                squareDom.style.backgroundColor = WHITE
            } else {
                squareDom.style.backgroundColor = BLACK
            }
        })
        return boardDom
    }

    createLoaderDom() {
        return $$(div({style: 'position: absolute; visibility: hidden;'}),
          img({src: 'img/loader.png', style: "position: absolute; width: 100%; height: 100%;"}),
          img({src: 'img/loader.gif', style: "position: absolute; width: 66%; height: 66%; left: 17%; top: 17%;"}),
        )
    }

    createNotifyDom() {
        return div({style: "position: absolute;" +
            "border-radius: 5px;" +
            "background-color: white;" +
            "visibility: hidden;" +
            "text-align: center;" +
            "border: 3px " + FRAME + " solid;" +
            "color: " + FRAME + ";"})
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    showLoader() {
        this.loaderDom.style.visibility = 'visible'
    }

    hideLoader() {
        this.loaderDom.style.visibility = 'hidden'
    }

    notify(text) {
        const notifyMillis = 1500
        this.notifyExpires = Date.now() + notifyMillis
        this.notifyDom.innerHTML = ''
        this.notifyDom.style.visibility = 'visible'
        this.notifyDom.appendChild($$$(span({style: "position: absolute; left: 50%; top: 50%; transform: translateY(-50%) translateX(-50%);"}), text))
        setTimeout(function() {
            if (Date.now() >= this.notifyExpires) {
                this.notifyDom.style.visibility = 'hidden'
            }
        }.bind(this), notifyMillis)
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    forEachSquare(onSquare) {
        FOR_EACH_KEY(this.X, this.Y, onSquare)
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

        const MAX_LOADER_SIZE = 200

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
        this.forEachSquare(function (xz, yz, key) {
            const squareSize = that.squareSize
            restyle(that.squares[key], squareSize, squareSize, (xz * squareSize), ((that.Y - yz - 1) * squareSize))
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

        const notifySize = this.loaderSize / 2
        const notifyTop = this.loaderTop + notifySize / 2
        restyle(this.notifyDom, this.loaderSize, notifySize, this.loaderLeft, notifyTop)
        this.notifyDom.style.fontSize = (this.loaderSize / 3.0) + "px"
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    dumpCore() {
        let note = []
        let line = []
        let empty = 0
        for (let yz = this.Y - 1; yz >= 0; yz--) {
            for (let xz = 0; xz < this.X; xz++) {
                let key = KEY(xz, yz)
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
        return note.join('/') // + ' ' + ((this.sideToMove === 1) ? "w" : "b") + ' - - 0 ' + Math.floor((this.plyCount + 1) / 2)
    }

    load(fen) {
        const fenTokens = fen.split(' ')
        if (fenTokens.length !== FULL) {
            this.plyCount = 1
        } else {
            this.plyCount = parseInt(fenTokens[PLY2]) * 2 - ((fenTokens[SIDE] === 'w') ? 1 : 0)
        }

        this.sideToMove = (fenTokens.length > SIDE) ? ((fenTokens[SIDE] === 'w') ? SIDE_WHITE : SIDE_BLACK) : SIDE_WHITE

        const boardArray = FLATTEN_FEN_BASE(fenTokens[BASE]).split('')

        if (boardArray.length !== this.X * this.Y) {
            throw "Corrupted FEN"
        }

        this.chessLayer.reset()
        this.pieces = {}
        this.hints = {}

        this.dropLayer.clear()
        this.moveLayer.clear()
        this.lastLayer.clear()
        this.hintLayer.clear()

        let that = this
        this.forEachSquare(function (xz, yz, key) {
            const pieceSymbol = boardArray[xz + (that.Y - yz - 1) * that.X]
            if (pieceSymbol == '.') {
                return
            }
            that.pieces[key] = pieceSymbol
            that.chessLayer.show(key, pieceSymbol)
        })

//        this.config.onPositionRegistered(this.dump())
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

    makeMoveEnPassant(key0, key1, keyPasse) {
        this.chessLayer.destroy(keyPasse)
        this.chessLayer.animate(key0, key1)
        this.hintLayer.capture(key1, this.pieces[keyPasse])

        this.lastLayer.highlight([key0, key1, keyPasse], LAST)

        this.pieces[key1] = this.pieces[key0]
        delete this.pieces[key0]
        delete this.pieces[keyPasse]
    }

    makeMoveCastling(key0, key1, keyKing, keyRook) {
        this.chessLayer.destroy(key0)
        this.chessLayer.destroy(key1)
        this.chessLayer.show(keyKing, this.pieces[key0])
        this.chessLayer.show(keyRook, this.pieces[key1])

        this.lastLayer.highlight([key0, key1, keyKing, keyRook], LAST)

        const pKing = this.pieces[key0]
        const pRook = this.pieces[key1]
        delete this.pieces[key0]
        delete this.pieces[key1]
        this.pieces[keyKing] = pKing
        this.pieces[keyRook] = pRook
    }

    makeMovePromoted(key0, keyPromoted, p1, pPromoted) {
        this.chessLayer.destroy(key0)
        this.chessLayer.show(keyPromoted, pPromoted)
        if (p1 !== '-') {
            this.hintLayer.capture(keyPromoted, p1)
        }

        this.lastLayer.highlight([key0, keyPromoted], LAST)

        delete this.pieces[key0]
        this.pieces[keyPromoted] = pPromoted
    }

    makeMoveRegular(key0, key1, p0, p1) {
        this.chessLayer.animate(key0, key1)
        if (p1 !== '-') {
            this.hintLayer.capture(key1, p1)
        }

        this.lastLayer.highlight([key0, key1], LAST)

        this.pieces[key1] = this.pieces[key0]
        delete this.pieces[key0]
    }

    makeMoveDecode(key0, key1) {
        const xz0 = FILE_INDEX(key0)
        const yz0 = RANK_INDEX(key0)
        const xz1 = FILE_INDEX(key1)
        const yz1 = RANK_INDEX(key1)

        const p0 = this.pieces.hasOwnProperty(key0) ? this.pieces[key0] : '-'
        const p1 = this.pieces.hasOwnProperty(key1) ? this.pieces[key1] : '-'

        // handle en passant
        if (((p0 === 'P') || (p0 === 'p')) && (xz0 !== xz1) && (p1 === '-')) {
            if (p0 === 'P') {
                const keyPasse = KEY(xz1, yz1 - 1)
                this.makeMoveEnPassant(key0, key1, keyPasse)
            } else {
                const keyPasse = KEY(xz1, yz1 + 1)
                this.makeMoveEnPassant(key0, key1, keyPasse)
            }
        }

        // handle castling
        else if (((p0 === 'K') && (p1 === 'R')) || ((p0 === 'k') && (p1 === 'r'))) {
            if (xz0 > xz1) {
                const kxz = Math.max(xz1, xz0 - 2)
                const rxz = kxz + 1
                const keyKing = KEY(kxz, yz0)
                const keyRook = KEY(rxz, yz1)
                this.makeMoveCastling(key0, key1, keyKing, keyRook)
            } else {
                const kxz = Math.min(xz1, xz0 + 2)
                const rxz = kxz - 1
                const keyKing = KEY(kxz, yz0)
                const keyRook = KEY(rxz, yz1)
                this.makeMoveCastling(key0, key1, keyKing, keyRook)
            }
        }

        // handle promotion
        else if (((p0 === 'P') && (yz0 === this.YZ - 1)) || ((p0 === 'p') && (yz0 === 1))) {
            if (p0 === 'P') {
                const pPromoted = ['Q', 'R', 'B', '-', 'N'][this.YZ - yz1]
                const keyPromoted = KEY(xz1, this.YZ)
                this.makeMovePromoted(key0, keyPromoted, p1, pPromoted)
            } else {
                const pPromoted = ['q', 'r', 'b', '-', 'n'][yz1]
                const keyPromoted = KEY(xz1, 0)
                this.makeMovePromoted(key0, keyPromoted, p1, pPromoted)
            }
        }

        // handle regular move
        else {
            this.makeMoveRegular(key0, key1, p0, p1)
        }

        this.chessLayer.sourceKey = null
        this.chessLayer.fingerOverKey = null
        this.chessLayer.touchIdentifier = null
    }

    parseLine(line) {
        let hints = {}
        const moves = line.split(' ')
        for (let i in moves) {
            const move = moves[i]
            if (move.length >= 4) {
                const key0 = UCI_KEY0(move)
                const key1Cap = UCI_KEY1CAP(move)
                if (!hints.hasOwnProperty(key0)) {
                    hints[key0] = []
                }
                hints[key0].push(key1Cap)
            }
        }
        return hints
    }

    allowMoves(hints) {
        this.hints = hints
        this.chessLayer.moves = hints
    }

    disableMoves() {
        this.hints = {}
        this.chessLayer.moves = {}
    }

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
// compatibility with chessboardjs

    position(fen) {
        if ((typeof fen === "undefined") || (fen === null)) {
            return this.dump()
        } else {
            this.load(fen)
            this.chessLayer.touchIdentifier = null
            this.chessLayer.sourceKey = null
            this.chessLayer.fingerOverKey = null
        }
    }

    highlight(key0, key1) {
        this.lastLayer.highlight([key0, key1], LAST)
    }

    highlightMove(move) {
        const key0 = UCI_KEY0(move)
        const key1 = UCI_KEY1(move)
        this.highlight(key0, key1)
    }
}
