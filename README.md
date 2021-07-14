# derive-benchmark
This is a performance and benchmarking comparison between the [DeriveJS](https://www.npmjs.com/package/derivejs) reactive ODM, and the popular [Mongoose ODM](https://www.npmjs.com/package/mongoose).

The results show the concept behind Derive - in which data operations are "aggregated" together - and are always sent in bulk requests to the DB, eliminating 
multiple seprate calls to the DB, like is done with other ODMs (such as Mongoose) - performs better in situations where lots of different data operations are 
triggered concurrently at roughly the same time.

to run: <br>
Make sure you have a running local MongoDB server on localhost:27017 (or change the `dbUrl` in `app.js` to another url that points to a MongoDB server), <br>
run `npm install`, then run `node app`.
