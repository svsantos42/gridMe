var gridMe_data = {};

function gridMe(options) {
    gridMe_data.container = $("#" + options.containerId);
    gridMe_data.nbrColumns = options.nbrColumns;
    if (gridMe_data.container.length == 1 && gridMe_data.nbrColumns) {
        gridMe_data.whiteSpace = (options.whiteSpace ? options.whiteSpace : 10);
        gridMe_data.boxLength = Math.floor((gridMe_data.container.width() - ((gridMe_data.nbrColumns + 1) * gridMe_data.whiteSpace)) / gridMe_data.nbrColumns);
        gridMe_data.endExtra = gridMe_data.container.width() - ((gridMe_data.boxLength * gridMe_data.nbrColumns) + ((gridMe_data.nbrColumns + 1) * gridMe_data.whiteSpace));
        gridMe_data.toBeSaved = [];
        gridMe_data.originalOptions = options;
        gridMe_data.saveFunction = (typeof options.saveFunction === "function" ? options.saveFunction : gridMe_saveLayout);
        
        var grid = [...Array(1).keys()].map(i => Array(gridMe_data.nbrColumns).fill(null));
        gridMe_data.grid = grid;
        //var dict = {};
        
        gridMe_data.container.css({
            "position":"relative"
            , "height": gridMe_data.whiteSpace + (gridMe_data.whiteSpace + gridMe_data.boxLength)
        });
        gridMe_data.container.data("height", gridMe_data.whiteSpace + (gridMe_data.whiteSpace + gridMe_data.boxLength));
        gridMe_data.container.prepend(gridMe_getGridOverlay());
        
        var defaultW = (options.defaultW ? options.defaultW : 1);
        var defaultH = (options.defaultH ? options.defaultH : 1);
        var defaultZ = 1;
        
        var selector = (options.selector ? options.selector : "div");
        gridMe_data.selector = selector;
        var items = gridMe_data.container.children(selector);
        
        var x = 0, y = 0, orderNbr = 1;
        items.each(function() {
            var objectX = ($.isNumeric($(this).data("x")) ? parseInt($(this).data("x")) : x);
            var objectY = ($.isNumeric($(this).data("y")) ? parseInt($(this).data("y")) : y);
            var objectW = ($.isNumeric($(this).data("w")) ? parseInt($(this).data("w")) : defaultW);
            var objectH = ($.isNumeric($(this).data("h")) ? parseInt($(this).data("h")) : defaultH);
            var objectZ = ($.isNumeric($(this).data("z")) ? parseInt($(this).data("z")) : defaultZ);
            
            if (objectX + objectW > gridMe_data.nbrColumns) {
                objectX = 0;
                x = 0;
                objectY += defaultH;
                y += defaultH;
            }
            
            for (var i = objectX, j = objectY; (j - objectY) < objectH; i++) { // fill grid
                if ((i - objectX) == objectW) {
                    i = objectX;
                    j++;
                    if ((j - objectY) == objectH) {
                        break;
                    }
                }

                while (typeof gridMe_data.grid[j] == "undefined") {
                    gridMe_addRowToGrid();
                }

                gridMe_data.grid[j][i] = $(this);
            }
            
            $(this).data({
                "x": objectX
                , "y": objectY
                , "w": objectW
                , "h": objectH
                , "orderNbr": orderNbr
                , "z": objectZ
            });
            
            orderNbr++;
            $(this).css({
                "position": "absolute"
                , "padding": "0px"
                , "z-index": $(this).data("z")
            });
            gridMe_sizeAndPosition($(this));
            
            $(this).prepend(gridMe_getHandlesHTML());
            $(this).addClass("gridMe_gridItem");
            
            x += objectW;
            if (x >= gridMe_data.nbrColumns) {
                x = 0;
                y += objectH;
            }
        });
        
        $(window).on("resize", function() {
            gridMe_resize();
        });
        
        // this helps fix issue where mousedown event isn't triggered if it occurs outside of the window
        gridMe_data.mouseDownCount = 0;
        document.onmousedown = function() { gridMe_data.mouseDownCount++; };
        document.onmouseup = function() { gridMe_data.mouseDownCount--; };
    }
}

