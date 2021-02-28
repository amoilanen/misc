trait HealthStatus:
  def isUp: Boolean =
    true

trait InfrastructureService:
  def health: HealthStatus =
    new HealthStatus {}

case class Weather(report: String)
trait Location

trait WeatherService:
  def weatherAt(location: Location): Weather

def getWeatherAtLocation(location: Location, registeredServices: List[WeatherService & InfrastructureService]): Option[Weather] =
  registeredServices.find(_.health.isUp).map(_.weatherAt(location))

@main def doMain: Unit =
  val location = new Location {}
  val defaultService = new WeatherService with InfrastructureService:
    def weatherAt(location: Location): Weather =
      Weather("default-weather-data")
  val satelliteDataBasedService = new WeatherService with InfrastructureService:
    def weatherAt(location: Location): Weather =
      Weather("detailed-weather-data")
  val weather = getWeatherAtLocation(location, List(defaultService, satelliteDataBasedService))

  println(weather)