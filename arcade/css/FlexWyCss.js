function ALPHA(hex_rgb, alpha, a) {
  return 'rgba(' + [0, 1, 2].map(i => parseInt("0x" + hex_rgb.substr(2*i+1,2)).toString()).join(',') + "," + (alpha / 100.0).toString() + ")"
}