function gridMe_resize() {
    gridMe_data.boxLength = Math.floor((gridMe_data.container.width() - (gridMe_data.nbrColumns * gridMe_data.whiteSpace) - gridMe_data.whiteSpace) / gridMe_data.nbrColumns);
    gridMe_data.endExtra = gridMe_data.container.width() - ((gridMe_data.boxLength * gridMe_data.nbrColumns) + ((gridMe_data.nbrColumns + 1) * gridMe_data.whiteSpace));
    gridMe_data.container.children(gridMe_data.selector).each(function() {
        gridMe_sizeAndPosition($(this));
    });
    $("#gridMe_gridOverlay").remove();
    gridMe_data.container.prepend(gridMe_getGridOverlay());
}

function gridMe_sizeAndPosition(object) {
    var boxLength = gridMe_data.boxLength;
    var whiteSpace = gridMe_data.whiteSpace;
    var x = object.data("x"), y = object.data("y"), w = object.data("w"), h = object.data("h");
    var width = (boxLength * w) + (whiteSpace * w) - whiteSpace;
    var height = (boxLength * h) + (whiteSpace * h) - whiteSpace;
    
    if (x + w === gridMe_data.nbrColumns) {
        width += gridMe_data.endExtra;
    }
    
    if (width !== parseInt(object.css("width")) || height !== parseInt(object.css("height"))) {
        if (typeof object.data("gridresizecallback") !== "undefined") {
            if (typeof window[object.data("gridresizecallback")] === "function") {
                window[object.data("gridresizecallback")](object, width, height);
            }
        }
    }
    
    object.css({
        "top": whiteSpace + (whiteSpace * y) + (boxLength * y)
        , "left": whiteSpace + (whiteSpace * x) + (boxLength * x)
        , "width": width
        , "height": height
        , "z-index": object.data("z")
    });
    object.attr("z-index", object.data("z"));
}

function gridMe_getHandlesHTML() {
    var html = "";
    html += "<div class='gridMe_topContainer'>" +
                "<span class='gridMe_dots'>&#8226; &#8226; &#8226;</span>" + 
                "<div class='gridMe_topContainerClickable' onmousedown='gridMe_onMouseDown(event, this);'></div>" +
                "<span class='gridMe_settings linklike' onmousedown='gridMe_showSettings(this);'>Settings</span>" +
                "<div class='gridMe_settingsDialog' style='display:none;'></div>" + 
            "</div>";
    html += "<div class='gridMe_leftResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"l\");'></div>";
    html += "<div class='gridMe_rightResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"r\");'></div>";
    html += "<div class='gridMe_bottomResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"b\");'></div>";
    html += "<div class='gridMe_topLeftResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"tl\");'></div>";
    html += "<div class='gridMe_topRightResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"tr\");'></div>";
    html += "<div class='gridMe_bottomLeftResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"bl\");'></div>";
    html += "<div class='gridMe_bottomRightResizeBar' onmousedown='gridMe_onMouseDownResize(event, this, \"br\");'></div>";
    return html;
}

function gridMe_getGridOverlay() {
    var grid = gridMe_data.grid;
    var html = "<div id='gridMe_gridOverlay' style='display:none;'>";
    var top = 0, left = 0;
    for (var i = 0; i <= grid.length; i++) {
        var height = gridMe_data.boxLength + gridMe_data.whiteSpace + (i == 0 || i == grid.length - 1 ? gridMe_data.whiteSpace / 2 : 0);
        for (var j = 0; j < grid[0].length; j++) {
            var width = gridMe_data.boxLength + gridMe_data.whiteSpace + (j == 0 || j == grid[0].length - 1 ? gridMe_data.whiteSpace / 2 : 0);
            if (j === gridMe_data.nbrColumns - 1) {
                width += gridMe_data.endExtra;
            }
            var last = (i == grid.length ? " row='last' " : "");
            html += "<div x='" + j + "' y='" + i + "'" + last + "style='top:" + top + "px; left:" + left + "px; width:" + width + "px; height:" + height + "px;'></div>";
            left += width;
        }
        top += height;
        left = 0;
    }
    html += "</div>";
    
    gridMe_data.gridOverlay = {
        nextTop: top
    };
    
    return html;
}

