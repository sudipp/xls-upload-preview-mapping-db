
function IsHandlerExist(obj2Test, a, b) {
    if (obj2Test._events[a] == null || obj2Test._events[a] == "undefined")
        return false;
    return ($.grep(obj2Test._events[a], function (e) {
        return (e.toString().indexOf(b) != -1);
    }).length > 0);
};

kendo.ui.FilterMenu.prototype.options.operators.string = {
    contains: "Contains",
    doesnotcontain: "Does not contain",
    eq: "Is equal to",
    neq: "Is not equal to",
    startswith: "Starts with",
    doesnotstartwith: "Does not start with", //GK
    endswith: "Ends with",
    doesnotendwith: "Does not end with", //GK
    blank: "Is BLANK",
    notblank: "Is not BLANK",
};
kendo.ui.FilterMenu.prototype.options.operators.number.blank = "Is BLANK";
kendo.ui.FilterMenu.prototype.options.operators.date.blank = "Is BLANK";
kendo.ui.FilterMenu.prototype.options.operators.enums.blank = "Is BLANK";
kendo.ui.FilterMenu.prototype.options.operators.number.notblank = "Is not BLANK";
kendo.ui.FilterMenu.prototype.options.operators.date.notblank = "Is not BLANK";
kendo.ui.FilterMenu.prototype.options.operators.enums.notblank = "Is not BLANK";


kendo.ui.Grid.prototype.Popup = null,
    kendo.ui.Grid.prototype.buildExportGridDefOnDataBind = false,
    kendo.ui.Grid.prototype.contentScrollLeft = 0,
    kendo.ui.Grid.prototype.isMasterGrid = false; //True if a grid is the master/main on the page

//Disable drag and drop for all locked columns
kendo.ui.Grid.fn._reorderable = function (reorderable) {
    return function () {
        reorderable.call(this);

        var dropTargets = $(this.element).find('th.disable-reorder');

        dropTargets.each(function (idx, item) {
            if ($(item).data("kendoDropTarget") != undefined)
                $(item).data("kendoDropTarget").destroy();
        });
        var draggable = $(this.element).data("kendoDraggable");
        if (draggable) {
            draggable.bind("dragstart", function (e) {
                if ($(e.currentTarget).hasClass("disable-reorder"))
                    e.preventDefault();
            });
        }
    }
}(kendo.ui.Grid.fn._reorderable);

kendo.ui.FilterMenu.prototype.filter = (function (originalFilter) {
    return function extendedFilter(event) {

        var res = $.grep(event.filters, function (item) {
            return (item.operator.indexOf("blank") >= 0) ? (item.value = "", true) : ("" !== item.value && null != item.value); //allow with or without value
        });

        if (res.length == 0) {
            this._reset();
        } else {
            //trigger event and wait for user selection (if any)
            this.dataSource.trigger("BeforeFilter", event);

            //if BeforeFilter is cancelled, then we shouldnt proceed with filter operation 
            if (event.isDefaultPrevented()) {
                this._reset();
            } else {
                originalFilter.apply(this, arguments);

                //trigger event and wait for user selection (if any)
                this.dataSource.trigger("AfterFilter", event);
            }
        }
    };
})(kendo.ui.FilterMenu.prototype.filter);

//disable Kendo numeric text box spinner
kendo.ui.NumericTextBox.fn.options.spinners = false;

kendo.ui.Grid.prototype.getUserPrefFromOptions = function () {
    var grdPrefStruct = {
        filter: this.getOptions().dataSource.filter,
        columns: this.getOptions().columns,
        sort: this.getOptions().dataSource.sort, // Defect 1774: Applied Sort Should Clear like Filters
        page: this.getOptions().dataSource.page
    };
    return grdPrefStruct;
};

kendo.ui.Grid.prototype.dirtyRecords = function () {
    return $.grep(this.dataSource.data(), function (e) { return (e.isNew() || e.dirty); });
};

kendo.ui.Grid.prototype.filteredRecords = function () {
    var ds = this.dataSource;
    var fltrdata = kendo.data.Query.process(ds.data(), { filter: ds.filter(), sort: ds.sort() }).data;
    return fltrdata;
};

