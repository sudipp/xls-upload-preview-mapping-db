
(function () {

    'use strict';

    appModule.directive('xlsUpload', ['$http', '$document', '$timeout', '$interval', '$compile', '$window', 'AppStartupService', 'FileSaver', 'Blob',
    function ($http, $document, $timeout, $interval, $compile, $window, AppStartupService, FileSaver, Blob) {
        return {
            scope: {
                dbColumnsList: '=dbColumnsList',
                uploadApiPath: '=uploadApiPath',
                uploadStatusApiPath: '=uploadStatusApiPath',
                pageTitle: '@'
            },
            controller: ['$scope', function ($scope) {

                $("#loading").hide();
                $scope.laddaLoading = false;
                $scope.selectedFile = null;
                $scope.msg = "";
                $scope.progress = 0;
                $scope.showGrid = false;
                var isDateField = [];

                $scope.addStyling = function (e) {
                    this.element.css({
                        "border-color": "#06c",
                        "background-color": "gray",
                        "opacity": 0.6
                    });
                }
                $scope.resetStyling = function (e) {
                    this.element.css({
                        //"border-color": "black",
                        "background-color": "transparent",
                        "opacity": 1
                    });
                }

                $scope.buildXLSToDBMapper = function (xlsColumns) {
                    $scope.xlsColumns = new kendo.data.DataSource({
                        schema: {
                            model: {
                                id: "id",
                                fields: {
                                    id: { type: "number" },
                                    item: { type: "string" }
                                }
                            }
                        }
                    });
                    var fields = Object.keys(xlsColumns.fields);
                    if (fields.indexOf("GrdRowId") > -1)
                        fields.splice(fields.indexOf("GrdRowId"), 1);
                    if (fields.indexOf("uid") > -1)
                        fields.splice(fields.indexOf("uid"), 1);
                    if (fields.indexOf("id") > -1)
                        fields.splice(fields.indexOf("id"), 1);
                    if (fields.indexOf("dirty") > -1)
                        fields.splice(fields.indexOf("dirty"), 1);
                    if (fields.indexOf("IsSelectable") > -1)
                        fields.splice(fields.indexOf("IsSelectable"), 1);

                    var z = 0;
                    var xlsColumnsData = fields.map(function (field) {
                        return { id: z++, item: field, type: xlsColumns.fields[field].type };
                    });
                    $scope.xlsColumns.data(xlsColumnsData);

                    //Add drop target based on dbColumnsList
                    $("#dbColListContainer").empty();
                    for (var x = 0; x < $scope.dbColumnsList.length; x++) {

                        //if the DB items allows multiple drops
                        var allowMultiple = ($scope.dbColumnsList[x].allowMultiple === true);
                        var allowBlank = ($scope.dbColumnsList[x].allowBlank === true);

                        if (allowBlank) {
                            $("#dbColListContainer").append("<div class='dbitemcontainer'><div class='dbitemdesc'>" + $scope.dbColumnsList[x].name + ", Type:" + $scope.dbColumnsList[x].type + ", AllowMultiple:" + allowMultiple +
                                "</div><div class='dbitem' allowMultiple='" + allowMultiple + "' type='" + $scope.dbColumnsList[x].type + "' id='dbitem_" + $scope.dbColumnsList[x].name + "'></div></div>");
                        } else {
                            $("#dbColListContainer").append("<div class='dbitemcontainer'><div class='dbitemdesc'>" + $scope.dbColumnsList[x].name + "<span class='errorMessage'>*</span>, Type:" + $scope.dbColumnsList[x].type + ", AllowMultiple:" + allowMultiple +
                                "</div><div class='dbitem' allowMultiple='" + allowMultiple + "' type='" + $scope.dbColumnsList[x].type + "' id='dbitem_" + $scope.dbColumnsList[x].name + "'></div></div>");
                        }

                        var dbitemColumns = new kendo.data.DataSource({
                            data: [],
                            schema: {
                                model: {
                                    id: "id",
                                    fields: {
                                        id: { type: "number" },
                                        item: { type: "string" }
                                    }
                                }
                            }
                        });

                        $("#dbitem_" + $scope.dbColumnsList[x].name).kendoListView({
                            dataSource: dbitemColumns,
                            template: "<div class='item'>#: item #</div>",
                            allowBlank: allowBlank
                        });
                        $("#dbitem_" + $scope.dbColumnsList[x].name).kendoDropTarget({
                            dragenter: $scope.addStyling,
                            dragleave: $scope.resetStyling,
                            drop: function (e) { //apply changes to the data after an item is dropped
                                var vxlsColList = $('#' + e.draggable.element.context.id).data("kendoListView");
                                var vdbColList = $('#' + e.dropTarget.context.id).data("kendoListView");

                                var draggableElement = e.draggable.currentTarget;
                                var dataItem = vxlsColList.dataSource.getByUid(draggableElement.data("uid"));

                                var allowMultiple = (e.dropTarget.attr("allowMultiple") === 'true');
                                //if ((!allowMultiple && vdbColList.dataSource.data().length > 0)) {//}|| (e.dropTarget.attr("type") !== "string" && e.dropTarget.attr("type") !== dataItem.type)) {
                                if ((!allowMultiple && vdbColList.dataSource.data().length > 0) || (e.dropTarget.attr("type") !== "string" && e.dropTarget.attr("type") !== dataItem.type)) {

                                    e.preventDefault();
                                    $scope.resetStyling.call(this);
                                    return;
                                }

                                vxlsColList.dataSource.remove(dataItem);
                                vdbColList.dataSource.add(dataItem);

                                $scope.resetStyling.call(this);
                            }
                        });
                        $("#dbitem_" + $scope.dbColumnsList[x].name).kendoDraggable({
                            filter: ".item",
                            hint: function (element) {
                                return element.clone().css({
                                    "opacity": 0.6,
                                    "background-color": "#0cf"
                                });
                            }
                        });
                    }

                    $("#xlsColList").kendoListView({
                        dataSource: $scope.xlsColumns,
                        template: "<div class='item'>#: item #</div>"
                    });

                    $("#xlsColList").kendoDraggable({
                        filter: ".item",
                        hint: function (element) {
                            return element.clone().css({
                                "opacity": 0.6,
                                "background-color": "#0cf"
                            });
                        }
                    });
                    $("#xlsColList").kendoDropTarget({
                        dragenter: $scope.addStyling,
                        dragleave: $scope.resetStyling,
                        drop: function (e) { //apply changes to the data after an item is dropped

                            var vxlsColList = $('#' + e.dropTarget.context.id).data("kendoListView");
                            var vdbColList = $('#' + e.draggable.element.context.id).data("kendoListView");

                            var draggableElement = e.draggable.currentTarget;
                            var dataItem = vdbColList.dataSource.getByUid(draggableElement.data("uid"));
                            vdbColList.dataSource.remove(dataItem);
                            vxlsColList.dataSource.add(dataItem);
                            $scope.resetStyling.call(this); //reset visual dropTarget indication that was added on dragenter
                        }
                    });

                };

                $scope.loadFile = function (files) {
                    $scope.$apply(function () {
                        $scope.selectedFile = files[0];

                        var opsuccessText = "Loading preview...";
                        var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: true });
                        AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "info");

                        $scope.handleFile();

                        $('#' + AppStartupService.settings.current_app_errordisplay_panelId).hide();
                    });
                }

                $scope.$on("fileProgress", function (e, progress) {
                    $scope.progress = progress.loaded / progress.total;
                });

                $scope.handleFile = function () {

                    var file = $scope.selectedFile;

                    if (file) {

                        $("#loading").show();

                        var reader = new FileReader();
                        if (!FileReader.prototype.readAsBinaryString) {
                            FileReader.prototype.readAsBinaryString = function (fileData) {
                                var binary = "";
                                var pt = this;
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    var bytes = new Uint8Array(reader.result);
                                    var length = bytes.byteLength;
                                    for (var i = 0; i < length; i++) {
                                        binary += String.fromCharCode(bytes[i]);
                                    }
                                    //pt.result  - readonly so assign content to another property

                                    pt.content = binary;
                                    pt.onload({ target: { result: pt.content } }); // thanks to @Denis comment
                                }
                                reader.readAsArrayBuffer(fileData);
                            }
                        };

                        reader.onload = function (e) {

                            var data = e.target.result;
                            //read workbook
                            var workbook = XLSX.read(data, { type: 'binary' });
                            //get first sheet
                            var firstSheetName = workbook.SheetNames[0];
                            //get xls headers formatted
                            var headers = $scope.getHeaderRow(workbook.Sheets[firstSheetName]);

                            //get xls data
                            var dataObjects = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName],
                                {
                                    range: 1,
                                    header: headers,
                                    raw: true,
                                    //date_format: 'mm/dd/yyyy',
                                    cellDates: true
                                }
                                //{ raw: true },
                                //{ 'date_format': 'mm/dd/yyyy' }
                            );

                            if (dataObjects.length > 0) {

                                var that = this;

                                //set grid columns
                                var columns = $scope.generateColumns(dataObjects);
                                $scope.grdOptions.columns = columns;

                                that.newColsArray = Array.apply(null, Array(dataObjects.length)).map(
                                        function (val, i) {
                                            return {
                                                'GrdRowId': i + 1,
                                                'IsSelectable': true
                                            }
                                        }
                                    );
                                var mergeddata = angular.merge({}, dataObjects, that.newColsArray);
                                var mergeddataArray = Object.keys(mergeddata).map(function (_) { return mergeddata[_]; });

                                //get model
                                var model = $scope.generateModel(mergeddataArray);


                                $scope.grdOptions.dataSource = {
                                    transport: {
                                        read: function (options) {
                                            options.success(mergeddataArray);
                                        }
                                    },
                                    pageSize: 20,
                                    schema: {
                                        model: model
                                    }
                                };


                                $("#grd").empty();
                                $scope.$apply(function () {
                                    var generatedTemplate = '<sp-grid grid-id="xlsGridName" grid-options="grdOptions" show-grid="true" grid-crud-options="grdCrudOptions" grid-toolbar-options="grdToolbarOptions"></sp-grid>';
                                    angular.element("#grd").append($compile(generatedTemplate)($scope));
                                });

                                //show drag drop panel
                                $("#xlsDBMapperDiv").show();
                                $scope.buildXLSToDBMapper(model);

                                $("#divGrd").show();
                                $("#loading").hide();
                                
                            } else {
                                $("#xlsDBMapperDiv").hide();
                                $("#loading").hide();
                                //$scope.msg = "Error : Something Wrong !";
                                var opsuccessText = "File is empty...";
                                var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: true });
                                AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "info");
                            }
                        }

                        reader.onerror = function (ex) {
                            var x = ex;
                        }
                        reader.readAsBinaryString(file);
                    }
                }

                $scope.grdOptions = {
                    resizable: true,
                    sortable: true,
                    scrollable: true,
                    selectable: true,
                    filterable: true,
                    pageable: {
                        pageSize: 5
                    },
                    autoBind: true,
                    editable: true,
                    dataBinding: function (e) {
                        var x = 0;
                    },
                    dataBound: function (e) {
                        $scope.SetGridHeight();
                    },
                    excel: {
                        fileName: "xlsupload.xlsx",
                        filterable: true,
                        allPages: true,
                        exportGrdNm: "requestGridName"
                    },
                    selectableColumn: {
                        show: true,
                        singleMode: false,
                        checked: true
                    },
                };
                $scope.grdCrudOptions = {
                    editMode: "inline"
                };
                $scope.grdToolbarOptions = {
                    gridHeaderText: 'File Preview',
                    showExport: true,
                    search: {
                        show: false,
                        panelExpanded: false,
                    },
                    showGridFiltersummary: false
                };
                
                $scope.GetMappingError = function (DBXLSColumnMap) {

                    var str = "";
                    for (var x = 0; x < $scope.dbColumnsList.length; x++) {
                        var dblstView = $("#dbitem_" + $scope.dbColumnsList[x].name).data("kendoListView");
                        if (!dblstView.options.allowBlank && dblstView.dataSource.data().length < 1)
                            str += "Mapping incomplete for DB field '" + $scope.dbColumnsList[x].name + "' \n";
                        else {
                            var map = {
                                dbColumn: $scope.dbColumnsList[x].name,
                                xlsColumns: []
                            };
                            for (var y = 0; y < dblstView.dataSource.data().length; y++) {
                                map.xlsColumns.push(dblstView.dataSource.data()[y].item);
                            }
                            DBXLSColumnMap.push(map);
                        }
                    }
                    return str;
                }

                $scope.MapXlsDataToDBColumns = function (DBXLSColumnMap, currentRecord, calculatePreviewToolTip) {
                    var rObj = { };

                    rObj["SrcRecId"] = currentRecord.GrdRowId + 1;
                    var mapPreviewToolTiphtml = "";
                    for (var x = 0; x < DBXLSColumnMap.length; x++) {
                        var xlsValsForaRow = [];
                        for (var y = 0; y < DBXLSColumnMap[x].xlsColumns.length; y++) {
                            var val = currentRecord[DBXLSColumnMap[x].xlsColumns[y]];
                            if (val != undefined) {
                                var colDataType = $.grep($scope.dbColumnsList, function (item) {
                                    return (item.name === DBXLSColumnMap[x].dbColumn);
                                })[0].type;

                                val = val.toString().trim();
                                if (colDataType === "date") {
                                    val = kendo.toString(kendo.parseDate(val, ["MM/dd/yyyy", "yyyy/MM/dd", "yyyyMMdd", "yyyyMM", "MM/dd/yy"]), "MM/dd/yyyy HH:mm:ss tt");
                                }
                                if (colDataType === "number") {
                                    val = kendo.parseFloat(val);
                                }

                                if (val != undefined)
                                    if (val.length > 0 || val !== 'NULL' || val !== 'null')
                                        xlsValsForaRow.push(val);
                            }
                        }
                        rObj[DBXLSColumnMap[x].dbColumn] = xlsValsForaRow.join(" ");
                        if (calculatePreviewToolTip)
                            mapPreviewToolTiphtml += "<tr><td nowrap>" + DBXLSColumnMap[x].dbColumn + ":</td><td nowrap>" + rObj[DBXLSColumnMap[x].dbColumn] + "</td></tr>";

                        if (DBXLSColumnMap[x].dbColumn === "Name" && rObj[DBXLSColumnMap[x].dbColumn].indexOf(",") > -1)
                            rObj[DBXLSColumnMap[x].dbColumn] = rObj[DBXLSColumnMap[x].dbColumn].replace(",", "");
                    }
                    var rObjResult = {
                        mapPreviewToolTiphtml: mapPreviewToolTiphtml,
                        rObj: rObj
                    };

                    return rObjResult;
                }

                $scope.statusCallAtInterval = function () {
                    $http({
                        method: "GET",
                        url: AppStartupService.serviceBaseUrl() + $scope.uploadStatusApiPath,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .success(function (response, status, headers) {
                        if (response == undefined) return;

                        if (response != null && response.logId != null) {
                            var errorPanel = $('#' + AppStartupService.settings.current_app_errordisplay_panelId)
                                .show().find(".k-errormessage").find(".AppMessage");

                            //clear error panel
                            errorPanel.html("");
                            //errorPanel.html('<div class="infoMessage">' + response.msg + " <a class='standardAnchar' ng-href ng-click='DownloadLog(\"" + response.logId + "\");'>log</a>" + '</div>');

                            if (response.error !== null && response.error !== "") {
                                var jqXhr = AppStartupService.buildJsonResponse(response.error + " ", { type: "error", isNavigatable: false });
                                AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "error");
                            }
                            errorPanel.html(errorPanel.html() + '<span class="infoMessage">' + response.msg + " <a class='standardAnchar' ng-href ng-click='DownloadLog(\"" + response.logId + "\");'>log</a>" + '</span>');

                            $compile(errorPanel)($scope || $rootScope);
                        } else {
                            var opsuccessText = response;
                            var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: true });
                            AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "info");
                        }
                        
                    }).error(function (response, status) {

                        var opsuccessText = response.Message.replace(/\"/g, '');
                        var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "error", isNavigatable: false });
                        AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "error");
                    });
                }

                $scope.UploadFile = function (e) {
                    this.DBXLSColumnMap = [];
                    var str = $scope.GetMappingError(this.DBXLSColumnMap);
                    if (str.length > 0) {
                        alert(str);
                        return;
                    }

                    if (AppStartupService.getDirective("sp-grid", "xlsGridName").scope.eqgGrid.$angular_scope.selectedRowPKIds.length() < 1) {
                        alert("Please select xls rows to uplaod");
                    } else {

                        var selectedRecords = AppStartupService.getDirective("sp-grid", "xlsGridName").scope.eqgGrid.$angular_scope.selectedRowPKIds;
                        var grddata = AppStartupService.getDirective("sp-grid", "xlsGridName").scope.eqgGrid.dataSource.data();
                        grddata = jQuery.grep(grddata, function (item, index) {
                            return selectedRecords.ids[item.GrdRowId] === true;
                        });

                        var that = this;
                        var thatscope = $scope;
                        var reformattedArray = grddata.map(
                                function callback(currentValue, index, array) {
                                    var rObjResult = $scope.MapXlsDataToDBColumns(that.DBXLSColumnMap, currentValue, false);
                                    return rObjResult.rObj;
                                }
                            );

                        var data = {
                            xlsData: reformattedArray,
                            //test: new Date('12/12/2012'),
                            uploadFileName: $scope.selectedFile.name
                        };

                        $scope.laddaLoading = true;

                        var opsuccessText = "Uploading file...";
                        var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: true });
                        AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "info");


                        $http({
                            method: "POST",
                            url: AppStartupService.serviceBaseUrl() + $scope.uploadApiPath,
                            data: JSON.stringify(data),
                            timeout : 24 * 60 * 60 * 1000, //1 min = 1*60*1000 ms
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .success(function (response, status, headers) {
                            thatscope.laddaLoading = false;
                            if (angular.isDefined($scope.StatusCheckTimer)) {
                                $interval.cancel($scope.StatusCheckTimer);
                            }
                            
                            if (response != null && response.logId != null) {
                                var errorPanel = $('#' + AppStartupService.settings.current_app_errordisplay_panelId)
                                    .show().find(".k-errormessage").find(".AppMessage");

                                //clear error panel
                                errorPanel.html("");
                                //errorPanel.html('<div class="infoMessage">' + response.msg + " <a class='standardAnchar' ng-href ng-click='DownloadLog(\"" + response.logId + "\");'>log</a>" + '</div>');

                                if (response.error !== null && response.error !== "") {
                                    var jqXhr = AppStartupService.buildJsonResponse(response.error + " ", { type: "error", isNavigatable: false });
                                    AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "error");
                                }
                                errorPanel.html(errorPanel.html() + '<span class="infoMessage">' + response.msg + " <a class='standardAnchar' ng-href ng-click='DownloadLog(\"" + response.logId + "\");'>log</a>" + '</span>');

                                //Mark the completion as Flag for Job Pending ****
                                AppStartupService.setJobPendingCommitOrRollbackFlag(true);

                                $compile(errorPanel)($scope || $rootScope);

                            } else {
                                var opsuccessText = "Data uploaded successfully";
                                var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: true });
                                AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "info");
                            }
                        }).error(function (response, status) {
                            thatscope.laddaLoading = false;
                            if (angular.isDefined($scope.StatusCheckTimer)) {
                                $interval.cancel($scope.StatusCheckTimer);
                            }

                            var opsuccessText = response.Message.replace(/\"/g, '');
                            var jqXhr = AppStartupService.buildJsonResponse(opsuccessText, { type: "error", isNavigatable: false });
                            AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(jqXhr), "error");
                        });

                        if($scope.uploadStatusApiPath != undefined)
                            $scope.StatusCheckTimer = $interval($scope.statusCallAtInterval, 5000);
                    }
                };
                
                $scope.generateColumns = function (response) {
                    var columnNames = Object.keys(response[0]);

                    return columnNames.map(function (name) {
                        return { field: name, title: name, format: (isDateField[name] ? "{0:D}" : ""), width: 100 };
                    });
                }

                $scope.getHeaderRow = function (sheet) {
                    var headers = [];
                    var range = XLSX.utils.decode_range(sheet['!ref']);
                    var C, R = range.s.r; /* start in the first row */
                    /* walk every column in the range */
                    for (C = range.s.c; C <= range.e.c; ++C) {
                        var cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })]; /* find the cell in the first row */

                        var hdr = "UNKNOWN " + C; // <-- replace with your desired default 
                        if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
                        hdr = hdr.replace(/\s/g, "_");
                        hdr = hdr.replace(/\//g, "_");
                        hdr = hdr.replace(/\./g, "");
                        hdr = hdr.replace(/\W/g, "");
                        hdr = hdr.replace(/\(/g, "");
                        hdr = hdr.replace(/\)/g, "");

                        headers.push(hdr);
                    }
                    return headers;
                }

                $scope.generateModel = function (response) {

                    var sampleDataItem = response[0];

                    var model = {};
                    var fields = {};
                    for (var property in sampleDataItem) {

                        if (property === "_events" || property === "_handlers") {
                            continue;
                        }

                        if (property.indexOf("GrdRowId") !== -1) {
                            model["id"] = property;
                        }
                        var propType = jQuery.type(sampleDataItem[property]);// typeof sampleDataItem[property];

                        if (propType === "number") {
                            fields[property] = {
                                type: "number",
                                validation: {
                                    required: false
                                }
                            };
                            if (model.id === property) {
                                fields[property].editable = false;
                                fields[property].validation.required = false;
                            }
                        } else if (propType === "function") {
                            continue;
                        } else if (propType === "boolean") {
                            fields[property] = {
                                type: "boolean"
                            };
                        } else if (propType === "string") {
                            var parsedDate = kendo.parseDate(sampleDataItem[property]);
                            if (parsedDate) {
                                fields[property] = {
                                    type: "date",
                                    validation: {
                                        required: false
                                    }
                                };
                                isDateField[property] = true;
                            } else {
                                fields[property] = {
                                    type: "string",
                                    validation: {
                                        required: false
                                    }
                                };
                            }
                        } else {
                            fields[property] = {
                                type: propType,
                                validation: {
                                    required: false
                                }
                            };
                        }
                    }

                    model.fields = fields;

                    return model;
                };

                function cleanUp() {
                    angular.element($window).off('resize', $scope.SetGridHeight);
                }
                angular.element($window).on('resize', $scope.SetGridHeight);
                $scope.$on('$destroy', cleanUp);
                $scope.SetGridHeight = function () {
                    var gridElement = $("#eqg_" + "xlsGridName");
                    var grid = $("#eqg_xlsGridName").data("kendoGrid");
                    var dataArea = gridElement.find(".k-grid-content");
                    var dataArealocked = gridElement.find(".k-grid-content-locked");
                    var gridPager = gridElement.find(".k-grid-pager");
                    var gridHeader = gridElement.find(".k-grid-header");
                    var gc = gridElement.find(".k-grid-content")[0];
                    var gridHeaderWrap = gridElement.find(".k-grid-header-wrap");
                    var gridBottomMargin = parseInt($(".body-content").css("padding-left"));

                    //var commandBarTopPosition = $(window).height();
                    var commandBarTopPosition = $("#grd").height();

                    var gridTopPosition = gridElement.position().top;
                    var popupwindowheight = $("#eqgeditform_xlsGridName").height();
                    var gridHeaderheight = 0;
                    var gridPagerheight = 0;
                    var gridHeaderWrapWidth = gridHeaderWrap.width();
                    var gridHeaderWidth = gridHeader.width();
                    if (gridHeaderWrapWidth < gridHeaderWidth) {
                        gridHeaderWrapWidth = gridHeaderWidth;
                    }
                    if (gridHeader.length > 0) {
                        gridHeaderheight = gridHeader.height();
                    }

                    if (gridPager.length > 0) {
                        gridPagerheight = gridPager.height();
                    }
                    var contentDiv = grid.wrapper.children(".k-grid-content");
                    var gridDivWidth = contentDiv.width() - kendo.support.scrollbar();
                    var gw = grid.wrapper.width();
                    var gbw = grid.tbody.width();

                    dataArea.height(commandBarTopPosition - gridPagerheight - gridHeaderheight - 50);
                    if (dataArealocked.length > 0)
                        dataArealocked.height(commandBarTopPosition - gridPagerheight - gridHeaderheight - 50);


                    //var gh = grid.wrapper.height();
                    var gridHeaderHeight = grid.thead.height();
                    var gridBodyHeight = grid.tbody.height();
                    var gh = dataArea.innerHeight() + gridHeaderHeight;
                    gridHeader.hide();
                    if (gh > gridHeaderHeight + gridBodyHeight) {
                        $('.k-grid-header').css("padding-right", "0px");
                        $('.k-grid-header-wrap').css('width', (gc.offsetWidth) + 'px');
                    }
                    else {
                        $('.k-grid-header-wrap').css('width', gridHeaderWrapWidth + dataArealocked.innerWidth);
                    }
                    gridHeader.show();
                };
                
                $scope.buildMessages = function (messages, msgtype) {
                    msgtype = msgtype || "error";
                    AppStartupService.displaySystemMessageText(AppStartupService.parseResponse(AppStartupService.buildJsonResponse(messages, { type: msgtype, isNavigatable: false })), msgtype);
                }

                $scope.DownloadLog = function (documentId, event) {
                    $http({
                        method: 'GET',
                        url: AppStartupService.serviceBaseUrl() + "/api/common/DownloadLog/" + documentId,
                        responseType: 'arraybuffer'
                    })
                    .success(function (response, status, headers) {

                        var octetStreamMime = 'application/octet-stream';

                        // Get the headers
                        headers = headers();

                        // Get the filename from the x-filename header
                        var filename = headers['x-filename'];

                        // Determine the content type from the header or default to "application/octet-stream"
                        var contentType = headers['content-type'] || octetStreamMime;

                        var blobData = new Blob([response], { type: contentType });
                        FileSaver.saveAs(blobData, filename);

                    }).error(function (response, status) {
                        var decodedMessage = decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(response))));
                        response = { responseText: decodedMessage };
                        $scope.buildMessages(AppStartupService.parseResponse(response));
                    });
                };
            }],
            restrict: 'E',
            templateUrl: '/Scripts/app/control/xlsUpload.html',
            link: function (scope, element) {


                scope.eqgRecordPreviewTooltipDisplayOptions = {
                    //showOn: "click",
                    Position: "top",
                    width: "auto",
                    callout: true,
                    beforeShow: function (e) {
                        var DBXLSColumnMap = [];
                        var str = scope.GetMappingError(DBXLSColumnMap);
                        if (str.length > 0 ) e.preventDefault();
                        else this.refresh();
                    },
                    //show: function (e) {                        
                    //    this.refresh();
                    //},
                    content: function (e) {

                        var DBXLSColumnMap = [];
                        var str = scope.GetMappingError(DBXLSColumnMap);
                        if (str.length > 0) { return "";}

                        var grddata = AppStartupService.getDirective("sp-grid", "xlsGridName").scope.eqgGrid.dataSource.data();
                        if (grddata.length < 1) return "";

                        var currentValue = grddata[0];
                        var filterhtml = "<table>";
                        var rObjResult = scope.MapXlsDataToDBColumns(DBXLSColumnMap, currentValue, true);
                        filterhtml += rObjResult.mapPreviewToolTiphtml;
                        filterhtml += "</table>";
                        return filterhtml;
                    }
                };

                scope.$on("kendoWidgetCreated", function (e, widget) {
                    if (widget === e.targetScope.eqgGrid) {

                        var clone = $("#btnAddCountryToPreview").clone(true);
                        clone.show();
                        $("#gridLabelHolder_xlsGridName").append(clone);
                    }
                    else if (widget === e.targetScope.eqgRecordPreviewTooltip) {
                        e.targetScope.eqgRecordPreviewTooltip.$angular_scope = e.targetScope;
                    }
                });
            }
        };
    }]);
})();