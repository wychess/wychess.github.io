function getapk() {
  if (confirm("The App does not require any permissions.\n" +
              "It works entirely offline.\n" +
              "The original sha1sum of file: e5e66e797ca741770e85562e39b4da6dae356ffd.\n" +
              "If you encounter any suspicious App behaviour please contact wychess@wychess.com.\n" +
              "Please confirm that you understand the risk of installing software from malicious sources.")) {
    document.location = 'https://wychess.github.io/release/wychess-arcade-v1.14rc.apk'
  }
}
