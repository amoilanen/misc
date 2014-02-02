var text = "Alice was beginning to get very tired of sitting by her sister on the \
bank, and of having nothing to do: once or twice she had peeped into the \
book her sister was reading, but it had no pictures or conversations in \
it, 'and what is the use of a book,' thought Alice 'without pictures or \
conversations?'\
\
So she was considering in her own mind (as well as she could, for the \
hot day made her feel very sleepy and stupid), whether the pleasure \
of making a daisy-chain would be worth the trouble of getting up and \
picking the daisies, when suddenly a White Rabbit with pink eyes ran \
close by her.";

function textWords(text) {
    var words = text.match(/[a-zA-Z\-]+/g);

    for (var i = 0; i < words.length; i++) {
        words[i] = words[i].toLowerCase();
    }
    return words;
}

function wordsFrequencies(words) {
    var frequencies = {},
        currentWord = null;
    
    for(var i = 0; i < words.length; i++) {
        currentWord = words[i];
        frequencies[currentWord] = (frequencies[currentWord] || 0) + 1;
    }
    return frequencies;
}

function sortedListOfWords(wordsFrequencies) {
    var words = [];

    for (var key in wordsFrequencies) {
        if (wordsFrequencies.hasOwnProperty(key)) {
            words.push(key);
        }
    }
    return words.sort();
}

function topTenWords(wordsFrequencies) {
    var frequencies = [],
        result = [];

    for (var key in wordsFrequencies) {
        if (wordsFrequencies.hasOwnProperty(key)) {
            frequencies.push([key, wordsFrequencies[key]]);
        }
    }

    frequencies = frequencies.sort(function(freq1, freq2) {
        return freq1[1] < freq2[1] ? 1 : (freq1[1] > freq2[1] ? -1 : 0);
    });

    for (var i = 0; i < 10; i++) {
        result[i] = frequencies[i];
    }
    return result;
}

function analyzeText(text) {
    var words = textWords(text),
        frequencies = wordsFrequencies(words),
        used = sortedListOfWords(frequencies),
        topTen = topTenWords(frequencies);

    console.log("Word count = ", words.length);
    console.log("List of used words = ", used);
    console.log("Top 10 most used words = ", topTen);
}

analyzeText(text);