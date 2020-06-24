var neo4j = require('neo4j-driver')
var express = require('express')
var bodyParser = require('body-parser')
const fs = require('fs');
var ke = require('./keywordextract')
var njq = require('./neo4j-query')
app = express()
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.post('/', async (request, response)=>{
    await postHandler(request, response)
});  

app.listen(5000);
console.log("server on 5000");

async function postHandler(request, response){
    //console.log("req body:",request.body);  
    /** check if content received */    
    if (Object.keys(request.body.data).length === 0) 
    {
        console.log('empty')
        response.send({data:'not recieved'});
    }
    else{
        
        //IMPORT BOOKMARKS FROM CLIENT - works
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
                                var neo = new njq.neo4jQueries()                
                                var res = await neo.addKeys(el)  
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
        //GET RECENTS
        else if(request.body.instruction == 'recent'){
            if(!request.body.data.lim){
                console.log('lim not recieved')
                response.send({data:'not received'});
            }
            else{
                var neo = new njq.neo4jQueries()
                var res = await neo.RecentBookmarks(request.body.data.lim)
                response.send({data:'recieved',output:res})
            }
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
        //SEARCH -  works
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
                    var neo = new njq.neo4jQueries()                
                    var res = await neo.SearchByTag(request.body.data.tag)
                    response.send({data:'recieved',output:res})
                }

            }
            //SEARCH BY DOMAIN
            else if (request.body.data.type=="byDomain"){
                if(!request.body.data.domain){
                    console.log('domain not recieved')
                    response.send({data:'not received'});
                }
                else{
                    console.log('domain recieved: ',request.body.data.domain)
                    //query with the tag
                    var neo = new njq.neo4jQueries()
                    var res = await neo.SearchByDomain(request.body.data.domain)
                    console.log('res to send',res)
                    //send response with results
                    response.send({data:'recieved',output:res})
                }
            }
            //SEARCH BY TITLE
            else if (request.body.data.type=="byTitle"){
                if(!request.body.data.title){
                    console.log('title not recieved')
                    response.send({data:'not received'});
                }
                else{
                    console.log('title recieved: ',request.body.data.title)
                    //query with the tag
                    var neo = new njq.neo4jQueries()
                    var res = await neo.SearchByTitle(request.body.data.title)
                    //console.log('res to send',res)
                    //send response with results
                    response.send({data:'recieved',output:res})
                }
            }
        }
        //GIVE FILE NAVIGATION
        else if(request.body.instruction == 'files'){}
        
        //DELETE FILE/BOOKMARK
        else if(request.body.instruction == 'delete'){}

        //SIMILAR TAGS
        else if(request.body.instruction == 'similar'){}
    };
}

