const derive = require('derivejs');
const { MongoClient } = require('mongodb');
const Benchmark = require('benchmark');
const mongoose = require('mongoose');
const blocked = require('blocked-at');

var totalBlocks = 0;
var blockTimeAverage = 0;
blocked(function(ms) {
    // console.log("Blocked for " + ms + " ms");
    blockTimeAverage =  blockTimeAverage + ms / ++totalBlocks;
});

/*
blocked((time, stack, {type, resource}) => {
    console.log(`Blocked for ${time}ms, operation started here:`, stack)
    if (type === 'HTTPPARSER' && resource) {
      // resource structure in this example assumes Node 10.x
      console.log(`URL related to blocking operation: ${resource.resource.incoming.url}`)
    }
}, {resourcesCap: 100})
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

        function runBenchmark (description, deriveFunc, mongooseFunc) {
            console.log ("\r\n\r\n" + description);
            totalBlocks = 0;
            blockTimeAverage = 0;
            return new Promise ((resolve,reject)=> {
                Benchmark.Suite()
                .add("Derive", {
                    defer: true,
                    fn: deriveFunc
                })
                .add("Mongoose", {
                    defer: true,
                    fn: mongooseFunc
                })
                .on('cycle', function(event) {
                    console.log(String(event.target));
                    console.log ("Average event loop block time: " + blockTimeAverage.toFixed(2) + "ms");
                })
                .on('complete', function() {
                    console.log('Fastest is ' + this.filter('fastest').map('name'));
                    resolve();
                })
                .run({async: true});
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

            /*----------------------------------------*
             * Insert One                             *
             *----------------------------------------*/
            await runBenchmark (
                "Insert One", 
                async function(deferred) {
                    await insertDoc();
                    deferred.resolve();
                },
                async function(deferred) {
                    await new DocModel({key:1, name:"Hello"}).save({validateBeforeSave: false});
                    deferred.resolve();
                }
            );

            /*----------------------------------------*
             * Insert Many                            *
             *----------------------------------------*/            
            // Change this value to test with a larger amount of documents
            var docCount = 100;
            await runBenchmark (
                "Insert " + docCount, 
                async function(deferred) {
                    let count = docCount;
                    let deriveMany = [];
                    while (count-- > 0) {
                        deriveMany.push (insertDoc());
                    }
                    await Promise.all(deriveMany);
                    deferred.resolve();
                },                
                async function(deferred) {
                    let count = docCount;
                    let mongooseMany = [];
                    while (count-- > 0) {
                        mongooseMany.push(
                                new DocModel({key:1, name:"Hello"}).save({validateBeforeSave: false}));
                    }
                    await Promise.all(mongooseMany);
                    deferred.resolve();
                }                
            );

            /*----------------------------------------*
             * Update One                             *
             *----------------------------------------*/

            let mongooseDoc = await new DocModel({key:1, name:"Hello"}).save({validateBeforeSave: false});

            await runBenchmark.call (this, 
                "Update One",
                async function(deferred) {
                    await updateDoc();
                    deferred.resolve();
                },
                async (deferred)=> {
                    await mongooseUpdate(mongooseDoc);
                    deferred.resolve();
                }                            
            );

            /*----------------------------------------*
             * Update Many                            *
             *----------------------------------------*/

            // Change this value to test with a larger amount of documents
            var docCount = 1000;
            let mongooseDocs = await DocModel.find({ key: 1 }, null, { limit: docCount }).exec();
            let deriveDocs = await DataModel.getAll({key:1}, null, docCount);

            await runBenchmark.call (this, 
                "Update " + docCount,
                async function(deferred) {
                    let count = docCount;
                    let deriveUpdateMany = [];
                    while (count-- > 0) {
                        deriveUpdateMany.push (updateDoc(deriveDocs[count]));
                    }

                    await Promise.all(deriveUpdateMany);
                    deferred.resolve();
                },
                async(deferred)=> {
                    let count = docCount;
                    let mongooseUpdateMany = [];
                    while (count-- > 0) {
                        mongooseUpdateMany.push(mongooseUpdate(mongooseDocs[count]));
                    }
                    await Promise.all(mongooseUpdateMany);
                    deferred.resolve();
                }                
            );

        });
    }
);
