module CssStyles exposing (commonCssStyles)

import Html exposing (..)

commonCssStyles: Html msg
commonCssStyles = 
  let
    styleContent = """
      .describe, .pass, .fail {
        margin-left: 1rem;
      }
      .pass {
        color: green;
      }
      .fail {
        color: red;
      }
      .fail:before {
        content: "x - ";
      }
      .errorMessage {
        font-style: italic;
        font-size: 0.8rem;
        margin-left: 1rem;
        margin-bottom: 1rem;
      }
    """
  in node "style" [] [text(styleContent)]