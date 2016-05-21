jQuery.noConflict();
define([

    'jquery',
    'text!../css/linkgua-semantic-styles.css',
    'i18n',
    'env',
    'views/video'

], function ($_lks, css, i18n, conf, VideoWidget) {

    "use strict";

    var LinkguaSemanticVideoPlugin = {

        errorNotReady: 503,
        lksWidgetContainerId : 'lks-video-widget-container',
        lksWidgetContainerClass : 'lks-video-widget-wrapper',
        account: {},

        /**
         * Init Function.
         * Es llamada en on load del client .
         */
        init: function () {
            //console.log("Init .. ");

            var that =  this;

            //Adding Style.
            this.addingStyles();

            //Append Widget Wrapper.
            this.addingWidgetWrapper();

            //Obtiene los datos del cliente.
            this.getClientData();

            // Loading Locale.
            this.loadLocale(this.account.lang,
                function () {
                    //console.log('loadding locale');
                    //Wizard creation.
                    that.widget = VideoWidget;
                    that.widget.init(that.account);
                }
            );
        },

        /**
         * Widget Container Wrapper.
         * This wrapper will render all the Widget View.
         */
        addingWidgetWrapper:function(){
            var $lks = $_lks('<div></div>', {id : this.lksWidgetContainerId, class:this.lksWidgetContainerClass });
            $_lks('body').append($lks);
        },

        /**
         * Añade los Estilos del Widget al client.
         */
        addingStyles: function () {
            // add the style tag into the head (once only)
            var $style = $_lks("<style></style>", {type: "text/css"});
            $style.text(css);
            $_lks("head").append($style);
        },

        /**
         * Carga los literales segun idioma.
         */
        loadLocale: function (lang,callback) {

            var dictUrl = conf.widgetBaseUrl+'src/lang/dictionary.json';
            $_lks.get(dictUrl,function(data){
                //Loading Dict.
                $_lks.i18n.load(data[lang]);
                //Call callback.
                if(callback)callback();
            });
        },

        /**
         * Obtiene los datos del cliente.
         * todo: Se tiene que definir como pillar estos datos de cliente [data-attribute , js, DOM .. ].
         */
        getClientData: function () {

            if (typeof window.lksConfig !== 'undefined') {

                this.account = window.lksConfig;

                //Adding Id wrapper to account info .
                this.account.lksWidgetWrapper = '#'+this.lksWidgetContainerId;
                this.account.lksWidgetContainerClass = '.' + this.lksWidgetContainerClass;

            }
        },

        /**
         *
         * @param clientCallback
         */
        callBack:function(clientCallback){
            if(clientCallback){
                this.widget.finishCallback = clientCallback;
            }
        }


    };

    return LinkguaSemanticVideoPlugin;
});

