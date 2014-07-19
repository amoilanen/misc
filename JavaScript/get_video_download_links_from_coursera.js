/*
 * Generating a script with Coursera download links for downloading with wget.
 */

function findLinks() {
  return [].slice.call(document.querySelectorAll("a[title=\"Video (MP4)\"]"), 0);
}

function getTitle(link) {
  var titleContainer = link.querySelector("div");
  var titleHtml = titleContainer.innerHTML;
  var match = titleHtml.match(/Video \(MP4\) for (.*)/);

  return match[1];
}

function getUrl(link) {
  return link.getAttribute("href");
}

function wgetCommandLine(title, url) {
  return "wget -O \"" + title + "\" " + url;
}

var commandLines = findLinks().map(function(link) {
  return wgetCommandLine(getTitle(link), getUrl(link));
});

console.log(commandLines.join("\n"));