function gridMe_addRowToGrid() {
    var prevLength = gridMe_data.grid.length;
    var height = gridMe_data.container.data("height");
    gridMe_data.container.css("height", height + gridMe_data.whiteSpace + gridMe_data.boxLength);
    gridMe_data.container.data("height", height + gridMe_data.whiteSpace + gridMe_data.boxLength);
    gridMe_data.grid = gridMe_data.grid.concat([...Array(1).keys()].map(i => Array(gridMe_data.nbrColumns).fill(null)));
    
    var top = gridMe_data.gridOverlay.nextTop;
    var left = 0;
    var height = gridMe_data.boxLength + gridMe_data.whiteSpace + (gridMe_data.whiteSpace / 2);
    if (prevLength > 1) {
        top -= gridMe_data.whiteSpace / 2;
    }
    
    var overlay = $("#gridMe_gridOverlay");
    overlay.children("div[y='" + prevLength + "']")
        .removeAttr("row")
        .css({
            top: top - (height - (gridMe_data.whiteSpace / 2))
            , height: gridMe_data.boxLength + gridMe_data.whiteSpace
        });
    
    for (var i = 0; i < gridMe_data.grid[0].length; i++) {
        var width = gridMe_data.boxLength + gridMe_data.whiteSpace + (i == 0 || i == gridMe_data.grid[0].length - 1 ? gridMe_data.whiteSpace / 2 : 0);
        if (i === gridMe_data.nbrColumns - 1) {
            width += gridMe_data.endExtra;
        }
        overlay.append("<div x='" + i + "' y='" + (prevLength + 1) + "' row='last' style='top:" + top + "px; left:" + left + "px; width:" + width + "px; height:" + height + "px;'></div>");
        left += width;
    }
    gridMe_data.gridOverlay.nextTop = top + height;
}

function gridMe_onMouseDown(event, obj) {
    var object = $(obj).parents(gridMe_data.selector).eq(0);
    if (object.data("x") + object.data("w") === gridMe_data.nbrColumns) {
        object.css("width", parseInt(object.css("width")) - gridMe_data.endExtra);
    }
    
    gridMe_data.mouseDown = {
        object: object
        , mouseStartX: event.pageX
        , mouseStartY: event.pageY
        , objStartTop: parseInt(object.css("top"))
        , objStartLeft: parseInt(object.css("left"))
        , objStartX: object.data("x")
        , objStartY: object.data("y")
        , parentOffsetX: gridMe_data.container.offset().left
        , parentOffsetY: gridMe_data.container.offset().top
    };
    
    object.addClass("gridMe_dragItem");
    $("body").on("mousemove", gridMe_onMouseMove);
    $("body").on("mouseup", gridMe_onMouseUp);
    $("body").addClass("gridMe_noSelect");
    $("#gridMe_gridOverlay").show();
}

function gridMe_onMouseMove(event) {
    if (gridMe_data.mouseDownCount === 0) {
        gridMe_onMouseUp(event);
        return;
    }
    
    var newTop = event.pageY - gridMe_data.mouseDown.parentOffsetY - 10;
    var newLeft = event.pageX - gridMe_data.mouseDown.parentOffsetX - 20;
    gridMe_data.mouseDown.object.css({
        "top": newTop
        , "left": newLeft
    });
    
    if (gridMe_isMouseInContainer(event)) {
        var box = gridMe_getBoxLocationFromMouse(event);
        gridMe_data.mouseDown.object.data({
            x: box.x
            , y: box.y
        });
        
        $("#gridMe_gridOverlay div").removeClass("highlighted");
        for (var x = box.x; x < box.x + gridMe_data.mouseDown.object.data("w"); x++) {
            for (var y = box.y; y < box.y + gridMe_data.mouseDown.object.data("h"); y++) {
                $("#gridMe_gridOverlay div[x='" + x + "'][y='" + y + "']").addClass("highlighted");
            }
        }
    } else {
        $("#gridMe_gridOverlay div").removeClass("highlighted");
    }
}

