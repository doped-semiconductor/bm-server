var neo4j = require('neo4j-driver')
var express = require('express')
var bodyParser = require('body-parser')
var ke = require('./keywordextract')
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
                else{                    
                    await addBookmark(request.body.data[i])
                    var x = new ke.KeywordExtractor(request.body.data[i].url)
                    x.genKeys((keys)=>{
                        if (keys!=undefined){
                            keys.forEach(async (el) => {
                                el.id = request.body.data[i].id
                                console.log('el',el)
                                addKeys(el)                    
                            })
                        }
                        else{
                            console.log("didnt receive keys for: ",request.body.data[i].title)
                        }                        
                    })
                }
            }
            addRelations()
        }
        response.send({data:'received',n :Object.keys(request.body.data).length});    // echo the result back

    };
}

async function addKeys(keys){
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {   
        const result0 = await session.writeTransaction(tx =>
            tx.run(`merge(n:Keyword{phrase:$term})`,
            {term: keys.term})
            .then(res => {console.log('added: KEYWORD - ',keys.term )})
            .catch(err =>{console.log(err.message)})
        )   
        const result = await session.writeTransaction(tx =>
            tx.run(`match(n:Keyword),(b:Bookmark) where n.phrase=$term and b.id=$id merge (n)-[r:KEYOF {tf: $tf}]->(b)`,
            keys)
          .then(res => {console.log('added: KEYWORD RELATIONSHIP - ',keys.id,keys.term)})
          .catch(err =>{console.log(err.message)})
        )      
    }     
    finally { await session.close() }  
    await driver.close()

}

async function addRelations(){
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {    
        const result = await session.writeTransaction(tx =>
          tx.run('match (n),(p:Folder) where n.parent = p.id merge (n)-[r:CHILDOF]->(p) return n')
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
          tx.run('MERGE (b: Bookmark {id:$id,title:$title,index:$index,url:$url,parent:$parent,date:$date}) return b',bookmark)
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
          tx.run('MERGE (b: Folder {id:$id,title:$title,index:$index,parent:$parent,date:$date}) return b',bookmark)
          .then(res => {console.log('added: ',bookmark.title)})
          .catch(err =>{console.log(err.message)})
        )       
    }     
    finally { await session.close() }  
    await driver.close()
}

