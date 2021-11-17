# derive-benchmark
This is a performance and benchmarking comparison between the [DeriveJS](https://www.npmjs.com/package/derivejs) reactive ODM, and the popular [Mongoose ODM](https://www.npmjs.com/package/mongoose). It uses [benchmarkJS](https://benchmarkjs.com/) to run the benchmarks.

The results show the concept behind Derive - in which data operations are "aggregated" together - and are always sent in bulk requests to the DB, eliminating 
multiple seprate calls to the DB, like is done with other ODMs (such as Mongoose) - performs better in situations where lots of different data operations are 
triggered concurrently at roughly the same time.

## To run
Make sure you have a running local MongoDB server on localhost:27017 (or change the `dbUrl` in `app.js` to another url that points to a MongoDB server), <br>
run `npm install`, then run `node app`.

## Sample Results
Here are some sample results from running on my local machine. You can see that when issuing a single insert or update (and waiting for a response from the DB after each) - Mongoose is faster, however, once we try to issue several insert or update operations concurrenty at the same time - Derive show much better performances.

```
Insert One
Derive x 219 ops/sec ±6.84% (46 runs sampled)
Average event loop block time: 36.21ms
Mongoose x 526 ops/sec ±2.30% (73 runs sampled)
Average event loop block time: 49.78ms
Fastest is Mongoose


Insert 100
Derive x 64.83 ops/sec ±1.84% (68 runs sampled)
Average event loop block time: 0.00ms
Mongoose x 6.42 ops/sec ±2.61% (34 runs sampled)
Average event loop block time: 140.42ms
Fastest is Derive


Update One
Derive x 66.55 ops/sec ±2.20% (55 runs sampled)
Average event loop block time: 0.00ms
Mongoose x 388 ops/sec ±1.39% (76 runs sampled)
Average event loop block time: 0.00ms
Fastest is Mongoose


Update 1000
Derive x 5.56 ops/sec ±1.48% (30 runs sampled)
Average event loop block time: 359.08ms
Mongoose x 0.47 ops/sec ±2.08% (7 runs sampled)
Average event loop block time: 390.54ms
Fastest is Derive
```
