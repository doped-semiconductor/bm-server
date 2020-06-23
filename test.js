var neo4j = require('neo4j-driver')
var driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'bookmarks')  
)
var session = driver.session()

/**
 * Output format

Node {
  identity: Integer { low: 0, high: 0 },
  labels: [ 'Node1' ],
  properties: { an: Integer { low: 1, high: 0 } } }
 */

 var query = {1 :
    {
      id: '1',
      title: 'Bookmarks bar',
      index: 0,
      parent: '0',
      date: 1531025507376
    } ,
    2 :
    {
      id: '2',
      title: 'Other bookmarks',
      index: 1,
      parent: '0',
      date: 1531025507376
    } ,
    3 :
    {
      id: '3',
      title: 'Mobile bookmarks',
      index: 2,
      parent: '0',
      date: 1531025507376
    } ,
    203 :
    { id: '203', title: 'cap', index: 4, parent: '1', date: 1591176953023 } ,
    207 :
    {
      id: '207',
      title: 'conan',
      index: 5,
      parent: '1',
      date: 1591176953027
    } ,
    211 :
    {
      id: '211',
      title: 'simp',
      index: 6,
      parent: '1',
      date: 1591176953031
    } ,
    215 :
    {
      id: '215',
      title: 'misc',
      index: 7,
      parent: '1',
      date: 1591176953035
    } ,
    232 :
    {
      id: '232',
      title: 'amazon',
      index: 8,
      parent: '1',
      date: 1592025193285
    } ,
    238 :
    {
      id: '238',
      title: 'kaggle',
      index: 9,
      parent: '1',
      date: 1592276463990
    }}


var basic =    {
        id: '1',
        title: 'Bookmarks bar',
        index: 0,
        parent: '0',
        date: 1531025507376
      }

async function main(data) {

  try {
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    
      const result = await session.writeTransaction(tx =>
        tx.run(`CREATE (b: Bookmark 
            {id:$id,title:$title,index:$index,parent:$parent,date:$date}
            ) 
        return b`, data)

        //'CREATE (n {age: $myIntParam})', { myIntParam: neo4j.int(22) }
      )
      const singleRecord = result.records[0]
      //const greeting = singleRecord.get(0)
      for (let i=0;i<result.records.length;i++){
        console.log(result.records[i].get(0))

      }
      
    } finally {
      await session.close()
    }  
    // on application exit:
    await driver.close()
  }

  for(let i in query){
      main(query[i])
  }
  
  //main();

  /**
   * match (n),(p:Folder) where n.parent = p.id create (n)-[r:CHILDOF]->(p) return n
   */