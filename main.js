var neo4j = require('neo4j-driver')
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
const fs = require('fs');
var ke = require('./keywordextract')
var njq = require('./neo4j-query')
app = express()
app.use(cors())
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
            var mid = 0
            if(request.body.data!=undefined){
                response.send({data:'received',n :Object.keys(request.body.data).length});
            }
            for (let i in request.body.data){ 
                
                request.body.data[i].readlater = false
                request.body.data[i].visits = 0 
                request.body.data[i].title = request.body.data[i].title.toLowerCase()               
                if (!request.body.data[i].url){
                    var neo = new njq.neo4jQueries()
                    await neo.addFolder(request.body.data[i])

                }
                else{
                    var neo = new njq.neo4jQueries()                    
                    await neo.addBookmark(request.body.data[i])
                    var x = new ke.KeywordExtractor(request.body.data[i].url)
                    x.genKeys((keys)=>{
                        if (keys!=undefined){
                            keys.forEach(async (el) => {
                                el.id = request.body.data[i].id
                                //console.log('el',el)
                                var neo = new njq.neo4jQueries()                
                                await neo.addKeys(el)  
                            })
                        }
                        else{
                            console.log("didnt receive keys for: ",request.body.data[i].title)
                        }                        
                    })
                }
                
            }
            var neo = new njq.neo4jQueries()
            await neo.addRelations()
            //response.send({data:'received',n :Object.keys(request.body.data).length});
        }
        //GET RECENTS - works
        else if(request.body.instruction == 'recent'){
            if(!request.body.data.lim){
                console.log('lim not recieved')
                response.send({data:'not received'});
            }
            else{
                var neo = new njq.neo4jQueries()
                var res = await neo.RecentBookmarks(neo4j.int(request.body.data.lim))
                response.send({data:'recieved',output:res})
            }
        }
        //GET READ LATER - works
        else if(request.body.instruction == 'later'){
            if(!request.body.data.lim){
                console.log('lim not recieved')
                response.send({data:'not received'});
            }
            else{
                var neo = new njq.neo4jQueries()
                var res = await neo.RLBookmarks(neo4j.int(request.body.data.lim))
                response.send({data:'recieved',output:res})
            }
        }
        //GENERATE TAGS - works
        else if(request.body.instruction == 'tags'){
            console.log('url',request.body.data.url)
            if (request.body.data.url==undefined){
                console.log('url not')
                response.send({data:'not received'});
            }
            else{
                var x = new ke.KeywordExtractor(request.body.data.url)
                x.genKeys((keys)=>{  
                    if (keys!=undefined){
                        response.send({data:'received',tags :keys});
                    }
                    else{response.send({data:'received',tags :null});}
                })
            }                
        }
        //ADD NEW BM - GENERATE ID INCOMPLETE
        else if(request.body.instruction == 'newbm'){
            var neo1 = new njq.neo4jQueries()
            
            var id = await neo1.MaxId(request.body.data)
            request.body.data.id = (parseInt(id[0])+1).toString()
            console.log('new bm obj')
            console.log('adding bm url')
            if ((request.body.data==undefined) || (request.body.data==[])){
                console.log('data not received: ',request.body.data)
                response.send({data:'not received'});
            }
            else{
                response.send({data:'received',x:1});
                var neo = new njq.neo4jQueries()
                //adds node connects to parent  and keys               
                await neo.addNewBookmark(request.body.data) 
                await neo.userAddKeys(request.body.data.tags,request.body.data.id)               
            }
        }
        //SEARCH -  works
        else if(request.body.instruction == 'search'){
            //SEARCH BY TAG
            console.log('search req recieved')
            if (request.body.type==="byTag"){
                console.log('search by tag recieved')
                //confirm received tag and on err send response
                if(!request.body.data){
                    console.log('tag not recieved')
                    response.send({data:'not received'});
                }
                else{
                    request.body.data = request.body.data.toLowerCase()
                    console.log('tag recieved: ',request.body.data)
                    //query with the tag    
                    var neo = new njq.neo4jQueries()                
                    var res = await neo.SearchByTag(request.body.data)
                    response.send({data:'recieved',output:res})
                }

            }
            //SEARCH BY DOMAIN
            else if (request.body.type==="byDomain"){
                if(!request.body.data){
                    console.log('domain not recieved')
                    response.send({data:'not received'});
                }
                else{
                    console.log('domain recieved: ',request.body.data)
                    //query with the tag
                    var neo = new njq.neo4jQueries()
                    var res = await neo.SearchByDomain(request.body.data)                    
                    //send response with results
                    response.send({data:'recieved',output:res})
                }
            }
            //SEARCH BY TITLE
            else if (request.body.type==="byTitle"){
                if(!request.body.data){
                    console.log('title not recieved')
                    response.send({data:'not received'});
                }
                else{
                    console.log('title recieved: ',request.body.data)
                    //query with the tag
                    var neo = new njq.neo4jQueries()
                    var res = await neo.SearchByTitle(request.body.data)
                    response.send({data:'recieved',output:res})
                }
            }
        }
        //GIVE FOLDER TO ADD
        else if(request.body.instruction == 'folder'){
            var neo = new njq.neo4jQueries()
            var out = await neo.DisplayFolder()
            response.send({data:'received',output:out});

        }

        //SIMILAR BOOKMARKS - works
        else if(request.body.instruction == 'similar'){
            if(!request.body.data){
                console.log('similar not received',request.body)
                response.send({data:'not received'})
            }
            else{
                var neo = new njq.neo4jQueries()
                var out = await neo.SimilarBookmarks(request.body.data)
                response.send({data:'received',output:out});
            }
        }

        //GIVE FILE NAVIGATION
        else if(request.body.instruction == 'files'){
            if(!request.body.data){
                console.log('folder id not received',request.body)
                response.send({data:'not received'})
            }
            else{
                var neo = new njq.neo4jQueries()
                var out = await neo.DisplayBookmarksUnderFolder(request.body.data)
                response.send({data:'received',output:out});
            }
        }

        //ADD FOLDER
        else if(request.body.instruction == 'newFold'){
            if(!request.body.data){
                console.log('folder id not received',request.body)
                response.send({data:'not received'})
            }
            else{
                console.log('received addf req',request.body.data)            
                var neo = new njq.neo4jQueries()
                //var pid = await neo.findParent(request.body.data.pname)
                var fid = await neo.MaxId() 
                var ind = parseInt(fid[0]) + 1 
                console.log('fid',ind)              
                await neo.ADDFolder2(request.body.data.title,request.body.data.pname,ind.toString())
                response.send({data:'received',output:'success'});
            }
        


}
        
        //DELETE FILE/BOOKMARK
        else if(request.body.instruction == 'delete'){
            if(request.body.data.type == 'bookmark'){
                var neo = new njq.neo4jQueries()
                await neo.DeleteBookmark(request.body.data.id)
                response.send({'data':'received','status':'completed'})
            }
            else if(request.body.data.type == 'folder'){
                var neo = new njq.neo4jQueries()
                await neo.DeleteFolder(request.body.data.id)
                response.send({'data':'received','status':'completed'})
            }
        }
    };
}



