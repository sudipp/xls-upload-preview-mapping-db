

(function () {

    'use strict';
    scrmApp.controller('warrantyRepairController', ['$scope', function ($scope) {
        $scope.uploadApiPath = "/api/warrantyrepair/Upload";
        $scope.dbColumnsList = [{ name: "VIN", type: "string" },
            { name: "CAMPAIGN_CODE", type: "string" },
            { name: "DeaderCode", type: "string" },
            { name: "ClaimNumber", type: "string" },
            { name: "Completion_Ts", type: "string" },
            { name: "ApprovedAmount", type: "number" },
            { name: "DrCrName", type: "string" }
        ];
    }]);
})();