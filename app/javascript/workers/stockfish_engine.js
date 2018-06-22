import d from '../dispatcher'

const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))

export default class StockfishEngine {

  constructor(options = {}) {
    this.multipv = options.multipv || 1
    this.stockfish = new Worker(`/assets/stockfish${wasmSupported ? '.wasm' : ''}.js`)
    this.initStockfish()
  }

  initStockfish() {
    if (this.multipv > 1) {
      this.stockfish.postMessage('setoption name MultiPV value ' + this.multipv)
    }
    this.stockfish.postMessage('uci')
    this.debugMessages()
  }

  debugMessages() {
    this.stockfish.addEventListener('message', e => console.log(e.data))
  }

  analyze(fen, options = {}) {
    let targetDepth = +options.depth || SEARCH_DEPTH
    this.stockfish.postMessage('position fen ' + fen)
    this.emitEvaluationWhenDone(fen, targetDepth)
    this.stockfish.postMessage('go depth ' + targetDepth)
  }

  emitEvaluationWhenDone(fen, depth) {
    let start = new Date()
    let targetDepth = depth
    let targetMultiPv = this.multipv

    let done = (state) => {
      console.log("time elapsed: " + (Date.now() - start))
      d.trigger("analysis:done", {
        fen: fen,
        eval: state.eval
      })
      this.stockfish.removeEventListener('message', processOutput)
    }

    // Modified from lila/ui/analyse/src/ceval/stockfishProtocol.js
    //
    let state
    let processOutput = (e) => {
      if (e.data.indexOf('bestmove ') === 0) {
        return
      }

      var matches = e.data.match(/depth (\d+) .*multipv (\d+) .*score (cp|mate) ([-\d]+) .*nps (\d+) .*pv (.+)/)
      if (!matches) {
        return
      }

      var depth = parseInt(matches[1])
      if (depth < targetDepth) {
        return
      }

      var multiPv = parseInt(matches[2])
      var cp, mate

      if (matches[3] === 'cp') {
        cp = parseFloat(matches[4])
      } else {
        mate = parseFloat(matches[4])
      }

      if (fen.indexOf('w') === -1) {
        if (matches[3] === 'cp') cp = -cp
        else mate = -mate
      }

      if (multiPv === 1) {
        state = {
          eval: {
            depth: depth,
            nps: parseInt(matches[5]),
            best: matches[6].split(' ')[0],
            cp: cp,
            mate: mate,
            pvs: []
          }
        }
      } else if (!state || depth < state.eval.depth) return // multipv progress

      state.eval.pvs[multiPv - 1] = {
        cp: cp,
        mate: mate,
        pv: matches[6],
        best: matches[6].split(' ')[0]
      }

      if (multiPv === targetMultiPv && state.eval.depth === targetDepth) {
        done(state)
      }
    }

    this.stockfish.addEventListener('message', processOutput)
  }
}
