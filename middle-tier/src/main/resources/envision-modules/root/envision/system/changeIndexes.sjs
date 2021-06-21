'use strict';

declareUpdate();
var admin = require('/MarkLogic/admin.xqy');
var dbid = xdmp.database("data-hub-FINAL");
var output = [];

var user;


function deleteRangeElementIndex(dbid, type, name, collation){
	let config2 = admin.getConfiguration();
	let rangespec = admin.databaseRangeElementIndex(type, "", name, collation, fn.false());
	let config3 = admin.databaseDeleteRangeElementIndex(config2, dbid, rangespec);
	admin.saveConfigurationWithoutRestart(config3);
	xdmp.log(["Deleted   ","ElementRangeIndex", name, type, collation]);
}

function addRangeElementIndex(dbid, type, name, collation){
	let config1 = admin.getConfiguration();
	let rangespec = admin.databaseRangeElementIndex(type, "", name, collation, fn.false());
	let config2 = admin.databaseAddRangeElementIndex(config1, dbid, rangespec);
	admin.saveConfigurationWithoutRestart(config2);
	xdmp.log(["Added     ", "ElementRangeIndex", name, type, collation]);
}

function addRangePathIndex(dbid, type, name, collation, entityName){
	let pathEx = "/(es:envelope|envelope)/(es:instance|instance)/" + entityName + "/"+name;

	let config1 = admin.getConfiguration();
	let PRISpec = admin.databaseRangePathIndex(dbid, type, pathEx, collation, fn.false(), "reject");
	let config2 = admin.databaseAddRangePathIndex(config1, dbid, PRISpec);
	admin.saveConfigurationWithoutRestart(config2);
}

function deleteRangePathIndex(dbid, type, name, collation, entityName){
	let pathEx = "/(es:envelope|envelope)/(es:instance|instance)/" + entityName + "/"+name;

	let config2 = admin.getConfiguration();
	let PRISpec = admin.databaseRangePathIndex(dbid, type, pathEx, collation, fn.false(), 'reject');
	let config3 = admin.databaseDeleteRangePathIndex(config2, dbid, PRISpec);
	admin.saveConfigurationWithoutRestart(config3);
}

function addElementWordLexicon (dbid, name, collation){

	let config1 = admin.getConfiguration();
	let lexspec = admin.databaseElementWordLexicon("", name, collation );
	let config2 = admin.databaseAddElementWordLexicon(config1, dbid, lexspec);
	admin.saveConfigurationWithoutRestart(config2);
	xdmp.log(["ElementWordLexison", name]);
}

function deleteElementWordLexicon(dbid, name, collation){

	let config2 = admin.getConfiguration();
	let lexiconspec = admin.databaseElementWordLexicon("", name, collation);
	let config3 = admin.databaseDeleteElementWordLexicon(config2, dbid, lexiconspec);
	admin.saveConfigurationWithoutRestart(config3);
}

var result = [];

function main(){

	var modelUri = `/envision/${user || ''}/currentModel.json`;

	xdmp.log("Following indexes are configured based on : " + modelUri);
	xdmp.log("     1. Element Range Index,");
	xdmp.log("     2. Path Range Index, and ");
	xdmp.log("     3. Element Word Lexicon");

	var doc = cts.doc(modelUri);
	var entityList = doc.root.nodes.toObject();
	var entities = Object.keys(entityList);

	for (let en in entities){   // iterate each entity
		let entityName = entityList[entities[en]].entityName;
		let properties = entityList[entities[en]].properties;

		for (let i=0;i< properties.length;i++){   // iterate each property
			let name = properties[i].name;
			let type = xs.string(properties[i].type);
			let collation ="";
			if (type=='string'){
				collation = "http://marklogic.com/collation/";
			}

			// Element Range Index setting
			if (properties[i].isElementRangeIndex == true){
				try{
					addRangeElementIndex(dbid, type, name, collation);
				}
				catch (err)
				{
					if (err.name==="ADMIN-DUPLICATECONFIGITEM"){
						xdmp.log(name + " is already in ElementRangeIndex","debug");
					}else{
						xdmp.log(err);
					}
				}
			}else{
				try{
					deleteRangeElementIndex(dbid, type, name, collation);
				}
				catch (err)
				{
					if (err.name==="ADMIN-NOSUCHITEM"){
						xdmp.log(name + " is not yet in ElementRangeIndex","debug");
					}else{
						xdmp.log(err)
					}
				}
			}

			// Element Word Lexicon setting
			if (type == "string"){
				if (properties[i].isWordLexicon == true ){
					try{
						addElementWordLexicon(dbid, name, collation);
					}
					catch (err)
					{
						if (err.name==="ADMIN-DUPLICATECONFIGITEM"){
							xdmp.log(name + " is already in ElementWordLexicon","debug");
						} else if(err.name==="ADMIN-INVALIDCONFIG") {
							xdmp.log("INVALIDCONFIG error happens in ElementWordLexicon");
						} else{
							xdmp.log(err);
						}
					}
				}else{
					try{
						deleteElementWordLexicon(dbid, name, collation);
					}
					catch (err)
					{
						if (err.name==="ADMIN-NOSUCHITEM"){
							xdmp.log(name + " is not yet in ElementWordLexicon","debug");
						}else{
							xdmp.log(err)
						}
					}
				}
			}

			// Path Range Index setting

			if (properties[i].isRangeIndex == true){
				try{
					addRangePathIndex(dbid, type, name, collation, entityName);
				}
				catch (err)
				{
					if (err.name==="ADMIN-DUPLICATECONFIGITEM"){
						xdmp.log(name + " is already in PathRangeIndex","debug");
					}else{
						xdmp.log(err);
					}
				}
			}else{
				try{
					deleteRangePathIndex(dbid, type, name, collation, entityName);
				}
				catch (err)
				{
					if (err.name==="ADMIN-NOSUCHITEM"){
						xdmp.log(name + " is not yet in PathRangeIndex","debug");
					}else{
						xdmp.log(err)
					}
				}
			}
		}
	}
}


main()
fn.true()