function gridMe_onMouseUp(event) {
    var object = gridMe_data.mouseDown.object;
    if (object.data("x") !== gridMe_data.mouseDown.objStartX || object.data("y") !== gridMe_data.mouseDown.objStartY) {
        var newX = object.data("x");
        while (newX + object.data("w") > gridMe_data.nbrColumns) {
            newX--;
        }
        object.data({x: newX});

        while (typeof gridMe_data.grid[object.data("y") + object.data("h") - 1] == "undefined") {
            gridMe_addRowToGrid();
        }

        gridMe_data.grid[object.data("y")][object.data("x")] = object;
        gridMe_addToBeSaved(object);
        gridMe_save();
    }
    
    gridMe_moveToTop(object); // calls sizeAndPosition
    
    object.removeClass("gridMe_dragItem");
    $("body").off("mousemove", gridMe_onMouseMove);
    $("body").off("mouseup", gridMe_onMouseUp);
    $("body").removeClass("gridMe_noSelect");
    $("#gridMe_gridOverlay").hide();
    $("#gridMe_gridOverlay div").removeClass("highlighted");
    delete gridMe_data.mouseDown;
}

function gridMe_isMouseInContainer(event) {
    var position = gridMe_data.container.offset();
    var containerWidth = gridMe_data.container.width();
    var containerHeight = gridMe_data.container.height();
    if ((event.pageX > position.left && event.pageX < position.left + containerWidth) || (event.pageY > position.top && event.pageY < position.top + containerHeight)) {
        return true;
    }
    return false;
}

function gridMe_getBoxLocationFromMouse(event) {
    var position = gridMe_data.container.offset();
    var x = 0;
    var rightBorder = position.left + gridMe_data.whiteSpace / 2;
    for (var i = 0; i < gridMe_data.nbrColumns; i++) {
        rightBorder += gridMe_data.boxLength + gridMe_data.whiteSpace;
        if (event.pageX < rightBorder) {
            break;
        }
        x++;
    }

    var y = 0;
    var bottomBorder = position.top + gridMe_data.whiteSpace / 2;
    for (var i = 0; i < gridMe_data.grid.length; i++) {
        bottomBorder += gridMe_data.boxLength + gridMe_data.whiteSpace;
        if (event.pageY < bottomBorder) {
            break;
        }
        y++;
    }
    
    return {x: x, y: y};
}

function gridMe_onMouseDownResize(event, obj, direction) {
    var object = $(obj.parentElement);
    gridMe_data.mouseDownResize = {
        object: object
        , mouseStartX: event.pageX
        , mouseStartY: event.pageY
        , objStartTop: parseInt(object.css("top"))
        , objStartLeft: parseInt(object.css("left"))
        , objStartWidth: object.width()
        , objStartHeight: object.height()
        , direction: direction
        , objStartX: object.data("x")
        , objStartY: object.data("y")
        , objStartW: object.data("w")
        , objStartH: object.data("h")
    };
    object.addClass("gridMe_dragItem");
    $("body").on("mousemove", gridMe_onMouseMoveResize);
    $("body").on("mouseup", gridMe_onMouseUpResize);
    $("body").addClass("gridMe_noSelect");
    $("#gridMe_gridOverlay").show();
}