kendo.ui.Grid.prototype.validateCrudProcess = function (op) {
    if (this.$angular_scope.gridCrudOptions == undefined)
        return true;
    if (this.$angular_scope.TempSelectedRowPKIds.length() === 0 && this.$angular_scope.selectedRowPKIds.length() === 0)
        return false;

    var recordLimit = 0;
    var recordLimitViolationText = "";
    if (op == "edit") {
        recordLimit = this.$angular_scope.gridCrudOptions.edit.recordLimit;
        recordLimitViolationText = this.$angular_scope.gridCrudOptions.edit.recordLimitViolationText;
    } else if (op == "delete") {
        recordLimit = this.$angular_scope.gridCrudOptions.destroy.recordLimit;
        recordLimitViolationText = this.$angular_scope.gridCrudOptions.destroy.recordLimitViolationText;
    }

    if (this.$angular_scope.TempSelectedRowPKIds.length() === 0 &&
        this.$angular_scope.selectedRowPKIds.length() > recordLimit) {
        //var jqXhr = this.$angular_scope.$root.startup.buildJsonResponse(recordLimitViolationText, true, false);
        var jqXhr = this.$angular_scope.$root.startup.buildJsonResponse(recordLimitViolationText, { type: "info", isNavigatable: false });
        this.$angular_scope.$root.startup.displaySystemMessageText(this.$angular_scope.$root.startup.parseResponse(jqXhr, "info"));
        return false;
    };
    return true;
};

kendo.ui.Grid.prototype.updateSelectedRecordCount = function () {

    var totalRecordsSelected = this.$angular_scope.selectedRowPKIds.length();

    //2340 - for server side pagination only
    if (this.dataSource.options.serverPaging) {
        var isSelectAllChecked = this.wrapper.find("#masterSelectAllCheckBox_" + this.wrapper.context.id).is(':checked');

        if (isSelectAllChecked)
            totalRecordsSelected = this.pager.dataSource._pristineTotal - this.$angular_scope.TempDeSelectedRowPKIds.length();
    }
    //2340 - for server side pagination only

    $("#selectedRecordCount_" + this.wrapper.context.id)
        .html("Record(s) selected: " + totalRecordsSelected);//this.$angular_scope.selectedRowPKIds.length());
};

//Custom row selection
//Hightlight row and check the row selection checkbox
kendo.ui.Grid.prototype.selectRow = function (model, checked) {

    if (checked)
        this.$angular_scope.selectedRowPKIds.set(model.id, checked);
    else
        this.$angular_scope.selectedRowPKIds.remove(model.id); //delete if not selected

    var tr = $("tr[data-uid='" + model.uid + "']");
    var isModelhighlighted = model.ishighlighted;
    tr.each(function () {
        if (isModelhighlighted)
            $(this).addClass("k-state-highlighted");
        if (checked)
            $(this).addClass("k-state-selected");
        else
            $(this).removeClass("k-state-selected");
    });

    this.updateSelectedRecordCount();

    return tr.find(".rowSelectCheckbox").prop("checked", (checked ? 'checked' : ''));
};

kendo.ui.Grid.prototype.selectDeselectRows = function (shouldSelect, shouldClearPrevChecked, filteredData, startRecordIndex, endRecordIndex) {
    var view = this.dataSource.view(); //current page

    //Check Selectb all check box in case of "Select all" menu selected or desecet it.
    ((startRecordIndex === 0 && endRecordIndex === filteredData.length) &&
        $("#masterSelectAllCheckBox_" + this.wrapper.context.id).prop("checked", shouldSelect)) ||
    ($("#masterSelectAllCheckBox_" + this.wrapper.context.id).prop("checked", false));

    //deselect all previous selections
    if (shouldClearPrevChecked) {
        this.$angular_scope.selectedRowPKIds.clear();
    }

    for (var i = 0; i < view.length; i++) { //first deselect rows (if any selected) from current page 
        if (view[i].IsSelectable)
            this.selectRow(view[i], false);
    }

    for (var i = startRecordIndex; i < endRecordIndex; i++) {
        if (filteredData[i].IsSelectable) {
            if (i >= filteredData.indexOf(view[0]) && i <= filteredData.indexOf(view[view.length - 1]))
                this.selectRow(filteredData[i], shouldSelect);
            else
                if (shouldSelect) this.$angular_scope.selectedRowPKIds.set(filteredData[i].id, shouldSelect);
                else this.$angular_scope.selectedRowPKIds.remove(filteredData[i].id);
        }
    }

    this.updateSelectedRecordCount();
};

