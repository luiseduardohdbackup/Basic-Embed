var StrongCookie = function() {
	var database;
	var userDataElem;
	
	function createElem(type, name, append) {
		var el;
		if (typeof name != 'undefined' && document.getElementById(name))
			el = document.getElementById(name);
		else
			el = document.createElement(type);
		el.style.visibility = 'hidden';
		el.style.position = 'absolute';

		if (name)
			el.setAttribute('id', name);

		if (append)
			document.body.appendChild(el);

		return el;
	}
	
	return {
		init: function(){
			if (window.openDatabase) {
				database =  window.openDatabase("opentok_embed", "1.0", "opentok embed", 1024 * 1024);

				database.transaction(function(tx) {
					tx.executeSql("CREATE TABLE IF NOT EXISTS opentok_cookie(" +
						"key TEXT NOT NULL, " +
						"value TEXT NOT NULL, " +
						"UNIQUE (key)" + 
					")", [], 
					function (tx, rs) { }, 
					function (tx, err) { });
				});
			}
			try {
				if (!document.getElementById("userDataElem")) {
					userDataElem = document.createElement("div");
					userDataElem.setAttribute("id", "userDataElem");
					userDataElem.style.visibility = 'hidden';
					userDataElem.style.position = 'absolute';
					userDataElem.style.behavior = "url(#default#userData)";
					document.body.appendChild(userDataElem);
				}
			} catch (err) {
				// Do nothing, this only works in IE...
			}
		},
		set: function(key, value) {
				if (database) {
					database.transaction(function(tx) {
						tx.executeSql("INSERT OR REPLACE INTO opentok_cookie(key, value) VALUES(?, ?)", [key, value],
							function (tx, rs) { }, 
							function (tx, err) { });
					});
				}
				
				try {
					userDataElem.setAttribute(key, value);
					userDataElem.save(key);					
				} catch (err) {
					// Do nothing, this only works in IE...
				}
				
				// Store in browser cookie
				var date = new Date();
				date.setTime(date.getTime()+(365*24*60*60*1000));
				var expires = "; expires="+date.toGMTString();
				document.cookie = key+"="+value+expires+"; path=/";
		},
		get: function(key, resultFunc) {			
			var value;
			
			// Check browser cookies
			var nameEQ = key + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) {
					value = c.substring(nameEQ.length,c.length);
				}
			}
			
			if (value) {
				resultFunc(value);
				return;
			}
			
			try {
				userDataElem.load(key);
				value = userDataElem.getAttribute(key);
				if (value) {
					resultFunc(value);
					return;
				}
			} catch (err) {
				// Do nothing, this only works in IE...
			}
			
			// Check local database
			if (database) {
				try {
					database.transaction(function(tx) {
						tx.executeSql("SELECT value FROM opentok_cookie WHERE key=?", [key],
						function(tx, result1) {
							if (result1.rows.length >= 1) {
								resultFunc(result1.rows.item(0)['value']);
							} else {
								resultFunc(null);
							}
						}, function (tx, err) { resultFunc(null); });
					});
					return;					
				} catch (err) {
					resultFunc(null);
					return;
				}
			}
			
			resultFunc(null);
		}
	};
}();
