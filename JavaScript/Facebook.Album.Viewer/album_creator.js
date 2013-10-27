/*
 * This script can be run by PhantomJS http://phantomjs.org/, for example:
 * 
 * phantomjs album_creator.js "https://www.facebook.com/photo.php?fbid=4828218591883&set=a.4828217071845.2189229.1489114124&type=3&l=9327ffc859"
 * 
 * where the URL of the first image in a public album is passed as a sole argument
 */
var args = require('system').args;
    fs = require('fs'),
    webpage = require('webpage');

var collectedImageUrls = [],
    collectedPageUrls = [];

function collectImages(url, finishCallback) {    
    collectedPageUrls.push(url);
    collectImage(url, function collectImageCallback(imageUrl, nextUrl) {
        if (collectedImageUrls.indexOf(imageUrl) >= 0) {            
            finishCallback(collectedImageUrls);
        } else {
            console.log(imageUrl);
            collectedImageUrls.push(imageUrl);
            collectedPageUrls.push(nextUrl);
            collectImage(nextUrl, collectImageCallback);
        }
    });
};

function collectImage(url, callback) {
    var page = webpage.create();
    
    page.open(url, function (status) {
        var imageUrl = null,
            url = null,
            urls = null;

        urls = page.evaluate(function () {
            var actions = document.querySelectorAll(".fbPhotosPhotoActionsItem");
            
            actions = [].slice.call(actions, 0);
            return actions.map(function(action) {
                return action.getAttribute("href"); 
            });
        });

        url = urls.filter(function (url) {
            return url.indexOf("?dl=1") >= 0;
        })[0];
            
        if (!url) {
            console.log("Next URL not found");
        };

        imageUrl = url.substring(0, url.length - "?dl=1".length);
    
        var nextUrl = page.evaluate(function () {
            var nextLink = document.querySelector("a.photoPageNextNav");
        
            return nextLink && nextLink.getAttribute("href");
        });        
        page.close();
        callback(imageUrl, nextUrl);
    });
};

function render(links) {
    var template = null,
        rendition = null,
        partialRendition = links.map(function(link) {
            return "{ image: \"" + link + "\" }";
        }).join(",\n");

    template = fs.open("template.html", "r").read();
    rendition = template.replace("@images@", partialRendition);
    fs.write("gallery.html", rendition, 'w');
};

var firstPhotoUrl = args[1];

if (!firstPhotoUrl) {
	throw new Error("Provide the URL of the first photo in a public album as the first argument");
};

collectImages(firstPhotoUrl, function(collectedImageUrls) {
    console.log("Total URLs = ", collectedImageUrls.length);
    console.log("Rendering...");
    render(collectedImageUrls);
    console.log("Finished");
    phantom.exit();
});