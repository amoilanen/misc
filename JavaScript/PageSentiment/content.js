var SENTIMENTS = [
  "neutral",
  "happy-1",
  "happy-2",
  "happy-3",
  "happy-4",
  "angry-1",
  "angry-2",
  "angry-3",
  "angry-4"
];

var wordSentiment = {};

function init() {
  initListeners();
  cacheWordSentiment('afinn-111.json');
}

function initListeners() {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      switch(request.message) {
        case "show.sentiment":
          showSentiment();
          break;
        case "hide.sentiment":
          hideSentiment();
          break;
        default:
          sendResponse("unknown.message");
          break;
      };
      sendResponse("done");
    }
  );
}

function cacheWordSentiment(jsonFile) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function(event) {
    wordSentiment = JSON.parse(xhr.response);
  };
  xhr.open("GET", chrome.extension.getURL(jsonFile));
  xhr.send();
}

  //TODO: Load the word sentiment data
  //TODO: Analyze the sentiment
    //--Delete the irrelevant tags from content
    //--Skip analyzing paragraphs that do not have text content or have not enough of it
    //--Background color should change based on the sentiment
function showSentiment() {
  console.log("showSentiment");
  console.log("wordSentiment = ");
  console.log(wordSentiment);

  //TODO: Also query for li, headers etc.?
  var elements = document.querySelectorAll("p");
  elements = [].slice.call(elements);

  elements.forEach(function(element) {
    var classAttribute = element.getAttribute("class");
    var randomSentiment = SENTIMENTS[Math.floor(Math.random() * (SENTIMENTS.length - 1))];

    element.setAttribute("class", classAttribute + " with-sentiment-added " + randomSentiment);
  });

  //TODO: Do the actual highlighting and analysis here
  //TODO: Analyze sentiment if there is sufficient text inside, i.e. we should avoid analyzing subheaders
}

function hideSentiment() {
  console.log("hideSentiment");
}

init();