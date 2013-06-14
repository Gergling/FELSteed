// TODO: Base on Backbone if still available.

var Module = function(def) {
	this.config;
	this.modulePath = def.modulePath;
	this.configFile = def.configFile;
	this.configPath = this.modulePath+"/"+this.configFile;
	this.name = def.name;
	this.dependents = {};
	this.dependencies = {};
	this.batch;
	this.loadIndex = 0;
	this.loadConfig = function(complete) {
		// jQuery should be loaded by now.
		var scope = this;
		$.getJSON(this.configPath, function(config) {
			scope.config = config;
			complete();
		})
		.fail(function(response,type) {
			var msg = "";
			switch(type) {
				case "parsererror":
					msg = "There is an error in the JSON syntax at "+scope.configPath;
				break;
				default:
					msg = "An error of type '"+type+"' has occurred.";
				break;
			}
			console.error("Module Config Load Error '"+scope.name+"':", msg);
		});
	};
	/*this.loadModule = function(complete) {
		var batches = this.getLoadBatches();
		// TODO: Find an alternative to the deep-indentation pattern, perhaps one which expresses the module components loading better.
		var scope = this;
		this.loadBatch(batches.preModule, function() {
			scope.loadBatch(batches.modelView, function() {
				scope.loadBatch(batches.preCollectionTemplate, function() {
					scope.loadBatch(batches.collectionTemplate, function() {
						scope.loadBatch(batches.postModule, function() {
							complete();
						});
					});
				});
			});
		});
	};
	this.loadBatch = function(batch, complete) {
		if (batch.length) {
			requirejs(batch, complete);
		} else {
			complete();
		}
	};*/
	this.getLoadBatches = function() {
		var scope = this;
		var batches = {};

		// Pre-Module
		if (this.config.special && this.config.special.preModule) {
			batches.preModule = [];
			$.each(this.config.special.preModule, function(idx, path) {
				batches.preModule.push(path);
			});
		}

		// Models/Views
		if (this.config.models || this.config.views) {
			batches.modelView = [];
			if (this.config.models) {
				$.each(this.config.models, function(idx, modelName) {
					console.log(modelName, scope.getComponentPath("model", modelName));
					batches.modelView.push(scope.getComponentPath("model", modelName));
				});
			}
			if (this.config.views) {
				$.each(this.config.views, function(idx, moduleName) {
					batches.modelView.push(scope.getComponentPath("view", moduleName));
				});
			}
		}

		// Pre-Collection/Template
		if (this.config.special && this.config.special.preCollectionTemplate) {
			batches.preCollectionTemplate = [];
			$.each(this.config.special.preCollectionTemplate, function(idx, path) {
				batches.preCollectionTemplate.push(path);
			});
		}

		// Collections/Templates
		if (this.config.collections || this.config.templates) {
			batches.collectionTemplate = [];
			if (this.config.collections) {
				$.each(this.config.collections, function(idx, moduleName) {
					batches.collectionTemplate.push(scope.getComponentPath("model", moduleName));
				});
			}
			if (this.config.templates) {
				$.each(this.config.templates, function(idx, moduleName) {
					batches.collectionTemplate.push(scope.getComponentPath("view", moduleName));
				});
			}
		}

		// Post-Module
		if (this.config.special && this.config.special.postModule) {
			batches.postModule = [];
			$.each(this.config.special.postModule, function(idx, path) {
				batches.postModule.push(path);
			});
		}

		return batches;
	};
	this.getComponentPath = function(type, name) {
		var path = "";
		switch(type) {
			case "model": case "collection": {
				path = "model";
			} break;
			case "view": case "template": {
				path = "view";
			} break;
			default: {
			}
		}
		return this.modulePath+"/"+path+"/"+name+".js";
	};
	this.getDependencyNames = function() {
		if (this.config) {
			if (this.config.dependencies) {
				return this.config.dependencies;
			} else {
				return [];
			}
		} else {
			throw "Config must be loaded first.";
		}
	};
	this.getDependencies = function() {
		// TODO: Various exception handling.
		return this.dependencies;
	};
	this.getDependents = function() {
		// TODO: Various exception handling.
		return this.dependents;
	};
	this.getRootDependencies = function() {
		var dependencies = {};
		if (Object.keys(this.getDependencies()).length) {
			$.each(this.getDependencies(), function(moduleName, module) {
				dependencies = $.extend(dependencies, module.getRootDependencies());
			});
		} else {
			dependencies[this.getName()] = this;
		}
		return dependencies;
	};
	this.getName = function() {
		return this.name;
	};
	this.assignDependent = function(module) {
		this.dependents[module.getName()] = module;
	};
	this.assignDependency = function(module) {
		this.dependencies[module.getName()] = module;
	};
	this.assignBatch = function(dependentBatchNumber) {
		this.batch = {
			first: dependentBatchNumber-2,
			second: dependentBatchNumber-1,
		};
	};
	this.getBatch = function() {
		return this.batch;
	};
	this.setLoadIndex = function(idx) {
		this.loadIndex = idx;
	};
	this.getLoadIndex = function() {
		return this.loadIndex;
	};
};
