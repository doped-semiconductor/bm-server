var neo4j = require('neo4j-driver')
var express = require('express')
var bodyParser = require('body-parser')

app = express()
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.post('/', (request, response)=>{
    postHandler(request, response)
});
  
app.listen(5000);
console.log("server on 5000");

async function postHandler(request, response){
    console.log(request.body.instruction);      // your JSON
    //console.log(request.body.data.length);
    if (Object.keys(request.body.data).length === 0) 
    {
        console.log('empty')
        response.send({data:'not recieved'});
    }
    else{
        //imported bookmarks
        if (request.body.instruction == 'import'){

            for (let i in request.body.data){                
                if (!request.body.data[i].url){await addFolder(request.body.data[i])}
                else{await addBookmark(request.body.data[i])}
            }
            addRelations()
        }
        response.send({data:'received',n :Object.keys(request.body.data).length});    // echo the result back

    };
}

async function addRelations(){
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {    
        const result = await session.writeTransaction(tx =>
          tx.run('match (n),(p:Folder) where n.parent = p.id create (n)-[r:CHILDOF]->(p) return n')
          .then(res => {console.log('added: RELATIONSHIPS')})
          .catch(err =>{console.log(err.message)})
        )      
    }     
    finally { await session.close() }  
    await driver.close()
}

async function addBookmark(bookmark){
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {    
        const result = await session.writeTransaction(tx =>
          tx.run('CREATE (b: Bookmark {id:$id,title:$title,index:$index,url:$url,parent:$parent,date:$date}) return b',bookmark)
          .then(res => {console.log('added: ',bookmark.title)})
          .catch(err =>{console.log(err.message)})
        )      
    }     
    finally { await session.close() }  
    await driver.close()
}

//FUNCTION - ADD FOLDER NODE TO DB
async function addFolder(bookmark){
    //
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {    
        const result = await session.writeTransaction(tx =>
          tx.run('CREATE (b: Folder {id:$id,title:$title,index:$index,parent:$parent,date:$date}) return b',bookmark)
          .then(res => {console.log('added: ',bookmark.title)})
          .catch(err =>{console.log(err.message)})
        )       
    }     
    finally { await session.close() }  
    await driver.close()
}

