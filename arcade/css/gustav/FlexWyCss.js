const GUSTAV = {
  'TABLE': "#393939",
  'WHITE': "#f0d9b5",
  'BLACK': "#b58863",
  'FRAME': "#707070",
  'ACCENT': "#887b09",
  'WIN': "#6b5e06",
  'ECHEC': "#42211e",
  'COORDS': "#393939",
  'CHECK': "#b63725",

  get LAST() { return ALPHA(this.ACCENT, 50) },
  get ACCENT_75() { return ALPHA(this.ACCENT, 75) },
  get FRAME_50() { return ALPHA(this.FRAME, 50) },
  get FRAME_75() { return ALPHA(this.FRAME, 75) },

  get CAP_HINT() { return ALPHA(this.ACCENT, 75) },
  get DOT_HINT_OUTER() { return this.ACCENT },
  get DOT_HINT_INNER() { return this.ACCENT },
  get DOT_MENU_OUTER() { return this.TABLE },
  get DOT_MENU_INNER_NORM() { return ALPHA(this.WHITE, 90) },
  get DOT_MENU_INNER_PICK() { return this.TABLE },

  'LOADER_BACK': "img/gustav/loader-gustav-back.png",
  'LOADER_SPIN': "img/gustav/loader-gustav.gif",
  'PIECES': "svg/cburnett/",

  'STALE': 'stale_gustav'
}
