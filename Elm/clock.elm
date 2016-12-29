Copyright (c) 2014-2016, Evan Czaplicki
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the {organization} nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
-}

{-
Based on the example from https://github.com/evancz/elm-architecture-tutorial/blob/master/LICENSE
Added minute and hour hands, and the ability to pause/resume the clock, minor re-factoring
-}

import Html exposing (..)
import Html.Events exposing (..)
import Svg exposing (..)
import Svg.Attributes exposing (..)
import Time exposing (Time, second)

main =
  Html.program
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

-- MODEL
type alias Model = {
  time: Time,
  paused: Bool
}

init : (Model, Cmd Msg)
init =
  (Model 0 False, Cmd.none)

-- UPDATE
type Msg
  = PauseResume
  | Tick Time

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    Tick newTime ->
      (Model newTime model.paused, Cmd.none)

    PauseResume ->
      (Model model.time (not model.paused), Cmd.none)

-- SUBSCRIPTIONS
subscriptions : Model -> Sub Msg
subscriptions model =
  if model.paused then
    Sub.none
  else
      Time.every second Tick

-- VIEW
view : Model -> Html Msg
view model =
  let
    secondsAngle = handAngle (Time.inSeconds model.time) 60
    minutesAngle = handAngle (Time.inMinutes model.time) 60
    hoursAngle = handAngle (Time.inHours model.time) 12
  in
    div []
    [
      button [ onClick PauseResume ] [ Html.text "Pause/Resume" ],
      svg [ viewBox "0 0 100 100", width "300px" ]
        [ circle [ cx "50", cy "50", r "45", fill "#0B79CE" ] []
        , clockHand secondsAngle 40
        , clockHand minutesAngle 30
        , clockHand hoursAngle 20
        ]
    ]

handAngle : Time -> Int -> Float
handAngle time totalUnitsInClock =
  let
    units = rem (floor time) totalUnitsInClock
  in
    degrees (270 + 360 * (toFloat units) / (toFloat totalUnitsInClock))

clockHand : Float -> Float -> Html Msg
clockHand angle length =
  let
    handX =
      toString (50 + length * cos angle)
    handY =
      toString (50 + length * sin angle)
  in
    line [ x1 "50", y1 "50", x2 handX, y2 handY, stroke "#023963" ] []
