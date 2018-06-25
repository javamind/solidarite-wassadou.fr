/* eslint-env browser */
window.blog = (function () {
    'use strict';

    firebase.initializeApp({
        "apiKey": "AIzaSyDNqQdytS7_LSJehhc_ZXu7hxNd4g0br6o",
        "authDomain": "solidaritewassadou.firebaseapp.com",
        databaseURL: "https://solidaritewassadou.firebaseio.com",
        storageBucket: "solidaritewassadou.appspot.com"
    });

    let database = firebase.database();

    /**
     * Converts result to an array
     * @param index
     * @returns {Array}
     * @private
     */
    function _transformResult(index) {
        if (index) {
            return Object.keys(index).map(key => index[key]);
        }
        return [];
    }

    /**
     * Save the blog visit for stats
     */
    function _saveVisit(filename, modeDev) {
        database
            .ref(`/stats${modeDev ? 'Dev' : ''}/${filename}`)
            .transaction(count => {
                let result = count ? count + 1 : 1;
                document.getElementById('nbview').innerHTML = ` - lu ${result} fois`;
                return result;
            });
    }

    /**
     * Parse the index, find the potential previous blog and update the view
     * @private
     */
    function init(filename, modeDev) {
        _saveVisit(filename, modeDev);
    }

    function sendMessage(target, page, title) {
        if ('twitter' === target) {
            document.location.href = `https://twitter.com/intent/tweet?original_referer=${encodeURI(page)}&text=${encodeURI(title) + ' @DevMindFr'}&tw_p=tweetbutton&url=${encodeURI(page)}`;
        }
        else if ('google+' === target) {
            document.location.href = `https://plus.google.com/share?url=${encodeURI(page)}&text=${encodeURI(title)}`;
        }
        else if ('linkedin' === target) {
            document.location.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURI(page)}&text=${encodeURI(title)}`;
        }
        else if ('facebook' === target) {
            document.location.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURI(page)}&description=${encodeURI(title)}`;
        }
    }

    return {
        // Find and update the page to display a link to the previous blogpost
        "init": init,
        // Send a message
        "sendSocial": sendMessage
    };
})();

