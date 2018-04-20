

'use strict';

spApp.factory('uiDefenceService',
    ['$http', '$rootScope', '$location', '$route', '$q', '$state',
        function ($http, $rootScope, $location, $route, $q, $state) {

            var uiDefenceService = function () {

                var ldPromise = null;

                //Security struture
                var uiDefence = {
                    m: {
                        fx: {
                            'SEI SCRM.home': { v: true, e: true } ,
                            'SEI SCRM.error': { v: true, e: false },
                            'SEI SCRM.xlsupload': { v: true, e: true },
                            'SEI SCRM.spgriddemo': { v: true, e: true }
                        }, //default access for all roles
                        v: false,
                    },
                    usrDtlPn: { v: true,
                        hm : { v : true },
                        info: { v: true, swchRle: { v: true } }
                    },
                };
                //backup roles
                var bkRles = [];

                //Returns a promise
                this.ld = function (forRl, forSndryRl, forUid, initialLoad, switchTriggered) {
                    
                    if (initialLoad == undefined) initialLoad = true;

                    //Deferred object which represents the load task which will finish in the future.
                    var deferred = $q.defer();
                    var thatstate = $state;
                    
                    //Uncomment the follwoing block to get security defination from API
                    /*
                    $http({
                        method: 'GET',
                        //withCredentials: true,
                        url: $rootScope.startup.serviceBaseUrl() + "/api/Security/GetUiDefence/"
                            + forUid + "/" + forRl + "/" + forSndryRl + "/" + initialLoad,
                    }).then(function successCallback(response) {

                        //once security load is successful, set new switched role/userId as current 
                        $rootScope.startup.setImprUsr(forUid, forRl);

                        if (initialLoad) {
                            uiDefence = response.data;
                            uiDefence.m.fx = $.extend({}, uiDefence.m.fx, {
                                'SEI SCRM.home': { v: true, e: true },
                                'SEI SCRM.error': { v: true, e: false }
                            });
                        } else {
                            //merge log in role security & switch role security
                            uiDefence.m.fx = response.data.fx;//$.extend({}, uiDefence.m.fx, response.data.fx);
                        }

                        if (switchTriggered) { //if caused by Switch role?
                            thatstate.go('home', {}, { reload: true, notify: true });
                        }

                        deferred.resolve('uiDef load success');

                        $rootScope.startup.clearMessage();

                    }, function errorCallback(response) {

                        response.data = response.data || "Error contacting Security service";
                        response.responseText = JSON.stringify(response.data);
                        $rootScope.startup.displaySystemMessageText($rootScope.startup.parseResponse(response), "error");

                        deferred.reject('uiDef load fail :' + response.responseText);
                    });
                    */

                    deferred.resolve('uiDef load success');

                    ldPromise = deferred.promise;

                    //return a promise
                    return ldPromise;
                };

                this.ldBkpUsrLst = function() {
                    /*$http({
                        method: 'GET',
                        url: $rootScope.startup.serviceBaseUrl() +
                            "/api/Security/GetBackupListForUser/" +
                            $rootScope.startup.crntUserId() +
                            "/" +
                            $rootScope.startup.crntRole()
                    }).then(function successCallback(response) {
                            //store data
                            //$rootScope.startup.avlBkSwchRles = response.data;
                            //update usr Info Css to add underline
                            if (response && response.data && response.data.data && response.data.data.length > 0) {
                                bkRles = response.data.data;
                                $rootScope.startup.settings.usrInfoCss = "usrInfo standardAnchar";
                            }
                        },
                        function errorCallback(response) {
                            response.responseText = JSON.stringify(response.data);
                            $rootScope.startup.displaySystemMessageText($rootScope.startup.parseResponse(response),
                                "error");
                        });
                        */
                };
                
                this.getLdPromise = function () {
                    return ldPromise;
                };

                this.authorize = function (fn) {
                    if (!uiDefence.m.fx['SEI SCRM.' + fn])
                        return { v: false, e: false };
                    return uiDefence.m.fx['SEI SCRM.' + fn];
                };

                this.avlBkRles = function () {
                    return bkRles.slice(0);
                };

                this.usr = function () {
                    return uiDefence.usrDtlPn;
                };

                this.isMenuVisible = function () {
                    return uiDefence.m.v;
                };

                this.getDta = function () {
                    return uiDefence;
                };
            };

            return uiDefenceService;
        }
    ]
);