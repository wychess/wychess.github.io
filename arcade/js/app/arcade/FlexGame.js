function genFlexGame(flexfen) {
    return {
        snaps: [{
            flexfen: flexfen,
            marks: [],
            status: 'PLAY',
            check: false,
            board: 'PLAY'
        }],
        log: [flexfen, "::"],
        repetitionLookup: {}
    }
}

