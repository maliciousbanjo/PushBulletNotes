/* Magic Mirror
 * Module: PushBulletNotes
 *
 * By maliciousbanjo
 * MIT Licensed.
 */

Module.register("PushBulletNotes", {
	defaults: {
		accessToken: "",
		numberOfNotifications: 5,
		showNotificationIcon: true,
		showMessage: true,
		showCount: false,
		fade: true,
		maxMsgCharacters: 50,
		maxHeaderCharacters: 32
	},

	payload: [],

	start: function() {
		console.log("PushBulletNotes module started!");
		//Flag for check if module is loaded
		this.loaded = false;
		this.sendSocketNotification("START", this.config);
		this.originalHeader = this.data.header;
	},

	getDom: function() {
		var wrapper = document.createElement("table");
		wrapper.className = "small";
		var self = this;

		if (this.config.showCount) { // Display the number of messages
			var headerRow = document.createElement("tr");
			var headerData = document.createElement("td");
			var headerDiv = document.createElement("div");

			headerDiv.className = "count";
			headerDiv.innerHTML = this.payload.length;
			headerData.appendChild(headerDiv);

			var headerRest = document.createElement("td");

			headerRest.innerHTML = this.originalHeader;
			headerRow.appendChild(headerData);
			headerRow.appendChild(headerRest);
			wrapper.appendChild(headerRow);
		}

		if (this.payload.length > 0) {
			var count = 0;

			// Only display however many notifications are specified by the config
			this.payload.slice(0, this.config.numberOfNotifications).forEach(function(o) {
				var name = (o.application_name == "sms") ? o.title : o.application_name; // If SMS, o.title is the contact name
				var title = (o.application_name == "sms") ? "" : o.title;

				// Determine if the header texts need truncating
				if (name.length + title.length > this.config.maxHeaderCharacters) {
					var remainder = (name.length + title.length) - this.config.maxHeaderCharacters;
					if (o.application_name == "sms") { // SMS Message
						name = name.substring(0, name.length - (remainder + 1)) + "...";
					}
					else {
						title = title.substring(0, title.length - (remainder + 1)) + "...";
					}
				}

				var notificationWrapper = document.createElement("tr");
				notificationWrapper.className = "normal";

				if (self.config.showNotificationIcon) {
					var iconWrapper = document.createElement("td");
					iconWrapper.className = "icon";
					var icon = document.createElement("span");
					if (o.application_name == "sms") { // Text message, display icon
						var smsPath = "/modules/PushBulletNotes/icons/sms.png";
						icon.innerHTML = "<img src=\"" + smsPath + "\" width=\"25\" >";
					}
					else {
						icon.innerHTML = "<img src=\"data:image/png;base64, " + o.icon + "\" width=\"25\" >";
					}
					iconWrapper.appendChild(icon);
					notificationWrapper.appendChild(iconWrapper);
				}

				var nameWrapper = document.createElement("td");
				nameWrapper.className = "bright";
				nameWrapper.innerHTML = name;
				notificationWrapper.appendChild(nameWrapper);

				var titleWrapper = document.createElement("td");
				titleWrapper.className = "bright";
				titleWrapper.innerHTML = title;
				notificationWrapper.appendChild(titleWrapper);
				wrapper.appendChild(notificationWrapper);

				if (self.config.showMessage) {
					var bodyWrapper = document.createElement("tr");
					var bodyContentWrapper = document.createElement("td");
					bodyContentWrapper.colSpan = "3";
					bodyContentWrapper.className = "dimmed xsmall address";
					bodyContentWrapper.innerHTML = o.body.substring(0, self.config.maxMsgCharacters);
					bodyWrapper.appendChild(bodyContentWrapper);
					wrapper.appendChild(bodyWrapper);
				}

				// Fade effect
				if (self.config.fade) {
					var startingPoint = self.payload.slice(0, self.config.numberOfNotifications).length * 0.25;
					var steps = self.payload.slice(0, self.config.numberOfNotifications).length - startingPoint;
					if (count >= startingPoint) {
						var currentStep = count - startingPoint;
						notificationWrapper.style.opacity = 1 - (1 / steps * currentStep);
					}
				}
				count++;
			});
		}
		else {
			wrapper.innerHTML = this.translate("No new notifications");
			wrapper.className = "small dimmed";
			return wrapper;
		}
		return wrapper;
	},

	getScripts: function() {
		return [];
	},

	getStyles: function () {
		return [
			"PushBulletNotes.css",
		];
	},

	cleanPayload: function(newPayload) {
		var name = newPayload.application_name;
		var title = newPayload.title;
		var self = this;
		var dupIndex = 0;
		if (this.payload.length > 0) {
			this.payload.forEach(function(m) {
				// If application_name already exists, increment notification count
				if (m.application_name === name && m.title === title) {
					self.payload.splice(dupIndex, 1);
				}
				dupIndex++;
			});
		}
		this.payload.unshift(newPayload);
	},

	removePayload: function(dismissedPayload) {
		var name = dismissedPayload.package_name;
		var self = this;
		var index = 0;

		if (this.payload.length > 0) {
			this.payload.forEach(function(m) {
				//If package_name exists in Notification list, remove notification
				if (m.package_name === name) {
					self.payload.splice(index, 1);
				}
				index++;
			});
		}
	},

	socketNotificationReceived: function (notification, payload) {
		console.log(notification);
		if(notification === "SMS_MESSAGE") {
			if (payload) {
				this.loaded = true;
				this.cleanPayload(payload);
			}
			this.updateDom();
		}
		else if (notification === "NOTIFICATION") {
			if (payload) {
				this.loaded = true;
				this.cleanPayload(payload);
			}
			this.updateDom();
		}
		else if (notification === "DISMISSAL") {
			if (payload) {
				this.loaded = true;
				this.removePayload(payload);
				this.updateDom();
			}
		}
	},
});
