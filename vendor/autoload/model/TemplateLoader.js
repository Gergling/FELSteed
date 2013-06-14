var TemplateLoader = Backbone.Collection.extend({
	model: TemplateModel,
	load: function(id, src) {
		this.add(function() {
			var model = new TemplateModel({id:id,src:src});
			//model.load();
			return model;
		}());
	},
});
TemplateLoader.instance = new TemplateLoader();