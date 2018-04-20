

(function () {

    'use strict';
    spApp.controller('xlsUploadController', ['$scope', function ($scope) {

        $scope.uploadApiPath = "/api/masterinflator/Upload";
        $scope.uploadStatusApiPath = "/api/masterinflator/GetActionStatus";
        $scope.dbColumnsList = [{ name: "DatabaseColumn1", type: "string" },
            { name: "DatabaseColumn2", type: "number", allowBlank : true },
            { name: "DatabaseColumn3", type: "string", allowMultiple: true },
            { name: "DatabaseColumn4", type: "string" },
            { name: "DatabaseColumn5", type: "string" }];
    }]);

})();