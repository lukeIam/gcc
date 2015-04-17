(function () {
	var loadingPopup = "<img src='images/loader.gif' style='border:none;margin:10px;'></img><p style='color: #fff;font-size: 16px;'>Loading your comment</p>";
	var errorPopup = "<img src='images/error.png' style='height:64px;width:64px;border:none;margin:10px;'></img><p style='color: #fff;font-size: 16px;'>Sorry <br> <br> Could not load this comment</p>";

	var _comment = null;
	var _fileInfo = null;
	
	var init = function () {
		blockGui(loadingPopup);
		
		$('#btnAddToGcc').click(addToGcc);
		$('h3').click(function(e){
			$(e.target).next().slideToggle();
		});
		
		var hash = window.location.hash.substring(1).trim();
		if (hash === "") {
			console.log("No id found");
			blockGui(errorPopup);
			return;
		}

		hash = hash.substring(3);

		getCommentData(hash).fail(function (msg) {
			console.log(msg);
			blockGui(errorPopup);
		}).done(function (comment) {
			var parsedCom = parseXMLToComment(comment["content"]);
			if (parsedCom === null) {
				console.log("Comment could not be parsed");
				blockGui(errorPopup);
				return;
			}

			displayComment(parsedCom, comment);			
		});
	};

	var blockGui = function (messageHtml) {
		$('#btnAddToGcc, #btnDownloadGccFile').block({ message: null });
		$('section').block({
			message: messageHtml,
			css: {
				color: '#232323',
				border: 'none',
				backgroundColor: '#232323',
				cursor: 'wait',
				'-webkit-border-radius': '10px',
				'-moz-border-radius': '10px'
			}
		});
	};

	var unblockGui = function () {
		$('#btnAddToGcc, #btnDownloadGccFile, section').unblock();
	};

	var displayComment = function (c, fileInfo) {
		_comment = null;
		_fileInfo = fileInfo;
		$('#lblGcCode').text(c.gccode);
		$('#lblName').text(c.name);
		$('#boxComment').text(c.commentValue);
		$('#btnDownloadGccFile a').attr('href', fileInfo["raw_url"]);
		displayFinalCoordinate(c);
		displayCoordinates(c);
		
		if(isMobile()){
			$('tr').each(function(i,e){
				$(e).children().first().hide();
			});
			$('#btnAddToGcc, #btnGetGCCInst').removeClass("twoLineButton").hide();
		}
		
		unblockGui();
	};
	
	var displayCoordinates = function(coord){
		for(var i=0; i<coord["waypoints"].length; i++){
			var c = coord["waypoints"][i];
			var convCoord = convertToDD(c.coordinate);
			$("<tr><td><img style='height:16px;width:16px;' src='images/flag.png'></img></td> <td style='max-width: 170px; word-wrap: break-word;'>"+ c.name +"</td> <td><span>"+ c.coordinate +"</span><p style='margin-left: 30%;margin-bottom: 0;'> <a target='_blank' href='https://www.google.de/maps?q="+c.coordinate+"'><img src='images/gmap.png' style='height: 20px;'></img></a> <a target='_blank' href='https://www.openstreetmap.org/?mlat="+convCoord.lat+"&mlon="+convCoord.lon+"&zoom=16'><img src='images/osm.png' style='height: 20px;'></img></a> </p></td> <td>"+ c.prefix +"</td> <td>"+ c.lookup +"</td> </tr>")
			.appendTo('#boxCoords tbody')
			.filter(isMobile).find("span").wrap("<a href='geo:"+convCoord.lat+","+convCoord.lon+"'></a>");			
		}
	}
	
	var displayFinalCoordinate = function(coord){		
		$('#final-coordinate').html("<span id='finalCoordSpan'>"+ convertToDDMM(coord.lat, coord.lng) +"</span><p style='margin-bottom: 0;'> <a target='_blank' href='https://www.google.de/maps?q="+coord.lat +" "+ coord.lng +"'><img src='images/gmap.png' style='height: 20px;'></img></a> <a target='_blank' href='https://www.openstreetmap.org/?mlat="+coord.lat+"&mlon="+coord.lng+"&zoom=16'><img src='images/osm.png' style='height: 20px;'></img></a> </p>");
		$('#finalCoordSpan').filter(isMobile).wrap("<a href='geo:"+coord.lat+","+coord.lng+"'></a>");
	}
	
	var addToGcc = function(){
		alert("Not working yet");
	};
	
	var getCommentData = function (id) {
		var d = new $.Deferred();
		var files = gistShare.getComment(id).done(function (files) {
			if (files.length < 1) {
				d.reject("No files found");
				return;
			}

			d.resolve(files[0]);
		}).fail(function (msg) {
			d.reject(msg);
		});

		return d.promise();
	}

	var convertToDD = function(str){
		var dataLat = str.match(/([NS]) *([0-9]+)[^0-9]*([0-9]+\.[0-9]+)/);
		var dataLon = str.match(/([WE]) *([0-9]+)[^0-9]*([0-9]+\.[0-9]+)/);
		
		return {
			lat:(parseFloat(dataLat[2])+(parseFloat(dataLat[3])/60))*(dataLat[1].trim()==="S"?-1:1),
			lon:(parseFloat(dataLon[2])+(parseFloat(dataLon[3])/60))*(dataLon[1].trim()==="W"?-1:1)
		};
	}
	
	var convertToDDMM = function(lat, lon){
		var ddLat = Math.floor(Math.abs(lat));
		var mmLat = (Math.abs(lat)-ddLat)*60;
		var ddLon = Math.floor(Math.abs(lon));
		var mmLon = (Math.abs(lon)-ddLon)*60;
		
		return (lat<0?"S":"N") + " " + ddLat + "° " +( Math.round(mmLat * 1000) / 1000) + " " 
			+ (lon<0?"W":"E") + " " + ddLon + "° " +( Math.round(mmLon * 1000) / 1000);
	};
	
	var isMobile = function(){
		return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())) !== false;
	}
	
	//Modified version of parseXMLImport from gccomment.user.js
	var parseXMLToComment = function (xml) {
		function unescapeXML(escaped) {
			if (escaped === null || escaped === undefined) {
				return null;
			}
			var result = escaped.replace(/&gt;/g, ">");
			result = result.replace(/&lt;/g, "<");
			result = result.replace(/&quot;/g, "\"");
			result = result.replace(/&amp;/g, "&");
			result = result.replace(/&apos;/g, "'");
			// result = result.replace(/&#10;/g, "\n");
			return result;
		}

		var parser = new DOMParser();
		try {
			var xmlDoc = parser.parseFromString(xml, "text/xml");
			var comments = xmlDoc.getElementsByTagName('comment');
		} catch (e) {
			console.log("Could not parse comment xml.");
			return null;
		}

		if (comments.length <= 0) {
			console.log("No comment data found.");
			return null;
		}

		var commentNode = comments[0];
		try {
			var imID = commentNode.childNodes[0].childNodes[0].nodeValue;
			var imCode = "";
			if (commentNode.childNodes[1].childNodes[0])
				imCode = commentNode.childNodes[1].childNodes[0].nodeValue;
			var imName = unescapeXML(unescape(commentNode.childNodes[2].childNodes[0].nodeValue));
			var imContent = "";
			if (commentNode.childNodes[3].childNodes[0]) {
				imContent = unescapeXML(unescape(commentNode.childNodes[3].childNodes[0].nodeValue));
			}
			if ((imContent == "null") || (imContent == "undefined"))
				imContent = "";

			var imSave = commentNode.childNodes[4].childNodes[0].nodeValue;

			var imState; // new property "state" with version 40
			if (commentNode.childNodes[5])
				imState = commentNode.childNodes[5].childNodes[0].nodeValue;

			var imLat = "", imLng = ""; // new props lat, lng since v46
			if (commentNode.childNodes[6] && commentNode.childNodes[7]) {
				if (commentNode.childNodes[6].childNodes[0])
					imLat = commentNode.childNodes[6].childNodes[0].nodeValue;
				if (commentNode.childNodes[7].childNodes[0])
					imLng = commentNode.childNodes[7].childNodes[0].nodeValue;
			}

			var imOriglat = "", imOriglng = ""; // new props for orig coordinate of
			// cache
			if (commentNode.childNodes[8] && commentNode.childNodes[9]) {
				if (commentNode.childNodes[8].childNodes[0])
					imOriglat = commentNode.childNodes[8].childNodes[0].nodeValue;
				if (commentNode.childNodes[9].childNodes[0])
					imOriglng = commentNode.childNodes[9].childNodes[0].nodeValue;
			}

			var imArchived = "";
			if (commentNode.childNodes[10]) {
				if (commentNode.childNodes[10].childNodes[0])
					imArchived = commentNode.childNodes[10].childNodes[0].nodeValue;
			}

			var imWaypoints = [];
			if (commentNode.childNodes[11]) {
				for (var j = 0; j < commentNode.childNodes[11].childNodes.length; j++) {
					var Xwpt = commentNode.childNodes[11].childNodes[j];
					imWaypoints.push({
						prefix: Xwpt.childNodes[0].childNodes[0].nodeValue,
						lookup: Xwpt.childNodes[1].childNodes[0].nodeValue,
						name: Xwpt.childNodes[2].childNodes[0].nodeValue,
						coordinate: Xwpt.childNodes[3].childNodes[0].nodeValue
					});
				}
			}
		} catch (e) {
			console.log("Could not parse comment data.");
			return null;
		}

		return {
			guid: imID,
			gccode: imCode,
			name: imName,
			commentValue: imContent,
			saveTime: imSave,
			state: imState,
			lat: imLat,
			lng: imLng,
			origlat: imOriglat,
			origlng: imOriglng,
			archived: imArchived,
			waypoints: imWaypoints
		};
	};

	var gistShare = new function () {
		this.shareComment = function (data, gcid, name) {
			var d = new $.Deferred();

			gist.uploadNewGist(data, gcid + ".gcc", "Shared comment for \"" + name + "\" (" + gcid + ")").done(function (result) {
				if (typeof (result) !== "undefined" && typeof (result["id"]) !== "undefined") {
					d.resolve("gcc" + result["id"]);
				}
				else {
					d.reject("Creation failed");
				}
			}).fail(function (jqXHR, textStatus) {
				d.reject(textStatus + " - " + jqXHR.responseText);
			});

			return d.promise();
		};

		this.getComment = function (id) {
			var d = new $.Deferred();
			var files = [];

			gist.getGist(id).done(function (result) {
				if (typeof (result) !== "undefined" && typeof (result["files"]) !== "undefined") {
					var truncatedFilesUrls = [];

					for (f in result["files"]) {
						if (!f["truncated"]) {
							files.push(result["files"][f]);
						}
						else {
							truncatedFilesUrls.push({
								url: result["files"][f]["raw_url"],
								fileInfo: result["files"][f]
							});
						}
					}

					if (truncatedFilesUrls.length > 0) {
						var fileLoadPromises = [];
						for (urlData in truncatedFilesUrls) {
							fileLoadPromises.push(
								(function () {
									var d2 = new $.Deferred();
									$.ajax(urlData["url"], {
										cache: false,
										dataType: "text"
									}).done(function (data) {
										urlData["fileInfo"]["content"] = data;
										d2.resolve(urlData["fileInfo"]);
									}).fail(function (msg) {
										d2.reject(msg);
									});
									return d2.promise();
								})()
							);
						}

						$.when.apply($, fileLoadPromises).done(function () {
							for (var i = 0; i < arguments.length; i++) {
								files.push(arguments[i]);
							}
							d.resolve(files);
						}).fail(function () {
							if (files.length > 0) {
								d.resolve(files);
								console.log("Getting some raw gist failed");
							}
							else {
								d.reject("Getting raw gist failed");
							}
						});
					}
					else {
						d.resolve(files);
					}
				}
				else {
					d.reject("Getting gist failed");
				}
			}).fail(function (jqXHR, textStatus) {
				d.reject(textStatus + " - " + jqXHR.responseText);
			});

			return d.promise();
		};		
	};

	var gist = new function () {
		var gistApiUrl = "https://api.github.com/gists";
		this.getGist = function (id) {
			return $.ajax(gistApiUrl + "/" + id, {
				cache: false,
				dataType: "json"
			});
		};
	};


	$(document).ready(init);
})();