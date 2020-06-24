var neo4j = require('neo4j-driver')
var express = require('express')
var bodyParser = require('body-parser')
const fs = require('fs');
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
    console.log("req body:",request.body);  
    /** check if content received */    
    if (Object.keys(request.body.data).length === 0) 
    {
        console.log('empty')
        response.send({data:'not recieved'});
    }
    else{
        //IMPORT BOOKMARKS FROM CLIENT
        if (request.body.instruction == 'import'){
            for (let i in request.body.data){ 
                request.body.data[i].readlater = false
                request.body.data[i].visits = 0 
                request.body.data[i].title = request.body.data[i].title.toLowerCase()               
                if (!request.body.data[i].url){await addFolder(request.body.data[i])}
                else{                    
                    await addBookmark(request.body.data[i])
                    var x = new ke.KeywordExtractor(request.body.data[i].url)
                    x.genKeys((keys)=>{
                        if (keys!=undefined){
                            keys.forEach((el) => {
                                el.id = request.body.data[i].id
                                //console.log('el',el)
                                addKeys(el) 
                                fs.appendFile('neologs.txt', JSON.stringify(el)+"\n", function (err) {if (err) throw err;});                   
                            })
                        }
                        else{
                            console.log("didnt receive keys for: ",request.body.data[i].title)
                        }                        
                    })
                }
            }
            addRelations()
            response.send({data:'received',n :Object.keys(request.body.data).length});
        }
        //GENERATE TAGS - INCOMPLETE
        else if(request.body.instruction == 'tags'){
            console.log('url',request.body.data)
            if (request.body.data==undefined){
                console.log('url not')
                response.send({data:'not received'});
            }
            else{
                var x = new ke.KeywordExtractor(request.body.data)
                x.genKeys((keys)=>{
                    console.log("keys",keys)
                    response.send({data:'received',tags :keys});                
                })
            }                
        }
        //SEARCH
        else if(request.body.instruction == 'search'){
            //SEARCH BY TAG
            console.log('search req recieved')
            if (request.body.data.type=="byTag"){
                console.log('search by tag recieved')
                //confirm received tag and on err send response
                if(!request.body.data.tag){
                    console.log('tag not recieved')
                    response.send({data:'not received'});
                }
                else{
                    request.body.data.tag = request.body.data.tag.toLowerCase()
                    console.log('tag recieved: ',request.body.data.tag)
                    //query with the tag
                    var driver = neo4j.driver(
                        'bolt://localhost:7687',
                        neo4j.auth.basic('neo4j', 'bookmarks')  
                    )
                    var session = driver.session()
                    try {    
                        console.log('key: ',request.body.data.tag)
                        const result = await session.writeTransaction(tx =>
                            
                            tx.run('MATCH (key: Keyword)-[keyof:KEYOF]->(book:Bookmark) WHERE key.phrase contains $tag return book'
                            ,{tag:request.body.data.tag})
                            .then(res => {
                                var op=[]
                                res.records.forEach(record=>{
                                    var temp = {
                                        title: record.get(0).properties.title,
                                        url: record.get(0).properties.url
                                    }
                                    //console.log('r',temp)
                                    op.push(temp)
                                })
                                console.log('res',res.record.get(0).properties)
                                response.send({data:'received','output':op});                                    
                            })
                          .catch(err =>{console.log(err.message)})
                        )      
                    }     
                    finally { await session.close() }  
                    await driver.close()

                    //send response with results
                }

            }
            else if (request.body.type=="byDomain"){}
            else if (request.body.type=="byTitle"){}
        }
        //GIVE FILE NAVIGATION
        
        //DELETE FILE/BOOKMARK

        //SIMILAR BOOKMARKS
    };
}

////FUNCTION - ADD KEYS NODE TO DB
async function addKeys(keys){
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {
        keys.term = keys.term.toLowerCase()    
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

////FUNCTION - ADD RELATIONS NODE TO DB
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

//FUNCTION - ADD BOOKMARK NODE TO DB
async function addBookmark(bookmark){
    var driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'bookmarks')  
    )
    var session = driver.session()
    try {    
        const result = await session.writeTransaction(tx =>
          tx.run('MERGE (b: Bookmark {id:$id,title:$title,index:$index,url:$url,parent:$parent,date:$date,visits:$visits,rl:$readlater}) return b',bookmark)
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

