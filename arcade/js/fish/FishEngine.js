// This file is a part of wychess project.
// Copyright (c) 2020-2021 wychess.com <wychess@wychess.com>.

class Fish {
    constructor(onMessage) {
        let wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
        this.stockfish = new Worker(wasmSupported ? 'js/engine/stockfish.wasm.js' : 'js/engine/stockfish.js');
        this.stockfish.addEventListener('message', onMessage);
        this.stockfish.postMessage('uci');
    }

    postMessage(message) {
        this.stockfish.postMessage(message)
    }
}
