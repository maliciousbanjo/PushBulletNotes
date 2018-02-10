/* Magic Mirror
 * Node Helper: PushBulletNotes
 *
 * By maliciousbanjo
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var PushBullet = require("pushbullet");

module.exports = NodeHelper.create({

	socketNotificationReceived: function(notification, payload) {
		if (notification === "START") {
			this.config = payload; // The payload is all of our configuration options
			console.log(notification + " received");
			this.pushBulletListener(this.config); // Start up the PushBullet listener
		}
	},

	pushBulletListener(config){
		var pusher = new PushBullet(config.accessToken); // PushBulletAPI object
		var stream = pusher.stream();
		var self = this;
		stream.connect();

		stream.on("push", function(push){ // Push is a JSON
			if (push.type === "sms_changed") { // Text message
				if (push.notifications.length !== 0) {
					var message = {
						application_name: "sms",
						package_name: "sms",
						title: push.notifications[0].title,
						body: push.notifications[0].body,
						// Come back to this later, maybe make an independent window for a text profile
						// It's too small to really be discernable of anything.
						icon: (typeof(push.notifications[0].image_url) == "undefined" ? null : push.notifications[0].image_url)
					}
					//console.log(push);
					console.log("SMS received, sending to mirror");
					self.sendSocketNotification("SMS_MESSAGE", message);
				}
				else {
					console.log("Dead Message");
					//console.log(push);
					// Do nothing
				}
			}
			if (push.type === "mirror") { // Ordinary notification
				var notification = {
					application_name: push.application_name,
					id: push.notification_id,
					package_name: push.package_name,
					count: 1,
					icon: push.icon, // base64 data
					title: push.title,
					body: push.body
				};
				//console.log(push);
				console.log("Notification received, sending to mirror");
				self.sendSocketNotification("NOTIFICATION", notification);
			}
			if (push.type === "dismissal") { // Dismissal
				var dismissal = {
					package_name: push.package_name,
					notification_id: push.notification_id
				};
				//console.log("Dismissal received, sending to mirror");
				self.sendSocketNotification("DISMISSAL", dismissal);
			}
		});
	},
});