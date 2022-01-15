function getapk(sha, url) {
  if (confirm("The App does not require any permissions.\n" +
              "It works entirely offline.\n" +
              "The original sha1sum of file: " + sha + ".\n" +
              "If you encounter any suspicious App behaviour please contact wychess@wychess.com.\n" +
              "Please confirm that you understand the risk of installing software from malicious sources.")) {
    document.location = url
  }
}


function get_arcade() {
  getapk(
    "d3b2358fb73304d84d6db548438af0cdf621c112",
    "https://drive.google.com/file/d/14ostX_ru3ZIsyQGnWfx1xjLIA-hS-m6e/view?usp=sharing"
  )
}

function get_puzzle() {
  getapk(
    "c3b3bc33630224d3714402e084ab9b694b76d45a",
    "https://drive.google.com/file/d/1dGYfo0SQAxxUkLPhEZEgdoxi0zPqwjcL/view?usp=sharing"
  )
}

function get_opener() {
  getapk(
    "f13d586488454c0ec094b3237aa4f8bfce2b3c06",
    "https://drive.google.com/file/d/1qlfA1c7X-fBFiec0kV_AEcQeVE40txLC/view?usp=sharing"
  )
}
