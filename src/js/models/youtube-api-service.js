/**
 * Created by rubenlangherrera on 11/03/16.
 */
define([

    'jquery'

], function ($) {

    "use strict";

    var YouTubeApiService = {

        baseUrl: 'https://www.googleapis.com/youtube',
        key: 'AIzaSyBqXp0Uo2ktJcMRpL_ZwF5inLTWZfsCYqY',


        getChannelProfileImage: function (channelId,callbackSuccess, callbackError) {
            var that = this;

            $.ajax({
                type: 'GET',
                url: this.baseUrl + '/v3/channels',
                data: {
                    part:'snippet',
                    id: channelId,
                    fields: 'items/snippet/thumbnails',
                    key: this.key
                },
                success: function (response) {
                    //console.log('Getting Img from Channel Id');
                    if(callbackSuccess) callbackSuccess(response);
                },
                error: function (response) {
                    //console.log("Error:: getting data");
                    if(callbackError) callbackError(response);
                }
            });
        }

    };

    return YouTubeApiService;
});

