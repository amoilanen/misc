package ch6

import io.circe._, io.circe.generic.auto._, io.circe.parser._, io.circe.syntax._

case class TrieNode(value: Char, children: Set[TrieNode], parent: Option[TrieNode], isStringEnd: Boolean = false) {

  def keys(): Set[String] = {
    if (children.isEmpty)
      Set(value.toString)
    else
      children.flatMap(child =>
        child.keys().map(value + _)
      )
  }
}

case class Trie(root: TrieNode) {

  private def findNode(keyPrefix: String, keepLastMatch: Boolean = false): Option[TrieNode] =
    if (keyPrefix.isEmpty)
      None
    else {
      val matchedNodes = keyPrefix.foldLeft(List(Option(root)))((matchedNodes, nextKeyChar) => {
        val subTrie = matchedNodes.head
        subTrie.flatMap(_.children.find(_.value == nextKeyChar)) +: matchedNodes
      })
      if (keepLastMatch)
        matchedNodes.dropWhile(!_.isDefined).head
      else
        matchedNodes.head
    }

  def contains(key: String): Boolean =
    findNode(key).map(_.isStringEnd).getOrElse(false)

  def keysMatchingStringPrefix(string: String): Set[String] = {
    val (matchingNodes, _) = (0 until string.length).toList.foldLeft((List((root, -1)), Option(root)))({ case (acc, idx) =>
      val (previousMatchingNodes, lastMatchingNode) = acc
      val nextChar = string.charAt(idx)
      val nextMatchingNode = lastMatchingNode.flatMap(_.children.find(_.value == nextChar))
      val nextMatchingNodes = nextMatchingNode.map((_, idx)).toList ++ previousMatchingNodes
      (nextMatchingNodes, nextMatchingNode)
    })
    matchingNodes.flatMap({ case (node, idx) =>
      if (node.isStringEnd)
        List(string.substring(0, idx + 1))
      else
        List()
    }).toSet
  }

  def delete(key: String): Trie =
    this

  def keysMatchingPrefix(prefix: String): Set[String] = {
    val prefixNode = findNode(prefix)
    val prefixKey: Option[String] = prefixNode.flatMap(node => {
      if (node.isStringEnd)
        Some(prefix)
      else
        None
    })

    prefixKey.toSet ++
      prefixNode
        .map(_.keys())
        .getOrElse(Set())
        .map(prefix + _.drop(1))
  }
}

object Trie extends App {

  private val SentinelChar = '#'

  private def addKeyAt(node: TrieNode, key: String): TrieNode = {
    if (key.isEmpty)
      node.copy(isStringEnd = true)
    else {
      val nextKeyChar = key.charAt(0)
      val childNodeToModify = node.children.find(_.value == nextKeyChar)
      val modifiedChildNode = childNodeToModify match {
        case Some(childNode) =>
          addKeyAt(childNode, key.substring(1))
        case None =>
          addKeyAt(TrieNode(nextKeyChar, Set(), Some(node)), key.substring(1))
      }
      val updatedChildren = node.children.filter(_.value != nextKeyChar) + modifiedChildNode
      node.copy(children = updatedChildren)
    }
  }

  def apply(keys: List[String]): Trie = {
    val rootNode = TrieNode(SentinelChar, Set(), None)
    val root = keys.foldLeft(rootNode)({ case (node, key) =>
      addKeyAt(node, key)
    })
    Trie(root)
  }

  val keys = List("abcd", "abe", "ab", "ac", "ad", "efg", "eab")
  val trie = Trie(keys)
  println(trie.asJson.spaces2)

  assert(trie.contains("abcd") == true)
  assert(trie.contains("abe") == true)
  assert(trie.contains("ab") == true)
  assert(trie.contains("ac") == true)
  assert(trie.contains("ad") == true)
  assert(trie.contains("efg") == true)
  assert(trie.contains("eab") == true)
  assert(trie.contains("fgh") == false)
  assert(trie.contains("ah") == false)

  assert(trie.keysMatchingPrefix("ab") == Set("abcd", "abe", "ab"))
  assert(trie.keysMatchingStringPrefix("abcdef") == Set("ab", "abcd"))

  val trieWithDeletedKeys = trie.delete("ab").delete("efg").delete("ea") // "ea" is not a valid key in Trie

  //TODO: Another test case when ae eb are deleted
}