
'use strict';

appModule.service('AppStartupService', ['$http', 'uiDefenceService', '$rootScope', '$cacheFactory', 'MessageService', 'FileSaver', 'Blob', 
function ($http, uiDefenceService, $rootScope, $cacheFactory, MessageService, FileSaver, Blob) {

    //if there is an error, while loading the main page, params wont be available
    if ($.cookie('params') == undefined) {
        //store if any erro on app load
        $rootScope.initErr = true;
        return;
    }

    var luiUrl = (location.origin + location.pathname).replace(/home/i, "").replace(/popupindex/i, "").replace(/\/$/, "");

    var that = this;

    that.xmlxlsTransformer = new xmlxlsTransformer();

    //ui defence serv ref
    var luiDef = new uiDefenceService();
    this.uiDef = function () { return luiDef; };

    //get App Params fromk server cookie
    var appParams = JSON.parse($.cookie('params'));
    //remove the cookie immediately
    $.removeCookie("params");

    //check for browser support, if not supported, then its a app init error
    $rootScope.initErr = !($rootScope.isBrowserSupported = (appParams.isBrwsrSupprtd != null) ? appParams.isBrwsrSupprtd : false);
    var lsupprtdBrwsrs = appParams.supprtdBrwsrs;
    this.supprtdBrwsrs = function () { return lsupprtdBrwsrs; };

    //get base service url
    var lserviceBaseUrl = appParams.servUri;
    var lsiteId = appParams.name;

    var luibaseUri = appParams.uibaseUri;

    //logged in user role and id
    var lloginUserId = appParams.loginUsrId;
    var lloginRole = appParams.loginRole;
    var lscndryRole = appParams.scndryRole;
    //current user id, and current user role, a supplier type user?
    var lcrntUserId = appParams.loginUsrId;
    var lcrntRole = appParams.loginRole;
    //Impersonated user id (switched user id)

    var grdPgSz = appParams.gridPageSize;
    var strLdUsrGrdPref = appParams.storLdUsrGrdPref;

    //determines if it is popup page
    var isPopupApp = (appParams.popup != null) ? appParams.popup : false;

    //role/user while log in
    this.loginUserId = function () { return lloginUserId; };
    this.loginRole = function () { return lloginRole; };
    this.scndryRole = function () { return lscndryRole; };

    this.uibaseUri = function () { return luibaseUri; };

    //current role/user to be used for all communication,
    this.crntUserId = function () { return lcrntUserId; };
    this.crntRole = function () { return lcrntRole; };

    this.serviceBaseUrl = function () { return lserviceBaseUrl; };
    this.uiUrl = function () { return luiUrl; };
    this.siteId = function () { return lsiteId; };
    this.isPpupApp = function () { return (isPopupApp == undefined) ? false : isPopupApp; }; //is it a popup app??

    this.setImprUsr = function (imprUsr, imprRl) { lcrntUserId = imprUsr; lcrntRole = imprRl; }; //Impersonate user role
    this.isRlImprsntd = function () { return lcrntUserId !== lloginUserId; }; //true if role is switched

    var xslClientError = this.uibaseUri() + 'Content/xslt/clientError.xslt',
            xslLinkedClientError = this.uibaseUri() + 'Content/xslt/clientErrorWithLink.xslt',
            xslClientInfo = this.uibaseUri() + 'Content/xslt/clientInfo.xslt';

    //Default Http headers
    $http.defaults.headers.common.HeaderTypemessageId = new guid().getNew();
    $http.defaults.headers.common.HeaderTypesiteId = this.siteId();
    $http.defaults.headers.common.HeaderTypebusinessId = this.crntUserId();
    $http.defaults.headers.common.HeaderTypecollectedTimestamp = kendo.toString(new Date(), "MM/dd/yyyy HH:mm:ss tt");
    $http.defaults.headers.common.HeaderTypeuserBackup = this.isRlImprsntd();
    //Default Http headers

    //get list of template and their last modified ts
    var lhtmls = [];
    this.htmls = function () { return lhtmls; };


    //returns a directive used on the page 
    //input : directiveType and name 
    this.getDirective = function (directiveType, name) {
        var el = null;
        var elForScopeFind = null;
        switch (directiveType.toLowerCase()) {
            case "comment-attachment":
                el = $("comment-attachment[name='" + name + "']");
                elForScopeFind = el.find("sp-grid");
                break;
            case "sp-grid":
                elForScopeFind = el = $("sp-grid [id='eqg_" + name + "']");
                break;
            case "scrm-master-list":
                elForScopeFind = el = $("select[id='" + name + "']");
                break;
            default:
                break;
        }
        return {
            element: el,
            scope: angular.element(elForScopeFind).scope()
        };
    };

    this.getLocalDateFormat = function (dt) {
        var date = kendo.toString(dt, "yyyy-MM-dd");
        return date;
    };

    this.dataLossWarning = function () {

        function getScop4IsViewDirty() { //for isViewDirty()
            var vwScope = angular.element(document.querySelector('#spView')).scope();
            var scevTbScope = angular.element(document.querySelector('[chevron-tab]')).scope();
            if (vwScope != null && vwScope.isViewDirty !== undefined && typeof vwScope.isViewDirty === "function")
                return vwScope;
            else if (scevTbScope != null && scevTbScope.isViewDirty !== undefined && typeof scevTbScope.isViewDirty === "function")
                return scevTbScope;
            return null;
        };
        function getScop4UndoViewChanges() { //for undoViewChanges()
            var vwScope = angular.element(document.querySelector('#spView')).scope();
            var scevTbScope = angular.element(document.querySelector('[chevron-tab]')).scope();
            if (vwScope != null && vwScope.undoViewChanges !== undefined && typeof vwScope.undoViewChanges === "function")
                return vwScope;
            else if (scevTbScope != null && scevTbScope.undoViewChanges !== undefined && typeof scevTbScope.undoViewChanges === "function")
                return scevTbScope;
            return null;
        };

        this.isViewDirty = function () {
            var currentConrollerScope = getScop4IsViewDirty();
            return (currentConrollerScope != null) ? currentConrollerScope.isViewDirty() : false;
        }
        this.dirtyWarnMsg = function () {
            return MessageService.messages.wanring.W064;
        }

        if (this.isViewDirty()) {
            if (confirm(this.dirtyWarnMsg())) {
                var currentConrollerScope = getScop4UndoViewChanges();
                (currentConrollerScope != null) && currentConrollerScope.undoViewChanges();
                return false;

            } else
                return true;
        }
        return false;
    };

    this.clearMessage = function () {

        $('#' + $rootScope.startup.settings.current_app_errordisplay_panelId).hide();
        $('#' + $rootScope.startup.settings.app_errordisplay_panelId).hide();
        $('#' + $rootScope.startup.settings.current_app_fullerrordisplay_panelId).hide();
        $('#' + $rootScope.startup.settings.app_fullerrordisplay_panelId).hide();
    };

    this.documentGrids = {  //structure to hold all grids in page
        ids: [],
        length: function () { return this.ids.length; },
        set: function (grid) {
            for (var x = 0; x < this.ids.length; x++) {
                var gridIndex = this.findIndex(this.ids[x].wrapper.context.id);
                if (this.ids[x].wrapper.context.id === grid.wrapper.context.id)
                    this.remove(gridIndex);
            }

            this.ids.push(grid);
        },
        get: function (index) { return this.ids[index]; },
        getMasterGrid: function () {
            for (var x = 0; x < this.ids.length; x++) {
                if (this.ids[x].isMasterGrid)
                    return this.ids[x];
            }
            return null;
        },
        findIndex: function (gridName) {
            for (var x = 0; x < this.ids.length; x++) {
                if (this.ids[x].wrapper != null)
                    if (this.ids[x].wrapper.context.id === gridName) {
                        return x;
                    }
            }
            return -1;
        },
        find: function (gridName) {
            for (var x = 0; x < this.ids.length; x++) {
                if (this.ids[x].wrapper != null)
                    if (this.ids[x].wrapper.context.id === gridName) {
                        return this.get(x);
                    }
            }
            return null;
        },
        remove: function (index) { this.ids.splice(index, 1); },
    };

    this.TransformToHtmlText = function (xmlDoc, xsltfile) {
        //var transformer = new xmlxlsTransformer();
        var transformedString = this.xmlxlsTransformer.transform(xmlDoc, xsltfile);
        return transformedString;
    },

    this.beforeServiceCall = function (xhr, settings) {
        //send all headers
        xhr.setRequestHeader("HeaderTypemessageId", new guid().getNew());
        xhr.setRequestHeader("HeaderTypesiteId", that.siteId());
        xhr.setRequestHeader("HeaderTypebusinessId", that.crntUserId());//that.loginUserId());
        xhr.setRequestHeader("HeaderTypecollectedTimestamp", kendo.toString(new Date(), "MM/dd/yyyy HH:mm:ss tt")); //moment().format('MM/DD/YYYY, hh:mm:ss a')); //'12/12/2015 12:12:09 AM'
        xhr.setRequestHeader("HeaderTypeuserBackup", that.isRlImprsntd());
    },
    this.settings = {
        app_errordisplay_panelId: 'sys-message',
        current_app_errordisplay_panelId: 'sys-message',
        app_fullerrordisplay_panelId: 'sys-message-expanded',
        current_app_fullerrordisplay_panelId: 'sys-message-expanded',

        //usr Info Css name
        usrInfoCss: "usrInfo",

        // Configure/customize these variables.
        showChar: 100,  // How many characters are shown by default
        ellipsestext: "...",
        moretext: "(View More)",
        moretextMultiple: "(View all {0} messages)",
        lesstext: "Show less",

        dateFormat: "{0:yyyy-MM-dd}",
        currencyFormat: "{0:0.0000}",
        gridPageSize: grdPgSz,
        storeLdUsrGrdPreference: strLdUsrGrdPref
    },
    this.onServiceRequestStart = function (jqXhr) {

    },
    this.onServiceRequestEnd = function (jqXhr) {

    },
    this.afterAjaxCallComplete = function (jqXHR, status) {

    },
    this.CreateTransport = function (apiUrl, protocolVerb) {
        var crudOperationDef = {
            url: apiUrl,
            dataType: "json",
            type: protocolVerb,
            //async:false,
            contentType: "application/json",
            complete: this.afterAjaxCallComplete
        };
        return crudOperationDef;
    },
    this.ExpandSysErrorpanel = function (expand, messageType) {
        if (messageType == "error") {
            $('#' + this.settings.current_app_fullerrordisplay_panelId)[0].className = "sys-message-expanded errorMessage";
            $('#' + this.settings.current_app_fullerrordisplay_panelId).find(".k-icon")[0].className = "k-icon k-warning";
            $('#' + this.settings.current_app_fullerrordisplay_panelId).find(".k-errormessage")[0].className = "k-errormessage errorMessage";
        }
        else if (messageType == "info") {
            $('#' + this.settings.current_app_fullerrordisplay_panelId)[0].className = "sys-message-expanded infoMessage";
            $('#' + this.settings.current_app_fullerrordisplay_panelId).find(".k-icon")[0].className = "k-icon k-info";
            $('#' + this.settings.current_app_fullerrordisplay_panelId).find(".k-errormessage")[0].className = "k-errormessage infoMessage";
        }
        if (expand) {
            //$('.sysinfo-pane .sys-message-expanded').slideDown(500);
            $('#' + this.settings.current_app_fullerrordisplay_panelId).show().find(".k-errormessage").slideDown(500);
            $('#' + this.settings.current_app_errordisplay_panelId).hide();
        } else {
            //$('.sysinfo-pane .sys-message-expanded').slideUp(500);    
            $('#' + this.settings.current_app_fullerrordisplay_panelId).hide();
            $('#' + this.settings.current_app_errordisplay_panelId).show();
        }
    },

    //Displays exception text in error panel (text /hyperlink)
    this.displaySystemMessageText = function (formattedError, messageType) {

        var sysMsgExpandedPanel = $('#' + this.settings.current_app_fullerrordisplay_panelId).hide().find(".k-errormessage");
        var errorPanel = $('#' + this.settings.current_app_errordisplay_panelId).show().find(".k-errormessage");
        errorPanel.html('<div class="' + messageType + 'Message">' + formattedError + '</div>');

        if (messageType == "error") {
            $('#' + this.settings.current_app_errordisplay_panelId)[0].className = "sys-message errorMessage";
            $('#' + this.settings.current_app_fullerrordisplay_panelId).find(".k-errormessage")[0].className = "k-errormessage errorMessage";
            $('#' + this.settings.current_app_errordisplay_panelId).find(".k-icon")[0].className = "k-icon k-warning";
        }
        else if (messageType == "info") {
            $('#' + this.settings.current_app_errordisplay_panelId)[0].className = "sys-message infoMessage";
            $('#' + this.settings.current_app_fullerrordisplay_panelId).find(".k-errormessage")[0].className = "k-errormessage infoMessage";
            $('#' + this.settings.current_app_errordisplay_panelId).find(".k-icon")[0].className = "k-icon k-info";
        }

        //find all messages
        var errors = $(errorPanel).find(".AppMessage");
        if (errors.length > 0) {
            //pick the 1st message
            var errorcontent = $(errors[0]).html();

            if (errorcontent.length > (this.settings.showChar + this.settings.ellipsestext.length + this.settings.moretext.length) || errors.length > 1) {

                sysMsgExpandedPanel.html(errorPanel.html() + '<div class="sys-message-expanded-item"><a class="toggleSysErrorpanel" href="javascript:angular.element(\'#'
                    + this.settings.current_app_fullerrordisplay_panelId + '\').scope().$root.startup.ExpandSysErrorpanel(false,' + '\'' + messageType + '\'' + ')">' + this.settings.lesstext + '</a><div>');

                var showmoretext = (errors.length > 1) ? this.settings.moretextMultiple.replace("{0}", errors.length)
                    : this.settings.moretext;

                var c = errorcontent.substr(0, this.settings.showChar);
                var html = "<div class='sys-message-expanded-item " + messageType + "Message'>" + c + this.settings.ellipsestext + '</div><div class="sys-message-expanded-item" ><a class="toggleSysErrorpanel" href="javascript:angular.element(\'#'
                    + this.settings.current_app_errordisplay_panelId + '\').scope().$root.startup.ExpandSysErrorpanel(true, ' + '\'' + messageType + '\'' + ')">' + showmoretext + '</a><div>';
                $(errorPanel).html(html);
            }
        }
    },

    //this.buildJsonResponse = function (responseText, isBizError, isBizErrorNavigatable) {
    this.buildJsonResponse = function (responseText, eventDetail) {

        //if array ?
        var isArray = Array.isArray(responseText);
        if (eventDetail.type == "info" || eventDetail.type == "BusinessException" || eventDetail.type == "warning") {
            if (isArray) {
                var x = 0;
                $(responseText).each(function () {
                    if (Array.isArray(this)) // ***** if inner item is aray, then expected that 1st element is RecordId
                    {
                        if (this.length == 1)
                            responseText[x] = "{\"RecordId\":\"" + this[0] + "\"}";
                        else if (this.length == 2)
                            responseText[x] = "{\"RecordId\":\"" + this[0] + "\",\"Message\":\"" + this[1] + "\"}";
                    } else {
                        responseText[x] = "{\"Message\":\"" + this + "\"}";
                    }
                    x++;
                });
                responseText = responseText.join(",");
            } else
                responseText = "{\"Message\":\"" + responseText + "\"}";

            //for multiple messages
            responseText = "[" + responseText + "]";
        } else //technical messages
            responseText = "\"" + responseText + "\"";

        var exceptionType = eventDetail.type;

        var jqXhr = {
            "xhr": {
                "responseText": "{\"Message\":" + responseText + ", \"Type\": \"" + exceptionType + "\"" + ((eventDetail.type == "BusinessException") ? ",\"HasNavigation\":" + eventDetail.isNavigatable : "") + "}"
            }
        };

        return jqXhr;
    },
    this.parseResponse = function (jqXhr) {
        // Create x2js instance with default config
        var x2js = new X2JS();

        var httpError;
        try {
            httpError = (jqXhr.xhr != null) ? JSON.parse(jqXhr.xhr.responseText) : JSON.parse(jqXhr.responseText);
        } catch (ex) { // somehow JSON.parse cannot parse some of jqXHR.xhr.responseText, it gets an error --> Invalid char. There is a work around to directly get an original error message from jqXHR.xhr.statusText.
            httpError = new Object();
            httpError.Type = "TechnicalException";
            httpError.HasNavigation = false;
            httpError.Message = (jqXhr.xhr != null) ? jqXhr.xhr.statusText : jqXhr.statusText;
        }

        var xml = null;
        var linkedError = httpError.HasNavigation; //false;
        if (httpError.Type === "BusinessException" || httpError.Type === "info" || httpError.Type === "warning") { // "BusinessException") {
            xml = this.xmlxlsTransformer.getXmlDocFromXml('<Messages>' + x2js.json2xml_str(httpError.Message) + '</Messages>');
        } else { //for technical exception
            //build the xml from SINGLE exception message
            xml = this.xmlxlsTransformer.getXmlDocFromXml('<Messages><item><Message>' + escapeXmlChars(httpError.Message) + '</Message></item></Messages>');
        }

        var xsl = null;
        if (httpError.Type == "info")
            xsl = xslClientInfo;
        else
            xsl = (!linkedError) ? xslClientError : xslLinkedClientError;

        return this.TransformToHtmlText(xml, xsl);
    },
    this.onServiceError = function (jqXhr) {
        //debugger;
        //for any reason if 404 error is thrown or responseText is empty
        if (jqXhr.xhr != null && (jqXhr.xhr.status === 404 || jqXhr.xhr.responseText == null))
            jqXhr.xhr.responseText = "{\"Message\":" + "\"" + jqXhr.xhr.statusText + "\"" + "}";
        else if (jqXhr.responseText == null)
            jqXhr.responseText = "{\"Message\":" + "\"" + jqXhr.errorThrown + "\"" + "}";
        that.displaySystemMessageText(that.parseResponse(jqXhr), "error");
    };

    $.ajaxSetup({
        beforeSend: that.beforeServiceCall,
    });

    $(document).ajaxSend(function (event, xhr, options) {
        xhr.withCredentials = true;
        that.beforeServiceCall(xhr);
    });


    window.onbeforeunload = function (e) {
        if (that.isViewDirty != undefined && that.isViewDirty()) {
            return that.dirtyWarnMsg();
        }
    };
}
]);
