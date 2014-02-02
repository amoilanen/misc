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
    return _.map(text.match(/[a-zA-Z\-]+/g), function(word) {
        return word.toLowerCase();
    });
}

function wordsFrequencies(words) {
    return _.reduce(words, function(frequencies, word) {
        frequencies[word] = (frequencies[word] || 0) + 1;
        return frequencies;
    }, {});
}

function sortedListOfWords(wordsFrequencies) {
    return _.sortBy(_.keys(wordsFrequencies));
}

function wordsAndFrequenciesDescending(wordsFrequencies) {
    return _.sortBy(_.map(_.keys(wordsFrequencies), function(key) {
        return [key, wordsFrequencies[key]];
    }), _.property("1")).reverse();
}

function topWords(wordsFrequencies, number) {
    return _.take(wordsAndFrequenciesDescending(wordsFrequencies), number);
}

function analyzeText(text) {
    var words = textWords(text),
        frequencies = wordsFrequencies(words),
        used = sortedListOfWords(frequencies),
        topTen = topWords(frequencies, 10);

    console.log("Word count = ", words.length);
    console.log("List of used words = ", used);
    console.log("Top 10 most used words = ", topTen);
}

analyzeText(text);