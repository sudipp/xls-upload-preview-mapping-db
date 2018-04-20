'use strict';

appModule.factory('roleLandingMapService',

    function () {

        var landingPages = {
            "Role1": "home",
            "Admin": "home"
        };

        return {
            getLandingState: function (role) {
                var lndPg=landingPages[role];
                return (lndPg == null) ? "home" : lndPg;
            }
        };
    });