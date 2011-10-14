(function($) {
	
	// var Animator = function() {
	// 
	// 	var _listeners = new Array();
	// 
	// 	var _intervalId;
	// 
	// 	function stopInterval () {
	// 		if (_intervalId) {
	// 			clearInterval(_intervalId);
	// 		}
	// 		_intervalId = null;
	// 	}
	// 
	// 	function onInterval () {
	// 		for (var i=0; i < _listeners.length; i++) {
	// 			_listeners[i]();
	// 		};
	// 	}
	// 
	// 	function startInterval () {
	// 		if (!_intervalId) {
	// 			setInterval(function() {onInterval();}, Animator.speed);
	// 		}
	// 	}
	// 
	// 	return {
	// 
	// 		speed:13,
	// 
	// 		registerIntervalCallback: function(listener) {
	// 			this.removeIntervalCallback(listener); // You cannot have the same listener multiple times
	// 			_listeners.push(listener);
	// 
	// 			startInterval();
	// 		},
	// 
	// 		removeIntervalCallback: function(listener) {
	// 			for (var i=0; i < _listeners.length; i++) {
	// 				if (_listeners[i] == listener) {
	// 					_listeners.splice(i, 1);
	// 					break;
	// 				}
	// 			};
	// 
	// 			if (_listeners.length == 0) stopInterval();
	// 		}
	// 	};
	// }();

	function NumericAnimator(that, fromValue, targetValue, duration) {
		var speed = 13;
		var interval;
		var step_amt;
		
		var currentValue = fromValue;

		this.getCurrentValue = function() {
			return currentValue;
		};
		
		this.setCurrentValue = function(value) {
			currentValue = value;
		};

		this.start = function() {
			var animator = this;
			//Animator.registerIntervalCallback(function() {animator.step();});
			interval = setInterval(function() {animator.step();}, speed);
		};

		this.step = function() {
			// Amount we change by at each step
			if (!step_amt)
				step_amt = (targetValue - this.getCurrentValue()) / (duration/speed);

			if (this.getCurrentValue() == targetValue) {
				this.stop();
				//clearInterval(interval);
				return;
			}

			if (step_amt > 0)
				this.setCurrentValue(this.getCurrentValue() + Math.min(Math.abs(step_amt), Math.abs(this.getCurrentValue() - targetValue)));
			else
				this.setCurrentValue(this.getCurrentValue() - Math.min(Math.abs(step_amt), Math.abs(this.getCurrentValue() - targetValue)));

			var newValue = this.getCurrentValue();	
			console.log("oldvalue: " + this.getCurrentValue() + " newvalue: " + newValue + " step: " + step_amt);
		};

		this.stop = function() {
			clearInterval(interval);
			//Animator.removeIntervalCallback(this.step);
		};
	}

	function Resizer (that, targetValue, duration, isWidth) {
		this.parentClass = NumericAnimator;
		this.parentClass(that, isWidth ? $(that).width() : $(that).height(), targetValue, duration);

		var superSetCurrentValue = this.setCurrentValue;
		this.setCurrentValue = function(value) {
			superSetCurrentValue(value);
			if (isWidth) {
				$(that).width(Math.round(value));
			} else {
				$(that).height(Math.round(value));
			}
		};
	}

	function Mover (that, targetValue, duration, cssKey) {
		this.parentClass = NumericAnimator;
		this.parentClass(that, $(that).position()[cssKey], targetValue, duration);

		var superSetCurrentValue = this.setCurrentValue;
		this.setCurrentValue = function(value) {
			superSetCurrentValue(value);
			$(that).css(cssKey, Math.round(value) + "px");
		};
	}

	$.fn.resizeSWF = function(width, height, duration) {
		
		this.each(function() {
			var widthResizer = new Resizer(this, width, duration, true);
			var heightResizer = new Resizer(this, height, duration, false);
			widthResizer.start();
			heightResizer.start();
		});
		
		return this;
	};
	
	$.fn.moveSWF = function(x, y, duration) {
		
		this.each(function() {
			var xMover = new Mover(this, x, duration, "left");
			var yMover = new Mover(this, y, duration, "top");
			xMover.start();
			yMover.start();
		});
		
		return this;
	};
})(jQuery);