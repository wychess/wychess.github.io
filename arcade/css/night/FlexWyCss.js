const NIGHT = {
  'TABLE': "#393939",
  'WHITE': "#ededed",
  'BLACK': "#c9cbcf",
  'FRAME': "#707070",
  'ACCENT': "#55936b",
  'WIN': "#21603b",
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

  'LOADER_BACK': "img/night/loader-night-back.png",
  'LOADER_SPIN': "img/night/loader-night.gif",

  'BUTTON_REROLL_BACK': "img/night/wychess_button_back.svg",
  'BUTTON_REROLL_HEAD': "img/night/wychess_button_reroll.svg",

  'BUTTON_TAKEBACK_BACK': "img/night/wychess_button_back.svg",
  'BUTTON_TAKEBACK_HEAD': "img/night/wychess_button_takeback.svg",

  'PIECES': "svg/staunty/",

  'STALE': 'stale_night'
}
