package ch6

case class TrieNode(value: Char, children: Set[TrieNode], isStringEnd: Boolean = false) {

  def keys(): Set[String] = {
    if (children.isEmpty)
      Set(value.toString)
    else
      children.flatMap(child =>
        child.keys().map(value + _)
      )
  }

  private def modify(key: String,
                     onEmptyKey: => Option[TrieNode],
                     updatedChildNodeMatchingNextChar: (TrieNode, String) => Option[TrieNode],
                     updatedChildNodeIfNoMatch: String => Option[TrieNode]): Option[TrieNode] = {
    if (key.isEmpty)
      onEmptyKey
    else {
      val nextKeyChar = key.charAt(0)
      val childNodeToModify = this.children.find(_.value == nextKeyChar)
      val modifiedChildNode = childNodeToModify match {
        case Some(childNode) =>
          updatedChildNodeMatchingNextChar(childNode, key)
        case None =>
          updatedChildNodeIfNoMatch(key)
      }
      val updatedChildren = children.filter(_.value != nextKeyChar) ++ modifiedChildNode.toList
      Some(this.copy(children = updatedChildren))
    }
  }

  def addKey(key: String): Option[TrieNode] =
    modify(key,
      onEmptyKey =
        Some(this.copy(isStringEnd = true)),
      updatedChildNodeMatchingNextChar = (childNode: TrieNode, key: String) =>
        childNode.addKey(key.substring(1)),
      updatedChildNodeIfNoMatch = (key: String) =>
        TrieNode(key.head, Set()).addKey(key.substring(1)))

  def deleteKey(key: String): Option[TrieNode] =
    modify(key,
      onEmptyKey =
        if (children.isEmpty)
          None
        else
          Some(this.copy(isStringEnd = false)),
      updatedChildNodeMatchingNextChar = (childNode: TrieNode, key: String) =>
        childNode.deleteKey(key.substring(1)),
      updatedChildNodeIfNoMatch = (key: String) =>
        None)
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

  def keyPrefixesOf(string: String): Set[String] = {
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
    root.deleteKey(key).map(Trie(_)).getOrElse(Trie.EmptyTrie)

  def keysHavingPrefix(prefix: String): Set[String] = {
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
  val EmptyTrie = new Trie(TrieNode(SentinelChar, Set()))

  def withKeys(keys: List[String]): Trie = {
    val root = keys.foldLeft(Option(EmptyTrie.root))({ case (currentRoot, key) =>
      currentRoot.flatMap(_.addKey(key))
    })
    root.map(Trie(_)).getOrElse(Trie.EmptyTrie)
  }
}