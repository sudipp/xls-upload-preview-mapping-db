
/* Uploaded file structure */
var UploadedFile = function (filesDetail, persistanceDetail) {
    this.FilesDetail = filesDetail; //file details per Kendo Upload
    this.PersistanceDetail = persistanceDetail; //Persiatance details from ECMS
};

var oInitUpload = kendo.ui.Upload.fn.init;
kendo.ui.Upload = kendo.ui.Upload.extend({
    init: function () {
        oInitUpload.apply(this, arguments);
        this.uploadedFiles = []; //list of uploaded files
    }
});
kendo.ui.plugin(kendo.ui.Upload);

kendo.ui.Upload.prototype.uploadReset = function (id) {
    if (id) {
        //if an id is passed as a param, only reset the element's child upload controls (in case many upload widgets exist)
        $("#" + id + " .k-upload-files").remove();
        $("#" + id + " .k-upload-status").remove();
        $("#" + id + " .k-upload.k-header").addClass("k-upload-empty");
        $("#" + id + " .k-upload-button").removeClass("k-state-focused");
    } else {
        //reset all the upload things!
        $(".k-upload-files").remove();
        $(".k-upload-status").remove();
        $(".k-upload.k-header").addClass("k-upload-empty");
        $(".k-upload-button").removeClass("k-state-focused");
    }
    this.uploadedFiles = [];
};

kendo.ui.Upload.prototype._submitRemove = function (submitRemove) {
    return function (fileNames, data, onSuccess, onError) {
        this.toggle(false);
        submitRemove.call(this, fileNames, data, onSuccess, onError);
    }
}(kendo.ui.Upload.prototype._submitRemove);


kendo.ui.Upload.prototype.options.error = function (e) {
    if (angular.element(document.body).scope() != undefined)
        angular.element(document.body).scope().$root.startup.onServiceError(e.XMLHttpRequest);
};