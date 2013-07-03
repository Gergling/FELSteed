// TODO: Base on Backbone if still available.

var Module = function(def) {
	this.config;
	this.root = def.root || "";
	this.modulePath = this.root+"/"+def.modulePath;
	this.configFile = def.configFile;
	this.configPath = this.modulePath+"/"+this.configFile;
	this.name = def.name;
	this.dependents = {};
	this.dependencies = {};
	this.batch = 0;
	this.templateLoadStatus = [];
	this.loadIndex = 0;
	this.loadBatches;
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

		// Collections
		if (this.config.collections) {
			batches.collection = [];
			if (this.config.collections) {
				$.each(this.config.collections, function(idx, moduleName) {
					batches.collection.push(scope.getComponentPath("model", moduleName));
				});
			}
			/*if (this.config.templates) {
				// This needs to go in separately from collections, as templates are html and will need ajax.
				$.each(this.config.templates, function(idx, moduleName) {
					batches.template.push(scope.getComponentPath("view", moduleName));
				});
			}*/
		}

		// Post-Module
		// Get the critical template-loading working first, then we can come back to these.
		/*if (this.config.special && this.config.special.postModule) {
			batches.postModule = [];
			$.each(this.config.special.postModule, function(idx, path) {
				batches.postModule.push(path);
			});
		}*/

		return batches;
	};
	this.initiateTemplateLoads = function(loadedFunction) {
		var scope = this;
		// Templates
		if (this.config.templates && this.config.templates.length) {
			$.each(this.config.templates, function(idx, templateName) {
				// Create html container in head, id'd after module/name combination.
				var templateContainer = $("<script>")
					.attr("type", "text/template")
					.attr("id", scope.getTemplateId(templateName))
					.load(scope.getTemplatePath(templateName), function(response, status, xhr) {
						// Update a template load status listing of some kind.
						scope.setTemplateLoadStatus(templateName);
						// Run a function which checks template loadings.
						// If they're all loaded, run complete.
						if (scope.hasAllTemplatesLoaded()) {
							loadedFunction();
						}
					})
				;
				$('head').append(templateContainer);
				// Ajax html template into container.
			});
		} else {
			loadedFunction();
		}
	};
	this.setTemplateLoadStatus = function(templateName) {
		this.templateLoadStatus.push(templateName); 
	};
	this.hasAllTemplatesLoaded = function() {
		if (this.config.templates && this.config.templates.length) {
			return this.config.templates.length==this.templateLoadStatus.length;
		} else {
			return true;
		}
	};
	this.getTemplateId = function(templateName) {
		return this.name+"-"+templateName;
	};
	this.getTemplatePath = function(templateName) {
		return this.modulePath+"/view/"+templateName+".html";
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
