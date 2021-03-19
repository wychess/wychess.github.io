const DOUBLE_TAP_MILLIS = 500
const HOLD_AND_TAP_MARKER_MILLIS = 500
const HOLD_AND_TAP_COMMIT_MILLIS = 1500

const DEFAULT_THROTTLE_RATE = 25

function throttle (f, interval, scope) {
    var timeout = 0
    var shouldFire = false
    var args = []

    var handleTimeout = function () {
        timeout = 0
        if (shouldFire) {
            shouldFire = false
            fire()
        }
    }

    var fire = function () {
        timeout = window.setTimeout(handleTimeout, interval)
        f.apply(scope, args)
    }

    return function (_args) {
        args = arguments
        if (!timeout) {
            fire()
        } else {
            shouldFire = true
        }
    }
}


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

        this.touchStart = 0
        this.touchEnded = 0
        this.touchRetap = 0
        this.enableTabAndHoldCancel = false

        this.outerDom.addEventListener('touchstart', this.onTouchDown.bind(this))
        window.ontouchcancel = this.onTouchCancel.bind(this)
    }

    onTouchCancel(touchEvent) {
        window.ontouchmove = null
        window.ontouchend = null
        this.touchEnded = Date.now()
        if (this.enableTabAndHoldCancel) {
            this.actions.tapAndHoldCancel()
            this.enableTabAndHoldCancel = false
        }
    }

    onTouchDown(touchEvent) {
        this.touchStart = Date.now()

        const touchX = touchEvent.changedTouches[0].pageX
        const touchY = touchEvent.changedTouches[0].pageY
        const innerBound = this.innerDom.getBoundingClientRect()
        const outerBound = this.outerDom.getBoundingClientRect()
        const minX = innerBound.left
        const maxX = innerBound.left + innerBound.width
        const minY = innerBound.top
        const maxY = innerBound.top + innerBound.height
        const slideCheck = function (a, b, c, d) {
            return (a < b) && (c < d)
        }
        this.detectSlideAccept = function (touchEvent) {
            const nowX = touchEvent.changedTouches[0].pageX
            const nowY = touchEvent.changedTouches[0].pageY
            return slideCheck(touchX, minX, maxX, nowX) || slideCheck(touchY, minY, maxY, nowY)
        }
        this.detectSlideReject = function (touchEvent) {
            const nowX = touchEvent.changedTouches[0].pageX
            const nowY = touchEvent.changedTouches[0].pageY
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
        if (this.detectSlideAccept(touchEvent)) {
            this.actions.slideAccept()
            this.onTouchCancel(touchEvent)
        } else if (this.detectSlideReject(touchEvent)) {
            this.actions.slideReject()
            this.onTouchCancel(touchEvent)
        }
    }

    onTouchUp(touchEvent) {
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

