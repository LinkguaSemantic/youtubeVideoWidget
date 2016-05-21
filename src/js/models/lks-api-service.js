/**
 * Created by rubenlangherrera on 11/03/16.
 */
define([

    'jquery',
    'i18n',
    'env'

], function ($_lks, i18n, conf) {

    "use strict";

    var LksService = {

        errorNotReady: 503,
        errorNotReadyDelay: 2000, // 2s

        baseUrl: conf.lksApiBaseUrl,
        sessionCookie: '',


        /**
         * Init Function.
         * Es llamada en on load del client .
         */
        init: function (config) {

            this.config =  config;

        },

        /**
         * Start the Cashub Process.
         * @param html_string
         * @param callbackSuccess
         * @param callbackError
         */
        annotate: function (html_string,callbackSuccess, callbackError) {
            var that = this;

            $_lks.ajax({
                type: 'POST',
                url: this.baseUrl + '/v1/annotate',
                data: {
                    //todo: add document data.
                    html_fragment: html_string,
                    lang: this.config.lang,
                    confidence: this.config.confidence,
                    KEY: this.config.client_key,
                    TOKEN: this.config.client_token
                },
                success: function (response) {
                    if (response.status === "success") {

                        //console.log("success:: getting data");

                        //setting Global annotations.
                        that.annotations = response.data.annotations;

                        if (callbackSuccess)callbackSuccess(response.data);

                    } else {

                        //console.log("Error:: getting data");
                    }

                },
                error: function (response) {
                    //console.log("Error:: getting data");
                    if (callbackError)callbackError(response);
                }
            });
        },

        /**
         * Return the Url for get Videos from Entity.
         * @param $entityParams
         * @returns {string}
         */
        getEntityVideoUrl:function($entityParams){
            return this.baseUrl + '/v1/entity/'+$entityParams.lang+'/'+$entityParams.id+'/videos';
        },

        getEntityUrl:function($entityParams, lang){
            return this.baseUrl + '/v1/entity/'+lang+'/'+$entityParams.id+'/';
        },

        /**
         * Getting Bank Config.
         * @param callbackSuccess
         * @param callbackError
         */
        getVideosFromEntity: function (params,callbackSuccess, callbackError) {

            var that = this;

            $_lks.ajax({

                type: 'GET',

                url: this.getEntityVideoUrl(params),

                data: {
                    //todo: add document data.
                    KEY: this.config.client_key,
                    TOKEN: this.config.client_token,
                    limit: params.limit,
                    offset: params.offset
                },

                //OK
                success: function (response) {
                    //console.log("BankConfig:: Success");
                    if (callbackSuccess)callbackSuccess(response);
                },
                //KO
                error: function (response) {
                    //console.log("BankConfig :: Error");
                    if (callbackError)callbackError(response);
                }
            });
        },

        getEntity: function (params, lang, callbackSuccess, callbackError) {
            var that = this;

            $_lks.ajax({

                type: 'GET',

                url: this.getEntityUrl(params, lang),

                data: {
                    //todo: add document data.
                    KEY: this.config.client_key,
                    TOKEN: this.config.client_token
                },

                //OK
                success: function (response) {
                    //console.log("BankConfig:: Success");
                    if (callbackSuccess)callbackSuccess(response);
                },
                //KO
                error: function (response) {
                    //console.log("BankConfig :: Error");
                    if (callbackError)callbackError(response);
                }
            });
        }

    };

    return LksService;
});

