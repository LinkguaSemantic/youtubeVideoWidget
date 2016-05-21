define([

    'jquery',
    'i18n',
    'env',
    'ractive',
    //services
    'models/lks-api-service',
    'models/youtube-api-service',
    //layouts
    'rv!templates/video/layout',
    //partials
    'rv!templates/video/partials/screen',
    'rv!templates/video/partials/carousel',
    'rv!templates/video/partials/loading',
    
    'ractive-touch',
    
    '../../../bower_components/moment/moment'


], function ($_lks, i18n, conf, Ractive, lksApiService, youTubeApiService, layout, Screen, Carousel, Loading, RactiveTouch, moment_lks) {

    "use strict";

    var Widget = {

        account: {},
        pluginUrl: conf.widgetBaseUrl,

        defaultVideoLimit: 15,

        //Dom Handlers.
        youtubePlayer: '.lks-yt-player-iframe',
        youtubeAPIPlayer: null,
        visorOverlay: '.lks-overlay',
        imagesSelector: '.lks-video-item',
        
        page: 1,
        nextPetitionPage: null,
        actualEntity: null,
        inPetition: false,
        inChangePage: false,
        
        allEntities: [],

        lang: null,


        /**
         * Init Function.
         * Es llamada en on load del client .
         */
        init: function (account) {

            Ractive.DEBUG = false;
            this.account = account;

            //Setting Layout in DOM.
            this.initLayout();

            //Starting ApiHandler.
            this.lksApi = lksApiService;
            this.lksApi.init(this.account);

            var html_string = this.getTextToAnnotate();

            // Si ya viene recogiendo un video de share, muestro el loading
            var vars = this.getUrlVars();
            if(typeof vars.lksvideoentity !== 'undefined'){
                this.layout.set('haveVideos', false);
                this.showWidget();
            }
            this.makeTextAnnotation(html_string);
        },

        /**
         * Init Reactive for Widget Layout.
         */
        initLayout: function () {

            //console.log('Init Layout');

            var that = this;

            // Add YT API
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/player_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            this.layout = new Ractive({

                el: this.account.lksWidgetWrapper,

                template: layout,

                partials: {
                    screen: Screen,
                    carousel: Carousel,
                    loading: Loading
                },

                data: {
                    //Selected Entity (Show some data about selected entity.)
                    selectedEntity: {},
                    //Video On Screen.
                    screenVideo: {},
                    //items [Videos de una entidad.]
                    items: [],

                    leftArrowSee: false,
                    rightArrowSee: true,
                    haveVideos: false,
                    seeInfoBool: false,
                    seeShareBool: false,
                    
                    shareUrl: null,
                    shareUrlURI: null
                }
            });

            //Element to Watch in this template.
            this.layout.observe('items', function () {
                //console.log('Ha cambiado el listado de Videos.');
            });

            //todo: Los elementos de reactive pueden ser cambiados en tiempo real.
            //ex. this.layout.set('items',newItems); //Esto cambiará los elementos y volverá a pintar la vista.[Paginado]

            //Manejador de Eventos ocurridos dentro del Layout
            //Estos eventos se ponen desde los templates
            //ref: http://docs.ractivejs.org/latest/event-directives
            var on = {

                //Hide Widget.
                hideWidget: function (ev) {
                    ev.original.preventDefault();
                    //console.log("Hide Widget");
                    that.hideWidget();
                },

                //Select Video From Carousel.
                selectVideo: function (ev) {
                    ev.original.preventDefault();
                    var videoId = $_lks(ev.node).attr('data-id');
                    //console.log("Select Video: " + videoId);
                    that.showVideo(videoId);
                },

                //Reduce una página
                minusPage: function (ev) {
                    if(that.page > 1){
                        that.page--;
                        if(that.page == 1){
                            that.layout.set('leftArrowSee', false);
                        }
                        that.pageScroll();
                    }
                },

                //Añade una página
                plusPage: function (ev) {
                    that.page++;
                    if(that.page > 1){
                        that.layout.set('leftArrowSee', true);
                    }
                    // Calcular con un margen de una página adicional
                    if(that.layout.get('items').length <= (that.page + 1) * 10) {
                        if(!that.inPetition)
                            that.getVideosFromEntity(false);
                    }
                    that.pageScroll();
                },

                //Es el listener del arrastre del carroussel
                movePan:function(ev){
                    if(!that.inChangePage){
                        if(ev.original.direction == 2){
                            on.plusPage();
                        }else{
                            on.minusPage();
                        }
                    }
                },
                seeInfo: function(ev){
                  // TODO
                    //console.log("info");
                    /*that.stopVideoInBackground();*/
                    that.layout.set('seeInfoBool', true);

                },
                hideInfo: function(ev){
                    that.layout.set('seeInfoBool', false);
                },




                openLinkguaPage: function(ev){
                    that.stopVideoInBackground();
                    var win = window.open("https://linkgua-semantic.com", '_blank');
                    win.focus();
                },

                shareBox: function(ev){
                    // TODO Falla a partir del segundo renderizado
                    if(!that.layout.get('seeShareBool')){
                        var url = location.protocol + '//' + location.host + location.pathname + '?lksvideoentity=' + that.actualEntity;
                        that.layout.set('shareUrl', url);
                        that.layout.set('shareUrlURI', encodeURIComponent(url));
                        that.layout.set('shareTitle', url); // TODO
                        
                        // Reabre el script de twitter
                        $_lks.getScript('http://platform.twitter.com/widgets.js');
                        
                        that.layout.set('seeShareBool', true);
                    }else{
                        that.layout.set('seeShareBool', false);
                    }
                    
                }
            };

            
            this.layout.on(on);

        },

        //Crea la animación para que el carousel vaya a la página actual
        pageScroll: function(){
            var that = this;
            
            this.inChangePage = true;
            var $selector = $_lks(".lks-video-widget-wrapper .lks-selector .lks-selector-content");
            $selector.animate({
                marginLeft: "-" + (this.page - 1) + "00vw"
            }, 500, function(){
                that.inChangePage = false;
            });
        },

        /**
         * Call the annotate service.
         * @param html_string
         */
        makeTextAnnotation: function (html_string) {
            var that = this;

            this.lksApi.annotate(
                //text to Annotate.
                html_string,
                //OK
                function (data) {
                    that.lang = data.lang;
                    that.saveEntitiesInText(data.annotations);
                    that.setAnnotatedHtml(data.wikifiedDocument);
                },
                //KO
                function (response) {
                    that.showError(response);
                }
            );
        },

        /**
         * Call get Entity Videos Service
         */
        getVideosFromEntity: function (firstTime) {
            var that = this;
            
            var entityParams = {
                lang: that.lang,
                id: that.actualEntity,
                limit: that.defaultVideoLimit,
                offset: that.nextPetitionPage
            };

            that.inPetition = true;

            this.lksApi.getVideosFromEntity(
                //Entity Data.
                entityParams,
                //OK
                function (response) {
                    // si no es visible porque lo ha ocultado mientras cargaba
                    if($_lks(that.account.lksWidgetWrapper).css("opacity") != 1){
                        return;
                    }
                    
                    that.nextPetitionPage = response.data.offset;
                    
                    //set videos to carousel
                    if(firstTime){
                        that.setVideos(response.data.items);
                        var firstVideo = response.data.items[0];

                        //Adding Channel Info to Video.
                        that.addInfoChannelToVideo(
                            firstVideo,
                            function(firstVideo){
                                that.layout.set('haveVideos', true);
                                function onPlayerReady() {
                                    that.setNewVideoScreen(firstVideo);
                                }
                                that.youtubeAPIPlayer = new YT.Player('lks-yt-player-iframe', {
                                    height: '340',
                                    width: '600',
                                    videoId: null,
                                    enablejsapi: 1,
                                    version: 3,
                                    playerapiid: "ytplayer",
                                    autoplay: 0,
                                    fs: 1,
                                    rel: 0,
                                    events:{
                                        "onReady": onPlayerReady
                                    }
                                });
                                that.bindWheelEvent();
                            },
                            function(msg){
                                that.showError(msg);
                            }
                        );

                    }else{
                        that.addNewVideos(response.data.items);
                    }
                    
                    that.inPetition = false;
                },
                //KO
                function (response) {
                    that.showError(response);
                }
            );
        },

        /**
         * Guarda las entidades encontradas en el texto.
         * todo: Salvar las entitdades encontradas para utilizarlas para aportar otros datos en la navegacion.
         * @param entities
         */
        saveEntitiesInText: function (entities) {
            //todo: add to reactive data model.
            //todo: with this we can get the clicked entity and show info about it when Screen Video is Showed.
            this.allEntities = entities;
            //console.log(entities);
        },

        /**
         * Set Videos Items to Dom.
         * todo: Se debe mirar que pasa con la paginacion. En vez de hacer un replace se debe añadir los nuevos elementos.
         * @param videoItems
         */
        addNewVideos: function (videoItems) {
            this.layout.get('items').push.apply(this.layout.get('items'), videoItems);
        },

        /**
         * Adding new videos to Dom.
         * @param videoItems
         */
        setVideos: function(videoItems){
            this.layout.set('items', videoItems);
        },

        /**
         * Set Video Item On Screen.
         * @param videoItem
         */
        setNewVideoScreen: function (videoItem) {
            this.layout.set('screenVideo', videoItem);

            // Detección de si es IPAD
            var isiPad = navigator.userAgent.match(/iPad/i) !== null;
            // iphone/ipod
            var isiPhone = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i));


            // Autoplay / Not autoplay Video
            if(isiPad || isiPhone) {
                this.youtubeAPIPlayer.cueVideoById(videoItem.id.videoId);
            }else{
                this.youtubeAPIPlayer.loadVideoById(videoItem.id.videoId);
            }
        },

        /**
         * Show the Video in Widget.
         * @param videoId
         */
        showVideo: function (videoId) {
            var that = this;
            var selectedVideo = $_lks.grep(this.layout.get('items'), function (item) {
                return item.id.videoId === videoId;
            });
            var video = selectedVideo[0];
            //Adding Channel Info to Video.
            this.addInfoChannelToVideo(
                video,
                function(video){
                    that.setNewVideoScreen(video);
                },
                function(msg){
                    that.showError(msg);
                }
            );
        },

        /**
         * Get Channel Info from Video.
         * @param video
         * @param callbackSuccess
         * @param callbackError
         */
        addInfoChannelToVideo:function(video,callbackSuccess,callbackError){
            video.snippet.publishedAt = moment_lks(video.snippet.publishedAt).format("DD-MM-YYYY HH:mm");
            
            youTubeApiService.getChannelProfileImage(
                video.snippet.channelId,
                function(response){
                    video.channelInfo = response.items.length ?  response.items[0] : undefined;
                    if(callbackSuccess)callbackSuccess(video);
                },
                function (msg) {
                    //console.log('Error getting Channel Img.');
                    if(callbackError)callbackError(msg);
                }
            );
        },


        setEntityFromId: function(entityId){
            var that = this;
            that.actualEntity = entityId;
            //console.log('Getting entity data');

            var selectedEntity = $_lks.grep(that.allEntities,function(entity){
                return entity.id === Number(entityId);
            });
            that.lksApi.getEntity(
                //Entity Data.
                selectedEntity[0],
                that.lang,
                //OK
                function (response) {
                    that.layout.set('selectedEntity', response.data);
                },
                function(error){

                }
            );

            that.page = 1;
            that.nextPetitionPage = null;
            that.inPetition = false;
            that.pageScroll(); // Deja el scroll a 0
            that.getVideosFromEntity(true);
            that.layout.set('haveVideos', false);
            that.showWidget();

            that.layout.set('leftArrowSee', false);
            that.layout.set('rightArrowSee', true);
        },

        bindURLEventsOverEntities: function(){
            var vars = this.getUrlVars();
            if(typeof vars.lksvideoentity !== 'undefined'){
                this.setEntityFromId(vars.lksvideoentity);
            }
        },
        /**
         * Watch Over Found Entities.
         */
        bindEventsOverEntities: function () {

            var that = this;

            $_lks(this.account.lks_text_container).find('a.wm_wikifiedLink').click(function (event) {
                event.preventDefault();
                that.setEntityFromId($_lks(this).attr("pageid"));
            });
        },

        /**
         * Obtiene el texto que se debe annotar.
         * todo: Esta funcion puede tener más lógica. Que pasa si el selector de texto está en varias secciones del DOM.
         * todo: Se debe hacer algo tipo recolectar todos los posibles textos y meterlos en array y mandarlos a anotar todos.
         * @returns {*|jQuery}
         */
        getTextToAnnotate: function () {
            return $_lks(this.account.lks_text_container).html();
        },

        /**
         * Change the original text with the annotated one.
         * todo: Se debe tratar el caso de que sean varios pedazos de código a anotar en el texto. (Un array de textos a anotar.)
         * @param annotatedHtml
         */
        setAnnotatedHtml: function (annotatedHtml) {

            //replace the text.
            $_lks(this.account.lks_text_container).html(annotatedHtml);

            //Biding Events Over Entities.
            this.bindEventsOverEntities();
            this.bindURLEventsOverEntities();

        },

        /**
         * General Error function.
         * @param msg
         */
        showError: function (msg) {
            //todo: do something
            //console.log('Error: ' + JSON.stringify(msg));
        },

        /**
         * Esconde el Widget.
         */
        hideWidget: function () {
            var that = this;
            var $visorWrapper = $_lks(this.account.lksWidgetWrapper);

            $visorWrapper.animate({
                opacity: 0
            }, 500, function () {
                $visorWrapper.hide();
                that.layout.set('seeInfoBool', false);
                that.layout.set('seeShareBool', false);
                that.stopVideoInBackground();
            });
        },

        /**
         * Show the Widget.
         */
        showWidget: function () {
            var $visorWrapper = $_lks(this.account.lksWidgetWrapper);

            $visorWrapper.show();
            $visorWrapper.animate({
                opacity: 1
            }, 500);
        },
        
        
        stopVideoInBackground: function(){
            var that = this;
            var $visorWrapper = $_lks(this.account.lksWidgetWrapper);
            
            //Stop Videos in Background.
            $visorWrapper.find(that.youtubePlayer).each(function () {
                this.contentWindow.postMessage('{"event":"command","func":"' + 'stopVideo' + '","args":""}', '*');
            });
        },

        bindWheelEvent: function(){
            var that = this;

            var element = window.document.getElementsByClassName("lks-selector")[0];

            if (element.addEventListener) {
                // IE9, Chrome, Safari, Opera
                element.addEventListener("mousewheel", MouseWheelHandler, false);
                // Firefox
                element.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
            }
            // IE 6/7/8
            else element.attachEvent("onmousewheel", MouseWheelHandler);
            function MouseWheelHandler(e){
                if(!that.inChangePage){
                    if(e.deltaY < 0){
                        that.layout.fire('minusPage');
                    }else{
                        that.layout.fire('plusPage');
                    }
                }
            }
        },
        getUrlVars : function() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;
            });
            return vars;
        }
    };

    return Widget;
});

