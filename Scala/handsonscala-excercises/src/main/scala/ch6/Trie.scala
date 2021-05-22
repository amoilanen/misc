package ch6

import io.circe._, io.circe.generic.auto._, io.circe.parser._, io.circe.syntax._

case class TrieNode(value: Char, children: Set[TrieNode], isStringEnd: Boolean = false) {

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

  private def findNode(keyPrefix: String): Option[TrieNode] =
    if (keyPrefix.isEmpty)
      None
    else
      keyPrefix.foldLeft(Option(root))((subTrie, nextKeyChar) => {
        subTrie.flatMap(_.children.find(_.value == nextKeyChar))
      })

  def contains(key: String): Boolean = {
    val foundNode = findNode(key)
    foundNode.map(_.isStringEnd).getOrElse(false)
  }

  def prefixesMatchingKey(key: String): Set[String] =
    ???

  def delete(key: String): Option[String] =
    ???

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
          addKeyAt(TrieNode(nextKeyChar, Set()), key.substring(1))
      }
      val updatedChildren = node.children.filter(_.value != nextKeyChar) + modifiedChildNode
      node.copy(children = updatedChildren)
    }
  }

  def apply(keys: List[String]): Trie = {
    val emptyTrie = TrieNode(SentinelChar, Set())
    val root = keys.foldLeft(emptyTrie)({ case (node, key) =>
      addKeyAt(node, key)
    })
    Trie(root)
  }

  val keys = List("abcd", "abe", "ab", "ac", "ad", "efg", "eab")
  val trie = Trie(keys)
  println(trie.asJson.spaces2)

  assert(trie.contains("abe") == true)
  assert(trie.contains("ab") == true)
  assert(trie.contains("fgh") == false)
  assert(trie.contains("ah") == false)

  assert(trie.keysMatchingPrefix("ab") == Set("abcd", "abe", "ab"))
}