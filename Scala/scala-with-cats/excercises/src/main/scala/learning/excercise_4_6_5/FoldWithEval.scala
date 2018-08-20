package learning.excercise_4_6_5

import cats.Eval

object FoldWithEval {

  def foldRight[A, B](as: List[A], acc: B)(fn: (A, B) => B): B =
    foldRightEval(as, acc)(fn).value

  def foldRightEval[A, B](as: List[A], acc: B)(fn: (A, B) => B): Eval[B] =
    as match {
      case head::tail =>
        Eval.defer(
          foldRightEval(tail, acc)(fn).map {
            tailAcc => fn(head, tailAcc)
          }
        )
      case Nil =>
        Eval.now(acc)
    }
}