kendo.ui.Grid.prototype.DeleteSelectedRows = function () {

    //if nothing selected, nothing to do
    if (!this.validateCrudProcess("delete"))
        return;

    var editedDataGrid = this;
    function onSuccessfulDataSourceDeleted(e) {
        //debugger;
        editedDataGrid.$angular_scope.selectedRowPKIds.clear();
        editedDataGrid.updateSelectedRecordCount();

        editedDataGrid.dataSource.one("requestEnd", function () { //Op 3

            editedDataGrid.CancelEdit();

            //clear selection
            editedDataGrid.$angular_scope.selectedRowPKIds.clear();
            editedDataGrid.updateSelectedRecordCount();

            var opsuccessText = (editedDataGrid.$angular_scope.gridCrudOptions.destroy.successText != undefined) ?
                    editedDataGrid.$angular_scope.gridCrudOptions.destroy.successText : editedDataGrid.$angular_scope.$root.msgSvc.messages.info.I028;

            var jqXhr = editedDataGrid.$angular_scope.$root.startup.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: false });
            editedDataGrid.$angular_scope.$root.startup.displaySystemMessageText(editedDataGrid.$angular_scope.$root.startup.parseResponse(jqXhr), "info");
        });

        editedDataGrid.dataSource.read();

        editedDataGrid.dataSource.unbind("sync", onSuccessfulDataSourceDeleted);
    }
    if (!IsHandlerExist(this.dataSource, 'sync', "onSuccessfulDataSourceDeleted")) {
        //debugger;
        this.dataSource.bind("sync", onSuccessfulDataSourceDeleted);
    }

    $.each(this.$angular_scope.selectedRowPKIds.idArray(), function (index, pkid) {
        var model = editedDataGrid.dataSource.get(pkid);
        editedDataGrid.dataSource.remove(model);
    });
    return editedDataGrid.dataSource.sync();
};

kendo.ui.Grid.prototype.CancelEdit = function (clearSelection) {
    //if (this.$angular_scope.TempSelectedRowPKIds.length() > 0) {
    if (this.$angular_scope.gridCrudOptions.editMode == "form") {
        if (this.Popup.element.parent().attr("id") === this.editform.attr("id")) {
            this.Popup.wrapper.append(this.Popup.element);
            this.editform.empty();
        }
    }

    if (this.$angular_scope.gridOptions.selectableColumn.singleMode)
        if (this.dataSource.hasChanges())
            this.dataSource.cancelChanges();
    
    if (clearSelection) {
        this.selectDeselectRows(false, true, this.filteredRecords(), 0, this.filteredRecords().length);
    }


    //To Show Export button, one CRUD completed/cancelled, if showExport==true
    var selfScope = this.$angular_scope;
    if (selfScope.gridToolbarOptions.showExport && this.dataSource.total() > 0) {
        selfScope.$evalAsync(function () {
            selfScope.gridToolbarOptions.showExportOnCRUD = true;
        });
    }

    $('#' + selfScope.$root.startup.settings.current_app_errordisplay_panelId).hide();
    $('#' + selfScope.$root.startup.settings.app_errordisplay_panelId).hide();
    $('#' + selfScope.$root.startup.settings.current_app_fullerrordisplay_panelId).hide();
    $('#' + selfScope.$root.startup.settings.app_fullerrordisplay_panelId).hide();
};

kendo.ui.Grid.prototype.AddRow = function () {

    if (this.$angular_scope.AddTemplate == null)
        throw "grid add template is not defined.";

    this.CancelEdit();

    //deselect all previous selections
    this.selectDeselectRows(false, true, this.dataSource, 0, this.dataSource.length);

    var model = this.dataSource.add();

    var tr = $("tr[data-uid='" + model.uid + "']");
    tr.find(".rowSelectCheckbox").attr("disabled", true);

    this.configureEditPopup(model);
};

//put the selected rows in edit mode (this is only for Batch update *****)
//if more than 1 row is selected, then nullify the popup editor
kendo.ui.Grid.prototype.EditSelectedRows = function () {

    //if nothing selected, nothing to do
    if (!this.validateCrudProcess("edit"))
        return;

    if (this.$angular_scope.EditTemplate == null)
        throw "grid edit template is not defined.";

    this.CancelEdit();

    //getr first selected row pk id
    var uid = (this.$angular_scope.TempSelectedRowPKIds.length() > 0) ?
this.$angular_scope.TempSelectedRowPKIds.idArray()[0]
: this.$angular_scope.selectedRowPKIds.idArray()[0];

    //get model
    var model = this.dataSource.get(uid);

    if (model == undefined)
        return;

    //model has to be set to default value
    if (this.$angular_scope.TempSelectedRowPKIds.length() === 0 && this.$angular_scope.selectedRowPKIds.length() > 1) { //if multiple items being updated

        //cloning the model
        var clonedModelStruct = kendo.data.Model.define({
            id: model.idField,
            fields: model.fields
        });
        var clonedModel = new clonedModelStruct();
        clonedModel.id = model.id;


        //resetting all fields for multiple items
        /*$.each(model.fields, function (key, val) {
        if (key != model.idField) {
            //model[key] = model.defaults[key];
            clonedModel[key] = model.defaults[key];
        }
        });*/
        //clonedModel["dirty"] = true;
        model = clonedModel;
    }

    this.configureEditPopup(model);
};

