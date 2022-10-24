package antivanov.codility.lessons

case class CrossingState(waitingForLeavesToFall: Set[Int], earliestTimeToCross: Option[Int] = None)

def earliestMomentToCross(riverLength: Int, fallingLeavesInTime: Seq[Int]): Int = {
  val leavesToFall = (1 to riverLength).toSet
  val finalCrossingState: CrossingState = fallingLeavesInTime.zipWithIndex.foldLeft(CrossingState(leavesToFall))({
    case (CrossingState(leftLeaves, Some(timeToCross)), _) => CrossingState(leftLeaves, Some(timeToCross))
    case (CrossingState(leftLeaves, None), (leafPosition, currentTime)) =>
      val updatedLeavesLeftToFall = leftLeaves - leafPosition
      val timeToCross = if (updatedLeavesLeftToFall.isEmpty)
        Some(currentTime)
      else
        None
      CrossingState(updatedLeavesLeftToFall, timeToCross)
  })
  finalCrossingState.earliestTimeToCross.getOrElse(-1)
}

@main def lesson41Main: Unit =
  val riverLength = 5
  val fallingLeavesInTime = Seq(1, 3, 1, 4, 2, 3, 5, 4)
  assert(earliestMomentToCross(riverLength, fallingLeavesInTime) == 6)