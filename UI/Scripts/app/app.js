
'use strict';

var spApp = angular.module('spApp',
	['kendo.directives', 'ngRoute', 'ui.router', 'ngAnimate', 'ngFileSaver', 'LocalStorageModule', 'appModule'])
    .factory('httpInterceptor', [
        '$rootScope', function httpInterceptor($rootScope) {
            function isHtmlRequest(str) {
                return (str.indexOf(".html", str.length - ".html".length) !== -1
                    || str.indexOf(".htm", str.length - ".htm".length) !== -1);
            }
            return {
                request: function (config) {
                    var AppStartupService = $rootScope.startup;
                    //htmls
                    if (AppStartupService !== undefined && AppStartupService.htmls().length > 0) {
                        if (config.method === "GET" && isHtmlRequest(config.url)) {
                            var url = config.url.toLowerCase();
                            var tfl = $.grep(AppStartupService.htmls(), function (n, i) {
                                return (n.tfl.indexOf(url) > -1);
                            });
                            if (tfl.length > 0) config.url = url + "?v=" + tfl[0].uts;
                        }
                    }
                    return config;
                }
            }
        }
    ])
	.config(function ($provide, $stateProvider, $urlRouterProvider, $httpProvider) {

	    $httpProvider.interceptors.push('httpInterceptor');

	    // For any unmatched url, redirect to /state1
	    $urlRouterProvider.otherwise(function ($injector, $location) {
	        var $state = $injector.get("$state");
	        var stateToLoad = ($location.$$state == null) ? $location.$$url.replace("/", "") : $location.$$state;
	        if (stateToLoad === "") stateToLoad = "home"; //default state is 'home'

	        var stateToLoadFoundInStateList = $state.get(stateToLoad);
	        $state.go((stateToLoadFoundInStateList != null) ? stateToLoad : "home");
	    });

	    $provide.factory('$stateProvider', function () {
	        return $stateProvider;
	    });
	    $provide.factory('$exceptionHandler', ['$log', function ($log) {
	        return function (exception, cause) {
	            console.log(exception, cause);
	            $log.error(exception, cause);
	        };
	    }]);
	})
	.run(function ($stateProvider, $rootScope, AppStartupService, MessageService,
		$location, $route, $http, $templateCache, $window, $state, roleLandingMapService) {

	    //store Service references
	    $rootScope.startup = AppStartupService;
	    $rootScope.msgSvc = MessageService;

	    $stateProvider
            .state('home',
            {
                url: '/home',
                templateUrl: function () {
                    return '/home/' + $rootScope.startup.crntUserId() + "/" + $rootScope.startup.crntRole();
                },
                controller: 'HomeController',
                cache: false,
                defFunc: 'home'
            })
            .state('error',
            {
                url: '/error/:code',
                templateUrl: function (params) {
                    return 'error/' + params.code;
                },
                controller: 'HomeController',
                defFunc: 'error'
            })
            .state('xlsupload',
			{
			    url: '/xlsupload',
			    templateUrl: function () {
			        return '/Views/Upload/xlsUpload.html';
			    },
			    controller: 'xlsUploadController',
			    cache: false,
			    defFunc: 'xlsupload'
			})
	        .state('spgriddemo',
			{
			    url: '/spgriddemo',
			    templateUrl: function () {
			        return '/Views/spgriddemo/index.html';
			    },
			    controller: 'spGridDemoController',
			    cache: false,
			    defFunc: 'spgriddemo'
			});

	    //Load the Messages, if no Application error occured
	    !$rootScope.initErr && $rootScope.msgSvc.ld();

	    //Load the UI Security, if no Application error occured
	    var defLdPromise = !$rootScope.initErr && !AppStartupService.isPpupApp()
            && $rootScope.startup.uiDef().ld(AppStartupService.crntRole(), AppStartupService.scndryRole(), AppStartupService.crntUserId(), true, false);

	    //not a supplier? Load the backup user list
	    if (!$rootScope.initErr && !AppStartupService.isPpupApp())
	        $rootScope.startup.uiDef().ldBkpUsrLst();


	    //$rootScope.$on('$routeChangeStart', function (event, next, current) {
	    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {

	        if (AppStartupService.isPpupApp()) //avoid processing, if popup
	            return;

	        if (toState.processed) //avoid processing, if processed
	            return;

	        //cancelling route changes, IF NOT processed 
	        event.preventDefault();

	        defLdPromise.then(function (successMsg) {

	            var scfuncNm = toState.defFunc;
	            var fx = $rootScope.startup.uiDef().authorize(scfuncNm);

                //if user doesn't have view access to the requested uri, send him to access denied page
	            if (fx == null || !fx.v) {
	                event.preventDefault();
	                toState.processed = false;
	                $state.go("error", { code: 401 }, { reload: true, notify: true });
	            } else {

	                //warning to be displated for any view data loss, if user doen't want to proceed, then stop event propagation
	                if (AppStartupService.dataLossWarning()) {
	                    event.preventDefault();
	                    return;
	                }

	                event.preventDefault();

	                if (toState.name === 'home' && !toState.processed) {
	                    //load landing state for the current role, if he is selecting "home" state ***
	                    var landingStateNm = roleLandingMapService.getLandingState(AppStartupService.crntRole());
	                    toState = $state.get(landingStateNm);
	                }

	                toState.processed = true; //mark processed, to avoid '$routeChangeStart' call

	                $state.go(toState, toParams, { reload: true, notify: true });
	            }
	        },
            function (failReason) {
                //failReason
                toState.processed = true; //mark processed, to avoid '$routeChangeStart' call
            });
	    }),

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            if (toState && toState.processed != undefined)
                toState.processed = false; //mark not processed

            //clear document grids
            $rootScope.startup.documentGrids.ids = [];

            if (!fromState.stickyMsg || fromState.stickyRoute != toState.stickyRoute || toParams.clearMessage == true) {
                //hide message panefromState=
                $('#' + $rootScope.startup.settings.current_app_errordisplay_panelId).hide();
                $('#' + $rootScope.startup.settings.app_errordisplay_panelId).hide();
                $('#' + $rootScope.startup.settings.current_app_fullerrordisplay_panelId).hide();
                $('#' + $rootScope.startup.settings.app_fullerrordisplay_panelId).hide();
            }

            //$templateCache.remove(toState.templateUrl());
            $templateCache.removeAll();
        });

	    $rootScope.swch2Bk = function (reqbkupRole, scndryRole, reqbkupUsrNm) {

	        if (!AppStartupService.dataLossWarning()) {
	            //reload the UI defence service
	            $rootScope.startup.uiDef().ld(reqbkupRole, scndryRole, reqbkupUsrNm, reqbkupRole == $rootScope.startup.loginRole(), true);
	        }
	    };

	});