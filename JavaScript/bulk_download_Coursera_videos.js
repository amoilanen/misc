/*
 * Bulk download of Coursera videos with wget.
 *
 * Copyright (c) 2014 Anton Ivanov anton.al.ivanov@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Note that for using wget you should be authenticated to the Coursera web site
 * and be enrolled to the course for which you are downloading videos.
 *
 * How to download Coursera videos:
 *
 * 1. Open course page where video lectures are available on the Coursera site
 * 2. Open the developer console of your browser
 * 3. Copy/paste this script to the developer console, then execute it
 * 4. Copy the generated script from the shown popup and save it in a file
 * 5. Export cookies from your browser for wget, for example, for Firefox use the following add-on
 *    https://addons.mozilla.org/en-US/firefox/addon/export-cookies/
 *    Save cookies in the text file cookies.txt in the same directory as the generated script file
 * 6. Execute the generated script, files will be downloaded to the folder where script is located
 */
(function() {
  var counter = 0;

  function findLinks() {
    return [].slice.call(document.querySelectorAll("a[title=\"Video (MP4)\"]"), 0);
  }

  function getTitle(link) {
    var titleContainer = link.querySelector("div");
    var titleHtml = titleContainer.innerHTML;
    var match = titleHtml.match(/Video \(MP4\) for (.*)/);

    counter++;
    return counter + " " + match[1] + ".mp4";
  }

  function getUrl(link) {
    return link.getAttribute("href");
  }

  function wgetCommandLine(title, url) {
    return "wget --load-cookies cookies.txt -O \"" + title + "\" " + url;
  }

  var commandLines = findLinks().map(function(link) {
    return wgetCommandLine(getTitle(link), getUrl(link));
  });

  alert(commandLines.join("\n"));
})();