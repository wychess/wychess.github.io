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

let touchCancelCallbacks = []

function touchCancel(touchEvent) {
    for(let index in touchCancelCallbacks) {
        touchCancelCallbacks[index](touchEvent)
    }
}

