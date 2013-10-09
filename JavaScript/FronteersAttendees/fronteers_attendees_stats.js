var fs = require('fs'),
    webpage = require('webpage');

function getCountries(callback) {
    var page = webpage.create();

    page.open('http://fronteers.nl/congres/2013/attendees', function (status) {
        var countries = page.evaluate(function () {
            var countries = document.querySelectorAll("#attendees tr td:nth-child(4)");

            countries = [].slice.call(countries, 0);
            return countries.map(function (country) {
                return country.innerHTML;
            });
        });
        page.close();
        callback(countries);
    });
};

function getSortedStats(countries) {
    var sortedStats = [],
        stats = {};

    countries.forEach(function (countryName) {    
        stats[countryName] = (stats[countryName] || 0) + 1;
    });

    for (var property in stats) {
        sortedStats.push([property, stats[property]]);
    }
    sortedStats = sortedStats.sort(function(x, y) {
        return (x[1] < y[1]) 
            ? 1 
            : ((x[1] > y[1]) ? -1 : 0);
    });
    return sortedStats;
};

function getTotal(countries) {
     return countries.reduce(function(previous, current){
         return previous + current[1];
     }, 0);
};

function generateReport(countries) {
    var total = getTotal(countries),
        tableData = null;

    tableData = countries.map(function(country) {
        var percent = (country[1] / total) * 100; 
        
        return [country[0], country[1], {v: percent, f: percent.toFixed(2) + "%"}];
    });
    return {
        geomapData: countries,
        tableData: tableData,
        total: total
    };
};

function renderReport(report) {
    var template = null,
        rendition = null;

    template = fs.open("report_template.html", "r").read();
    rendition = ["geomapData", "tableData", "total"].reduce(function(previous, current) {
        var variableRegex = new RegExp("@" + current + "@"),
            variableJson = JSON.stringify(report[current]);

        return previous.replace(variableRegex, variableJson);
    }, template);
    fs.write("attendees.html", rendition, 'w');
};


getCountries(function(countries) {
    renderReport(generateReport(getSortedStats(countries)));
    phantom.exit();
});