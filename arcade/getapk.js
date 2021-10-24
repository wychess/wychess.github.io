function getapk() {
  if (confirm("The App does not require any permissions.\n" +
              "It works entirely offline.\n" +
              "The original sha1sum of file: d3b2358fb73304d84d6db548438af0cdf621c112.\n" +
              "If you encounter any suspicious App behaviour please contact wychess@wychess.com.\n" +
              "Please confirm that you understand the risk of installing software from malicious sources.")) {
    document.location = 'https://wychess.github.io/release/wychess-arcade-v1.17rc.apk'
  }
}
