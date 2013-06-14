var Texture = Backbone.Model.extend({
	idAttribute: "name",
	name:"",
	url:"",
	texture:null,
	initialize: function(name, url) {
		this.name = name;
		this.url = url+"?cb="+Math.random();
	},
	load: function(onload) {
		try {
			this.set("texture", THREE.ImageUtils.loadTexture(this.get("url"), new THREE.UVMapping(), function() {
				onload();
			}, function(e) {
				console.error("Texture Loading Error:",e,"If it's cross-origin on chrome, then you probably want to start up chrome with --allow-file-access-from-files.");
			}));
		} catch (e) {
			console.error("Caught!", e);
		}
	},
});