var Draggable = function() {
	
	var animationDuration = 50;
	
	var showDraggableTimeout;
	var publisherObject;
	var dragging = false;
	
	var smallWidth;
	var smallHeight;
	var largeWidth;
	var largeHeight;
	
	var oldX;
	var oldY;
	
	var showing;
	
	return {
		init: function(pub, sW, sH, lW, lH, stageWidth, stageHeight){
			smallWidth = sW;
			smallHeight = sH;
			largeWidth = lW;
			largeHeight = lH;
			publisherObject = pub;
			
			$("#publisherContainer").draggable({ containment: 'parent' }).draggable("option", "disabled", true).css({left: Math.round((stageWidth - 215)/2) + "px", top: Math.round((stageHeight - 138)/2) + "px"});
			$('#draggable').width(smallWidth+2).height(smallHeight+2).css({"marginTop": (0-smallHeight - 6) + "px", "marginLeft": "2px"}).hide();
		},
		
		layout: function() {
			var publisherCoord = $("#publisherContainer").position();
			publisherCoord.right = publisherCoord.left + smallWidth;
			publisherCoord.bottom = publisherCoord.top + smallHeight;
			var stageDim = [$(window).width(), $(window).height() - $("#bottomBar").height()];
			
			if (publisherCoord.right > stageDim[0]){
				$("#publisherContainer").css("left", stageDim[0] - smallWidth);
			}
			if (publisherCoord.bottom > stageDim[1]){
				$("#publisherContainer").css("top", stageDim[1] - smallHeight);
			}
		},
		
		start: function(){			
			$("#publisherContainer").draggable("option", "disabled", false).css({top: "10px", left: "10px"});
			$("#publisherContainer object").css({ "-moz-border-radius": "2px 2px 2px 2px", "-webkit-border-radius": "2px 2px 2px 2px", "border": "2px solid #FFFFFF"});
			$("#draggable").show();
			showing = true;
			$('#publisherContainer').bind({
				click: function() {
					if (!dragging) {
						log("click");
						clearTimeout(showDraggableTimeout);
						showDraggableTimeout = null;
						Draggable.hide();
					}
				},
				mouseenter: function() {
					if (!dragging) {
						log("mouseenter");
						clearTimeout(showDraggableTimeout);
						showDraggableTimeout = null;
					}
					
					$(document.body).unbind('click');
				},
				mouseleave: function() {
					if (!dragging && !showing) {
						log("mouseleave");
						if (!showDraggableTimeout) {
							showDraggableTimeout = setTimeout('Draggable.show()', 1000);
						}
						
						$(document.body).bind('click', function(event) {
							clearTimeout(showDraggableTimeout);
							showDraggableTimeout = null;
							Draggable.show();
							
							$(this).unbind('click');
						});
					}
				},
				dragstart: function(){
					log("dragstart");
					dragging = true;
				},
				dragstop: function(){
					log("dragstop");
					dragging = false;
					$(this).mouseenter();
				}
			});
		},
		hide: function() {
			if (!showing) return;
			
			showing = false;
			$("#draggable").hide();
			$("#publisherContainer").draggable("option", "disabled", true);
			publisherObject.width = largeWidth;
			publisherObject.height = largeHeight;
			//$(publisherObject).resizeSWF(largeWidth, largeHeight, animationDuration);
			
			oldX = $("#publisherContainer").position().left;
			oldY = $("#publisherContainer").position().top;
			
			// Center the resizing
			var xPos = oldX - (largeWidth - smallWidth)/2;
			var yPos = oldY - (largeHeight - smallHeight)/2;
			
			// If we went off the edge then adjust
			var bottomRightX = xPos + largeWidth - $("#htmlEmbed").position().left;
			var bottomRightY = yPos + largeHeight - $("#htmlEmbed").position().top;
			
			if (xPos < $("#htmlEmbed").position().left) {
				xPos = $("#htmlEmbed").position().left;
			}
			if (yPos < $("#htmlEmbed").position().top) {
				yPos = $("#htmlEmbed").position().top;
			}
			if (bottomRightX > $("#htmlEmbed").width()) {
				xPos = xPos - (bottomRightX - $("#htmlEmbed").width());
			}
			if (bottomRightY > $("#htmlEmbed").height()) {
				yPos = yPos - (bottomRightY - $("#htmlEmbed").height());
			}
			
			//$("#publisherContainer").moveSWF(xPos, yPos, animationDuration);
			//$("#publisherContainer").animate({left: xPos+"px", top: yPos+"px", width: largeWidth+"px", height: largeHeight+"px"}, {duration:animationDuration});
			//$(publisherObject).animate({width: largeWidth+"px", height: largeHeight+"px"}, {duration:animationDuration});
			$("#publisherContainer").css("left", xPos + "px");
			$("#publisherContainer").css("top", yPos + "px");
		},

		show: function() {
			if (showing) return;
			showing = true;
			$("#draggable").show();
			$("#publisherContainer").draggable("option", "disabled", false);
			//$(publisherObject).resizeSWF(smallWidth, smallHeight, animationDuration);
			//$("#publisherContainer").moveSWF(oldX, oldY, animationDuration);
			//$("#publisherContainer").animate({left: oldX+"px", top: oldY+"px", width: smallWidth+"px", height: smallHeight+"px"}, {duration:animationDuration});
			//$(publisherObject).animate({width: smallWidth+"px", height: smallHeight+"px"}, {duration:animationDuration});
			publisherObject.width = smallWidth;
			publisherObject.height = smallHeight;
		
			$("#publisherContainer").css("left", oldX + "px");
			$("#publisherContainer").css("top", oldY + "px");
		}
	};
}();