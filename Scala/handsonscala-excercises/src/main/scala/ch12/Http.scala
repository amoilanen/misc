package ch12

import requests.Response

//Temporarily mocking requests to not submit actual POST requests
object Http {

  case class MockResponse(value: String, code: Int) {
    def text() = value
    def statusCode() = code
  }

  object req {
    def post(url: String, headers: Map[String, String], data: Any): MockResponse = {
      println(s"POST $url, $headers \n$data")
      MockResponse("{\"number\": 100}", 200)
    }

    def get(url: String, params: Map[String, String], headers: Map[String, String]): Response =
      requests.get(url, params = params, headers = headers)
  }
}
