class FlexGest {
    constructor(outerDom, innerDom, actions) {
        const voidAction = function () {}
        const defaultActions = {
            tapAndHoldMarker: voidAction,
            tapAndHoldCancel: voidAction,
            tapAndHoldCommit: voidAction,
            slideAccept: voidAction,
            slideReject: voidAction,
            doubleTap: voidAction
        }
        this.actions = {...defaultActions, ...actions}
        this.outerDom = outerDom
        this.innerDom = innerDom

        this.touchIdentifier = null

        this.touchStart = 0
        this.touchEnded = 0
        this.touchRetap = 0
        this.enableTabAndHoldCancel = false

        this.outerDom.addEventListener('touchstart', this.onTouchDown.bind(this))
        touchCancelCallbacks.push(this.onTouchCancel.bind(this))
        window.ontouchcancel = touchCancel
    }

    onTouchCancel(touchEvent) {
        const changedTouches = Array.from(touchEvent.changedTouches).filter(t => t.identifier === this.touchIdentifier)
        if (changedTouches.length === 0) {
            return
        }
        window.ontouchmove = null
        window.ontouchend = null
        this.touchEnded = Date.now()
        if (this.enableTabAndHoldCancel) {
            this.actions.tapAndHoldCancel()
            this.enableTabAndHoldCancel = false
        }
        this.touchIdentifier = null
    }

    onTouchDown(touchEvent) {
        if (this.touchIdentifier != null) {
            return
        }

        this.touchStart = Date.now()
        const changedTouch = touchEvent.changedTouches[0]
        this.touchIdentifier = changedTouch.identifier

        const touchX = changedTouch.pageX
        const touchY = changedTouch.pageY
        const innerBound = this.innerDom.getBoundingClientRect()
        const outerBound = this.outerDom.getBoundingClientRect()
        const minX = innerBound.left
        const maxX = innerBound.left + innerBound.width
        const minY = innerBound.top
        const maxY = innerBound.top + innerBound.height
        const slideCheck = function (a, b, c, d) {
            return (a < b) && (c < d)
        }
        this.detectSlideAccept = function(changedTouch) {
            const nowX = changedTouch.pageX
            const nowY = changedTouch.pageY
            return slideCheck(touchX, minX, maxX, nowX) || slideCheck(touchY, minY, maxY, nowY)
        }
        this.detectSlideReject = function(changedTouch) {
            const nowX = changedTouch.pageX
            const nowY = changedTouch.pageY
            return slideCheck(nowX, minX, maxX, touchX) || slideCheck(nowY, minY, maxY, touchY)
        }

        if (this.touchStart - this.touchRetap < DOUBLE_TAP_MILLIS) {
            let that = this
            const longTouch = this.touchStart
            setTimeout(function () {
                if (longTouch > that.touchEnded) {
                    that.actions.tapAndHoldMarker()
                }
                that.enableTabAndHoldCancel = true
            }, HOLD_AND_TAP_MARKER_MILLIS)
            setTimeout(function () {
                if (longTouch > that.touchEnded) {
                    that.actions.tapAndHoldCommit()
                }
                that.enableTabAndHoldCancel = false
            }, HOLD_AND_TAP_COMMIT_MILLIS)
        }

        window.ontouchmove = throttle(this.onTouchMove.bind(this), DEFAULT_THROTTLE_RATE)
        window.ontouchend = this.onTouchUp.bind(this)
    }

    onTouchMove(touchEvent) {
        const changedTouches = Array.from(touchEvent.changedTouches).filter(t => t.identifier === this.touchIdentifier)
        if (changedTouches.length === 0) {
            return
        }
        const changedTouch = changedTouches[0]
        if (this.detectSlideAccept(changedTouch)) {
            this.actions.slideAccept()
            this.onTouchCancel(touchEvent)
        } else if (this.detectSlideReject(changedTouch)) {
            this.actions.slideReject()
            this.onTouchCancel(touchEvent)
        }
    }

    onTouchUp(touchEvent) {
        touchEvent.preventDefault()
        const changedTouches = Array.from(touchEvent.changedTouches).filter(t => t.identifier === this.touchIdentifier)
        if (changedTouches.length === 0) {
            return
        }
        const now = Date.now()
        if (now - this.touchRetap < DOUBLE_TAP_MILLIS) {
            this.actions.doubleTap()
        } else {
            this.touchRetap = this.touchStart
        }

        this.onTouchMove(touchEvent)
        this.onTouchCancel(touchEvent)
    }
}

