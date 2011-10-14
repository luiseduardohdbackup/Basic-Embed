

var analytics = function () {
	var that = {};
	
	var POSTURL = "logging/ClientEvent";
//	var POSTURL = "http://viper.opentok.com:4015/logging/ClientEvent"; // local
	
	that.logEvent = function (_action, _variation, _payloadType, _payload) {
		var action = _action;
		var variation = _variation;
		var payload_type = _payloadType || "";
		var payload = _payload || "";
		
		var data = {
			"action" : action,
			"variation" : variation,
			"payload_type" : payload_type,
			"payload" : payload,
			'guid' : "",
			'widget_id' : "",
			'session_id' : "",
			'connection_id' : EmbedApp.connectionId,
			'stream_id' : "",
			'widget_type' : "BasicEmbed",
			'partner_id' : SessionData.apiKey,
			'source' : "",
			'section' : "",
			'build' : ""
		};
		
		$.ajax({
			type: 'POST',
			url: SessionData.loggingURL + POSTURL,
			data: data,
			success: postSuccess,
			error: postError
		});
		
		log("logged: " + "{action: " + data["action"] + ", variation: " + data["variation"] + ", payload_type: " + data["payload_type"] + ", payload: " + data["payload"] + "}");
	};
	
	
	function postSuccess(data){
		log(data);
	}
	function postError(data){
		log(data);
		log(data.responseText);
	}
	
//	that.logEvent("fake1", "fake2")
	
	return that;
}();