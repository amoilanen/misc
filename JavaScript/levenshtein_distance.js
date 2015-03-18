/*
 * Computing the Levenstein distance between strings.
 * http://en.wikipedia.org/wiki/Levenshtein_distance
 */

/*
 * Inefficient recursive algorithm.
 */
function stringDistance(str1, length1, str2, length2) {

  /*
   * If one of the strings is empty then the distance
   * is the length of the other string.
   */
  if ((length1 == 0) || (length2 == 0)) {
    return length1 + length2;
  }

  var cost = (str1[length1 - 1] == str2[length2 - 1]) ? 0 : 1;

  /*
   * Looking at all the possible options to transform one string into another
   * and choosing the minimum number of steps which will be by definition 
   * the Levenshtein distance between str1 and str2:
   * - Removing one character from first string
   * - Removing one character from second string
   * - Removing one character from both strings
   */
  return Math.min(
    stringDistance(str1, length1 - 1, str2, length2) + 1,
    stringDistance(str1, length1, str2, length2 - 1) + 1,
    stringDistance(str1, length1 - 1, str2, length2 - 1) + cost
  );
}

function distance(str1, str2) {
  return stringDistance(str1, str1.length, str2, str2.length);
}

console.log("String distance = ", distance("kitten", "sitting"));