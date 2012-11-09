//PhantomJS http://phantomjs.org/ based web crawler Anton Ivanov anton.al.ivanov@gmail.com 2012

(function(host) {

    function Crawler() {
        this.visitedURLs = {};
    };
    
    Crawler.webpage = require('webpage');

    Crawler.prototype.crawl = function (url, depth, onSuccess, onFailure) {
        if (0 == depth || this.visitedURLs[url]) {
            return;
        };
        var self = this;
        var page = Crawler.webpage.create();

        page.open(url, function (status) {
            if ('fail' === status) { 
                onFailure({
                    url: url, 
                    status: status
                });
            } else {
                var documentHTML = page.evaluate(function () {
                    return document.body && document.body.innerHTML ? document.body.innerHTML : "";
                });
                self.crawlURLs(self.getAllURLs(page), depth - 1, onSuccess, onFailure);
                self.visitedURLs[url] = true;
                onSuccess({
                    url: url,
                    status: status,
                    content: documentHTML
                });
            };
        });
    };

    Crawler.prototype.getAllURLs = function(page) {
        return page.evaluate(function () {
            return Array.prototype.slice.call(document.querySelectorAll("a"), 0)
                .map(function (link) {
                    return link.getAttribute("href");
                });
        });
    };

    Crawler.prototype.crawlURLs = function(urls, depth, onSuccess, onFailure) {
        var self = this;
        urls.filter(function (url) {
            return Crawler.isTopLevelURL(url);
        }).forEach(function (url) {
            self.crawl(url, depth, onSuccess, onFailure);
        });
    };

    Crawler.isTopLevelURL = function(url) {
        return 0 == url.indexOf("http");
    };

    host.Crawler = Crawler;
})(phantom);

new phantom.Crawler().crawl("https://github.com/ariya/phantomjs/wiki/Quick-Start", 2, 
    function onSuccess(page) {
        console.log("Loaded page. URL = " + page.url + " content length = " + page.content.length + " status = " + page.status);
    }, 
    function onFailure(page) {
        console.log("Could not load page. URL = " +  page.url + " status = " + page.status);
    }
);