kendo.ui.Grid.prototype.configureEditPopup = function (model) {
    var editedDataGrid = this;

    var op = (model.isNew()) ? "add" : "edit";

    function onSuccessfulDataSourceUpdated(e) {

        editedDataGrid.dataSource.one("requestEnd", function () { //Op 3

            editedDataGrid.CancelEdit();
            //clear selection
            editedDataGrid.$angular_scope.selectedRowPKIds.clear();
            editedDataGrid.updateSelectedRecordCount();
            //}

            var opsuccessText = (op == "add") ? ((editedDataGrid.$angular_scope.gridCrudOptions.add.successText != undefined) ? editedDataGrid.$angular_scope.gridCrudOptions.add.successText : editedDataGrid.$angular_scope.$root.msgSvc.messages.info.I005)
                : ((editedDataGrid.$angular_scope.gridCrudOptions.edit.successText != undefined) ? editedDataGrid.$angular_scope.gridCrudOptions.edit.successText : editedDataGrid.$angular_scope.$root.msgSvc.messages.info.I005);

            var jqXhr = editedDataGrid.$angular_scope.$root.startup.buildJsonResponse(opsuccessText, { type: "info", isNavigatable: false });

            editedDataGrid.$angular_scope.$root.startup.displaySystemMessageText(editedDataGrid.$angular_scope.$root.startup.parseResponse(jqXhr), "info");

            /*
            if (op == "edit") {
                var uid = editedDataGrid.$angular_scope.selectedRowPKIds.idArray()[0];

                //get model
                var model1 = editedDataGrid.dataSource.get(uid);
                if (model1 != undefined) {

                    if (editedDataGrid.$angular_scope.gridCrudOptions.editMode == "form") {
                        //if (editedDataGrid.Popup.element.parent().attr("id") === editedDataGrid.editform.attr("id")) {
                            //editedDataGrid.Popup.wrapper.append(editedDataGrid.editform.children());//editedDataGrid.Popup.element);
                            //editedDataGrid.editform.empty();
                            kendo.bind(editedDataGrid.Popup.element, model1);
                            //editedDataGrid.Popup.refresh();
                            editedDataGrid.Popup.open().center();

                            //kendo.bind($(editedDataGrid.editform.children()), model1);

                            //editedDataGrid.editform.empty();//.append(editedDataGrid.Popup.element.clone(true, true));
                            //editedDataGrid.editform.append(editedDataGrid.Popup.element.clone(true, true));
                            //kendo.bind(editedDataGrid.editform.children(), model1);
                        //}
                    }

                    //editedDataGrid.Popup.refresh();
                    
                    //kendo.bind(editedDataGrid.editform, model1);
                    //editedDataGrid.editform.append(editedDataGrid.Popup.element);
                    //model1.bind("set", onModelFieldUpdate);
                }
            }
            */
            /*

            var uid = editedDataGrid.$angular_scope.selectedRowPKIds.idArray()[0];

            //get model
            var model1 = editedDataGrid.dataSource.get(uid);
            if (model1 != undefined) {
                kendo.bind(editedDataGrid.editform, model1);
                //editedDataGrid.editform.append(editedDataGrid.Popup.element);
                //model1.bind("set", onModelFieldUpdate);
            }*/
        });

        editedDataGrid.dataSource.read();

        editedDataGrid.dataSource.unbind("sync", onSuccessfulDataSourceUpdated);

        //close popup
        editedDataGrid.Popup.close();
    }

    //Model update event handler
    function onModelFieldUpdate(e) {

        if (!e.sender.isNew()) { //if for Edit mode            
            if (editedDataGrid.$angular_scope.selectedRowPKIds.length() > 1) { //for more than 1 item edited
                $.each(editedDataGrid.$angular_scope.selectedRowPKIds.idArray(), function (index, pkid) {
                    var dataModel = editedDataGrid.dataSource.get(pkid);

                    //dataModel.set(e.field, e.value);
                    dataModel[e.field] = e.value;
                    dataModel["dirty"] = true;
                });
            }
        }
    }

    if (!IsHandlerExist(this.dataSource, 'sync', "onSuccessfulDataSourceUpdated")) {
        this.dataSource.bind("sync", onSuccessfulDataSourceUpdated);
    }

    //build edit template
    var popupeditTemplate = (op == "add") ? this.$angular_scope.AddTemplate : this.$angular_scope.EditTemplate;
    if (op == "add")
        this.Popup.title(this.$angular_scope.gridCrudOptions.add.windowTile);
    else {
        this.Popup.title(this.$angular_scope.gridCrudOptions.edit.windowTile);
    }

    //set window template
    this.Popup.setOptions
    ({
        content:
    {
        template: popupeditTemplate
    },
        height: this.$angular_scope.gridCrudOptions.height,
        width: this.$angular_scope.gridCrudOptions.width
    });
    try {
        this.Popup.refresh();
    } catch (e) {
        console.log(e);
    }

    if (!IsHandlerExist(model, 'set', "onModelFieldUpdate")) {
        model.bind("set", onModelFieldUpdate);
    }

    //bind data to window
    kendo.bind(this.Popup.element, model);
    if (model.dirty && op === "edit") model.dirty = false;

    //this.Popup.bind("close", function (e) {
    //    //debugger;
    //    $(e.sender.element).closest(".k-window-content").data("kendoWindow").Grid.dataSource.cancelChanges();
    //});

    if (this.$angular_scope.gridCrudOptions.editMode == "form") {
        this.editform.empty();
        this.editform.append(this.Popup.element);
        //this.editform.empty();
        //this.editform.append(this.Popup.element.children().clone(true, true));
        //kendo.bind(this.editform.children(), model);

        //this.resize();
    }
    else {
        //open window
        this.Popup.open().center();
    }

    //To Hide Export button, when CRUD in progress
    var selfScope = this.$angular_scope;
    if (selfScope.gridToolbarOptions.showExport) {
        selfScope.$evalAsync(function () {
            selfScope.gridToolbarOptions.showExportOnCRUD = false;
        });
    }
};

