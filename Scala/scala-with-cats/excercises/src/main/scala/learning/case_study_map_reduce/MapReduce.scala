package learning.case_study_map_reduce

import cats.Monoid

object MapReduce {

  def foldMap[A, B: Monoid](input: Vector[A])(f: A => B): B = {
    val m = implicitly[Monoid[B]]
    val mappedInput = input.map(f)
    mappedInput.reduce((partialResult, mappedItem) =>
      m.combine(partialResult, mappedItem)
    )
  }
}
