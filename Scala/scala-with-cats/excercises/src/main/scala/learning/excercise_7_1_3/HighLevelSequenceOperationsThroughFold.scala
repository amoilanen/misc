package learning.excercise_7_1_3

object HighLevelSequenceOperationsThroughFold {

  def map[A, B](list: List[A])(f: A => B): List[B] =
    list.foldRight(List[B]()) {
      (e: A, acc: List[B]) =>
        f(e) :: acc
    }

  def flatMap[A, B](list: List[A])(f: A => List[B]): List[B] =
    list.foldRight(List[B]()) {
      (e: A, acc: List[B]) =>
        f(e) ++ acc
    }

  def filter[A](list: List[A])(p: A => Boolean): List[A] =
    list.foldRight(List[A]()) {
      (e: A, acc: List[A]) =>
        if (p(e)) {
          e :: acc
        } else {
          acc
        }
    }

  def sum[A](list: List[A])(implicit n: Numeric[A]): A =
    list.foldRight(n.zero) {
      (e: A, acc: A) =>
        n.plus(e, acc)
    }
}
