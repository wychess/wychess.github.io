const LIGHT = {
  'TABLE': "#fdfdfd",
  'WHITE': "#fdfdfd",
  'BLACK': "#d9dbdf",
  'FRAME': "#404040",
  'ACCENT': "#f1bd5c",
  get WIN() { return this.ACCENT },
  get ECHEC() { return this.FRAME },
  get COORDS() { return this.FRAME },
  'CHECK': "#b63725",

  get LAST() { return ALPHA(this.ACCENT, 50, this) },
  get ACCENT_75() { return ALPHA(this.ACCENT, 75) },
  get FRAME_50() { return ALPHA(this.FRAME, 50) },
  get FRAME_75() { return ALPHA(this.FRAME, 75) },

  get CAP_HINT() { return ALPHA(this.ACCENT, 75) },
  get DOT_HINT_OUTER() { return this.ACCENT },
  get DOT_HINT_INNER() { return this.ACCENT },
  get DOT_MENU_OUTER() { return this.FRAME },
  get DOT_MENU_INNER_NORM() { return ALPHA(this.WHITE, 90) },
  get DOT_MENU_INNER_PICK() { return this.FRAME },

  'LOADER_BACK': "img/light/loader-light-back.png",
  'LOADER_SPIN': "img/light/loader-light.gif",
  'PIECES': "svg/staunty/",

  'STALE': 'stale_light'
}
