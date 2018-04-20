(function () {

    'use strict';

    scrmApp.controller('HomeController', ['$scope', '$location','$document', 'scrmAppStartupService','scrmMessageService', 
        function ($scope, $location, $document, scrmAppStartupService, scrmMessageService) {
            
            //$scope.Name = "www";

            var supprtdBrwsrsList = [];
            angular.forEach(scrmAppStartupService.supprtdBrwsrs(), function (browser) {
                if(browser.Ua !== "IE") supprtdBrwsrsList.push(" " + browser.Ua + " Version " + browser.Ver);
            });
            $scope.BrowserNotSupportedMessage = scrmMessageService.messages.error.E107.replace("{0}", supprtdBrwsrsList.join());

        }]);
})();

