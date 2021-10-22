function getapk() {
  if (confirm("The App does not require any permissions.\n" +
              "It works entirely offline.\n" +
              "The original sha1sum of file: 3abc26a825789ff1e11a6569bdc83c500432f406.\n" +
              "If you encounter any suspicious App behaviour please contact wychess@wychess.com.\n" +
              "Please confirm that you understand the risk of installing software from malicious sources.")) {
    document.location = 'https://wychess.github.io/release/wychess-arcade-v1.16rc.apk'
  }
}