//Allows to add search criterion as a part of Filter display panel
kendo.ui.Grid.prototype.setSearchCriteriaForFilterDisplay = function (searchCriterion) {
    if (!angular.isArray(searchCriterion)) {
        throw new Error("searchCriterion has to be Array type.");
    }
    this.$angular_scope.searchCriteriaForFilterDisplay = searchCriterion;
};

kendo.ui.Grid.prototype.formattedFilterHtml = function () {
    //debugger;
    var htmlFilterCollection = [], operator = '';

    function recursiveFilterCriteriaIteration(grid, filter, operator) {
        var gridColumns = [];
        if (filter.logic != undefined)
            operator = filter.logic;

        for (var property in filter) {

            if (typeof filter[property] == "object") {
                if (filter[property] != null && (property === "filters" || !isNaN(property)))
                    recursiveFilterCriteriaIteration(grid, filter[property], operator);
            }
            else {
                if (filter.field != undefined && property === "field") {
                    //Created Column Column Collection.It contains Grouped and Ungrouped Columns
                    $.grep(grid.columns, function (e) {
                        if (e.columns != undefined) {
                            $.grep(e.columns, function (e) {
                                gridColumns.push(e);
                            });
                        }
                        gridColumns.push(e);
                    });
                    var filterColumn = $.grep(gridColumns, function (e) {
                        return (e.field === filter.field);
                    });
                    if (grid.dataSource.options.schema.model.fields[filterColumn[0].field].type === "date") {
                        htmlFilterCollection.push(filterColumn[0].title + " " +
                            //kendo.ui.FilterMenu.prototype.options.operators[grid.dataSource.options.schema.model.fields[filterColumn[0].field].type][filter.operator]
                            filter.operator
                            + " " + "<span class='k-filtertooltip'>"
                            + ((filter.value == null || filter.value === "") ? "" : "[" + kendo.toString(filter.value, "d") + "]") + "</span>");
                    } else {
                        htmlFilterCollection.push(filterColumn[0].title + " " +
                            //kendo.ui.FilterMenu.prototype.options.operators[grid.dataSource.options.schema.model.fields[filterColumn[0].field].type][filter.operator]
                            filter.operator
                            + " " + "<span class='k-filtertooltip'>"
                            + ((filter.value == null || filter.value === "") ? "" : "[" + filter.value + "]") + "</span>");
                    }
                }
            }
        }
    }

    if (this.dataSource.filter() != null)
        recursiveFilterCriteriaIteration(this, this.dataSource.filter(), operator);

    return htmlFilterCollection;
};

