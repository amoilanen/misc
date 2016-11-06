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
      case rest => rest
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

  def quickSort[A <% Ordered[A]](seq: Seq[A]): Seq[A] = seq match {
    case (x::xs) => {
      val lessThan = for {y <- xs; if (y < x)} yield y
      val greaterThan = for {y <- xs; if (y >= x)} yield y
      (quickSort(lessThan) :+ x) ++ quickSort(greaterThan)
    }
    case x => x
  }

  def mergeSort[A <% Ordered[A]](seq: Seq[A]): Seq[A] = {

    def splitInHalf[A](seq: Seq[A]): (Seq[A], Seq[A]) = {
      val halfLength = seq.size / 2
      (seq.take(halfLength), seq.drop(halfLength))
    }

    def merge[A <% Ordered[A]](seq1: Seq[A], seq2: Seq[A]): Seq[A] = (seq1, seq2) match {
      case (Seq(), s) => s
      case (s, Seq()) => s
      case (x::xs, y::ys) => if (x < y) {
        x +: merge(xs, y::ys)
      } else {
        y +: merge(x::xs, ys)
      }
    }

    if (seq.size > 1) {
      val (left, right) = splitInHalf(seq)
      merge(mergeSort(left), mergeSort(right))
    } else {
      seq
    }
  }
}