function gridMe_onMouseMoveResize(event) {
    if (gridMe_data.mouseDownCount === 0) {
        gridMe_onMouseUpResize(event);
        return;
    }
    
    var changeX = event.pageX - gridMe_data.mouseDownResize.mouseStartX;
    var changeY = event.pageY - gridMe_data.mouseDownResize.mouseStartY;
    var object = gridMe_data.mouseDownResize.object;
    
    if (gridMe_isMouseInContainer(event)) {
        var box = gridMe_getBoxLocationFromMouse(event);
    
        switch (gridMe_data.mouseDownResize.direction) {
            case "l": // left
                object.css({
                    top: object.css("top")
                    , left: gridMe_data.mouseDownResize.objStartLeft + changeX
                    , width: gridMe_data.mouseDownResize.objStartWidth - changeX
                    , height: object.css("height")
                });
                
                object.data({
                    x: box.x
                    , w: object.data("w") + (object.data("x") - box.x)
                });
                break;
            case "r": // right
                object.css({
                    top: object.css("top")
                    , left: object.css("left")
                    , width: gridMe_data.mouseDownResize.objStartWidth + changeX
                    , height: object.css("height")
                });
                
                object.data({
                    w: object.data("w") + (box.x - (object.data("x") + object.data("w") - 1))
                });
                break;
            case "b": // bottom
                object.css({
                    top: object.css("top")
                    , left: object.css("left")
                    , width: object.css("width")
                    , height: gridMe_data.mouseDownResize.objStartHeight + changeY
                });
                
                object.data({
                    h: object.data("h") + (box.y - (object.data("y") + object.data("h") - 1))
                });
                break;
            case "bl": // bottom left
                object.css({
                    top: object.css("top")
                    , left: gridMe_data.mouseDownResize.objStartLeft + changeX
                    , width: gridMe_data.mouseDownResize.objStartWidth - changeX
                    , height: gridMe_data.mouseDownResize.objStartHeight + changeY
                });
                
                object.data({
                    x: box.x
                    , w: object.data("w") + (object.data("x") - box.x)
                    , h: object.data("h") + (box.y - (object.data("y") + object.data("h") - 1))
                });
                break;
            case "br": // bottom right
                object.css({
                    top: object.css("top")
                    , left: object.css("left")
                    , width: gridMe_data.mouseDownResize.objStartWidth + changeX
                    , height: gridMe_data.mouseDownResize.objStartHeight + changeY
                });
                
                object.data({
                    w: object.data("w") + (box.x - (object.data("x") + object.data("w") - 1))
                    , h: object.data("h") + (box.y - (object.data("y") + object.data("h") - 1))
                });
                break;
            case "tl": // top left
                object.css({
                    top: gridMe_data.mouseDownResize.objStartTop + changeY
                    , left: gridMe_data.mouseDownResize.objStartLeft + changeX
                    , width: gridMe_data.mouseDownResize.objStartWidth - changeX
                    , height: gridMe_data.mouseDownResize.objStartHeight - changeY
                });
                
                object.data({
                    x: box.x
                    , y: box.y
                    , w: object.data("w") + (object.data("x") - box.x)
                    , h: object.data("h") + (object.data("y") - box.y)
                });
                break;
            case "tr": // top right
                object.css({
                    top: gridMe_data.mouseDownResize.objStartTop + changeY
                    , left: object.css("left")
                    , width: gridMe_data.mouseDownResize.objStartWidth + changeX
                    , height: gridMe_data.mouseDownResize.objStartHeight - changeY
                });
                
                object.data({
                    y: box.y
                    , w: object.data("w") + (box.x - (object.data("x") + object.data("w") - 1))
                    , h: object.data("h") + (object.data("y") - box.y)
                });
                break;
        }
        
        $("#gridMe_gridOverlay div").removeClass("highlighted");
        for (var x = object.data("x"); x < object.data("x") + object.data("w"); x++) {
            for (var y = object.data("y"); y < object.data("y") + object.data("h"); y++) {
                $("#gridMe_gridOverlay div[x='" + x + "'][y='" + y + "']").addClass("highlighted");
            }
        }
    } else {
        $("#gridMe_gridOverlay div").removeClass("highlighted");
    }
}

