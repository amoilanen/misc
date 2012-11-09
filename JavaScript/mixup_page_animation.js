//URL for a bookmarklet in a browser:
//javascript:var script = document.createElement("script"); script.src="https://raw.github.com/gist/3084823/6d8c6643e41092d09fa80c0db5234adbea7f94ea/mixup_page_animation.js"; document.body.appendChild(script);void(0);

(function(win) {
    var elements = document.querySelectorAll("img, div");

    setInterval(function() {    
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.position = "fixed";
            elements[i].style.top = Math.floor(Math.random() * win.innerHeight).toString() + "px";
            elements[i].style.left = Math.floor(Math.random() * win.innerWidth).toString() + "px";
        };
    }, 1000);
})(this);