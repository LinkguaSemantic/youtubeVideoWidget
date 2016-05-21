jQuery.noConflict();
require(["jquery", "lks-video-plugin"], function ($_lks, app) {
    "use strict";
    $_lks.noConflict();
    $_lks(function () {
        window.lksVideoWidget = app;
        var okJshint = window.addEventListener ? window.addEventListener("load", window.lksVideoWidget.init(), false) : window.attachEvent("onload", window.lksVideoWidget.init());
    });
});

