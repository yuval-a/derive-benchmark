# derive-benchmark
This is a performance and benchmarking comparison between the [DeriveJS](https://www.npmjs.com/package/derivejs) reactive ODM, and the popular [Mongoose ODM](https://www.npmjs.com/package/mongoose). It uses [benchmarkJS](https://benchmarkjs.com/) to run the benchmarks.

The results show the concept behind Derive - in which data operations are "aggregated" together - and are always sent in bulk requests to the DB, eliminating 
multiple seprate calls to the DB, like is done with other ODMs (such as Mongoose) - performs better in situations where lots of different data operations are 
triggered concurrently at roughly the same time.

to run: <br>
Make sure you have a running local MongoDB server on localhost:27017 (or change the `dbUrl` in `app.js` to another url that points to a MongoDB server), <br>
run `npm install`, then run `node app`.

Here are some example results from running in my local machine. You can see that when issuing a single insert or update (and waiting for a response from the DB after each) - Mongoose is faster, however once we try to issue several insert or update operations concurrenty at the same time - Derive show much better performances.

```
Insert One
Derive x 284 ops/sec ±6.52% (56 runs sampled)
Average event loop block time: 37.26ms
Mongoose x 482 ops/sec ±2.02% (72 runs sampled)
Average event loop block time: 37.26ms
Fastest is Mongoose


Insert 100 (Inserting 100 documents concurrently)
Derive x 49.82 ops/sec ±4.97% (58 runs sampled)
Average event loop block time: 122.86ms
Mongoose x 5.82 ops/sec ±2.46% (31 runs sampled)
Average event loop block time: 145.38ms
Fastest is Derive


Update One
Derive x 72.54 ops/sec ±3.37% (47 runs sampled)
Average event loop block time: 0.00ms
Mongoose x 378 ops/sec ±2.38% (76 runs sampled)
Average event loop block time: 0.00ms
Fastest is Mongoose


Update 1000 (Updating 1000 documents concurrently)
Derive x 4.92 ops/sec ±1.73% (28 runs sampled)
Average event loop block time: 363.43ms
Mongoose x 0.45 ops/sec ±2.73% (7 runs sampled)
Average event loop block time: 397.76ms
Fastest is Derive
```
