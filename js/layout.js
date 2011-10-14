var LayoutContainer = function() {
	var Width;
	var Height;
	var containerId;	
	
	return {
		init: function(cid){
			containerId = cid;
			
			$("#banOverlay a").hover(function() {
				$("#banOverlay").addClass("hovering");
			}, function() {
				$("#banOverlay").removeClass("hovering");
			});
		},
		layout: function(){
			Width = jQuery(window).width();
			Height = jQuery(window).height() - $("#bottomBar").height();
			
			var subscriberBox = document.getElementById(containerId);
			var vid_ratio = 198/264;

			// Find ideal ratio
			var count = subscriberBox.children.length;
			var min_diff;
			var targetCols;
			var targetRows;
			var availableRatio = Height / Width;
			for (var i=1; i <= count; i++) {
				var cols = i;
				var rows = Math.ceil(count / cols);
				var ratio = rows/cols * vid_ratio;
				var ratio_diff = Math.abs( availableRatio - ratio);
				if (!min_diff || (ratio_diff < min_diff)) {
					min_diff = ratio_diff;
					targetCols = cols;
					targetRows = rows;
				}
			};

			var videos_ratio = (targetRows/targetCols) * vid_ratio;

			if (videos_ratio > availableRatio) {
				targetHeight = Math.floor( Height/targetRows );
				targetWidth = Math.floor( targetHeight/vid_ratio );
			} else {
				targetWidth = Math.floor( Width/targetCols );
				targetHeight = Math.floor( targetWidth*vid_ratio );
			}

			var spacesInLastRow = (targetRows * targetCols) - count;
			var lastRowMargin = (spacesInLastRow * targetWidth / 2);
			var lastRowIndex = (targetRows - 1) * targetCols;

			var firstRowMarginTop = ((Height - (targetRows * targetHeight)) / 2);
			var firstColMarginLeft = ((Width - (targetCols * targetWidth)) / 2);
			
			var x = 0;
			var y = 0;
			for (i=0; i < subscriberBox.children.length; i++) {
				if (i % targetCols == 0) {
					// We are the first element of the row
					x = firstColMarginLeft;
					if (i == lastRowIndex) x += lastRowMargin;
					y += i == 0 ? firstRowMarginTop : targetHeight;
				} else {
					x += targetWidth;
				}
				
				var parent = subscriberBox.children[i];
				var child = subscriberBox.children[i].firstChild;
				parent.style.left = x + "px";
				parent.style.top = y + "px";

				child.width = targetWidth;
				child.height = targetHeight;
				
				parent.style.width = targetWidth + "px";
				parent.style.height = targetHeight + "px";
			};
		},
		createSubContainer: function(id, connection) {
			var container = document.createElement("div");
			var div = document.createElement("div");
			div.setAttribute("id", id);
			container.appendChild(div);
			var subscriberBox = document.getElementById("subscriberBox");
			subscriberBox.appendChild(container);
			
			$(container).hover(
				function() {
					if (EmbedApp.moderator) {
						$(this).append($("#banOverlay"));
						$("#banOverlay").show();
					
						$("#banOverlay a").click(function() {
							EmbedApp.ban(connection);
						});
					}
				}, 
				function() {
					$("#banOverlay").hide();
					$("#banOverlay a").unbind("click");
				}
			);
		},
		removeSubContainer: function(subContainer) {
			var banOverlay = document.getElementById("banOverlay");
			if ($.contains(subContainer, banOverlay)) {
				document.body.appendChild(banOverlay);
				$("#banOverlay").hide();
			}
			subContainer.parentNode.removeChild(subContainer);
		}
	};
}();