package sorting

object Sorting {

  def bubbleSort[A <% Ordered[A]](seq: Seq[A]): Seq[A] = {

    def bubbleSortIteration[A <% Ordered[A]](seq: Seq[A]): Seq[A] = seq match {
      case (x::y::rest) =>
        if (x > y) {
          y +: bubbleSortIteration(x :: rest)
        } else {
          x +: bubbleSortIteration(y :: rest)
        }
      case all => all
    }

    def bubbleSortWithIndex[A <% Ordered[A]](seq: Seq[A], idx: Integer): Seq[A] = {
      if (idx == seq.length) {
        seq
      } else {
        bubbleSortWithIndex(bubbleSortIteration(seq), idx + 1)
      }
    }

    bubbleSortWithIndex(seq, 0)
  }
}