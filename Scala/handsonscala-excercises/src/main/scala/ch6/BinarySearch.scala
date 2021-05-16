package ch6

import scala.annotation.tailrec

object BinarySearch extends App {

  @tailrec
  def search[T: Ordering](elements: IndexedSeq[T], element: T, from: Int, to: Int): Int =
    if (from > to)
      -1
    else {
      val ordering = implicitly[Ordering[T]]
      val middleIndex = (from + to) / 2
      val middleElement = elements(middleIndex)
      if (ordering.gt(element, middleElement))
        search(elements, element, middleIndex + 1, to)
      else if (ordering.lt(element, middleElement))
        search(elements, element, from, middleIndex - 1)
      else
        middleIndex
    }

  def search[T: Ordering](elements: IndexedSeq[T], element: T): Int =
    search(elements, element, 0, elements.length - 1)
}
