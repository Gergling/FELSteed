// TODO: Base on Backbone if still available.

var ModuleCollection = function() {
	this.modules = {};
	this.loadIndexes = {};
	this.totalConfigsLoaded = 0;
	this.batches = {};
	this.currentBatch = 1;
	this.setModules = function(modules) {
		var scope = this;
		for(var idx in modules) {
			var name = modules[idx];
			this.modules[name] = new Module({
				name: name,
				configFile: "module.json",
				modulePath: "module/"+name,
			});
		}
	};
	this.loadConfigs = function(update, complete) {
		var scope = this;
		for(var i in this.modules) {
			var module = this.modules[i];
			module.loadConfig(function() {scope.loadComplete();});
		};
		this.update = update;
		this.complete = complete;
	};
	this.loadModules = function(complete) {
		this.assignDependencies();
		this.setLoadIndexOrder();
		this.loadCurrentBatch(complete);
	};
	this.loadCurrentBatch = function(complete) {
		var scope = this;
		if (this.hasBatch(this.currentBatch)) {
			var batch = this.getBatch(this.currentBatch);
			/*requirejs(batch, function() {
				scope.currentBatch++;
				scope.loadCurrentBatch(complete);
			});*/
			this.loadSubBatch(batch, function() {
				scope.currentBatch++;
				scope.loadCurrentBatch(complete);
			});
		} else {
			// The only empty batch should be the one which indicates
			complete();
		}
	};
	this.subBatchOrder = [
		"preModule",
		"modelView",
		"preCollectionTemplate",
		"collection",
		"postModule",
	];
	this.currentSubBatch = 0;
	this.loadSubBatch = function(batch, complete) {
		var scope = this;
		var subBatchName = this.subBatchOrder[this.currentSubBatch];
		if (this.currentSubBatch<this.subBatchOrder.length) {
			var oncomplete = function() {
				scope.currentSubBatch++;
				scope.loadSubBatch(batch, complete);
			};
			if (batch[subBatchName] && batch[subBatchName].length) {
				requirejs(batch[subBatchName], oncomplete);
			} else {
				oncomplete();
			}
		} else {
			complete();
		}
	};
	this.hasBatch = function(batchIDX) {
		return this.batches[batchIDX];
	};
	this.getBatch = function(batchIDX) {
		var batch = {};
		var scope = this;
		if (this.hasBatch(batchIDX)) {
			$.each(this.batches[batchIDX], function(moduleName, module) {
				$.each(scope.subBatchOrder, function(idx, subBatchName) {
					// Need to handle each sub-batch
					var subBatch = batch[subBatchName] || [];
					subBatch = subBatch.concat(module.getLoadBatches()[subBatchName]);
					batch[subBatchName] = subBatch;
				});
			});
		} else {
			// TODO: Throw an exception
			console.log("bugger!", batchIDX);
		}
		return batch;
	};
	this.loadComplete = function() {
		this.totalConfigsLoaded++;
		this.update();
		if (this.totalConfigsLoaded>=this.length()) {
			this.complete();
		}
	};
	this.loadModuleTemplates = function(loadedFunction) {
		var scope = this;
		// Loaded function will include completion function if all modules are fully loaded.
		$.each(this.modules, function(moduleName, module) {
			module.initiateTemplateLoads(function() {
				scope.loadedModuleTemplates.push(moduleName);
				scope.loadTemplateModuleComplete(loadedFunction);
			});
		});
	};
	this.loadedModuleTemplates = [];
	this.loadTemplateModuleComplete = function(loadedFunction) {
		if (this.loadedModuleTemplates.length>=this.length()) {
			loadedFunction();
		}
	};
	this.length = function() {
		return Object.keys(this.modules).length;
	};
	this.current = function() {
		return this.totalConfigsLoaded/this.length();
	};
	this.assignDependencies = function() {
		// Loop through each module, get the dependencies, load the dependencies in a batch previous to the current batch.
		// Probably an array can be used, and an index giving names of modules and their batch indexes.
		var scope = this;
		$.each(this.modules, function(moduleName, module) {
			// Get the dependencies
			var dependencies = module.getDependencyNames();

			// The loadIndex stores the number of the batch which loads the module.
			// If there is no loadIndex, the module has not been referred to yet for loading.
			var loadIndex = scope.loadIndexes[moduleName] || 0;
			$.each(dependencies, function(idx, dependencyName) {
				var dependency = scope.modules[dependencyName];
				dependency.assignDependent(module);
				module.assignDependency(dependency);
			});
		});
	};
	this.setLoadIndexOrder = function() {
		// Assign all the root dependencies to the first batch.
		var roots = this.getRootDependencies();
		var scope = this;
		$.each(roots, function(moduleName, module) {
			//this.loadIndexes[moduleName] = 1;
			scope.setDependentLoadIndex(module);
		});

	};
	this.setDependentLoadIndex = function(module) {
		var moduleName = module.getName();
		var scope = this;
		//if (this.loadIndexes[moduleName]) {
		if (this.hasLoadIndex(moduleName)) {
			// If it has a batch we're going to assume the dependencies have a load index as well, and we're going to handle the dependents.
			$.each(module.getDependents(), function(moduleName, dependent) {
				scope.setDependentLoadIndex(dependent);
			});
		} else {
			// There is no load index, we have to check if the dependencies have a load index.
			// Set the load index based on the highest dependency load index.
			// This will not run for roots. Roots require a special case.
			var highestLoadIndex = 0;
			$.each(module.getDependencies(), function(dependencyName, dependency) {
				// If any one of these doesn't have a load index, we'll load one into it.
				if (!scope.hasLoadIndex(dependencyName)) {
					scope.setDependentLoadIndex(dependency);
				}
				highestLoadIndex = Math.max(dependency.getLoadIndex(), highestLoadIndex);
			});
			this.setLoadIndex(highestLoadIndex+1, module);

			// Roots will not have any dependencies, and their dependents need to be handled.
			if (Object.keys(module.getDependencies()).length==0) {
				this.setDependentLoadIndex(module);
			}
		}
	};

	this.getRootDependencies = function() {
		var roots = {};
		$.each(this.modules, function(moduleName, module) {
			roots = $.extend(roots, module.getRootDependencies());
		});
		return roots;
	};

	this.setLoadIndex = function(idx, module) {
		// IDX is the batch index.
		var moduleName = module.getName();
		module.setLoadIndex(idx);
		this.loadIndexes[moduleName] = idx;
		if (!this.batches[idx]) {this.batches[idx] = {};}
		this.batches[idx][moduleName] = module;
	};
	this.hasLoadIndex = function(moduleName) {
		return this.loadIndexes[moduleName];
	};
};

/*
{
	"dependencies": [
		// List of modules which will need to be loaded before this module.
	],
	"models": [
		// List of models which will need to be loaded up before the collections.
	],
	"collections": [
		// List of collections. It is assumed the models are needed first.
	],
	"views": [
		// List of views which will be loaded up before the templates.
	],
	"templates": [
		// List of templates. It is assumed the views are needed first.
	],
	"special": {
		// Any unstructured or specific files to be loaded go in here (including any controllers until they have a popular structure):
		"preModule": [
			// Loads before any dependencies
		],
		"preModelView": [
			// Loads after dependencies and before models/views
		],
		"preCollectionTemplate": [
			// Loads after model/view and before collections/templates
		],
		"postModule": [
			// Loads after module has been loaded.
		]
	}
}
*/
