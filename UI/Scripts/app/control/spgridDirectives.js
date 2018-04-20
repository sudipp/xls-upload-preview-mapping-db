

(function () {

    'use strict';

    appModule.directive('spGrid', ['$http', '$document', '$sce', '$compile', 'AppStartupService', 'localStorageService',
        function ($http, $document, $sce, $compile, AppStartupService, localStorageService) {
            return {
                scope: {
                    gridOptions: '=gridOptions',
                    gridId: '@',
                    gridCrudOptions: '=gridCrudOptions',
                    gridToolbarOptions: '=gridToolbarOptions',
                    showGrid: '=showGrid',
                    saveUserPref: '=saveUserPref',
                },

                controller: ['$scope', '$sce', function ($scope, $sce) {

                    if ($scope.showGrid == undefined) $scope.showGrid = true;
                    //user preference
                    if ($scope.saveUserPref == undefined) $scope.saveUserPref = false;

                    //to load user filter preference ???
                    $scope.ldFltPref = ($scope.gridOptions.loadGridFilterPref == undefined) ? false : $scope.gridOptions.loadGridFilterPref;

                    $scope.gridOptions.excel.allPages = true;

                    //common Grid settings
                    $scope.gridOptions.noRecords = $scope.gridOptions.noRecords || {
                        template: "No Record Found."
                    };

                    if ($scope.gridOptions.selectableColumn == undefined) {
                        $scope.gridOptions.selectableColumn = {
                            show: false,
                            singleMode: true
                        };
                    }

                    $scope.gridOptions.reorderable = true;

                    //defect fix - 1773 - if grid is sortable, allow single column sort
                    if ($scope.gridOptions.sortable) {
                        $scope.gridOptions.sortable = {
                            mode: "single",
                            allowUnsort: true
                        };
                    }

                    //***************************************************************
                    //Add SelectAllCheckBox column at position 0
                    //***************************************************************
                    var newColumns = [];
                    newColumns.push({
                        headerTemplate: "<span id='masterLabelSelectAllCheckBox_eqg_" + $scope.gridId + "' style='text-align:center;margin-left:8px!important;'>All</span><br/><input type='checkbox' id='masterSelectAllCheckBox_eqg_" + $scope.gridId + "' style='margin-left:8px;'/>",
                        template: "# if(data.IsSelectable == 1){ # <input type='checkbox' class='rowSelectCheckbox' /> #} # ",
                        width: ($scope.gridOptions.selectableColumn.width == undefined) ? 35 : $scope.gridOptions.selectableColumn.width,
                        resizable: false,
                        headerAttributes: { "class": "disable-reorder" },

                        lockable: false,
                        locked: true,

                        filterable: false,
                        sortable: false,
                    });

                    //for single mode, reset header template
                    if ($scope.gridOptions.selectableColumn.singleMode)
                        newColumns[0].headerTemplate = "";

                    //setting disable reorder for all locked columns
                    $($scope.gridOptions.columns).each(function (index, col) {
                        if (col.locked) col.headerAttributes = { "class": "disable-reorder" };
                    });

                    var isSelectAllColumnAttached = $.grep($scope.gridOptions.columns, function (col) {
                        return (col.template !== undefined) && typeof (col.template) !== 'function' && col.template.indexOf("rowSelectCheckbox") > -1;
                    });

                    if (isSelectAllColumnAttached.length === 0)
                        $scope.gridOptions.columns = newColumns.concat($scope.gridOptions.columns);
                    //***************************************************************

                    if ($scope.gridOptions.pageable != false) {

                        $scope.gridOptions.pageable = {
                            pageSize: 20,
                            input: true,
                            messages: { display: "Showing {0}-{1} of {2}" },
                            numeric: false,
                            info: true,
                            change: function (e) {
                                //resetting the scroll top for grid on Page change
                                AppStartupService.getDirective("sp-grid", $scope.gridId).scope.eqgGrid
                                    .content.scrollTop(0);
                            }
                        };
                    }

                    //load user preference ************
                    console.info("localStorageService supported on browser ?: " + localStorageService.isSupported);
                    console.info("Is User's Grid [" + $scope.gridId + "] perference store enabled ?: " + $scope.saveUserPref);

                    if ($scope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                        var grdPref = localStorageService.get($scope.gridId + "-kendo-grid");
                        if (grdPref != null) {

                            //set filter preference
                            if ($scope.ldFltPref && grdPref.filter != null) $scope.gridOptions.dataSource.filter(grdPref.filter);

                            //set column preference
                            $scope.gridOptions.columns = grdPref.columns;

                            //set column sort preference
                            if (grdPref.sort != null) $scope.gridOptions.dataSource.sort(grdPref.sort);
                        }
                        console.info("Grid[" + $scope.gridId + "]  prefrence" + ((grdPref == null) ? " not" : "") + " found on localStorageService");
                    }
                    //load user preference ************

                    //common Grid settings
                    $scope.gridToolbarOptions = ($scope.gridToolbarOptions == undefined) ? ({
                        gridHeaderText: '',
                        showExport: false,
                        //showClearGridFilter: false,
                        search: {
                            show: false,
                            panelExpanded: false
                        },
                        showGridFiltersummary: false
                    }) : $scope.gridToolbarOptions;

                    //enabling clear grid 
                    $scope.gridToolbarOptions.showClearGridFilter = true;

                    $scope.showGridSerach = $scope.gridToolbarOptions.search.show;

                    //To show Export button, when CRUD in progress, if showExport==true, else hide 
                    $scope.gridToolbarOptions.showExportOnCRUD = $scope.gridToolbarOptions.showExport;

                    if ($scope.showGridSerach && $scope.gridToolbarOptions.search.panelExpanded) {
                        //make it false, to show the search panel expanded
                        $scope.gridToolbarOptions.search.show = false;
                    }

                    //$scope.AppStartupService = AppStartupService;
                    $scope.toolbarFilterDisplayText = null;

                    $scope.searchCriteriaForFilterDisplay = [];

                    $scope.selectedRowPKIds = {
                        ids: {},
                        length: function () {
                            var x = 0;
                            $.each(this.ids, function (key, val) {
                                x++;
                            });
                            return x;
                        },
                        get: function (key) {
                            return this.ids[key];
                        },
                        set: function (key, val) {
                            this.ids[key] = val;
                        },
                        remove: function (key) {
                            delete (this.ids[key]);
                        },
                        clear: function () {
                            this.ids = {};
                        },
                        idArray: function () { //array of ids property
                            return $.map(this.ids,
                                function (key, val) { return val; }
                                );
                        }
                    };

                    $scope.TempSelectedRowPKIds = jQuery.extend(true, {}, $scope.selectedRowPKIds);

                    //for server side pagination only
                    $scope.TempDeSelectedRowPKIds = jQuery.extend(true, {}, $scope.selectedRowPKIds);
                    //for server side pagination only

                    $scope.gridtoolbarFilterDisplayOptions = {
                        showOn: "click",
                        Position: "top",
                        width: "auto",
                        callout: true,
                        beforeShow: function (e) {
                            var grid = e.sender.$angular_scope.eqgGrid;
                            var filter = (grid != null && $scope.gridToolbarOptions.showGridFiltersummary == true) ? grid.dataSource.filter() : null;

                            if (filter == null &&
                                (e.sender.$angular_scope.searchCriteriaForFilterDisplay == null ||
                                e.sender.$angular_scope.searchCriteriaForFilterDisplay.length == 0)) {
                                e.preventDefault();
                            } else
                                this.refresh();
                        },
                        content: function (e) {
                            var grid = e.sender.$angular_scope.eqgGrid;

                            var filterArr = ($scope.gridToolbarOptions.showGridFiltersummary == true) ? grid.formattedFilterHtml().concat(e.sender.$angular_scope.searchCriteriaForFilterDisplay) : e.sender.$angular_scope.searchCriteriaForFilterDisplay;

                            if (filterArr.length == 0) {
                                e.sender.hide();
                                return "";
                            }

                            var filterhtml = "<table>";
                            $.each(filterArr, function (key, value) {
                                filterhtml += "<tr><td style='float:left;' nowrap>" + value + "</td></tr>";
                            });
                            filterhtml += "</table>";

                            return filterhtml;
                        },
                    };
                }],

                //controllerAs : 'sudipControl',
                restrict: 'E',
                //transclude: true,
                //replace: true, // optional 
                templateUrl: function () {
                    return '/Scripts/app/control/grid.html';
                },
                link: function (scope) {

                    scope.sce = $sce;

                    scope.Name = "spGrid Scope" + scope.gridId;

                    scope.onEditPopupOpen = function (e) {
                        if (e.sender.wrapper.find('.sys-message').length == 0)  //.error_content_panel
                            throw new Error("Error display panel [id:popup_errordisplay_panel] inside popup is not defined.");

                        scope.$root.startup.settings.current_app_errordisplay_panelId = "popup_errordisplay_panel_" + scope.gridId;
                        scope.$root.startup.settings.current_app_fullerrordisplay_panelId = "popup_expandederrordisplay_panel_" + scope.gridId;
                    };

                    scope.onEditPopupClose = function (e) {
                        e.sender.Grid.dataSource.cancelChanges();

                        scope.$root.startup.settings.current_app_errordisplay_panelId =
                            scope.$root.startup.settings.app_errordisplay_panelId;

                        scope.$root.startup.settings.current_app_fullerrordisplay_panelId =
                            scope.$root.startup.settings.app_fullerrordisplay_panelId;
                    };
                    scope.PopupClose = function (e) {
                        e.preventDefault();
                        this.eqgGridPopup.close();
                    };
                    scope.UpdateChanges = function (e) {
                        e.preventDefault();

                        var scp = this;
                        var grd = scp.eqgGrid;

                        var validator = scp.eqgGridPopup.element.closest(".k-window-content").find('form').kendoValidator().data("kendoValidator");
                        if (validator != undefined) {
                            if (!validator.validate()) {
                                validator.hideMessages();
                                var errors = validator.errors();
                                var jqXhr = scp.$root.startup.buildJsonResponse(errors, { type: "BusinessException", isNavigatable: false });
                                scp.$root.startup.displaySystemMessageText(scp.$root.startup.parseResponse(jqXhr), "error");
                                return false;
                            } else {
                                if (grd.dirtyRecords().length > 0) {
                                    //return a promise
                                    return grd.dataSource.sync();
                                }
                            }
                        }
                    };

                    function setGridProperties(widget, $scope, sce) {

                        widget.thead.kendoTooltip({
                            filter: "th",
                            beforeShow: function (e) {
                                var target = e.target;
                                var index = -1;
                                var columns = widget.options.columns;
                                if (columns.length > 0) {
                                    for (var i = 0; i < columns.length; i++) {
                                        if (columns[i].title == $(target).text()) {
                                            index = i;
                                        }
                                    }
                                }

                                if (widget.options.columns[index] == undefined || widget.options.columns[index].headerAttributes == undefined || widget.options.columns[index].headerAttributes.title == undefined) {
                                    // don't show the tooltip if the attribute doesnot exist
                                    e.preventDefault();
                                }
                            },
                            content: function (e) {
                                var target = e.target; // element for which the tooltip is shown
                                var index = -1;
                                var columns = widget.options.columns;
                                if (columns.length > 0) {
                                    for (var i = 0; i < columns.length; i++) {
                                        if (columns[i].title == $(target).text()) {
                                            index = i;
                                        }
                                    }
                                }

                                if (widget.options.columns[index] != undefined && widget.options.columns[index].headerAttributes != undefined && widget.options.columns[index].headerAttributes.title != undefined)
                                    return widget.options.columns[index].headerAttributes.title;
                                return "";
                            }
                        });
                        if (widget.getOptions().RowSelectedCompleted != undefined)
                            widget.bind("RowSelectedCompleted", widget.getOptions().RowSelectedCompleted);

                        //Attach RowSelected event handler, if any
                        if (widget.getOptions().RowSelected != undefined)
                            widget.bind("RowSelected", widget.getOptions().RowSelected);

                        //Attach SelectAllRows event handler, if any
                        if (widget.getOptions().AllRowsSelected != undefined)
                            widget.bind("AllRowsSelected", widget.getOptions().AllRowsSelected);

                        //Attach BeforeFilter event handler, if any
                        if (widget.getOptions().BeforeFilter != undefined)
                            widget.bind("BeforeFilter", widget.getOptions().BeforeFilter);

                        //Attach AfterFilter event handler, if any
                        if (widget.getOptions().AfterFilter != undefined)
                            widget.bind("AfterFilter", widget.getOptions().AfterFilter);

                        //Attach AfterFilter event handler, if any
                        if (widget.getOptions().GridDataBindCompleted != undefined)
                            widget.bind("GridDataBindCompleted", widget.getOptions().GridDataBindCompleted);

                        $scope.$watch('eqgGrid.options.selectableColumn.show', function (newValue, oldValue) {
                            if (newValue) widget.showColumn(0);
                            else widget.hideColumn(0);
                        });

                        if (widget.options.pageable && $("#selectedRecordCount_" + widget.wrapper.context.id).length == 0) {//grid.pager != null && grid.pager.element != null) {
                            widget.pager.element.append("<span id=\"selectedRecordCount_" + widget.wrapper.context.id + "\" style=\"margin-left:20px;\"></span>");
                            widget.updateSelectedRecordCount();
                        }

                        widget.wrapper.on("change", "#masterSelectAllCheckBox_" + widget.wrapper.context.id, function () {
                            var grd = $scope.eqgGrid;

                            if (grd != null) {
                                var ds = grd.dataSource;
                                var fltrdata = kendo.data.Query.process(ds.data(),
                                { filter: ds.filter(), sort: ds.sort() }).data;

                                grd.selectDeselectRows($(this).is(":checked"), true, fltrdata, 0, fltrdata.length);

                                var checked = $(this).is(':checked'), event = { selected: checked };


                                //for server side pagination only
                                if (grd.dataSource.options.serverPaging) {
                                    //clear array in case of SelctAll uncheck
                                    if (!checked) $scope.TempDeSelectedRowPKIds.clear();
                                }
                                //for server side pagination only

                                //trigger AllRowsSelected event
                                grd.trigger("AllRowsSelected", event);
                            };
                        });


                        //recheking on page change
                        widget.wrapper.on("click", ".rowSelectCheckbox", function (e) {

                            var grd = $scope.eqgGrid;
                            if (grd != null) {

                                var checked = $(this).is(':checked'),
                                    row = $(this).closest("tr"),
                                    that = this,
                                    model = grd.dataItem(row),
                                    event = {
                                        model: model,
                                        row: row,
                                        selected: checked
                                    };

                                //we need to identify if the RowSelected event is cancelled by UI,
                                //if it is cancelled, we dont need to select new records
                                grd.$angular_scope.TempSelectedRowPKIds.set(model.id, checked);


                                //trigger RowSelected event
                                var triggerEvent = true;
                                if (grd.dataSource.hasChanges()) {
                                    //"There are unsaved changes. Would like to proceed?");
                                    if (!confirm($scope.$root.msgSvc.messages.wanring.W019))
                                        triggerEvent = false;
                                }

                                if (triggerEvent)
                                    grd.trigger("RowSelected", event);


                                if (!triggerEvent || (event._defaultPrevented != null && event.isDefaultPrevented())) {// event.isDefaultPrevented()) {
                                    e.preventDefault();
                                    grd.$angular_scope.TempSelectedRowPKIds.clear();
                                    return false;
                                }


                                //find the row again, as it might be rebuilt on dataChnages.cancel
                                //get model
                                model = grd.dataSource.get(grd.$angular_scope.TempSelectedRowPKIds.idArray()[0]);

                                grd.$angular_scope.TempSelectedRowPKIds.clear();

                                //deselect any previous selection, in case of SingleMode
                                if (grd.$angular_scope.gridOptions.selectableColumn.singleMode && checked) {
                                    grd.selectDeselectRows(false, true, grd.dataSource, 0, grd.dataSource.length);
                                }

                                if (model != undefined) {

                                    //for server side pagination only
                                    if (grd.dataSource.options.serverPaging) {
                                        if (!checked)
                                            grd.$angular_scope.TempDeSelectedRowPKIds.set(model.id, checked);
                                        else
                                            grd.$angular_scope.TempDeSelectedRowPKIds.remove(model.id);
                                    }

                                    grd.selectRow(model, checked);
                                }

                                if (triggerEvent)
                                    grd.trigger("RowSelectedCompleted", event);
                            }
                        });
                    };

                    scope.$on("kendoWidgetCreated", function (e, widget) {
                        if (widget === e.targetScope.eqgGridTooltip) {
                            e.targetScope.eqgGridTooltip.$angular_scope = e.targetScope;
                        }
                        else if (widget === e.targetScope.eqgGrid) {
                            e.targetScope.eqgGrid.$angular_scope = e.targetScope;


                            setGridProperties(widget, e.targetScope, e.targetScope.sce);

                            if (e.targetScope.gridToolbarOptions.search.close != undefined &&
                                $("#gridSerachPanel_" + e.targetScope.gridId).length > 0) {
                                $("#gridSerachPanel_" + e.targetScope.gridId).bind("close", e.targetScope.gridToolbarOptions.search.close);
                                $("#gridSerachPanel_" + e.targetScope.gridId).bind("open", e.targetScope.gridToolbarOptions.search.open);
                            }

                            /////////////////////
                            var thatScope = widget.$angular_scope;

                            var beforeFilterHandler = function (event) {

                                var triggerEvent = true;
                                if (thatScope.selectedRowPKIds.length() > 0) {
                                    if (!confirm(thatScope.$root.msgSvc.messages.wanring.W027)) {
                                        triggerEvent = false;
                                        event.preventDefault();
                                    }
                                }

                                if (triggerEvent)
                                    widget.trigger("BeforeFilter", event);  //trigger grids BeforeFilter event

                                //Causing filter, on grid with selected rows, will clear all record selection
                                if (event != undefined && !event.isDefaultPrevented()
                                    && thatScope.selectedRowPKIds.length() > 0) {
                                    widget.CancelEdit(true);
                                }
                            };

                            /*widget.bind("filterMenuInit", function (e) {
                                e.container.on("click", "[type='reset']", function () {
                                    if (thatScope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                                        localStorageService.set(thatScope.gridId + "-kendo-grid", widget.getUserPrefFromOptions());
                                    }
                                });
                            });*/

                            var afterFilterHandler = function (event) {
                                if (e.targetScope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                                    localStorageService.set(e.targetScope.gridId + "-kendo-grid", widget.getUserPrefFromOptions());
                                }
                                widget.trigger("AfterFilter", event);  //trigger grids AfterFilter event
                            };


                            widget.one("excelExport", function (e) {
                            });

                            widget.one("dataBound", function (e) {
                                //set last visited page (from the preference) for the first time grid is loaded ****
                                var grdPref = localStorageService.get(thatScope.gridId + "-kendo-grid");
                                if (grdPref != null && thatScope.ldFltPref && grdPref.page != null) {
                                    this.dataSource.page(grdPref.page);
                                }
                            });
                            widget.bind("dataBound", function (e) {
                                if (thatScope.TempSelectedRowPKIds.length() == 0) {

                                    //Akash
                                    var isSelectAllChecked = widget.wrapper.find("#masterSelectAllCheckBox_" + widget.wrapper.context.id).is(':checked');

                                    var view = this.dataSource.view();
                                    for (var i = 0; i < view.length; i++) {
                                        if (view[i].IsSelectable) {
                                            if (thatScope.selectedRowPKIds.get(view[i].id) || view[i].ishighlighted

                                                //2340 - for server side pagination only
                                                || (this.dataSource.options.serverPaging && isSelectAllChecked && thatScope.TempDeSelectedRowPKIds.get(view[i].id) == undefined))

                                                this.selectRow(view[i], true);
                                        }
                                    }
                                }
                                //for sort preference
                                if (thatScope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                                    localStorageService.set(thatScope.gridId + "-kendo-grid", widget.getUserPrefFromOptions());
                                }

                                //update pref on clear filter
                                if (this.dataSource.filter() === null) {
                                    if (thatScope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                                        localStorageService.set(thatScope.gridId + "-kendo-grid", widget.getUserPrefFromOptions());
                                    }
                                }

                                //attach 'BeforeFilter' to dataSource
                                this.dataSource.unbind("BeforeFilter", beforeFilterHandler)
                                    .bind("BeforeFilter", beforeFilterHandler);

                                //attach 'AfterFilter' to dataSource
                                this.dataSource.unbind("AfterFilter", afterFilterHandler)
                                    .bind("AfterFilter", afterFilterHandler);

                                var currentFilter = this.dataSource.filter();
                                thatScope.$evalAsync(function () {
                                    thatScope.toolbarFilterDisplayText =
                                        thatScope.sce.trustAsHtml(((currentFilter != null && currentFilter.filters.length > 0 && thatScope.$parent.gridToolbarOptions.showGridFiltersummary == true) ||
                                        (thatScope.searchCriteriaForFilterDisplay != null && thatScope.searchCriteriaForFilterDisplay.length > 0))
                                        ? "<span class='filterCriteriaLink' >View Search Criteria</span>" : "All Records");

                                    //show clear filter when filter is applied
                                    thatScope.gridToolbarOptions.showClearGridFilter = (currentFilter != null && currentFilter.filters.length > 0);

                                });

                                //hide export button when grid has no record
                                if (thatScope.gridToolbarOptions.showExport)
                                    thatScope.gridToolbarOptions.showExportOnCRUD = (this.dataSource.total() > 0);


                                widget.trigger("GridDataBindCompleted", e);
                            });

                            widget.bind("columnResize", function () {
                                if (e.targetScope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                                    localStorageService.set(e.targetScope.gridId + "-kendo-grid", widget.getUserPrefFromOptions());
                                }
                            });
                            widget.bind("columnReorder", function (evnt) {
                                if (e.targetScope.saveUserPref && AppStartupService.settings.storeLdUsrGrdPreference) {
                                    setTimeout(function () {
                                        localStorageService.set(e.targetScope.gridId + "-kendo-grid", widget.getUserPrefFromOptions());
                                    }, 5);
                                }
                            });
                            //////////////////////


                            //Edit form place holder
                            e.targetScope.eqgGrid.editform = $("#eqgeditform_" + e.targetScope.gridId);

                            e.targetScope.$root.startup.documentGrids.set(e.targetScope.eqgGrid);

                            if (e.targetScope.eqgGridPopup != undefined) {
                                e.targetScope.eqgGrid.Popup = e.targetScope.eqgGridPopup;
                                e.targetScope.eqgGridPopup.Grid = e.targetScope.eqgGrid;
                            }
                        }
                        else if (widget === e.targetScope.eqgGridPopup) {
                            e.targetScope.eqgGridPopup.$angular_scope = e.targetScope;
                            e.targetScope.eqgGridPopup.bind("open", scope.onEditPopupOpen);

                            if (e.targetScope.eqgGrid != undefined) {
                                e.targetScope.eqgGrid.Popup = e.targetScope.eqgGridPopup;
                                e.targetScope.eqgGridPopup.Grid = e.targetScope.eqgGrid;
                            }

                            if (scope.gridCrudOptions) {
                                if (scope.gridCrudOptions.add) {
                                    $http.get(scope.gridCrudOptions.add.templateFile)
                                        .then(function (response) {
                                            e.targetScope.AddTemplate = kendo.template(response.data);
                                        }, function (response) {
                                            console.log('unable to load Template : ' + scope.gridCrudOptions.add.templateFile);
                                            alert('unable to load Template : ' + scope.gridCrudOptions.add.templateFile);
                                        });
                                }
                                if (scope.gridCrudOptions.edit) {
                                    $http.get(scope.gridCrudOptions.edit.templateFile)
                                        .then(function (response) {
                                            e.targetScope.EditTemplate = kendo.template(response.data);
                                        }, function (response) {
                                            console.log('unable to load Template : ' + scope.gridCrudOptions.edit.templateFile);
                                            alert('unable to load Template : ' + scope.gridCrudOptions.edit.templateFile);
                                        });
                                }
                            }
                        }
                    });

                    scope.exportGridData = function () {
                        var grid = scope.$root.startup.documentGrids.find("eqg_" + scope.gridId);
                        var grdNameForExport = "";
                        if (scope.gridOptions.excel.exportGrdNm) {
                            grdNameForExport = scope.gridOptions.excel.exportGrdNm;
                        } else {
                            grdNameForExport = scope.gridId;
                        }
                        grid.options.excel = {
                            fileName: grdNameForExport + "_" + kendo.toString(new Date(), "yyyyMMddHHmmss") + ".xlsx",
                            allPages: true,
                            proxyURL: "/Home/GridExport",
                            forceProxy: true
                        };



                        grid.saveAsExcel();
                    };
                    scope.clearGridFilter = function () {
                        var grid = scope.$root.startup.documentGrids.find("eqg_" + scope.gridId);
                        //clear all filters
                        grid.dataSource.filter([]);
                    };

                    scope.closeSearch = function (e) {

                        if (!scope.gridToolbarOptions.search.show) {
                            scope.gridToolbarOptions.search.show = true;
                        }
                        $("#gridSerachPanel_" + scope.gridId).trigger("close", e);
                    };

                    scope.openSearch = function (e) {
                        var gridDirective = AppStartupService.getDirective("sp-grid", scope.gridId);
                        if (gridDirective.scope.eqgGrid.$angular_scope.selectedRowPKIds.length() > 0) {
                            if (!confirm("Upon completion of selected action and return to this screen, all currently selected items on the screen will be de-selected. To proceed, select OK"))
                                return;
                        }
                        scope.gridToolbarOptions.search.show = false;

                        if ($("#gridSerachPanel_" + scope.gridId).length > 0)
                            $("#gridSerachPanel_" + scope.gridId).trigger("open", e);
                    };
                }

            };
        }]);

})();