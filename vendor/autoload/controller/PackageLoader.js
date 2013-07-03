var PackageLoader = function() {
	this.cb = Math.random(0, 100000000000);
	this.current = 0;
	this.batches = [];
	this.modules; // This is initially an array, but changes type to a collection once the class is loaded.
	this.packagePreloader;
	this.modulePreloader;
	this.config;

	// Load kicks off the entire loading process.
	this.load = function(config, loadMap, modules, onload) {
		var scope = this;

		// Config defaults
		config.root = config.root || "";
		config.moduleSrc = config.moduleSrc || "vendor/autoload";
		config.preloader = config.root+ "/" + config.moduleSrc+"/view/PackagePreloader.js",
		config.currentProgress = function() {
			return scope.current/scope.batches.length;
		};

		// TODO: Include location of custom modules e.g. 'module'.

		// TODO: Implement and test console errors where no underscore/backbone is included.
		scope.batches.push(new PackageBatch("Underscore", [config.underscore]));
		scope.batches.push(new PackageBatch("Backbone", [config.backbone]));
		for(label in loadMap) {
			scope.batches.push(new PackageBatch(label, loadMap[label]));
		}
		//scope.batches.push(new PackageBatch("Module Configs", this.getModulePaths(modules)));
		scope.modules = modules;
		scope.onload = onload;
		this.config = config;
		if (config.preloader && config.jQuery) {
			requirejs([
				config.preloader,
				config.jQuery,
				config.root+ "/" + config.moduleSrc + "/model/Module.js",
				config.root+ "/" + config.moduleSrc + "/model/ModuleCollection.js",
			], function() {
				scope.modules = new ModuleCollection({root: config.root});
				scope.modules.setModules(modules);

				//PackagePreloader.instance.init(config);
				scope.packagePreloader = new PackagePreloader();
				scope.packagePreloader.init(config);
				scope.subLoad();
			});
		} else {
			console.error("PackageLoader.load: First argument (config object) requires 'preloader' and 'jQuery' source path properties, or the function cannot run.");
		}
	};

	// This loads the current (not-yet-loaded) batch of packages.
	this.subLoad = function() {
		this.packagePreloader.update();
		var scope = this;
		if (this.current<this.batches.length) {
			this.batches[this.current].require(function() {
				scope.current++;
				scope.subLoad();
			});
		} else {
			scope.packagePreloader.complete(function() {scope.moduleConfigLoad();});
		}
	};
	this.moduleConfigLoad = function() {
		var scope = this;

		this.config.currentProgress = function() {return scope.modules.current();};

		this.modulePreloader = new PackagePreloader();
		this.modulePreloader.init(this.config);
		this.modules.loadConfigs(function() {
			// Each time an update occurs, update the preloader.
			//scope.moduleConfigSubLoad();
			scope.modulePreloader.update();
		}, function() {
			// When the load is finished, move to loading the module items.
			//console.log(3);
			scope.modules.loadModules(function() {
				$(function() {
					scope.modules.loadModuleTemplates(function() {
						scope.onload();
					})
				});
			});
		});
		//this.moduleConfigSubLoad();
		//this.current=0;
	};
	/*this.moduleConfigSubLoad = function() {
		if (this.current<this.modules.initial.length) {
			var moduleName = scope.modules.initial[this.current];
			var modCon = new ModuleConfig(moduleName);
			scope.modules.configs[moduleName] = modCon;
		} else {
			$(function() {
			});
		}
	};*/

	// Returns the current package. The point of this is to be a neat public function.
	this.getCurrentPackage = function() {
		return this.batches[this.current];
	};

	this.getModulePaths = function(modules) {
		// Gets a list of module config paths to be loaded.
		var paths = [];
		$.each(modules, function(idx, name) {
			paths.push("module/"+name+"/module.js?cb="+this.cb);
		});
		return paths;
	};
	this.addModule = function(config) {
		// Adds this config to the module configs.
		// This config also needs to be processed to ensure the correctly-ordered loading of modules and their dependent modules.
		// Several package batches are created according to the module lists and their dependencies.
		this.modules.configs[config.name] = config;
	};
	this.prepareModuleAutoloading = function() {
		// Prepares batches for all modules. This needs to be done after the packages are all loaded, but before the main function is run.
		$.each(this.modules.configs, function(idx, config) {
			if (config.dependencies) {
				// If module needs certain other modules, they need to load in previous batches.
				// Check for modules being loaded in previous batches.
				// - If they're already being loaded in a previous batch, no work needs to be done.
				// - If they're not being loaded in a previous batch or at all, they need to be put in a previous batch.
				$.each(config.dependencies, function(idx, module) {
					var myFish = ["angel", "clown", "mandarin", "surgeon"];
					 
					//removes 0 elements from index 2, and inserts "drum"
					var removed = myFish.splice(2, 0, "drum");
					//myFish is ["angel", "clown", "drum", "mandarin", "surgeon"]
					//removed is [], no elements removed
					 
					//removes 1 element from index 3
					removed = myFish.splice(3, 1);
					//myFish is ["angel", "clown", "drum", "surgeon"]
					//removed is ["mandarin"]

					
				});
			}

			// Model/View batch
			if (config.models) {
				// If module has models, they need to be loaded in this batch.
				$.each(config.models, function(idx, module) {
					
				});
			}
			if (config.models) {
				// If module has views, they need to be loaded in this batch.
				$.each(config.models, function(idx, module) {
					
				});
			}

		});
	};
};

// This is currently automatically a singleton, until a better method of defining the PackageLoader/PackagePreloader relationship and public reference to PackageLoader is defined.
PackageLoader.instance = new PackageLoader();

// Handles a single 'batch' of packages.
var PackageBatch = function(label, batch) {
	this.label = label;
	this.batch = batch;

	this.require = function(complete) {
		requirejs(this.batch, complete);
	};
	
};

/*var ModuleConfig = function(name) {
	this.name = name;
	this.path = "module/"+name+"/module.json";
	this.config;
	this.load = function(complete) {
		var scope = this;
		$.getJSON(this.path, function(config) {
			scope.config = config;
			complete();
		});
	};
};*/