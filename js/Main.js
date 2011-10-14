/*!
 * Copyright (c) 2011 TokBox, Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * No rights or license are granted to use, modify, distribute or redistribute any
 * TokBox mark (any TokBox name, logo, trademark or service mark), including
 * those originally built into this Software, unless you have entered a separate
 * written trademark license agreement with TokBox.
 *
 */



function log (text) {
	try {
		console.log(text);
	}
	catch (e){}
}

Array.prototype.contains = function(obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
};
Array.prototype.removeElement = function(arrayElement) {
	log("remove " + arrayElement);
	for(var i=0; i<this.length;i++ ) { 
		if (this[i]==arrayElement) {
			this.splice(i,1); 
		}
	} 
	log(this);
};
Array.prototype.addUnique = function(arrayElement) {
	this.removeElement(arrayElement);
	log("add " + arrayElement);
	this.push(arrayElement);
	log(this);
}

// main app
var EmbedApp = function () {
	var that = {};
	
	that.REFERER_QUERY_PARAM = "rzjz";
	
	var stage = {};  // display area
	var ele = {};  // view elements
	var session;  // opentok session
	var view = {};  // view
	
	var embedProxy;
	
	// specific views
	var viewJoinOthers;
	var viewJoinAsFirst;
	var viewMediatorSecret;
	var viewRecoverPassword;
	var viewMediatorRejoin;
	var viewBanned;
	var viewModeratorExit;
	var viewChatClosed;
	var viewShareEmail;

	var publisher;
	
	var bannedKey;
	
	// timer that retries when the chat is closed
	var chatClosedTimer;
	
	
	/* ****************************
	 * view
	 */
	
	view.abstractViewObj = function () {
		var that = {};
		that.viewComponent = {}; // req
		that.viewComponent.style = {};
		that.viewComponent.style.display = {};
		// show and hide
		that._show = function() {
			that.viewComponent.style.display = "block";
			// submit form on return key pressed
			document.body.onkeydown = function ( e ) {
				that.keydownDefault(e);
			};
		};
		that._hide = function() {
			that.viewComponent.style.display = "none";
			document.body.onkeydown = null;
		};
		// actual func calls
		that.show = function () {
			that._show();
		};
		that.hide = function () {
			that._hide();
		};
		// with modal override
		that.showAndModal = function() {
			that._show();
			log('show and modal');
			ele.modalOverlay.style.display = "block";
		}
		that.hideAndModal = function() {
			that._hide();
			ele.modalOverlay.style.display = "none";
		};
		that.keydownDefault = function(event){
			try {
				var e = window.event || event;
				var keypressed = event.which ? event.which : event.keyCode;
				if (keypressed == 13){
					that.onUserFormSubmit();
					return false;
				}
			}
			catch(e){}
		};
		that.onUserFormSubmit = function(){};
		return that;
	};
	view.abstractJoinView = function() {
		var that = view.abstractViewObj();
		that.nonModJoin = function ( ) {
			join();
			if (EmbedApp.sessionConnected) {
				publish();
			} 
			else if (EmbedApp.active) {
				connect();
			}
			return false;
		};
		return that;
	}
	
	view.joinOthers = function() {
		var that = view.abstractJoinView();
		that.viewComponent = ele.viewJoinOthers;
		
		var oldShow = that.show;
		that.show = function( ) {
			oldShow();
			if (ele.shareBoxDiv.style.display == "none") {
				$(ele.shareBoxDiv).fadeIn(1000);
			}
		};
		
		ele.btnJoinOthers.onclick = function() {
			that.nonModJoin();
		};
		
		that.onUserFormSubmit = function() {
			ele.btnJoinOthers.onclick(null);
		};
		
		that.updateNumPeeps = function(npeeps) {
			ele.joNumWatching.innerHTML = npeeps.toString();
			ele.wjNumWatching.innerHTML = npeeps.toString();
		};
		
		return that;
	};
	
	view.joinAsFirst = function() {
		var that = view.abstractJoinView();
		that.viewComponent = ele.viewJoinAsFirst;
		
		var oldShow = that.show;
		that.show = function() {
			oldShow();
			hideAllShare();
		};
		
		ele.btnJoinAsFirst.onclick = function() {
			that.nonModJoin();
		};
		
		that.onUserFormSubmit = function() {
			ele.btnJoinAsFirst.onclick(null);
		};
		
		that.updateNumPeeps = function(npeeps) {
			ele.jfNumWatching.innerHTML = npeeps.toString();
			if (npeeps == 1) {
				ele.joinAsFirstPeepsMssg.innerHTML = "person is on this page right now!";
			}
			else {
				ele.joinAsFirstPeepsMssg.innerHTML = "people are on this page right now!";
			}
		};
		ele.joinAsFirstPeepsMssg.innerHTML = " ";
		ele.jfNumWatching.innerHTML = " ";
		return that;
	};

	
	view.mediatorSecret = function () {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewMediatorSecret;
		
		var sendingToServer = false;
		
		// show and hide
		that.hide = function () {
			that.hideAndModal();
			that.clearSecret();
		};
		that.show = function () {
			that.showAndModal();
			ele.secretPhrase.focus();
			
			if (SessionData.open) {
				ele.mediatorSecretTopHeader.innerHTML = "Moderation";
				ele.btnJoinChatAsMediator.innerHTML = "Unlock";
			}
			else {
				ele.mediatorSecretTopHeader.innerHTML = "";
				ele.btnJoinChatAsMediator.innerHTML = "Open";
			}
		};
		
		// event listeners
		ele.forgotSecret.onclick = function ( event ) {
			log("I forgot my password");
			viewSwitcher( viewRecoverPassword );
			return false;
		};
		
		ele.btnJoinChatAsMediator.onclick = function ( event ) {
			if (!sendingToServer) {
				log("btn click join chat as mediator");
				SessionData.secret = that.getSecret();
				sendingToServer = true;
				embedProxy.joinAsMediator( that.onJoinMediatorProxySuccess, that.onJoinAsMediatorProxyError, SessionData.secret );
			}
			return false;
		};
		
		ele.goBackFromMediator.onclick = function ( event ) {			
			if (SessionData.open){
				viewHide();
			}
			else {
				viewSwitcher( viewChatClosed );
			}
			// logging
			analytics.logEvent("embedAuthBack", "");
			return false;
		};
		
		
		that.onJoinAsMediatorProxyError = function ( data ) {
			sendingToServer = false;
			showNonUserError("unknown server error");
			// logging
			analytics.logEvent("embedAuthFail", "unknown");
		};
		
		
		// when a user hits return while on this view
		that.onUserFormSubmit = function () {
			ele.btnJoinChatAsMediator.onclick( null );
		};
		
		// callback func from session info proxy
		newSession = false;
		that.onJoinMediatorProxySuccess = function ( data ) {	
			sendingToServer = false;
			if (!data){
				showNonUserError("unknown server error");
				// logging
				analytics.logEvent("embedAuthFail", "unknown");
				return;
			}
			if (data.password == "invalid"){
				showUserError("invalid password");
				// logging
				analytics.logEvent("embedAuthFail", "invalidPassword");
			}
			else {
				hideError();
				
				// EmbedApp.publishing = true;
				EmbedApp.active = true;
				
				EmbedApp.setModerator(true);
				
				// Set a new token
				SessionData.token = data.token;
				newSession = false;
				if (SessionData.session_id != data.session_id) {
					newSession = true;
					SessionData.session_id = data.session_id;
					// logging
					analytics.logEvent("embedOpened", "");
				}
				
				if (!EmbedApp.sessionConnected) {
					if (newSession || !session) {
						initSession();
					} 
					connect();
					EmbedApp.setModerator(true);
					setSessionIsOpen(true);
					viewHide();
				}
				else {
					if (EmbedApp.publishing){
						viewSwitcher(viewMediatorRejoin);
					}
					else {
						viewMediatorRejoin.rejoinUserAsMediator();
					}
				}
			}
		};
		
		// get secret error mssgs
		var showUserError = function ( mssg ) {
			jQuery("#secretPhraseErrorMssg").show();
			jQuery("#secretPhraseErrorMssg").html( mssg );
			jQuery("#secretPhrase").addClass("error");
		};
		var showNonUserError = function ( mssg ) {
			jQuery("#secretPhraseErrorMssg").show();
			jQuery("#secretPhraseErrorMssg").html( mssg );
		};
		var hideError = function () {
			jQuery("#secretPhraseErrorMssg").hide();
			jQuery("#secretPhrase").removeClass("error");
		};
		
		// getters
		that.getSecret = function () {
			return ele.secretPhrase.value;
		};
		
		that.clearSecret = function () {
			ele.secretPhrase.value = "";
		};

		return that;
	};
	
	
	view.mediatorRejoin = function() {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewMediatorRejoin;
		
		that.show = that.showAndModal;
		that.hide = that.hideAndModal;
		
		ele.btnModeratorRejoin.onclick = function(e) {
			that.rejoinUserAsMediator();
		};
		
		that.rejoinUserAsMediator = function(){
			// Reconnect with new token
			if (EmbedApp.sessionConnected) {
				EmbedApp.reconnect = true;
				if (session) {
					BottomBar.showUnpublishingView();
					session.disconnect();
				}
			} 
			else {
				if (!session) {
					initSession();
				} 
				connect();
			}
			viewHide();			
		};
		
		that.onUserFormSubmit = function() {
			ele.btnModeratorRejoin.onclick(null);
		};
		
		return that;
	};
	
	
	view.recoverPassword = function () {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewRecoverPassword;
		
		var header = document.getElementById("rpHeader");
		var body = document.getElementById("rpBody");
		// get main ui txt values
		var headertxt = header.innerHTML;
		var bodytxt = body.innerHTML;
		// sent values for main ui txt
		var sent_headertxt = "Recover secret";
		var sent_bodytxt = "Secret sent";
		
		that.show = that.showAndModal;
		that.hide = that.hideAndModal;
		
		//
		that.showSentView = function () {
			header.innerHTML = sent_headertxt;
			body.innerHTML = sent_bodytxt;
			ele.btnSendEmail.style.display = "none";
			
			var to = setTimeout(that.hideSentView, 5000);
		};
		that.hideSentView = function () {
			header.innerHTML = headertxt;
			body.innerHTML = bodytxt;
			ele.btnSendEmail.style.display = "block";
		};
		
		
		// event listeners
		ele.btnSendEmail.onclick = function ( event ) {
			embedProxy.recoverPassword();
			
			// change recover password view
			that.showSentView();
			
			return false;
		};
		
		
		
		ele.goBackFromRecoverPassword.onclick = function ( event ) {
			viewSwitcher( viewMediatorSecret );
			return false;
		};
		
		
		
		return that;
	};		
	
	
	view.banned = function() {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewBanned;
		
		return that;
	};
	
	
	view.moderatorExit = function () {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewModeratorExit;
		
		that.show = that.showAndModal;
		that.hide = that.hideAndModal;
		
		// event listeners
		ele.btnModeratorLeaveChat.onclick = function () {
			// EmbedApp.disconnect();
			EmbedApp.unpublish();
		};
		ele.btnModeratorShutDownChat.onclick = function () {
			viewHide();
			if (SessionData.secret) {
				embedProxy.shutDownChat( that.onShutDownSuccess, that.onShutDownError, SessionData.secret );
			}
			
			return false;
		};
		ele.btnModeratorCancelExit.onclick = function () {
			viewHide();
		};
		
		that.getSecret = function () {
			return ele.secretPhrase.value;
		};
		
		that.onShutDownSuccess = function(data) {
			if (data.password == "invalid") {
				// This shouldn't happen
				return;
			}
			if (session) {
				session.signal();
				// logging
				analytics.logEvent("embedShutDown", "");
			}
		};
		
		that.onShutDownError = function() {
			log("shutdown failed");
		};		
		
		return that;
	};
	
	view.chatClosed = function () {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewChatClosed;
		
		var isShowing = false;
		
		// show and hide
		that.hide = function () {
			isShowing = false;
			that.viewComponent.style.display = "none";
			
			if (chatClosedTimer) {
				clearInterval(chatClosedTimer);
				chatClosedTimer = null;
			}
		};
		that.show = function () {
			isShowing = true;
			that.viewComponent.style.display = "block";
			
			if (!chatClosedTimer) {
				chatClosedTimer = setInterval(function() {checkClosed();}, 30000);
			}
		};
		
		that.init = function() {
		};
		
		
		
		// event listeners
		ele.btnRestartChat.onclick = function ( event ) {
			viewSwitcher( viewMediatorSecret );
		};
		
		
		that.init();
		return that;
	};
	
	
	view.shareEmail = function () {
		var that = view.abstractViewObj();
		that.viewComponent = ele.viewShareEmail;
		
		// ele: shareEmailAddress btnShareEmail btnShareEmailCancel
		// shareEmailLabel shareEmailErrorMssg
		// shareEmailPrepareContainer shareEmailSentContainer shareEmailSentMssg btnShareEmailDone
		
		var oldShowFunc = that.showAndModal;
		that.show = function () {
			oldShowFunc();
			ele.shareEmailAddress.focus();
		};
		
		var oldHideFunc = that.hideAndModal;
		that.hide = function () {
			clearForm();
			oldHideFunc();
		};
		
		ele.btnShareEmailCancel.onclick = function (e) {
			viewHide();
		};
		ele.btnShareEmailDone.onclick = function (e) {
			showPrepareSubmitView(); // prep for user return to this view
			viewHide();
		};
		
		ele.btnShareEmail.onclick = function (e) {
			var friendEmail = ele.shareEmailAddress.value;
			if (friendEmail.length <= 0){
				showError("email required");
			}
			else if (!util.isValidEmail(friendEmail)){
				showError("invalid email");
				ele.shareEmailAddress.select();
			}
			else {
				var emShareUrl = encodeURIComponent(util.updateHostUrlWithRef("em"));
				var encodedFriendEmail = encodeURIComponent(friendEmail);
				
				// ajax to send email
				embedProxy.sendShareEmail(emShareUrl, encodedFriendEmail);
				
				showSubmitSuccessView(friendEmail);
				
				clearForm();
				analytics.logEvent("emailShare", "");
			}
		};
		
		var showError = function (mssg) {
			ele.shareEmailAddress.focus();
			ele.shareEmailErrorMssg.innerHTML = mssg || "error";
			ele.shareEmailLabel.style.display = "none";
			ele.shareEmailErrorMssg.style.display = "block";
		};
		var hideError = function () {
			ele.shareEmailLabel.style.display = "block";
			ele.shareEmailErrorMssg.style.display = "none";
		};
		
		var showSubmitSuccessView = function (friendEmail) {
			ele.shareEmailPrepareContainer.style.display = "none";
			ele.shareEmailSentContainer.style.display = "block";
			ele.shareEmailSentMssg.innerHTML = friendEmail || "";
		};
		var showPrepareSubmitView = function () {
			ele.shareEmailPrepareContainer.style.display = "block";
			ele.shareEmailSentContainer.style.display = "none";
		};
		
		
		var clearForm = function () {
			hideError();
			ele.shareEmailAddress.value = "";
		};
		
		// when a user hits return while on this view
		that.onUserFormSubmit = function () {
			ele.btnShareEmail.onclick(null);
		};
		
		return that;
	};
	
	
	
	
	// share bg
	var shareBgShowing = false;
	var shareBgMarginTop = 0;
	var streamSubscribeQueue = [];
	
	
	var resetShareBg = function () {
		onHideShareBgComplete();
		shareBgShowing = false;
	};
	
	var showShareBg = function () {
		if (!shareBgShowing){
			
			$(ele.shareBg).stop();
			//subscribeToStreamsInQueue();
			
			ele.shareBg.style.marginTop = shareBgMarginTop + "px";
			ele.shareBg.style.display = "block";
			$(ele.shareBoxDiv).fadeOut(1000);
			shareBgShowing = true;
		}
	};
	var hideShareBg = function () {
		if (shareBgShowing){
			$(ele.shareBg).animate({"margin-top" : stage.height}, 1000, null, onHideShareBgComplete);
			shareBgShowing = false;
		}
	};
	var onHideShareBgComplete = function () {
		ele.shareBg.style.display = "none";
		$(ele.shareBoxDiv).fadeIn(1000);
		subscribeToStreamsInQueue();
	};
	var showHideShareBg = function () {
		var nstreams = getNStreams();
		if (nstreams <= 1 && that.publishing){
			showShareBg();
		}
		else if (shareBgShowing) {
			hideShareBg();
			return false;
		}
		return true; // no animate
	};
	var hideAllShare = function() {
		$(ele.shareBg).stop().hide();
		$(ele.shareBoxDiv).stop().hide();	
	};
	
	
	var subscribeToStreamsInQueue = function () {
		if (streamSubscribeQueue.length > 0){
			// streamSubscribeQueue
			subscribeToStreams(streamSubscribeQueue, true);
			// empty the array
			streamSubscribeQueue.length = 0;
			streamSubscribeQueue = [];
		}
	};
	
	
	var numWatchingOverlay = function () {
		var that = {};
		that.show = function() {
			ele.showNumWatchingOverlay.style.display = "block";
		};
		that.hide = function() {
			ele.showNumWatchingOverlay.style.display = "none";			
		};
		return that;
	}();
	
	/* ****************************
	 * controllers
	 */

	
	var join = function () {
		EmbedApp.publishing = true;
		EmbedApp.active = true;
		
		viewHide();
	};
	
	function joined() {
		$("#publisherContainer").css("z-index", "997");
		
		EmbedApp.unmute();
		
		// logging
		if (that.moderator){
			analytics.logEvent("embedJoin", "isModerator");
		}
		else {
			analytics.logEvent("embedJoin", "");
		}
	}	
	
	
	// hide must come before show for view components due to modal bg overlay can be hidden then displayed when switching
	var viewSwitcher = function ( newview ) {
		if ( view.currentview ) {
			if (view.currentview !== newview) {
				view.previousview = view.currentview;
				view.currentview.hide();
				view.currentview = newview;
			}
			newview.show();
		}
		else {
			newview.show();
			view.currentview = newview;
		}
	};
	var viewHide = function () {
		if ( !that.publishing ){
			pickCorrectJoinView();
		}
		else {
			view.currentview.hide();
 			numWatchingOverlay.show();
		}
	};
	var viewLastView = function () {
		if ( view.previousview ){
			viewSwitcher( view.previousview );
		}
		else {
			viewHide();
		}
	};
	
	
	function pickCorrectJoinView() {
		if (getNStreams() > 0){
			viewSwitcher( viewJoinOthers );
		}
		else {
			viewJoinOthers.hide();
			viewSwitcher( viewJoinAsFirst );
		}
	}
	
	function updateNumWatchingAndBroadcasting() {
		// ele.joNumBroadcasting = document.getElementById("joNumBroadcasting");
		// ele.joNumWatching
		var nBroadcasting = getNStreams();
		ele.joNumBroadcasting.innerHTML = nBroadcasting.toString();
		// nWatching
		if ( session.numViewers !== undefined ){
			viewJoinOthers.updateNumPeeps(session.numViewers);
			viewJoinAsFirst.updateNumPeeps(session.numViewers);
		}
	}
	
	
	// set state of ui based on session open or closed
	var setSessionIsOpen = function ( isOpen ) {
		SessionData.open = isOpen;
		if ( isOpen ){
			$("#htmlEmbed").removeClass("chatClosedBg");
			$("#htmlEmbed").addClass("chatOpenBg");
			$("#bottomBar").show();
		}
		else {
			$("#htmlEmbed").removeClass("chatOpenBg");
			$("#htmlEmbed").addClass("chatClosedBg");
			$("#bottomBar").hide();
		}
		layoutApp();
	};
	
	
	
	// controller that sends notification to app that user wants to submit form
	function onUserAnyFormSubmit () {
		view.currentview.onUserFormSubmit();
	}
	
	
	
	function chatReopened() {
		embedProxy.join(function(data) {
			if (data.open) {
				SessionData.session_id = data.session_id;
				SessionData.token = data.token;
				initSession();
				connect();
				setSessionIsOpen(data.open);
				viewHide();
			}
		},
		function() {
			log("failed to join");
		});
	}
	
	
	function checkClosed() {
		embedProxy.checkState(function(open) {
			if (open) {
				chatReopened();
				if (chatClosedTimer) {
					clearInterval(chatClosedTimer);
				}
			}
		});
	}
	
	// get num of streams, not included the stream you're publishing
	function getNStreams () {
		return that.currStreamConnectionIds.length;
	}
	
	
	/* ****************************
	 * session event handlers
	 */

	// opentok 
	function sessionConnectedHandler (event) {
		log('connected');
		that.connectionId = session.connection.connectionId;
		that.sessionConnected = true;
		that.sessionConnecting = false;
		subscribeToStreams(event.streams);
		
		session.numViewers = event.connections.length;
		updateNumWatchingAndBroadcasting();
		
		// chat shuts down.  chat restarted without reload page.  session data needs to be set as open
		setSessionIsOpen( true );
		
		if (that.publishing){
			publish();
		}
	}
	
	function connectionCreatedHandler(event) {
		session.numViewers += event.connections.length;
		updateNumWatchingAndBroadcasting();
	}
	function connectedDestroyedHandler(event) {
		session.numViewers -= event.connections.length;
		updateNumWatchingAndBroadcasting();
	}
	
	function connect() {
		if (!that.sessionConnected && !that.sessionConnecting) {
			log("try to connect");
			that.sessionConnected = false;
			that.sessionConnecting = true;
			that.active = true;
			session.connect(SessionData.apiKey, SessionData.token);
		}
	}	
	
	function publish() {
		var div = document.createElement("div");
		div.setAttribute("id", "publisher");
		ele.publisherContainer.insertBefore(div, ele.draggable);
		
		publisher = session.publish("publisher", {width:50, height:50, name: ""});
		
		Draggable.init(document.getElementById(publisher.id), 50, 50, 215, 138, stage.width, stage.height - $("#bottomBar").height());
		
		BottomBar.showPublishingView();
		
		publisher.addEventListener("accessDenied", that.unpublish);
	}
	
	
	function sessionDisconnectedHandler (event) {
		if (event.reason == "forceDisconnected") {
			viewSwitcher(viewBanned);
			
			if (!that.moderator) {
				StrongCookie.set(bannedKey, "true");
				analytics.logEvent("embedUserBanned", "");
			}
			
			return;
		}
		
		for (var subscriber in session.subscribers) {
			removeSubscriber(session.subscribers[subscriber]);
		};
		
		that.currStreamConnectionIds = [];
			
		that.sessionConnected = false;
		that.sessionConnecting = false;
		
		// reset share bg to hidden
		resetShareBg();
		$("#publisherContainer").css("z-index", "9999"); // on top of modal overlay, so they can click allow in flash settings box
		
		if (that.active && that.reconnect) {
			if (SessionData.session_id != session.sessionId) {
				// I need to initialize a new session
				initSession();
			}
			
			that.reconnect = false;

			var action = function() {
				connect();
			};
			setTimeout(action, 500);
		} 
		else {
			if (!SessionData.open){
				// Show call ended view
				viewSwitcher( viewChatClosed );
			}
			else {
				viewHide();
			}
		}
	}

	function streamCreatedHandler (event) {
		log("stream created");
		
		for (var i=0; i < event.streams.length; i++) {
			if (event.streams[i].connection.connectionId == session.connection.connectionId) {
				joined();
				Draggable.start();
			}
		};
		// show share btn background if they are only user
		subscribeToStreams(event.streams);
	}
	
	function signalReceivedHandler (event) {
		// Check the state of the call
		embedProxy.checkState(function(open) {
			setSessionIsOpen( open );
			if (!open) {
				// The call has closed
				that.disconnect();
			}
		});
	}
	
	function removeSubscriber(subscriber) {
		that.currStreamConnectionIds.removeElement(subscriber.stream.connection.connectionId);
		var subContainer = document.getElementById(subscriber.id).parentNode;
		session.unsubscribe(subscriber);
		LayoutContainer.removeSubContainer(subContainer);
	}
	

	
	function numStreamsChanged (nstreams) {
		LayoutContainer.layout();
		
		if (!that.publishing) {
			pickCorrectJoinView();
		}
		updateNumWatchingAndBroadcasting();
	}
	
	function streamDestroyedHandler (event) {
		event.preventDefault();
		
		for (var i=0; i < event.streams.length; i++) {
			// remove if in stream queue
			log(streamSubscribeQueue.indexOf(event.streams[i]));
			streamSubscribeQueue.splice(streamSubscribeQueue.indexOf(event.streams[i]), 1);
			
			var subscribers = session.getSubscribersForStream(event.streams[i]);
			delete that.names[event.streams[i].name];
			for (var j=0; j < subscribers.length; j++) {
				removeSubscriber(subscribers[j]);
			};
		};
		numStreamsChanged();
		
		showHideShareBg();
	}
	
	function subscribeToStreams (streams, queuedStreams) {
		if (!queuedStreams) {
			for (var k=0; k < streams.length; ++k){
				that.currStreamConnectionIds.addUnique(streams[k].connection.connectionId);
			}
		}
		// subscribe to streams immediately if do not need to animate share bg away, otherwise, add streams to queue
		if (!showHideShareBg()){
			for (var i=0; i < streams.length; i++) {
				streamSubscribeQueue.push(streams[i]);
			}
		}
		else {
			for (var i=0; i < streams.length; i++) {
				var stream = streams[i];
				that.names[stream.name] = true;
				if (stream.connection.connectionId != session.connection.connectionId) {
					var divId = "subscriber_" + stream.streamId;
					LayoutContainer.createSubContainer(divId, stream.connection);
					session.subscribe(stream, divId, {subscribeToAudio: !EmbedApp.muted});
					subscribed = true;
				}
			}
		}
		numStreamsChanged();
	}
	
	function updateMuted() {
		for (var sub in session.subscribers) {
			session.subscribers[sub].subscribeToAudio(!EmbedApp.muted);
		};
		BottomBar.updateMuted();
	}	
	
	function initSession() {
		// TB.setLogLevel(TB.DEBUG); // GTODO
		// start opentok session
		session = TB.initSession(SessionData.session_id);
		// add opentok event handlers
		session.addEventListener("sessionConnected", sessionConnectedHandler);
		session.addEventListener("sessionDisconnected", sessionDisconnectedHandler);
		session.addEventListener("streamCreated", streamCreatedHandler);
		session.addEventListener("streamDestroyed", streamDestroyedHandler);
		session.addEventListener("signalReceived", signalReceivedHandler);
		session.addEventListener("connectionCreated", connectionCreatedHandler);
		session.addEventListener("connectionDestroyed", connectedDestroyedHandler);
	}
	
	/* ****************************
	 * public
	 */
	
	
	var layoutApp = function() {
		stage.width = jQuery(window).width();
		stage.height = jQuery(window).height();
		// set x,y coords of ui boxes
		$(".regbox").css("margin-left", (stage.width - $(".regbox").width()) / 2 + "px");
		$(".regbox").css("margin-top", (stage.height - $(".regbox").height()) / 2 + "px");
		$(ele.shareBg).css("margin-left", (stage.width - $(ele.shareBg).width()) / 2 + "px");
		shareBgMarginTop = ((stage.height - $("#bottomBar").height()) - $(ele.shareBg).height()) / 2;
		$(ele.shareBg).css("margin-top", shareBgMarginTop + "px");
		
		$("#shareBox").css("width", stage.width - ($("#logoBox").width() + $("#buttonBox").width()));
		$("#shareBox").css("width", stage.width - ($("#logoBox").width() + $("#buttonBox").width()));
		
		
		$("#imgSilhouetteContainer").css("width", stage.width - 200);
		$("#imgSilhouette").css("height", (stage.height - $("#bottomBar").height()).toString() + "px");
		$("#imgSilhouette").css("left", (($("#imgSilhouetteContainer").width() - $("#imgSilhouette").width()) / 2).toString() + "px");
		
		
		$("#htmlEmbed").css("width", stage.width);
		if ( SessionData.open ){
			$("#htmlEmbed").css("height", stage.height - $("#bottomBar").height());
		}
		else {
			$("#htmlEmbed").css("width", stage.width);
			$("#htmlEmbed").css("height", stage.height);
		}
		
		
		LayoutContainer.layout();
		BottomBar.layout();
		Draggable.layout();
	};



	that.muted = false;
	that.publishing = false;
	that.reconnect = false;
	that.active = false;
	that.sessionConnected = false;
	that.sessionConnecting = false;
	that.connectionId = "";
	that.moderator = false;
	that.names = [];	// Dictionary of names of streams
	that.currStreamConnectionIds = [];
	
	that.init = function(){
		/* ****************************
		 * init
		 */
		
		StrongCookie.init();
		
		// get window viewport dimensions
		stage.width = jQuery(window).width();
		stage.height = jQuery(window).height();

		// properties
		that.publishing = false;	

		// swf elements
		ele.subscriberBox = document.getElementById("subscriberBox");
		// view elements
		ele.publisherContainer = document.getElementById("publisherContainer");
		ele.publisher = document.getElementById("publisher");
		ele.draggable = document.getElementById("draggable");
		// view components
		ele.modalOverlay = document.getElementById("modalOverlay");
		// num watching overlay
		ele.showNumWatchingOverlay = document.getElementById("showNumWatchingOverlay");
		ele.wjNumWatching = document.getElementById("wjNumWatching");
		
		// join view
		ele.viewJoinOthers = document.getElementById("viewJoinOthers");
		ele.btnJoinOthers = document.getElementById("btnJoinOthers");
		ele.joEleContainer = document.getElementById("joEleContainer");
		ele.joNumBroadcasting = document.getElementById("joNumBroadcasting");
		ele.joNumWatching = document.getElementById("joNumWatching");
		ele.viewJoinAsFirst = document.getElementById("viewJoinAsFirst");
		ele.btnJoinAsFirst = document.getElementById("btnJoinAsFirst");
		ele.jfNumWatching = document.getElementById("jfNumWatching");
		ele.joinAsFirstPeepsMssg = document.getElementById("joinAsFirstPeepsMssg");
		// mediator secret view
		ele.viewMediatorSecret = document.getElementById("viewMediatorSecret");
		ele.secretPhrase = document.getElementById("secretPhrase");
		ele.forgotSecret = document.getElementById("forgotSecret");
		ele.btnJoinChatAsMediator = document.getElementById("btnJoinChatAsMediator");
		ele.goBackFromMediator = document.getElementById("goBackFromMediator");
		ele.mediatorSecretTopHeader = document.getElementById("mediatorSecretTopHeader");
		// moderator rejoin view
		ele.viewMediatorRejoin = document.getElementById("viewMediatorRejoin");
		ele.btnModeratorRejoin = document.getElementById("btnModeratorRejoin");
		// recover password view
		ele.viewRecoverPassword = document.getElementById("viewRecoverPassword");
		ele.btnSendEmail = document.getElementById("btnSendEmail");
		ele.goBackFromRecoverPassword = document.getElementById("goBackFromRecoverPassword");
		// banned view
		ele.viewBanned = document.getElementById("viewBanned");
		// moderator exit view
		ele.viewModeratorExit = document.getElementById("viewModeratorExit");
		ele.btnModeratorLeaveChat = document.getElementById("btnModeratorLeaveChat");
		ele.btnModeratorShutDownChat = document.getElementById("btnModeratorShutDownChat");
		ele.btnModeratorCancelExit = document.getElementById("btnModeratorCancelExit");
		// chat closed
		ele.viewChatClosed = document.getElementById("viewChatClosed");
		ele.btnRestartChat = document.getElementById("btnRestartChat");
		// share bg buttons
		ele.shareBg = document.getElementById("shareBg");
		ele.shareBoxDiv = document.getElementById("shareBoxDiv");
		// share email ui
		ele.viewShareEmail = document.getElementById("viewShareEmail");
		ele.shareEmailAddress = document.getElementById("shareEmailAddress");
		ele.btnShareEmail = document.getElementById("btnShareEmail");
		ele.btnShareEmailCancel = document.getElementById("btnShareEmailCancel");
		ele.shareEmailLabel = document.getElementById("shareEmailLabel");
		ele.shareEmailErrorMssg = document.getElementById("shareEmailErrorMssg");
		ele.shareEmailPrepareContainer = document.getElementById("shareEmailPrepareContainer");
		ele.shareEmailSentContainer = document.getElementById("shareEmailSentContainer");
		ele.shareEmailSentMssg = document.getElementById("shareEmailSentMssg");
		ele.btnShareEmailDone = document.getElementById("btnShareEmailDone");
		
		// init layout
		LayoutContainer.init("subscriberBox");

		// set view based on whether session open
		setSessionIsOpen( SessionData.open );
		
		// when user hits return
		$(".regbox form").submit(function(){
			onUserAnyFormSubmit();
			return false;
		});
		
		window.onresize = function(e){
			layoutApp();
		};
		
		// Initialize bottom bar
		BottomBar.init();
		BottomBar.showUnpublishingView();

		// setup views
		viewJoinOthers = view.joinOthers();
		viewJoinAsFirst = view.joinAsFirst();
		viewMediatorSecret = view.mediatorSecret();
		viewMediatorRejoin = view.mediatorRejoin();
		viewRecoverPassword = view.recoverPassword();
		viewBanned = view.banned();
		viewModeratorExit = view.moderatorExit();
		viewChatClosed = view.chatClosed();
		viewShareEmail = view.shareEmail();
		
		// hide other views
		viewJoinOthers.hide();
		viewJoinAsFirst.hide();
		viewMediatorSecret.hide();
		viewMediatorRejoin.hide();
		viewRecoverPassword.hide();
		viewBanned.hide();
		viewModeratorExit.hide();
		viewChatClosed.hide();
		viewShareEmail.hide();
		
		// ajax
		embedProxy = EmbedProxy( this );
		
		bannedKey = "banned_" + SessionData.embedID;
		
		StrongCookie.get(bannedKey, function(banned) {
			if (banned == "true") {
				// set the currentview
				viewSwitcher( viewBanned );
			} else if (SessionData.open){
				initSession();

				TB.addEventListener("exception", function(event){log("TB error: " + event.message);});
				connect();

				// set the currentview
				// viewSwitcher( viewJoin );
			} else {
				// set the currentview
				viewChatClosed.show();
				view.currentview = viewChatClosed;
			}
		});
		
		// log if user is referred from twitter, facebook, or neither ("tw", "fb", and "no" respectively)
		var whoReferredMe = util.getURLParameter(that.REFERER_QUERY_PARAM, SessionData.hostURL);
		var logReferrer = "no";
		switch (whoReferredMe) {
			case null:
				break;
			case "null":
				break;
			case "fb":
				logReferrer = "fb";
				break;
			case "tw":
				logReferrer = "tw";
				break;
			case "em":
				logReferrer = "em";
				break;
			default:
				that.noRefAllowed = true;
		} 
		
		layoutApp();
		
		//var logReferrer = whoReferredMe != (null || "null") ? whoReferredMe : "no";
		// logging
		analytics.logEvent("embedLoaded", "", "url::wd::ht::ref", SessionData.hostURL + "::" + stage.width + "::" + stage.height + "::" + logReferrer);
		
	};
	
	that.emailBtnClick = function () {
		viewSwitcher(viewShareEmail);
	};
	
	that.closeButtonClick = function() {
		if (session) {
			if (that.moderator) {
				// if moderator, show option to shut down widget or just leave
				viewSwitcher( viewModeratorExit );
			}
			else {
				that.unpublish();
			}
		}
	};
	
	that.disconnect = function() {
		if (session) {
			that.active = false;
			that.publishing = false;
			session.disconnect();
			
			numWatchingOverlay.hide();
			BottomBar.showUnpublishingView();
		}
	};
	
	that.unpublish = function() {
		if (session) {
			that.active = false;
			that.publishing = false;
			
			session.unpublish( publisher );
			
			// since streamDestroyedHandler doesnt always fire
			that.currStreamConnectionIds.removeElement(session.connection.connectionId);			
			hideShareBg();
			viewHide();
			
			numWatchingOverlay.hide();
			BottomBar.showUnpublishingView();
		}
	};
	
	that.onClickLockBtn = function() {
		if (!that.moderator) {
			viewSwitcher( viewMediatorSecret );
		}
	};
	
	that.ban = function(connection) {
		if (session) {
			session.forceDisconnect(connection);
		}
	};
	
	that.mute = function(){
		if (that.muted) return;
		
		that.muted = true;
		
		updateMuted();
		
		// logging
		analytics.logEvent("muteAll", "");
	};
	
	that.unmute = function() {
		if (!that.muted) return;
		
		that.muted = false;
		
		updateMuted();
		// logging
		analytics.logEvent("unmuteAll", "");
	};
	
	that.setModerator = function(value) {
		that.moderator = value;
	};
	
	
	return that;
}();

$(document).ready(function() {
	EmbedApp.init();
});
