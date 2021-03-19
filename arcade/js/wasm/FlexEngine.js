var FlexJs

const flex_host = 'https://wychess.github.io/arcade'

const SizeJs = {
  startActivityIntent: function(x, y) {
    document.location = flex_host + '/play.html?X=' + x + '&Y=' + y
  },
  changeResolution: function(x, y) {
    localStorage.setItem('X', x)
    localStorage.setItem('Y', y)
  }
}

function OnFlexJsLoaded(onLoad) {
  Module.onRuntimeInitialized = async _ => {
    FlexJs = {
      get_move_hints: Module.cwrap('get_move_hints', 'string', ['number', 'number', 'string']),
      get_bestmove: Module.cwrap('get_bestmove', 'string', ['number', 'number', 'string']),
      set_history: function(X, Y, history) { window.localStorage.setItem(X + 'x' + Y, history) }
    }
    onLoad()
  }
}

