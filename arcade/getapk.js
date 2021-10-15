function getapk() {
  if (confirm("The App does not require any permissions.\n" +
              "It works entirely offline.\n" +
              "The original sha1sum of file: 1a1f928bb7d1b144c72818e501aae41f41fd7929.\n" +
              "If you encounter any suspicious App behaviour please contact wychess@wychess.com.\n" +
              "Please confirm that you understand the risk of installing software from malicious sources.")) {
    document.location = 'https://wychess.github.io/release/wychess-arcade-v1.14rc.apk'
  }
}