function gridMe_onMouseUpResize(event) {
    var object = gridMe_data.mouseDownResize.object;
    if (parseInt(object.css("width")) === 0) {
        object.data({
            x: gridMe_data.mouseDownResize.objStartX
            , w: gridMe_data.mouseDownResize.objStartW
        });
    }
    if (parseInt(object.css("height")) === 0) {
        object.data({
            y: gridMe_data.mouseDownResize.objStartY
            , h: gridMe_data.mouseDownResize.objStartH
        });
    }
    
    var newW = object.data("w");
    while (newW + object.data("x") > gridMe_data.nbrColumns) {
        newW--;
    }
    object.data({w: newW});
    
    while (typeof gridMe_data.grid[object.data("y") + object.data("h") - 1] == "undefined") {
        gridMe_addRowToGrid();
    }
    
    gridMe_moveToTop(object); // calls sizeAndPosition
    gridMe_data.grid[object.data("y")][object.data("x")] = object;
    gridMe_addToBeSaved(object);
    gridMe_save();
    
    object.removeClass("gridMe_dragItem");
    $("body").off("mousemove", gridMe_onMouseMoveResize);
    $("body").off("mouseup", gridMe_onMouseUpResize);
    $("body").removeClass("gridMe_noSelect");
    $("#gridMe_gridOverlay").hide();
    $("#gridMe_gridOverlay div").removeClass("highlighted");
    delete gridMe_data.mouseDownResize;
}

function gridMe_save() {
    gridMe_data.saveFunction(gridMe_data.toBeSaved);
}

function gridMe_saveLayout(toBeSaved) {
    var saveData = [];
    if (toBeSaved.length > 0) {
        while (toBeSaved.length > 0) {
            var nextObject = toBeSaved.pop();
            saveData.push({
                x: nextObject.data("x")
                , y: nextObject.data("y")
                , w: nextObject.data("w")
                , h: nextObject.data("h")
                , z: nextObject.data("z")
                , orderNbr: nextObject.data("orderNbr")
                , id: nextObject.attr("ccsfid")
            });
        }
        //console.log(saveData);
        console.log("gridMe_saveLayout");
        var params = {
            saveData: saveData
        };

        /*var url = "report266Process.php?";
        var args = "action=" + encodeURIComponent('savedashboardlayout');
        args += "&params=" + encodeURIComponent(JSON.stringify(params));

        $.ajax({
            url: url
            , data: args
            , type: "POST"
            , success: function (result) {
                var results = JSON.parse(result);
                if (!results.result) {
                    console.log("there was an error saving the layout");
                }
            }
        });*/
    }
}

function gridMe_showSettings(obj) {
    var object = $(obj).parents(gridMe_data.selector).eq(0);
    var html = "";
    html += "<table><tbody>";
    html += "<tr><th>Width:</th><td><select id='gridMe_sizeWidth'>";
    for (var i = 1; i <= gridMe_data.nbrColumns; i++) {
        var selected = (object.data("w") == i ? " selected='selected' " : "");
        html += "<option value='" + i + "'" + selected + ">" + i + "</option>";
    }
    html += "</select></td></tr>" +
            "<tr><th>Height:</th><td><select id='gridMe_sizeHeight'>";
    for (var i = 1; i <= gridMe_data.nbrColumns; i++) {
        var selected = (object.data("h") == i ? " selected='selected' " : "");
        html += "<option value='" + i + "'" + selected + ">" + i + "</option>";
    }
    html += "</select></td></tr>";
    html += "<tr><th></th><td>" +
                "<input type='checkbox' id='gridMe_settingsMoveToTop' onclick='gridMe_settingsMoveCheckbox(this);' /> Move to top <br/>" +
                "<input type='checkbox' id='gridMe_settingsMoveToBottom' onclick='gridMe_settingsMoveCheckbox(this);' /> Move to bottom" +
            "</td></tr>";
    html += "<tr><th></th><td>" +
                "<input type='button' onclick='gridMe_saveSettingsFromDialog();' value='Save' style='float:right;'/>" +
            "</td></tr>";
    html += "</tbody></table>";
    
    gridMe_data.settingsObject = object.siblings(".gridMe_settingsDialog").eq(0);
    gridMe_data.settingsObject.dialog({
        autoOpen: true,
        height: 200,
        width: 300,
        modal: false,
        title: ("Settings"),
        show: {
            effect: "clip",
            duration: 500
        },
        hide: {
            effect: "clip",
            duration: 500
        },
        open: function() {
            gridMe_data.settingsObject.html(html);
            gridMe_data.settingsObject.data("object", object);
            $(".gridMe_topContainer").css("display", "none");
        },
        close: function() {
            gridMe_data.settingsObject.html("");
            gridMe_data.settingsObject.dialog("destroy");
            delete gridMe_data.settingsObject;
            $(".gridMe_topContainer").css("display", "");
        }
    });
}

