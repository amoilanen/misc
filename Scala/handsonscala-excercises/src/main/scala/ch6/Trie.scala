package ch6

import io.circe._, io.circe.generic.auto._, io.circe.parser._, io.circe.syntax._

case class TrieNode(value: Char, children: Set[TrieNode]) {
  val isLeaf = children.isEmpty

  def keys(): Set[String] = {
    if (isLeaf)
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

  def contains(key: String): Boolean =
    findNode(key).map(_.isLeaf).getOrElse(false)

  def prefixesMatchingKey(key: String): Set[String] =
    ???

  def keysMatchingPrefix(prefix: String): Set[String] =
    findNode(prefix)
      .map(_.keys())
      .getOrElse(Set())
      .map(prefix + _.drop(1))
}

object Trie extends App {

  private val SentinelChar = '#'

  private def addKeyAt(node: TrieNode, key: String): TrieNode = {
    if (key.isEmpty)
      node
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

  val keys = List("abcd", "abe", "ac", "ad", "efg", "eab")
  val trie = Trie(keys)
  println(trie.asJson.spaces2)

  println(trie.contains("abe"))
  println(trie.contains("ab"))
  println(trie.contains("fgh"))
  println(trie.contains(""))

  println(trie.keysMatchingPrefix("ab"))
}