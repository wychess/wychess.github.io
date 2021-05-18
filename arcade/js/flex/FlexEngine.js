// This file is a part of wychess project.
// Copyright (C) 2021 wychess.com <wychess@wychess.com>.

var FlexEngineJs

function OnFlexEngineJsLoaded(onLoad) {
  Module.onRuntimeInitialized = async _ => {
    FlexEngineJs = {
      getBoard:      Module.cwrap('get_board',       'string', ['number', 'number', 'string', 'string']),
      getStatus:     Module.cwrap('get_status',      'string', ['number', 'number', 'string', 'string']),
      getMoves:      Module.cwrap('get_moves',       'string', ['number', 'number', 'string', 'string']),
      getBoardAfter: Module.cwrap('get_board_after', 'string', ['number', 'number', 'string', 'string']),
      getBestMove:   Module.cwrap('get_bestmove',    'string', ['number', 'number', 'string', 'string']),
    }
    onLoad()
  }
}

