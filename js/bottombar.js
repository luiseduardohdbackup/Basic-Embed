var BottomBar = function() {
	var numPeople = 0;
	
	var referrerQueryParam = "";
	
	
	function getStatus() {
		var status = "Come chat with us!";
		return status;
	}
	
	
	
	return {
		init: function(stage){

			this.layout();
			
			$(".emLogo").click(function(){
				// GTODO, send email
				EmbedApp.emailBtnClick();
			});
			
			$(".fbLogo").click(function() {
				var title = getStatus();
				var shareurl = "http://www.facebook.com/sharer.php?s=100&p[title]=" + encodeURIComponent( title ) + "&p[url]=" + encodeURIComponent( util.updateHostUrlWithRef("fb") ) + "&p[summary]=";
				window.open(shareurl, "facebook", "width=550,height=500,left=500,top=100,resizable=1");
				// logging
				analytics.logEvent("facebookShare", "", "#people", numPeople);
			});
			
			// Come chat with Andrew, Adam, Garret and 3 others
			$(".twLogo").click(function() {
				status = getStatus();
				
				var shareurl = 'http://twitter.com/intent/tweet?text=' + encodeURIComponent(status) + "&url=" + encodeURIComponent(util.updateHostUrlWithRef("tw"));
				
				window.open(shareurl, "twitter", "width=550,height=345,left=500,top=100,resizable=1");
				// logging
				analytics.logEvent("twitterShare", "", "#people", numPeople);
			});
			
			$("#muteBtn").click(function() {
				if (EmbedApp.muted) {
					EmbedApp.unmute();
					$("#muteBtn").removeClass("muted");
				} else {
					EmbedApp.mute();
					$("#muteBtn").addClass("muted");
				}
			});
			
			$("#closeBtn").click(function() {
				EmbedApp.closeButtonClick();
			});
			
			$("#lockBtn").click(function(){
				if (!EmbedApp.moderator) {
					EmbedApp.onClickLockBtn();
				}
			});
			
			$("#tbLogo").click(function(){
				// logging
				var _partnerId = SessionData.apiKey || "";
				var _hostParam = SessionData.hostURL || "";
				var _embedID = SessionData.embedID || "";
				
				if (EmbedApp.moderator){
					analytics.logEvent("tokboxLogoClick", "moderator");
					
					var feedbackUrl = TokboxData.widgeturl + "/opentok/plugnplay/basicembed/feedback";
					
					feedbackUrl += "?hostURL=" + _hostParam;
					feedbackUrl += "&partnerId=" + _partnerId;
					feedbackUrl += "&embedId=" + _embedID;
					
					var wopen = window.open(encodeURI(feedbackUrl));
					
					// attach host url and email
					// 
				}
				else {
					analytics.logEvent("tokboxLogoClick", "nonmoderator");
					var feedbackUrl = TokboxData.widgeturl + "/opentok/plugnplay/basicembed/getembed";
					feedbackUrl += "?partnerId=" + _partnerId;
					var wopen = window.open(encodeURI(feedbackUrl));
				}
			});
		},
		
		layout: function(){
			var barHeight = $("#bottomBar").height();
			$("#bottomBar").css({
				"margin-top": (jQuery(window).height() - barHeight) + "px",
				"width": jQuery(window).width() + "px"
			});
		},
		
		updateMuted: function(value){
			if (value) {
				$("#muteBtn").addClass("muted");
			} else {
				$("#muteBtn").removeClass("muted");
			}
		},
		
		showPublishingView: function() {
			$("#closeBtn").show();
			$("#lockBtn").show();
			if (!EmbedApp.moderator){
				$("#lockBtn").removeClass("lockBtnActive");				
				$("#lockBtn").addClass("lockBtnReg");			}
			else {
				$("#lockBtn").removeClass("lockBtnReg");
				$("#lockBtn").addClass("lockBtnActive");
			}
		},
		showUnpublishingView: function() {
			$("#closeBtn").hide();
			if (!EmbedApp.moderator){
				$("#lockBtn").hide();
			}
		}
	};
}();
