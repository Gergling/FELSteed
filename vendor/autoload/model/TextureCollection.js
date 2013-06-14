var TextureCollection = Backbone.Collection.extend({model:Texture,getTotalItems: function() {return this.length;}});
TextureCollection.instance = new TextureCollection();
