var Router = Backbone.Router.extend({
	routes: {
		"combat/:idx": "viewCombat",
		"*path": "viewDefault",
	},

	viewCombat: function(vehicleID) {
		// Load combat template.
		// Pass vehicle ID.
		console.log("Combat with vehicle", vehicleID);
	},
	viewDefault: function(path) {
		if (path) {
			this.view404();
		} else {
			this.viewHome();
		}
	},
	view404: function(path) {
		console.log("404!", path);
	},
	viewHome: function() {
		console.log("Home!");
	},
});
