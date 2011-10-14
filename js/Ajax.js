/*
 * Proxies
 * 
 */

var EmbedProxy = function ( parentPointer ) {
	var that = {};
	
	pointAtMain = parentPointer;
	
	that.joinAsMediator = function ( returnFunc, errorFunc, secret ) {
		var jsonUrl = SessionData.embedURL + SessionData.embedID + "/auth?password=" + secret;
		log(jsonUrl);
		$.ajax({
			type: "GET", 
			url: jsonUrl,
			dataType: 'json',
			success: returnFunc,
			error : errorFunc
		});
	};
	
	that.join = function( returnFunc, errorFunc ) {
		var jsonUrl = SessionData.embedURL + SessionData.embedID + "/join";
		log(jsonUrl);
		$.ajax({
			type: "GET", 
			url: jsonUrl,
			dataType: 'json',
			success: returnFunc,
			error : errorFunc
		});
	};
	
	that.shutDownChat = function( returnFunc, errorFunc, secret) {
		var jsonUrl = SessionData.embedURL + SessionData.embedID + "/end?password=" + secret;
		log(jsonUrl);
		
		$.ajax({
			url: jsonUrl,
			type: "GET",
			dataType: "json",
  			success: returnFunc,
  			error: errorFunc
		});		
	};
	
	that.checkState = function(returnFunc) {
		var jsonUrl = SessionData.embedURL + SessionData.embedID + "/state";
		log(jsonUrl);
		
		$.ajax({
			url: jsonUrl,
			type: "GET",
			dataType: "json",
			success: function(data) {
				returnFunc(data.open);
			},		
			error: function() {
				returnFunc(false);
			}
		});
		
	};
	
	that.recoverPassword = function() {
		var jsonUrl = SessionData.embedURL + SessionData.embedID + "/forgot_pw?hostURL=" + SessionData.hostURL;
		log(jsonUrl);
		
		$.ajax({
			url: jsonUrl,
			type: "GET",
			dataType: "json",
			success: function(data) {
				log("successfully sent password");
			},
			error: function() {
				log("Failed to send password");
			}
		});
	};
	
	that.sendShareEmail = function(shareUrl, friendEmail, userName) {
		var jsonUrl = SessionData.embedURL + SessionData.embedID + "/share_email?shareUrl=" + shareUrl + "&friendEmail=" + friendEmail;
		log(jsonUrl);
		
		$.ajax({
			url: jsonUrl,
			type: "GET",
			dataType: "json",
			success: function(data) {
				log("successfully sent share email");
			},
			error: function() {
				log("Failed to send share email");
			}
		});
	};
	
	
	
	
	return that;
};