function gridMe_settingsMoveCheckbox(obj) {
    var object = $(obj);
    if (object.prop("checked") && object.attr("id") == "gridMe_settingsMoveToTop") {
        $("#gridMe_settingsMoveToBottom").prop("checked", false);
    } else if (object.prop("checked") && object.attr("id") == "gridMe_settingsMoveToBottom") {
        $("#gridMe_settingsMoveToTop").prop("checked", false);
    }
}

function gridMe_saveSettingsFromDialog() {
    var object = gridMe_data.settingsObject.data("object");
    object.data({
        w: parseInt($("#gridMe_sizeWidth option:selected").val())
        , h: parseInt($("#gridMe_sizeHeight option:selected").val())
    });
    
    var siblings = object.siblings(gridMe_data.selector);
    if ($("#gridMe_settingsMoveToTop").prop("checked")) {
        gridMe_moveToTop(object);
    } else if ($("#gridMe_settingsMoveToBottom").prop("checked")) {
        gridMe_moveToBottom(object);
    }
    
    while (typeof gridMe_data.grid[object.data("y") + object.data("h") - 1] == "undefined") {
        gridMe_addRowToGrid();
    }
    
    gridMe_data.settingsObject.dialog("close");
    gridMe_save();
}

function gridMe_moveToTop(object) {
    var nbrChildren = gridMe_data.container.children(gridMe_data.selector).length;
    var startZ = object.data("z");
    
    for (var i = startZ; i <= nbrChildren; i++) {
        gridMe_data.container.children(gridMe_data.selector + "[z-index='" + i + "']").each(function() {
            if ($(this).data("z") > 1) {
                $(this).data("z", i - 1);
                gridMe_sizeAndPosition($(this));
                gridMe_addToBeSaved($(this));
            }
        });
    }
    
    object.data("z", nbrChildren);
    gridMe_sizeAndPosition(object);
    gridMe_addToBeSaved(object);
}

function gridMe_moveToBottom(object) {
    var siblings = object.siblings(gridMe_data.selector);
    object.data("z", 1);
    siblings.each(function() {
        if ($(this).data("z") < siblings.length + 1) {
            $(this).data("z", $(this).data("z") + 1);
            gridMe_sizeAndPosition($(this));
            gridMe_addToBeSaved($(this));
        }
    });
    gridMe_sizeAndPosition(object);
    gridMe_addToBeSaved(object);
}

function gridMe_addToBeSaved(object) {
    for (var i = 0; i < gridMe_data.toBeSaved; i++) {
        if (gridMe_data.toBeSaved[i].is(object)) {
            return;
        }
    }
    gridMe_data.toBeSaved.push(object);
}

function gridMe_isGreaterThan(a, b) {
    if (a.y == b.y) {
        if (a.x >= b.x) {
            return true;
        } else {
            return false;
        }
    } else if (a.y > b.y) {
        return true;
    } else {
        return false;
    }
}

function gridMe_addOne(loc) {
    if (loc.x + 1 < gridMe_data.nbrColumns) {
        return {x: loc.x + 1, y: loc.y};
    } else {
        return {x: 0, y: loc.y + 1};
    }
}

function gridMe_subOne(loc) {
    if (loc.x == 0) {
        if (loc.y == 0) {
            return {x: 0, y: 0};
        } else {
            return {x: gridMe_data.nbrColumns - 1, y: loc.y - 1};
        }
    } else {
        return {x: loc.x - 1, y: loc.y};
    }
}

function gridMe_isEqual(a, b) {
    if (a.x == b.x && a.y == b.y) {
        return true;
    } else {
        return false;
    }
}

// -------------------------------------------------------------------------------------------------
// --- Common Resize Callback Functions ------------------------------------------------------------

function gridMe_resizeChartCallback(object, width, height) {
    var chart = object.data("chart");
    var data = object.data("data");
    var options = object.data("options");
    options.width = width;
    options.height = height;
    
    chart.draw(data, options);
}