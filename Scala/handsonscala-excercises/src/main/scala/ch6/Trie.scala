package ch6

case class TrieNode[T](value: Char, children: Set[TrieNode[T]], isStringEnd: Boolean = false, storedValue: Option[T] = None) {

  def keysWithNodes: Set[(String, TrieNode[T])] = {
    val current =
      if (isStringEnd)
        Set((value.toString, this))
      else
        Set()
    current ++ children.flatMap(child =>
        child.keysWithNodes.map({ case (key, node) =>
          (value + key, node)}))
  }

  private def modify(key: String,
                     onEmptyKey: => Option[TrieNode[T]],
                     updatedChildNodeMatchingNextChar: (TrieNode[T], String) => Option[TrieNode[T]],
                     updatedChildNodeIfNoMatch: String => Option[TrieNode[T]]): Option[TrieNode[T]] = {
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

  def addKey(key: String, value: Option[T] = None): Option[TrieNode[T]] =
    modify(key,
      onEmptyKey =
        Some(this.copy(isStringEnd = true, storedValue = value)),
      updatedChildNodeMatchingNextChar = (childNode: TrieNode[T], key: String) =>
        childNode.addKey(key.substring(1), value),
      updatedChildNodeIfNoMatch = (key: String) =>
        TrieNode[T](key.head, Set()).addKey(key.substring(1), value))

  def deleteKey(key: String): Option[TrieNode[T]] =
    modify(key,
      onEmptyKey =
        if (children.isEmpty)
          None
        else
          Some(this.copy(isStringEnd = false)),
      updatedChildNodeMatchingNextChar = (childNode: TrieNode[T], key: String) =>
        childNode.deleteKey(key.substring(1)),
      updatedChildNodeIfNoMatch = (key: String) =>
        None)
}

case class Trie[T](root: TrieNode[T]) {

  private def findNode(keyPrefix: String): Option[TrieNode[T]] =
    if (keyPrefix.isEmpty)
      None
    else
      keyPrefix.foldLeft(Option(root))((subTrie, nextKeyChar) => {
        subTrie.flatMap(_.children.find(_.value == nextKeyChar))
      })

  def add(key: String, value: T): Trie[T] =
    Trie(root.addKey(key, Some(value)).getOrElse(root))

  def get(key: String): Option[T] =
    findNode(key)
      .filter(_.isStringEnd)
      .flatMap(_.storedValue)

  def contains(key: String): Boolean = {
    val foundNode = findNode(key)
    foundNode.map(_.isStringEnd).getOrElse(false)
  }

  def keyPrefixesOfWithValues(string: String): Map[String, T] =
    ???

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

  def delete(key: String): Trie[T] =
    root.deleteKey(key).map(Trie(_)).getOrElse(Trie.emptyTrie)

  private def keysAndNodesHavingPrefix(prefix: String): Set[(String, Option[T])] =
    findNode(prefix)
      .map(_.keysWithNodes)
      .getOrElse(Set())
      .map({ case (key, node) =>
        (prefix + key.drop(1), node.storedValue)
      })

  def keysHavingPrefixWithValues(prefix: String): Map[String, T] =
    keysAndNodesHavingPrefix(prefix).flatMap({ case (key, value) =>
        value.toSet.map((v: T) => key -> v)
      })
      .toMap

  def keysHavingPrefix(prefix: String): Set[String] =
    keysAndNodesHavingPrefix(prefix).map({ case (key, _) => key })
}

object Trie extends App {

  private val SentinelChar = '#'
  def rootNode =
    TrieNode[Nothing](SentinelChar, Set())
  val EmptyTrie = new Trie[Nothing](rootNode)

  def emptyTrie[T]: Trie[T] =
    EmptyTrie.asInstanceOf[Trie[T]]

  def withKeys(keys: List[String]): Trie[Nothing] = {
    val root = keys.foldLeft(Option(rootNode))({ case (currentRoot, key) =>
      currentRoot.flatMap(_.addKey(key))
    })
    root.map(Trie[Nothing](_)).getOrElse(Trie.EmptyTrie)
  }
}
