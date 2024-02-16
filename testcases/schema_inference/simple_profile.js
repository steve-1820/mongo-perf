load('testcases/schema_inference/sample_json/transactions_large_array.js')

if ( typeof(tests) != "object" ) {
    tests = [];
}

/*
 * Setup:
 * Test: Insert empty documents into database
 * Notes: Let mongod create missing _id field
 *        The generated Object ID for _id will be monotically increasing, and
 *            the index on _id will continually add entries larger than
 *            any current entry.
 */

tests.push( { name: "Insert.TransactionsLarge.Schema",
              tags: [],
              pre: function( collection ) {
                collection.drop();
                collection.runCommand( "create", { inferSchema : true } );
              },
              ops: [
                  { op:  "insert",
                    doc: transactionsLargeJson
                  }
              ] } );
