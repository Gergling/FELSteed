var TemplateModel = Backbone.Model.extend({
	//<iframe id="sldvjb" type="text/html" src="module/tabulator/view/TabTemplate.html"></iframe>
	// $('#sldvjb').contents().find('body').html()
	id:"",
	src:"",
	initialize: function() {
		this.load();
	},
	load: function() {
		var _this = this;
		var jqiframe = $('<iframe>')
			.attr({
				id:this.id,
				src:this.src,
				type:"text/html",
				onload: "console.log(3, $(_this.id).contents().find('body').html());",
			}).ready(function(a,b,c) {
				var selector = '#'+_this.id;
				console.log(4,a,b,c);
				console.log(1, 
					$(selector), 
					$(selector).contents(), 
					$(selector).contents().find('body'), 
					$(selector).contents().find('body').html()
				);
			});
		;
		//console.log(2, jqiframe.contents().find('body').html());
		//console.log(jqiframe.contents().find('body').html());
		$('body').append(jqiframe);
	},
});