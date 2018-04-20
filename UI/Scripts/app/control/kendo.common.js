

kendo.data.Model.prototype.ishighlighted = false;
kendo.data.Model.prototype.highlight = function () {
    this.ishighlighted = true;
    var tr = $("tr[data-uid='" + this.uid + "']");
    tr.each(function () {
        $(this).addClass("k-state-highlighted").find("td input").attr("checked", "checked");
    });
}
kendo.data.Model.prototype.dehighlight = function () {
    this.ishighlighted = false;
    var tr = $("tr[data-uid='" + this.uid + "']");
    tr.each(function () {
        $(this).removeClass("k-state-highlighted");//.find("td input").removeAttr("checked");
    });
}
////////////////////////////////////////////

kendo.data.DataSource.prototype.options.error = function (jqXhr) {
    if (angular.element(document.body).scope() != undefined)
        angular.element(document.body).scope().$root.startup.onServiceError(jqXhr);
};
kendo.data.DataSource.prototype.options.requestStart = function (jqXhr) {
    if (angular.element(document.body).scope() != undefined)
        angular.element(document.body).scope().$root.startup.onServiceRequestStart(jqXhr);
};
kendo.data.DataSource.prototype.options.requestEnd = function (jqXhr) {
    if (angular.element(document.body).scope() != undefined)
        angular.element(document.body).scope().$root.startup.onServiceRequestEnd(jqXhr);
};


function escapeXmlChars(str) {
    if (typeof (str) == "string")
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
    else
        return str;
};
function guid() {
    this.S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    this.getNew = function () {
        return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0, 3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    };
};