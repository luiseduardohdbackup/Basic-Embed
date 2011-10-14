var util = function () {
	var that = {};
	
	
	
	that.getURLParameter = function(name, urlstr) {
	    return unescape(
	        (RegExp(name + '=' + '(.+?)(&|$)').exec(urlstr)||[,null])[1]
	    );
	};
	
	
	
	that.insertParam = function(url, key, value) {
		var retval = "";
		if (that.getURLParameter(key, url) != ("null" || null)){
			key = escape(key); 
			value = escape(value);
			
			var s = url;
			var kvp = key+"="+value;
			
			var r = new RegExp("(&|\\?)"+key+"=[^\&]*");
			
			retval = s.replace(r,"$1"+kvp);
		}
		else {
			if (url.indexOf("?") >= 0){
				retval = url + "&" + key + "=" + value;
			}
			else {
				retval = url + "?" + key + "=" + value;
			}
		}

	    return retval;
	};
	
	
	that.isValidEmail = function( emailstr ) {
	   var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
	   if(reg.test(emailstr) == false) {
	      return false;
	   }
	   else {
		   return true;
	   }
	};
	
	// add a referrer url get param to the session data host url (the page hosting the embed)
	that.updateHostUrlWithRef = function (refStr) {
		if (EmbedApp.noRefAllowed !== true){
			return util.insertParam(SessionData.hostURL, EmbedApp.REFERER_QUERY_PARAM, refStr);
		}
		else {
			return SessionData.hostURL;
		}
	}
	
	return that;
}();