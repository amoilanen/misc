var fs = require('fs'),
    page = require('webpage').create(),
    TIMEOUT = 5000,
    TOP_LANGUAGES_NUMBER = 30,
    activeSearches = 0;

page.onConsoleMessage = function (msg) {
    console.log(msg);
};

function getAllGithubLanguages(callback) {
    page.open("https://github.com/languages", function (status) {
        var allLanguages = page.evaluate(function() {
            var links = document.querySelectorAll(".all_languages a");
            return Array.prototype.slice.call(links, 0).map(function(link) {
                return link.innerHTML;
            });
        });
        callback(allLanguages);
    });
};

function getSummaryCount() {
    var resultStats = document.querySelector("div.summarycount"),                   
        regex = /[\d,.]+/g,
        resultsNumber = -1;
                
    if (resultStats) {
        resultsNumber = regex.exec(resultStats.innerHTML)[0];
        resultsNumber = resultsNumber.replace(/[,\.]/g, "");
    };
    return parseInt(resultsNumber);
};

function openResultsURL(url, callback) {
    page.open(url, function (status) {                 
        callback(page.evaluate(getSummaryCount));
    });    
};

function search(term, callback) {
    var urls = [
        "http://stackoverflow.com/search?q=" + encodeURIComponent(term),
        "http://stackoverflow.com/tags/" + encodeURIComponent(term)
    ];

    openResultsURL(urls[0], function(resultsCount) {
        if (resultsCount > 0) {
            callback(term, resultsCount);
        } else {
            openResultsURL(urls[1], function(resultsCount) {
                callback(term, resultsCount);
            });
        }
    });
};

function prepareForRendering(number, map) {
    function descending(x, y){
        return y - x;
    };
    var keys = [],
        values = [],
        result = [],
        i, j;

    for (key in map) {
        if (map.hasOwnProperty(key)) {
            keys.push(key);
            values.push(map[key]);
        };
    };
    values.sort(descending);

    number = Math.min(number, values.length);

    for (i = 0; i < number; i++) {
        for (j = 0; j < keys.length; j++) {
            if (values[i] == map[keys[j]]) {
                result.push([keys[j], values[i]]);
                delete map[keys[j]];
            };
        };
    };
    result.unshift(["Language Popularity", "Search Count"]);
    return result;
};

function generateReport(statistics) {
    return '<html>\r\n\
    <head>\r\n\
        <script type="text/javascript" src="https://www.google.com/jsapi"></script>\r\n\
        <script type="text/javascript">\r\n\
             google.load("visualization", "1", {packages:["corechart"]});\r\n\
             google.setOnLoadCallback(drawChart);\r\n\
             function drawChart() {\r\n\
                 var data = google.visualization.arrayToDataTable(\r\n' +
JSON.stringify(prepareForRendering(TOP_LANGUAGES_NUMBER, statistics)) +
            '\r\n);\r\n\
\r\n\
                 var options = {\r\n\
                     title: "Language Popularity at stackoverflow.com",\r\n\
                     vAxis: {title: "Language",  titleTextStyle: {color: "black"}}\r\n\
                 };\r\n\
\r\n\
                 var chart = new google.visualization.BarChart(document.getElementById("chart_div"));\r\n\
                 chart.draw(data, options);\r\n\
              }\r\n\
        </script>\r\n\
    </head>\r\n\
    <body>\r\n\
        <div id="chart_div" style="width: 900px; height: 800px;"></div>\r\n\
    </body>\r\n\
</html>';
};

function saveReport(html) {
    fs.write("top_languages_report.html", html, "w");
};

getAllGithubLanguages(function (languages) {
    var statistics = {},
        int;
    
    languages = Array.prototype.slice.call(languages, 0);
    console.log("Number of languages = ", languages.length);
    int = setInterval(function waitForStatistics() {
        if (0 == activeSearches) {
            if (languages.length > 0) {
                activeSearches++;                
                search(languages.shift(), function (term, count) {
                    console.log(term + " found " + count + " times");               
                    statistics[term] = count;
                    activeSearches--;
                });
            } else {
                console.log("Finished all searches!");
                clearInterval(int);
                saveReport(generateReport(statistics));
                phantom.exit();
            };
        };
    }, TIMEOUT);
});