function getapk() {
  if (confirm("The App does not require any permissions.\n" +
              "It works entirely offline.\n" +
              "The original sha1sum of file: aee2ab78109043dbfcbd93b850b7061c9218e4ab.\n" +
              "If you encounter any suspicious App behaviour please contact wychess@wychess.com.\n" +
              "Please confirm that you understand the risk of installing software from malicious sources.")) {
    document.location = 'https://wychess.github.io/release/wychess-arcade-v1.13.apk'
  }
}
