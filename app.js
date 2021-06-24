const derive = require('derivejs');
const { MongoClient } = require('mongodb');
const Benchmark = require('benchmark');
const mongoose = require('mongoose');
const blocked = require('blocked');
/*
blocked(function(ms) {
    console.log("Blocked for " + ms + " ms");
});
*/
var dbUrl = "mongodb://localhost:27017/";
var dbName =  "benchmark";
derive.Connect
({
    dbUrl,
    dbName,
    defaultMethodsLog: false,
    debugMode: false
})
.then(
    async Model=> {

        // Native MongoDB
        let dbClient = new MongoClient(dbUrl, {useUnifiedTopology: true});
        await dbClient.connect();
        var col = dbClient.db(dbName).collection('DataModels');

        // Derive
		const DataModel = Model({
            key: 1,
            name: "Hello"
        }, "DeriveDataModel");
        // A function that waits until the document is actually inserted, then resolved
        function insertDoc() {
            return new Promise((resolve,reject)=> {
                (new DataModel()).$_dbEvents.once("inserted", (id, document)=> {
                    resolve(document);
                });
            });
        }

        let insertedDoc = await insertDoc();
        function updateDoc(doc=null) {
            if (!doc) doc = insertedDoc;
            return new Promise((resolve,reject)=> {
                doc.name = {
                    $value: "World",
                    $callback: ()=> {
                        resolve();
                    }
                };
            });
        }

        // Mongoose
        mongoose.connect(dbUrl + dbName, {useNewUrlParser: true, useUnifiedTopology: true});
        const db = mongoose.connection;
        db.once('open', async function() {

            const ModelSchema = new mongoose.Schema({
                key:Number,
                name:String
            });
            const DocModel = mongoose.model("MongooseDataModel", ModelSchema);

            function mongooseUpdate(mongooseDoc) {
                mongooseDoc.name = "World";
                return mongooseDoc.save({validateBeforeSave:false});
            }

            /*----------------------------------------*/
            // insertOne
            /*
            Benchmark.Suite()
            //.add("Mongo insertOne", {
            //    defer: true,
            //    fn: async function(deferred) {
            //        await col.insertOne({key:1, name:"Hello"});
            //        deferred.resolve();
            //    }
            //})
            .add("Derive insertOne", {
                defer: true,
                fn: async function(deferred) {
                    await insertDoc();
                    deferred.resolve();
                }
            })
            .add("Mongoose insertOne", {
                defer: true,
                fn: async function(deferred) {
                    await new DocModel({key:1, name:"Hello"}).save({validateBeforeSave: false});
                    deferred.resolve();
                }
            })
            .on('cycle', function(event) {
                console.log(String(event.target));
            })
            .on('complete', function() {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
            })
            .run({ 'async': true });        
            */

            /*----------------------------------------*/


            // insertMany
            /*
            let count = 100;
            let deriveMany = [];
            let mongooseMany = [];
            while (count-- > 0) {
                deriveMany.push (insertDoc());
                mongooseMany.push(new DocModel({key:1, name:"Hello"}).save({validateBeforeSave: false}));
            }

            Benchmark.Suite()
            // .add("Mongo insertMany", async function() {
            //    await col.insertMany(manyDocs);
            //})
            .add("Derive insertMany", {
                defer: true,
                fn: async function(deferred) {
                    await Promise.all(deriveMany);
                    deferred.resolve();
                }
            })
            .add("Mongoose insertMany", {
                defer: true,
                fn: async function(deferred) {
                    // await DocModel.insertMany(manyDocs, {validateBeforeSave: false});
                    await Promise.all(mongooseMany);
                    deferred.resolve();
                }
            })
            .on('cycle', function(event) {
                console.log(String(event.target));
            })
            .on('complete', function() {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
            })
            .run({ 'async': true });        
            */
            /*----------------------------------------*/

            /*
            let mongooseDoc = await new DocModel({key:1, name:"Hello"}).save({validateBeforeSave: false})
            Benchmark.Suite()
            .add("Derive Update One", {
                defer: true,
                fn: async function(deferred) {
                    await updateDoc();
                    deferred.resolve();
                }
            })
            .add("Mongoose Update One", {
                defer: true,
                fn: async function(deferred) {
                    await mongooseUpdate(mongooseDoc);
                    deferred.resolve();
                }
            })
            .on('cycle', function(event) {
                console.log(String(event.target));
            })
            .on('complete', function() {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
            })
            .run({ 'async': true });    
            /*----------------------------------------*/


            let docCount = 1000;
            let mongooseDocs = await DocModel.find({ key: 1 }, null, { limit: docCount }).exec();
            let deriveDocs = await DataModel.getAll({key:1}, null, docCount);

            Benchmark.Suite()
            //.add("Mongo insertMany", async function() {
            //    await col.insertMany(manyDocs);
            //})
            .add("Derive updateMany", {
                defer: true,
                fn: async function(deferred) {
                    let count = docCount;
                    let deriveUpdateMany = [];
                    while (count-- > 0) {
                        deriveUpdateMany.push (updateDoc(deriveDocs[count]));
                    }

                    await Promise.all(deriveUpdateMany);
                    deferred.resolve();
                }
            })
            .add("Mongoose updateMany", {
                defer: true,
                fn: async function(deferred) {
                    let count = docCount;
                    let mongooseUpdateMany = [];
                    while (count-- > 0) {
                        mongooseUpdateMany.push(mongooseUpdate(mongooseDocs[count]));
                    }
                    await Promise.all(mongooseUpdateMany);
                    deferred.resolve();
                }
            })
            .on('cycle', function(event) {
                console.log(String(event.target));
            })
            .on('complete', function() {
                console.log('Fastest is ' + this.filter('fastest').map('name'));
            })
            .run({ 'async': true });        

        });
    }
);
