load('testcases/schema_inference/sample_json/airbnb.js')
load('testcases/schema_inference/sample_json/companies.js')
load('testcases/schema_inference/sample_json/transactions.js')
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

function generateNested(depth) {
  if (depth === 0) {
      return {"foo": "bar"};
  }

  // const oppositeType = type === '$and' ? '$or' : '$and';
  const object = {};
  const child = generateNested(depth - 1);
  object["level" + depth] = child;
  return object;
}

function generateUnionArray(length) {
  let arr = []
  for (let i = 0; i < length; i++) {
      if (i % 5 === 0) {
        arr.push("foo");
      } else if (i % 3 === 0) {
        arr.push(false);
      } else {
        arr.push({
          "index": i
        });
      }
  }

  return {"foo": arr};
}

function generateSimpleArray(length, type) {
  switch(type) {
    case "string":
      return {"foo": Array.apply(null, Array(length)).map(function (x, i) { return "foo"; })}
    case "integer":
        return {"foo": Array.apply(null, Array(length)).map(function (x, i) { return i; })}
    default:
      break;
  }
}

function generateIdAsKey(length, type) {
  let obj = {}
  switch(type) {
    case "objectID":
      for (let i = 0; i < length; i++) {
        id = ObjectId()
        obj[id.valueOf()] = {"foo": "bar"}
      }
      return obj
    case "UUID":
      for (let i = 0; i < length; i++) {
        id = UUID()
        obj[id.toString().split('"')[1]] = {"foo": "bar"}
      }
      return obj
    default:
      break;
  }
}

workloads = [
  {
    name: "Base",
    doc: {
      string: "string",
      integer: NumberInt("9"),
      long: NumberLong("2555555000005"),
      decimal: NumberDecimal("1000.55"),
      date: Date(),
      bool: false,
    }
  },
  {
    name: "SmallNested",
    doc: generateNested(5)
  },
  {
    name: "MedNested",
    doc: generateNested(25)
  },
  {
    name: "LargeNested",
    doc: generateNested(80)
  },
  {
    name: "SmallSimpleStringArray",
    doc: generateSimpleArray(20, "string")
  },
  {
    name: "LargeSimpleStringArray",
    doc: generateSimpleArray(100, "string")
  },
  {
    name: "SmallSimpleIntegerArray",
    doc: generateSimpleArray(20, "integer")
  },
  {
    name: "LargeSimpleIntegerArray",
    doc: generateSimpleArray(100, "integer")
  },
  {
    name: "SmallUnionArray",
    doc: generateUnionArray(20)
  },
  {
    name: "LargeUnionArray",
    doc: generateUnionArray(100)
  },
  {
    name: "IDAsKeyObjectID",
    doc: generateIdAsKey(100, "objectID")
  },
  {
    name: "IDAsKeyUUID",
    doc: generateIdAsKey(100, "UUID")
  },
  {
    name: "Airbnb",
    doc: airbnbJson
  },
  {
    name: "Companies",
    doc: companiesJson
  },
  {
    name: "Transactions",
    doc: transactionsJson
  },
  {
    name: "TransactionsLarge",
    doc: transactionsLargeJson
  }
]


// print("workloadsworkloads")
// print(workloads)
for(let i = 0; i < workloads.length; i++) {
  workload = workloads[i];
  tests.push( { name: `Insert.${workload.name}`,
              tags: [],
              pre: function( collection ) {
                collection.drop();
              },
              ops: [
                  { op:  "insert",
                    doc: workload.doc }
              ] } );
  tests.push( { name: `Insert.${workload.name}.Schema`,
              tags: [],
              pre: function( collection ) {
                collection.drop();
                collection.runCommand( "create", { inferSchema : true } );
              },
              ops: [
                  { op:  "insert",
                    doc: workload.doc }
              ] } );

  tests.push( { name: `Insert.${workload.name}.WildCardIndex`,
              tags: [],
              pre: function( collection ) {
                collection.drop();
                collection.createIndex( { "$**" : 1 } );
              },
              ops: [
                  { op:  "insert",
                    doc: workload.doc }
              ] } );
}


