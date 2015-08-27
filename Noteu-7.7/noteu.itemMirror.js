 /*2013/06/10
 * Dropbox.min 0.9.1
 * jQuery.min  1.9.1
 * ItemMirror.min 0.7.1
   doc & url: //googledrive.com/host/0B147HlW6g510cDdfeFJWM1MwTHM/0.7.1/ItemMirror.min.js
*/

"use strict";

(function() {
    function ItemMirrorfn(){
        /* declare function object*/
        var newObj = new Object();
        /*declare variables*/
        var dropboxItemUtility,
            dropboxXooMLUtility,
            dropboxClient,
            rootPath = "/",
            rootFolder = "",
            rootItemMirror = "",
            namespaceURI = "http://noteU";

            // Create DropboxClient
            dropboxClient = new Dropbox.Client({
                key: "lIIemIURNrA=|JZxk4BbHQ6384pHW77rSHyOb44koORg73AKQQ4kd9w==",
                sandbox: true
            });
            dropboxClient.authDriver(new Dropbox.Drivers.Redirect({
                rememberUser: true
            }));

            // Create options for XooMLU and ItemU
            dropboxXooMLUtility = {
                driverURI: "DropboxXooMLUtility",
                dropboxClient: dropboxClient,
            };
            dropboxItemUtility = {
                driverURI: "DropboxItemUtility",
                dropboxClient: dropboxClient
            };
        /* declare hash map object*/
        var MapItemMirror = new Object();
        /*-------------------function--start--from--here-------------------------------*/
        //refresh itemMirror
        /*
        function refreshLoop(itemMirror, callback) {
          setTimeout(function () {
            itemMirror.refresh( function (error){
                if (error) { throw error };
                itemMirror.sync(function (error){
                    if (error) { throw error};
                });
            });
          }, 100000);
          return callback(itemMirror);
        }
        */
        /* get parent itemMirror*/
        function getItemMirror(GUID, callback){
            //store in Map
            if (MapItemMirror.hasOwnProperty(GUID)) {
                var itemMirror = MapItemMirror[GUID];
                itemMirror.sync(function (error){
                    if (error) { throw error};
                    delete MapItemMirror[GUID];
                    MapItemMirror[GUID] = itemMirror;

                    return callback(MapItemMirror[GUID]); //itemMirror
                });
            }else{
                return callback(null);
            };
        }
        /* loading all itemMirror*/
        function initialItemMirror(dirpath, callback){
            //create an ItemMirror
            var itemMirrorOptions = { 
                groupingItemURI: dirpath, 
                xooMLDriver: dropboxXooMLUtility,
                itemDriver: dropboxItemUtility,
                syncDriver: {
                    utilityURI: "MirrorSyncUtility"
                },
                readIfExists: true
            };

            require(["ItemMirror"], function (ItemMirror){
                dropboxClient.authenticate(function (error, client){
                    if (error) { throw error; };
                    new ItemMirror(itemMirrorOptions, function (error, itemMirrorCase){
                        if (error) { //throw error;
                            //refreshLoop(itemMirrorCase, function (itemMirror){
                                //return callback(error, itemMirror); //itemMirror
                            //});
                            callback(error, itemMirrorCase); 
                        };
                        callback(error, itemMirrorCase);
                    });
                });
            });
        }
        /* create itemMirror from grouping item association*/
        function createItemMirror(itemMirrorCase, GUID, callback){
            itemMirrorCase.createItemMirrorForAssociatedGroupingItem( GUID,  function (error, newitemMirrorCase ) {
                if (error) { throw error};
                //newitemMirrorCase.sync(function (error){
                    return callback(newitemMirrorCase);
                //});
            });
        }
        /*get username from dropbox client*/
        function getUserName(callback){
            dropboxClient.authenticate(function (error, client) {
                if (error) { throw error; }
                //null is options setting for dropbox getUserInfo funtion
                client.getUserInfo(null, function (error, userInfo, userOptions){
                    var username = userInfo.name;
                    var useremail = userInfo.email;
                    callback(username, useremail);
                    //console.log(username);
                });
            });
        }
        /* loop */
        function loopTask(GUIDs, index, itemMirrorCase, color, path, callback){
            if (index > GUIDs.length -1  || GUIDs.length == 0) {
                return callback();
            };

            var _GUID = GUIDs[index];

            var _displayText = "";
            itemMirrorCase.getAssociationDisplayText( _GUID,  function (error , displayText) {
                if(error) { console.log('1: '+ error); throw error; }
                _displayText = displayText;
            });

            var _dueDate = "";
            itemMirrorCase.getAssociationNamespaceAttribute("dueDate", _GUID, namespaceURI, function (error, namespacedata){
                if(error) { console.log('2: '+ error); throw error; }
                _dueDate = namespacedata;
            });

            var _doORac = "";
            itemMirrorCase.getAssociationNamespaceAttribute("doORac", _GUID, namespaceURI, function (error, namespacedata){
                if(error) { console.log('3: '+ error); throw error; }
                _doORac = namespacedata;
            });

            var _localItem = "";
            itemMirrorCase.getAssociationLocalItem( _GUID,  function (error, localItem) {
                if (error) { console.log('4: '+ error); throw error};
                _localItem = localItem;
            });

            var _associationItem = "";
            checkisGrouping(itemMirrorCase, GUIDs[index], function (flag) {
                if (flag == false) {
                    if ( _localItem == '') {
                        
                        itemMirrorCase.getAssociationAssociatedItem(GUIDs[index],  function (error , associationItem){
                            if (error) { throw error};
                            
                             _associationItem = associationItem;
                            if (associationItem == '' || typeof associationItem === "undefined") {
                                //fake txt
                                uiTaskAssembly( _GUID, _displayText, _dueDate, _doORac, '', '');
                            }else{
                                //fake url
                                uiTaskAssembly( _GUID, _displayText, _dueDate, _doORac, _associationItem, "url");
                            };
                            uichangecolor(color);
                        });
                        
                    }else{
                        var fileStr = _localItem.split('.');
                        var fileType = fileStr[fileStr.length-1];
                        if (fileType == 'url') {
                            //real url;
                            getFileUR(path + _localItem + '/', _GUID, function ( realURL ){
                                _associationItem = realURL;
                                uiTaskAssembly( _GUID, _displayText, _dueDate, _doORac, _associationItem, 'url');
                                uichangecolor(color);
                            });
                        }else{
                            //real file
                            getURL(path + _localItem + '/', _GUID, function ( publicURL ){
                                _associationItem = publicURL;
                                uiTaskAssembly( _GUID, _displayText, _dueDate, _doORac, _associationItem, 'file');
                                uichangecolor(color);
                            });
                        };
                    };

                    loopTask(GUIDs, index += 1, itemMirrorCase, color, path, callback);
                } else {

                    uiTaskAssembly( _GUID, _displayText, _dueDate, _doORac, '', 'folder');
                    uichangecolor(color);
                    
                    loopTask(GUIDs, index += 1, itemMirrorCase, color, path, callback);
                }
            });
        }
        /*load checklist information*/
        function loadTask(title, GUID, color, path){
            if (GUID == null || typeof GUID === undefined || GUID == '') {
                rootItemMirror.listAssociations(function (error, GUIDs){
                    uiRemove();
                    uiChecklistAssembly(GUID, title);
                    uichangecolor(color);
                    $("#paper").show();
                    if(GUIDs.length == 0){
                        //$("#paper").show();
                    }else{
                        loopTask(GUIDs, 0 , rootItemMirror, color, path, function(){
                            //$("#paper").show();
                        });
                    };
                });
            }else{
                getItemMirror( GUID, function (itemMirrorCase){
                    createItemMirror(itemMirrorCase, GUID, function ( newitemMirrorCase){
                        newitemMirrorCase.listAssociations(function (error, GUIDs){
                            uiRemove();
                            uiChecklistAssembly(GUID, title);
                            uichangecolor(color);
                            $("#paper").show();
                            if(GUIDs.length == 0){
                                //$("#paper").show();
                            }else{
                                loopTask(GUIDs, 0 , newitemMirrorCase, color, path, function(){
                                    //$("#paper").show();
                                });
                            };
                        });
                    });
                });  
            };
        }
        /* get file.url from Dropbox website*/
        function getFileUR(path, GUID, callback){
             dropboxClient.authenticate(function (error, client){
                if (error) { throw error; };
                client.readFile(path, null, function (error, content, sta, fileRange){
                    var fileArray = content.split('\r\n');
                    $(fileArray).each( function (key, value){
                        if(value != '' && value.search('URL=') != -1){
                            return callback($.trim(value.replace('URL=', '')));
                        };
                    });
                    //return callback('');
                });
            });
        }
        /* get download url from Dropbox website*/
        function getURL(path, GUID, callback){
            dropboxClient.authenticate(function (error, client){
                if (error) { throw error; };
                client.makeUrl(path, null, function (error, publicURL){
                    return callback(publicURL.url);
                });
            });
        }
        /* get folder path*/
        function getuiPath(GUID, path, callback){
            if($('#' + GUID).hasClass('notes')){
                 return callback(path);
            }else{
                var parentGUID = $('#' + GUID).parent('ol').attr('id');
                path =  $('#' + parentGUID).attr('title') + '/' + path;
                getuiPath(parentGUID, path, function ( finalPath){
                    return callback(finalPath);
                });
            }

        }
        /* check is grouping item or not*/
        function checkisGrouping(itemMirrorCase, GUID, callback){
            itemMirrorCase.isAssociatedItemGrouping( GUID, function (error, isGroupingItem) {
                if(error) { console.log(error); return callback(false); }//throw error; 
                return callback(isGroupingItem);
            });
        }
        /* get localItem from association*/
        //callback(localItem)
        function getLocalItem(itemMirrorCase, GUID, callback){
            itemMirrorCase.getAssociationLocalItem( GUID,  function (error, localItem) {
                if (error) { throw error};
                return callback(localItem);
            });
        }
        /* get association attr*/
        function getAssociationAttr(itemMirrorCase, attrName, GUID, callback){
            itemMirrorCase.getAssociationNamespaceAttribute(attrName, GUID, namespaceURI, function (error, attrValue ) {
                //console.log('get association error: ' + error);
                if(error) { throw error; }
                callback(attrValue);
            });
        }
        /* set association attr*/
        function setAssociationAttr(itemMirrorCase, attrName, attrValue, GUID){
            itemMirrorCase.setAssociationNamespaceAttribute(attrName, attrValue.toString() , GUID, namespaceURI, function (error){
                //console.log('set association error: ' + error);
                if (error) {throw error; };
            });
        }
        /* set attr into association*/
        function setAttributeValue(parentGUID, attrName, attrValue, level, GUID){
            getItemMirror(parentGUID, function (itemMirrorCase){
                switch(level){
                    case ("association"):
                        setAssociationAttr(itemMirrorCase, attrName, attrValue, parentGUID); 
                        break;
                    case ("next"):
                        createItemMirror(itemMirrorCase, parentGUID, function (newitemMirrorCase) {
                            setAssociationAttr(newitemMirrorCase, attrName, attrValue, GUID);
                        });
                    case ("fragement"):
                        rootItemMirror.setFragmentNamespaceAttribute(attrName, attrValue, namespaceURI, function ( error ){
                            if (error) { throw error};
                        });
                    default:
                        break;
                }
            });
        }
        /*create new task: create an association, set associationnamespacedata dueDate, done or active*/
        function createTask(GUID, inputtext, dueDate, doORac, color){
            getItemMirror(GUID, function (itemMirrorCase){
                 createItemMirror(itemMirrorCase, GUID, function (newitemMirrorCase){
                    newitemMirrorCase.createAssociation({
                        "displayText": inputtext,
                    }, function (error, newGUID) {
                        uiTaskAssembly(newGUID, inputtext, dueDate, "true", '', '');
                        uichangecolor(color);
                        
                        //set association name space data
                        setAssociationAttr(newitemMirrorCase, "dueDate", dueDate.toString(), newGUID);
                        setAssociationAttr(newitemMirrorCase, "doORac", doORac.toString(), newGUID);
                    });
                 });
            });
        }
        /* delete task and association */
        function deleteTask(parentGUID, GUID){
            getItemMirror(parentGUID, function (itemMirrorCase){
                createItemMirror(itemMirrorCase, parentGUID, function (newitemMirrorCase){
                    newitemMirrorCase.deleteAssociation( GUID , function (error) {
                        if (error) { throw error; };
                    });
                });
            });
        }
        function createAssociationCase3(itemMirrorCase, parentGUID, inputtext, callback){
            itemMirrorCase.createAssociation({
                "displayText": inputtext,
                "itemName": inputtext,
                "isGroupingItem": true
            }, function (error, GUID) {
                if (error) { return callback(false); }; //throw error;
                //append
                uiDirAssembly(GUID, inputtext, inputtext, "rgb(58, 110, 165)", parentGUID);
                //set AossociationNameSpaceAttribute, checklist color, create date
                setAssociationAttr(itemMirrorCase, "color", "rgb(58, 110, 165)", GUID);
                setAssociationAttr(itemMirrorCase, "createDate", getCurrentdate().toString(), GUID);
                
                //new checklist on webpage
                uiRemove();
                uiChecklistAssembly(GUID, inputtext); 
                uichangecolor("rgb(58, 110, 165)");

                MapItemMirror[GUID] = itemMirrorCase;

                //create new xooml file under this folder
                createItemMirror(itemMirrorCase, GUID, function (newitemMirrorCase){
                    return callback(true);
                });
            });
        }
        /*create a new checklist and dropbox folder*/
        //callback(isExist)
        function createChecklist(inputtext, dirpath, parentGUID, callback){
            //create association
            if (parentGUID != null) {
                getItemMirror( parentGUID, function (itemMirrorCase){
                    createItemMirror(itemMirrorCase, parentGUID, function (newitemMirrorCase){
                        createAssociationCase3(newitemMirrorCase, parentGUID, inputtext, function ( isError ){
                            return callback(isError);
                        });
                    });
                });
            }else{
                initialItemMirror(dirpath, function (error, itemMirrorCase){
                    if (error) { return callback(false); };
                    createAssociationCase3(itemMirrorCase, parentGUID, inputtext, function ( isError ){
                        return callback(isError);
                    });
                });
            };
        }
        /* delete checklist , and map prop "delete Map['prop']";*/
        function deleteChecklist(GUID){
            getItemMirror(GUID, function (itemMirrorCase){
                itemMirrorCase.deleteAssociation(GUID, function (error){
                    if (error) { throw error};
                    delete MapItemMirror[GUID];
                });
            });
        }
        /* translate color */
        function colorTranslate(color){
             
            var colorClass = "blue";

            switch(color){
                case ("rgb(255, 204, 102)"):
                    colorClass = "yellow";
                    break;
                case ("rgb(58, 110, 165)"):
                    colorClass = "blue";
                    break;
                case ("rgb(194, 71, 71)"):
                    colorClass = "red";
                    break;
                case ("rgb(51, 153, 102)"):
                    colorClass = "green";
                    break;
                default:
                    colorClass = "blue";
                    break;
            }
            return colorClass;
        }
        /* translate colorclass*/
        function colorClassTranslate(colorClass){
            var colorCode = "rgb(58, 110, 165)";

            switch(colorClass){
                case ("yellow"):
                    colorCode = "rgb(255, 204, 102)";
                    break;
                case ("blue"):
                    colorCode = "rgb(58, 110, 165)";
                    break;
                case ("red"):
                    colorCode = "rgb(194, 71, 71)";
                    break;
                case ("green"):
                    colorCode = "rgb(51, 153, 102)";
                    break;
                default:
                    colorCode = "rgb(58, 110, 165)";
                    break;
            }
            return colorCode;
        }
        /* Assembly folders html node */
        function uiDirAssembly(GUID, dirname, abbrname, color, parentGUID){
            var colorClass = colorTranslate(color);
            var parentTag = "notes_panel";
            var olClass = "notes";

            if (parentGUID != null) {
                parentTag = parentGUID;
                olClass = "sublist";
                $('#' + parentTag).children('li').children('.triangle').removeClass("hidden1");

                $('#' + parentTag).append($('<ol></ol>')
                    .attr({
                        id: GUID,
                        title: dirname
                    })
                    .addClass(olClass)
                );
            }else{
                $('#' + parentTag).prepend($('<ol></ol>')
                    .attr({
                        id: GUID,
                        title: dirname
                    })
                    .addClass(olClass)
                );
            };

            $('#' + GUID).append($('<li></li>')
                .addClass('list')
                .addClass('ui-draggable')
                .css('position', 'relative')
                .append($('<div></div>')
                    .addClass('task_color')
                    .addClass(colorClass)
                )
                .append($('<div></div>')
                    .addClass('triangle')
                    .addClass('triangle-right')
                    .addClass('hidden1')
                )
                .append($('<div></div>')
                    .html(abbrname)
                )
            );
        }
        /* Assembly new checklist HTML node*/
        function uiChecklistAssembly(GUID, title){
            $('.click').attr('id', GUID);
            $('.click').html(title);
        }
        function uiRemove(){
            $('.task').remove();
        }
        function uiRemoveDir(GUID){
            if (GUID != '') {
                $('#'+GUID).children('ol').remove();
            }else{
                $('.notes').remove();
            };
        }
        /* change color ui */
        function uichangecolor(color){
            if (color == "" || typeof color === "undefined" || color == null) {
                color = "rgb(58, 110, 165)";
                setAttributeValue($('.click').attr('id'), "color", color, "association", null);
            };

            $('article').css('background-color',color);
            $('li.task').css('background-color',color);
            $('.line').css('background-color',color);   
        
            var rgb = getRGB(color);
            for(var i = 0; i < rgb.length; i++){
                rgb[i] = Math.max(0, rgb[i] - 190);    
            }
            
            var newColor = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
            
            var rgbHover = getRGB(color);
            for(var i = 0; i < rgbHover.length; i++){
                rgbHover[i] = Math.max(0, rgbHover[i] - 10);
            }
            var newHoverColor = 'rgb(' + rgbHover[0] + ',' + rgbHover[1] + ',' + rgbHover[2] + ')';
            $('li.task').hover(
                function () {
                    $(this).css("background-color", newHoverColor);
                },
                function () {
                    $(this).css("background-color", color);
                }
            );
        }
        /*<!--change color function-->*/
        function getRGB(color) {
            var result;
            
            // Look for rgb(num,num,num)
            if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)) return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];

            // Look for rgb(num%,num%,num%)
            if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color)) return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55];

            // Look for #a0b1c2
            if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color)) return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];

            // Look for #fff
            if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color)) return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16)];
        }
        /* gernate create data*/
        function getCurrentdate(){
            var gdate = new Date();
            var gyear = gdate.getFullYear();
            var gmonth = gdate.getMonth();
            var gday = gdate.getDate();
            var gh = gdate.getHours();
            var gm = gdate.getMinutes();
            return gday+"/"+gmonth+"/"+gyear+"-"+gh+":"+gm;
        }
        /* Assembly all tasks into checklist HTML node */
        function uiTaskAssembly(GUID, inputtext, dueDate, doORac, urlHref, type){

            var doORacTag = "";

            if (doORac == "false") {
                doORacTag = "done";
            }else{
                doORacTag = "active";
            };

            $('#' + doORacTag).prepend($('<li></li>')
                .addClass('task')
                .attr({
                    id: GUID
                })
                .append($('<span></span>')
                    .addClass("date")
                    .html(dueDate)
                )
                .append($('<span></span>')
                    .addClass('task-name')
                    .html(inputtext)
                )
                .append($('<span></span>')
                    .addClass('task-action')
                    .append($('<button></button>')
                        .addClass('task-active-button')
                        .attr({
                            type: "button"
                        })
                        .html("Active")
                        .addClass(function (index, currentClass){
                            if (doORac == "false") {
                                return '';
                            }else{
                                return 'hidden';
                            };
                        })
                    )
                    .append($('<button></button>')
                        .addClass('task-done-button')
                        .attr({
                            type: "button"
                        })
                        .html("Done")
                        .addClass(function (index, currentClass){
                            if (doORac == "false") {
                                return 'hidden';
                            }else{
                                return '';
                            };
                        })
                    )
                    .append($('<button></button>')
                        .addClass('task-delete-button')
                        .attr({
                            type: "button"
                        })
                        .html("Delete")
                    )
                )
            );

            if (type != '') {
                $('#' + GUID + '.task').children('.task-name').html('');
                
                if (type == "file") {
                    var fileArray = inputtext.split('.');
                    var fileType = fileArray[fileArray.length-1];
                    var txtArray = ["ade", "cdr", "igs", "pdf", "ppt", "pptx", "wri", "xls", "xlxs", "zip", "mp3", "wav", "txt", "doc", "docx", "txt"];
                    var picArray = ["jpg", "bmp", "dib", "jpg", "jpeg", "jpe", "jfif", "gif", "tif", "tiff", "png", "ico"]; 
                    //var loopArray = [txtArray, picArray];

                    $.each(txtArray, function (index, value){
                        if (fileType == value) {
                            type = "txt";
                        };
                    });
                    
                    $.each(picArray, function (index, value){
                        if (fileType == value) {
                            type = "pic";
                        };
                    })

                    if (type != "txt" && type != "pic") {
                        type = "unknown";
                    };
                   
                };

                $('#' + GUID + '.task').children('.task-name').append($('<a></a>')
                    .attr({
                        href: urlHref,
                        target: "_blank"
                    })
                    .addClass('task-link')
                    .append($('<div></div>')
                        .addClass('icon')
                        .addClass(type)
                    )
                    .append($('<span><span>')
                        .html(inputtext)
                    )
                );

                if (type == "folder") {
                    $('#' + GUID + '.task').children('.task-name').children('a').removeAttr("target").removeAttr('href');
                };
            };      
        }
        function createRootItemMirror(dirpath, callback){
            initialItemMirror(dirpath, function (error, itemMirrorCase){
                if (error) { throw error };
                rootItemMirror = itemMirrorCase;
                return callback(itemMirrorCase);
            });
        }
        function loopFolder(GUIDs, index, parentGUID, itemMirrorCase, callback){
            if (index > GUIDs.length-1 || GUIDs.length == 0) {
                return callback();
            };

            checkisGrouping(itemMirrorCase, GUIDs[index], function (flag) {
                MapItemMirror[GUIDs[index]] = itemMirrorCase;

                if (flag) {
                    getLocalItem(itemMirrorCase, GUIDs[index], function ( localItem ){
                        var abbrname = localItem;
                        if (localItem.length > 15) {
                            abbrname = localItem.substring(0, 10) + "...";
                        };

                        getAssociationAttr(itemMirrorCase, "color", GUIDs[index], function ( _color ) {
                            createItemMirror(itemMirrorCase, GUIDs[index], function (newitemMirrorCase){
                                uiDirAssembly(GUIDs[index], localItem, abbrname, _color, parentGUID);
                                loadFolders(newitemMirrorCase, GUIDs[index]);
                                loopFolder(GUIDs, index += 1, parentGUID, itemMirrorCase, callback);
                            });
                        });
                    });
                } else {
                   loopFolder(GUIDs, index += 1, parentGUID, itemMirrorCase, callback);
                }
            });
        }
        function loadFolders(itemMirrorCase, parentGUID){
            itemMirrorCase.listAssociations(function (error, GUIDs) {
                if (error) { throw error};
                loopFolder(GUIDs, 0, parentGUID, itemMirrorCase, function () {
                    //the loop has finished for all elements
                });
            });
        
        }
        function reloadFolders(GUID, callback){
            var itemMirrorCase = MapItemMirror[GUID];
            createItemMirror(itemMirrorCase, GUID, function (newitemMirrorCase){
                loadFolders(newitemMirrorCase, GUID, function () {
                    return callback();
                });
            });
        }
        function loadDefaultTask(){
            rootItemMirror.sync(function (error){
                rootItemMirror.getFragmentNamespaceAttribute ("color", namespaceURI, function (error, _color){
                    if (error) { throw error };
                    if ( _color == null || typeof _color === "undefined") {
                        _color = "rgb(58, 110, 165)"
                        rootItemMirror.setFragmentNamespaceAttribute("color", _color, namespaceURI, function (error){
                            if (error) { throw error};
                            loadTask(rootFolder, '', _color, rootPath);
                        });
                    }else{
                        loadTask(rootFolder, '', _color, rootPath);
                    };
                });
            });
        }

        /* declare fn method*/
        newObj.getUserName = getUserName;
        newObj.loadFolders = loadFolders;
        newObj.loadTask = loadTask;
        newObj.deleteTask = deleteTask;
        newObj.createTask = createTask;
        newObj.createChecklist = createChecklist;
        newObj.deleteChecklist = deleteChecklist;
        newObj.setAttributeValue = setAttributeValue;
        newObj.uichangecolor = uichangecolor;
        newObj.uiRemoveDir = uiRemoveDir;
        newObj.colorTranslate = colorTranslate;
        newObj.rootPath = rootPath;
        newObj.rootFolder = rootFolder;
        newObj.getuiPath = getuiPath;
        newObj.createRootItemMirror = createRootItemMirror;
        newObj.MapItemMirror = MapItemMirror;
        newObj.createItemMirror = createItemMirror;
        newObj.reloadFolders = reloadFolders;
        newObj.loadDefaultTask = loadDefaultTask;
        return newObj;
    /*<---------------function--end--here-------------------------------*/
    }

    var fn = new ItemMirrorfn();
    /* page load*/
    function WindowLoad(){
        $("#paper").hide();
        
        //get ueser info
        fn.getUserName(function (username, useremail) {
          $('#username').html(username);
          $('#username').attr('title', useremail);

          //load folders
          fn.uiRemoveDir('');
          fn.createRootItemMirror(fn.rootPath, function (itemMirrorCase){
            //fn.loadDefaultTask();
            fn.loadFolders(itemMirrorCase, null);
          });
        });

    }
    /* page ready*/
    function DocumentReady(){
        var title, dirpath, GUID, parentGUID, color="rgb(58, 110, 165)", colorClass="blue";
        function alertMsg(title, msg, btnHidden, GUID){
            if (btnHidden == false) {
                $('#confirm').show();
                $('#cancel').show();
                ;
            }else{
                $('#confirm').hide();
                $('#cancel').hide()
            };
            $('#alerttitle').html(title);
            $('#alertmsg').html(msg);

            if (btnHidden == true) {
                $('#basic-modal-content').modal();
            }else{
                $('#basic-modal-content').modal({
                    onShow: function (dialog){
                        var modal = this;
                        $('#cancel').click( function() {
                            modal.close();

                            return false;
                        });

                        $('#confirm').click( function () {
                            uideleteChecklist(GUID);
                            modal.close();

                            return false;
                        });
                    }
                });
            };
        }
        function uideleteChecklist(parentGUID){
            $("#paper").hide();
            var count = $('#' + parentGUID).parent().children('ol').length;
            var parentTag = $('#' + parentGUID).parent().attr('id');

            if (count == 1 && parentTag != "notes_panel") {
                $('#' + parentGUID).parent().children('li').children('.triangle').removeClass('triangle-down');
                $('#' + parentGUID).parent().children('li').children('.triangle').addClass('triangle-right');
                $('#' + parentGUID).parent().children('li').children('.triangle').addClass('hidden1');
            };

            $('#' + parentGUID).remove();
            fn.deleteChecklist(parentGUID);
        }
        /*<!--DatePicker-->*/
        $('#datepicker').datepicker({
            showOn: "button",
            buttonImage: "image/calendar.png",
            buttonImageOnly: true,
            inline:true,
        });
        /*<!--up to parent level-->*/
        $('#up').click(function (){
            GUID = $('.click').attr('id');
            parentGUID = $('#'+ GUID).parent('ol').attr('id');

            if (GUID == '' || GUID == null || typeof GUID === "undefined") {
                //console.log('root: GUID: ' + GUID + '+ parentGUID: ' + parentGUID);;
                alertMsg('Notice' , 'You are in the top checklist!', true, '');
                //alert("we are in the root folder");
            }else{
                 if (parentGUID == null || typeof parentGUID === "undefined" || parentGUID == '') {
                    //console.log('uproot: GUID: ' + GUID + '+ parentGUID: ' + parentGUID);
                    alertMsg('Notice' , 'You are in the top checklist!', true, '');
                    //fn.loadDefaultTask();
                 }else{
                    //console.log('find: GUID: ' + GUID + '+ parentGUID: ' + parentGUID);
                    $('#paper').hide();
                    title = $('#' + parentGUID).attr('title');
                    color = $('#' + parentGUID).children('li').children('.task_color').css('background-color');
                    fn.getuiPath( parentGUID, title + '/', function (path){
                        //load task
                        $('#' + GUID).children("li").css("background-color","#47A3DA");
                        $('#' + parentGUID).children("li").css("background-color","rgb(0, 0, 102");
                        fn.loadTask(title, parentGUID, color, fn.rootPath + path);
                    });
                 };
            };            
        });
        /*<!--delete task-->*/
        $('body').delegate('.task-delete-button', 'click', function() {
            var flag = $(this).parent('span').prev('.task-name').children('a').children('div').hasClass('folder');
            
            parentGUID = $('.click').attr('id');
            GUID = $(this).parents("li").attr('id');

            $(this).parents("li").remove();

            if (flag == true) {
                var count = $('#' + GUID).parent('ol').children('ol').length;
                var parentTag = $('#' + GUID).parent('ol').attr('id');

                if (count == 1 && parentTag != "notes_panel") {
                    $('#' + GUID).parent('ol').children('li').children('.triangle').removeClass('triangle-down');
                    $('#' + GUID).parent('ol').children('li').children('.triangle').addClass('triangle-right');
                    $('#' + GUID).parent('ol').children('li').children('.triangle').addClass('hidden1');
                };

                //$('#' + parentGUID).remove();
                $('#' + GUID).remove();
                fn.deleteChecklist(GUID);
            }else{
                fn.deleteTask(parentGUID, GUID)
            };

        });
        /*<!--add task-->*/
        $('body').delegate('#new-task-button', 'click', function() {
            if ($('#new-task-name').val() != "") {
                color = $('article').css('background-color');
                fn.createTask( $('.click').attr('id'), $('#new-task-name').val(), $('#datepicker').val(), true, color);
                $('#new-task-name').val("");
                $('#datepicker').val(""); 
            } else{
                alertMsg('Notice' , 'Please type in your task!', true, '');
            };
        });
        /*<!--create check list-->*/
        $('body').delegate('#newnote', 'click', function() {
            $('#dialog-modal-content').modal({
                onShow: function (dialog){
                    var modal = this;
                    $('#folder-name').val('');

                    $('#dialog-cancel').click( function() {
                        modal.close();
                        return false;
                    });

                    $('#dialog-create').click( function () {
                        GUID = null;
                        $("li.list").each(function( index ) {
                            //console.log( index + ": " + $(this).css('background-color'));
                            var color = $(this).css('background-color');
                            if (color == "rgb(0, 0, 102)") {
                                GUID = $(this).parent('ol').attr('id');
                            };
                        });

                        var folderpath = fn.rootPath;
                        var foldername = $('#folder-name').val();

                        modal.close();
                        if (foldername == null || foldername == '') {
                            alertMsg('Notice' , 'Please type in your checklist!', true, '');
                        }else{
                            //console.log(folderpath);
                            //console.log(foldername);
                            //console.log(GUID);

                            fn.createChecklist(foldername, folderpath, GUID, function (isExist) {
                                if (isExist != false) {
                                    $("#paper").show();
                                    if (GUID != null) {
                                        $('#' + GUID).children("li").children('.triangle').removeClass('triangle-right');
                                        $('#' + GUID).children("li").children('.triangle').addClass('triangle-down');
                                        $('#' + GUID).children("ol").slideDown("slow");
                                        $('#' + GUID).children("li").css("background-color","#47A3DA");
                                    };
                                    GUID = $('#' + GUID).children("ol").last().attr('id');
                                    //console.log(GUID);
                                    //console.log($('.click').attr('id'));
                                    $('#' + GUID).children("li").css("background-color","rgb(0, 0, 102");
                                    
                                }else {
                                    alertMsg('Notice' , 'This checklist is existed, please try again!', true, '');
                                }
                            });
                        };

                        return false;     
                    });
                }
            });
        });
        /*<!--delete check list-->*/
        $('.tools').delegate('#delete', 'click', function(){
            GUID = $('.click').attr('id')
            alertMsg('Notice', 'remove?', false, GUID);
        });
        /*<!--active to done-->*/
        $('body').delegate('.task-done-button','click', function(){
            parentGUID = $('.click').attr('id');
            GUID = $(this).closest('li').attr('id');
            
            $(this).toggleClass('hidden');
            var prev= $(this).prev();
            $(prev).toggleClass('hidden');
            var c=$(this).parents("li");
            $("#done").prepend(c);

            fn.setAttributeValue(parentGUID, "doORac", "false", "next", GUID);
        });
        /*<!--done to active-->*/
        $('body').delegate('.task-active-button','click',function(){ 
            parentGUID = $('.click').attr('id');
            GUID = $(this).closest('li').attr('id');

            $(this).toggleClass('hidden');
            var next= $(this).next();
            $(next).toggleClass('hidden');
            var c=$(this).parents("li");
            $("#active").prepend(c);
          
            fn.setAttributeValue(parentGUID, "doORac", "true", "next", GUID);
        });
        /*<!--load checklist-->*/
        $('body').delegate('.list', 'click', function(){
            $("#paper").hide();

            $(".list").css("background-color","#47A3DA");
            $(this).css("background-color","#006");

            GUID = $(this).parent().attr('id');
            title = $(this).parent().attr('title');
            color = $(this).children('.task_color').css('background-color');
            fn.getuiPath( GUID, title + '/', function (path){
                //load task
                fn.loadTask(title, GUID, color, fn.rootPath + path);
            });
        });
        $('#trashcan').click(function (){
            GUID = null;
            //title = fn.rootFolder;
            $("li.list").each(function( index ) {
                //console.log( index + ": " + $(this).css('background-color'));
                var color = $(this).css('background-color');
                if (color == "rgb(0, 0, 102)") {
                    GUID = $(this).parent('ol').attr('id');
                    //title = $(this).parent('ol').attr('title');
                };
            });

            if (GUID != null) {
                alertMsg('Notice', 'remove?', false, GUID);
            }else{
                alertMsg('Notice', 'Please select one checklist or drag to the trash can!', true, '');
            };

        });
        /*<!-- Drag to trash can--!>*/
        $( "#taskpanel" ).delegate('.list','mousedown', function(){
            $(this).draggable({
                revert: true,
            });
        });
        $( "#trashcan" ).droppable({
            hoverClass:"pink",
            drop: function( event, ui ) {
                var drop= $(this);
                drop.toggleClass("pink");
                ui.draggable.addClass("hidden", function(){

                    GUID = ui.draggable.parent('ol').attr('id');
                    alertMsg('Notice', 'remove?', false, GUID);

                    drop.removeClass("pink");
                });
            }
        });
        /*--edit title--*/
        $('body').delegate('.click', 'click', function () {
            $('.click').editable( function (value, settings) { 
                console.log(this);
                console.log(value);
                console.log(settings);
                return(value);
            },{
                indicator : "<img src='img/indicator.gif'>",
                tooltip   : "Click to edit...",
                style  : "inherit"
            });
        });
        /*--go to next level--*/
        $('body').delegate('a', 'click', function () {
            if ($(this).children('div').hasClass('folder')) {
                $('#paper').hide();

                parentGUID = $('.click').attr('id');
                GUID = $(this).parent('span').parent('li').attr('id');
                title = $(this).children('span').html();
                color = $('#' + GUID).children('li').children('.task_color').css('background-color');
                fn.getuiPath( GUID, title + '/', function (path){
                    //load task
                    $('#' + GUID).children("li").css("background-color","rgb(0, 0, 102)");
                    $('#' + parentGUID).children("li").css("background-color","#47A3DA");
                    
                    fn.loadTask(title, GUID, color, fn.rootPath + path);
                });
            };
        })
        /*<!--change color-->*/
        $('.tools').delegate('a', 'click', function(){
            color = $(this).css("background-color");
            colorClass = fn.colorTranslate(color);
            GUID = $('.click').attr('id');

            //ui change color
            fn.uichangecolor(color);

            if (GUID == '' || typeof GUID === "undefined") {
                //store color into rootfolder fragement
                fn.setAttributeValue(null, "color", color, "fragement", null);
            }else{
                //store color into associationNameSpaceData
                fn.setAttributeValue(GUID, "color", color, "association", null);
                //set folders color back in sidebar
                var oldcolor = $('#' + GUID).children('li').children('.task_color').css('background-color');
                var oldcolorclass = fn.colorTranslate(oldcolor);
                $('#' + GUID).children('li').children('.task_color').removeClass(oldcolorclass);
                $('#' + GUID).children('li').children('.task_color').addClass(colorClass);
            };   
        });
        /*<!--Task Panel Button--!>*/
        $('body').delegate('#arrow', 'click', function(){
            var panel= $("#taskpanel");
            var position= panel.position();
            if(position.left >= 0){
                $('#taskpanel').animate({"left": "-=250px"}, "slow");
                $('#paper').animate({"left": "-=130px"}, "slow");
                $('#arrow').animate({"left": "-=250px"}, "slow");
                $('#arrow').css('background-image','url(image/navigation-right-frame.png)');
            }else{
                $('#taskpanel').animate({"left": "+=250px"}, "slow");
                $('#paper').animate({"left": "+=130px"}, "slow");
                $('#arrow').animate({"left": "+=250px"}, "slow");
                $('#arrow').css('background-image','url(image/navigation-left-frame.png)');
            }
        });
        /*<!--Note Panel Arrow--!>*/
        $('body').delegate('.triangle', 'click', function (event){
            event.stopPropagation();
            GUID = $(this).parent('li').parent('ol').attr('id');

            if ($(this).parent('li').siblings(".sublist").is(":hidden")) {
                //fn.uiRemoveDir(GUID);
                //fn.reloadFolders(GUID, function(){
                    $('#'+ GUID).children('li').children(".triangle").removeClass("triangle-right");
                    $('#'+ GUID).children('li').children(".triangle").addClass("triangle-down");
                    $('#'+ GUID).children("ol").slideDown("slow");
                //});

            }else{
                $('#'+GUID).children('li').children(".triangle").removeClass("triangle-down");
                $('#'+GUID).children('li').children(".triangle").addClass("triangle-right");
                $('#'+GUID).children("ol").slideUp("slow");
            };
        });
    }

    $(window).load(function(){
        WindowLoad();
    });
    $(document).ready(function () {
        DocumentReady();
    });
}).call(this);

