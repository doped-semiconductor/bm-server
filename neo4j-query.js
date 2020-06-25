neo4j = require('neo4j-driver')
class neo4jQueries{
    constructor(){
        this.driver = null
        this.session = null
        this.result = null        
    }
    ////FUNCTION - ADD USER GIVEN KEYS
    async userAddKeys(keywords,id){
        var neo4j = require('neo4j-driver');                           
            var driver = neo4j.driver(
                'bolt://localhost:7687',
                neo4j.auth.basic('neo4j', 'bookmarks')  
            )
            var session = driver.session()
            try {    
                const result = await session.writeTransaction(tx =>
                  tx.run('MATCH(b:Bookmark) WHERE b.id=$id UNWIND $keywords AS keyword MERGE(key:Keyword {phrase:keyword}) MERGE((key)-[:KEYOF]->(b))',{keywords:keywords,id:id})
                  .then(res => {
                     // output.push(res.records[0].get(0))
                     console.log('keywords added')
                  })
                  .catch(err =>{console.log(err.message)})
                )}
            finally { await session.close() }  
            await driver.close()
    
    }
    ////FUNCTION - GET ID
    async MaxId(){
        var output = [];
        var neo4j = require('neo4j-driver');                           
            var driver = neo4j.driver(
                'bolt://localhost:7687',
                neo4j.auth.basic('neo4j', 'bookmarks')  
            )
            var session = driver.session()
            try {   
                const result = await session.writeTransaction(tx =>
                  tx.run('MATCH(n) return toString(max(toInteger(n.id))) as maxid')
                  .then(res => {
                    output.push(res.records[0].get('maxid'))                      
                  })
                  .catch(err =>{console.log('d')
                      console.log(err)})
                )}
            finally { await session.close() }  
            await driver.close()
            return output
    }
    ////FUNCTION - SIMILAR BOOKMARKS
    async SimilarBookmarks(id){
        var output = [];
        var neo4j = require('neo4j-driver');
            var driver = neo4j.driver(
                'bolt://localhost:7687',
                neo4j.auth.basic('neo4j', 'bookmarks')  
            )
            var session = driver.session()
            try {    
                const result = await session.writeTransaction(tx =>
                  tx.run('MATCH(b:Bookmark)<-[:KEYOF]-(k1:Keyword)-[:KEYOF *0..]->(b1:Bookmark) WHERE b.id=$id RETURN b1',{id:id})
                  .then(res => {
                      res.records.forEach(record=>{
                          output.push(record.get(0).properties)})
                      })
                  .catch(err =>{console.log(err.message)})
                )      
            }     
            finally { await session.close() }  
            await driver.close()
            return output
    }
    ////FUNCTION -SEARCH RECENTS
    async RecentBookmarks(n){
        var output = [];
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
        try {    
            const result = await session.writeTransaction(tx =>
              tx.run('MATCH(b:Bookmark) RETURN b ORDER BY b.date DESC LIMIT $n',{n: n})
              .then(res => {
                  res.records.forEach(record=>{
                      output.push(record.get(0).properties)})
                  })
              .catch(err =>{console.log(err.message)})
            )      
        }     
        finally { await session.close() }  
        await driver.close()
        return output
    }
    ////FUNCTION - SEARCH READ LATER
    async RLBookmarks(n){
        var output = [];
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
        try {    
            const result = await session.writeTransaction(tx =>
              tx.run('MATCH(b:Bookmark) WHERE b.rl = true RETURN b ORDER BY b.date DESC LIMIT $n',{n: n})
              .then(res => {
                  res.records.forEach(record=>{
                      output.push(record.get(0).properties)})
                  })
              .catch(err =>{console.log(err.message)})
            )      
        }     
        finally { await session.close() }  
        await driver.close()
        return output
    }
    ////FUNCTION -SEARCH BY TITLE
    async SearchByTitle(title){
        var op = []
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
        try {    
            const result = await session.writeTransaction(tx =>
              tx.run('MATCH (b: Bookmark) WHERE b.title CONTAINS $title SET b.date=date() return b',{title:title})
              .then(res => {
                  res.records.forEach(record=>{
                      //console.log(record.get(0).properties)
                      op.push(record.get(0).properties)})
                 //console.log(op)
                  })
              .catch(err =>{console.log(err.message)})
            )      
        }     
        finally { await session.close() }  
        await driver.close()
        return op
    }
    ////FUNCTION -SEARCH BY DOMAIN
    async SearchByDomain(domain){
        var op = []
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
        try {    
            const result = await session.writeTransaction(tx =>
                tx.run('MATCH (b: Bookmark) WHERE b.url CONTAINS $domain SET b.date=date() return b',{domain:domain})
                .then(res => {
                    res.records.forEach(record=>{
                        op.push(record.get(0).properties)})
                        //console.log(op)
                    })
                .catch(err =>{console.log(err.message)})
            )      
        }     
        finally { await session.close() }  
        await driver.close()
        return op
    }
    ////FUNCTION -SEARCH BY TAG
    async SearchByTag(tag){
        var op = [];
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
        try {    
            const result = await session.writeTransaction(tx =>
                tx.run('MATCH (key: Keyword)-[keyof:KEYOF]->(book:Bookmark) WHERE key.phrase CONTAINS $tag return book',{tag:tag})
                .then(res => {
                    res.records.forEach(record=>{
                        op.push(record.get(0).properties)})                
                })
                .catch(err =>{console.log(err.message)})
            )      
        }     
        finally { await session.close() }  
        await driver.close()
        return op
    }
    ////FUNCTION - ADD KEYS NODE TO DB
    async addKeys(keys){
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
    async addRelations(){
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
    async addBookmark(bookmark){
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
    async addFolder(bookmark){
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
    //FUNCTION - ADD NEW PAGE
    async addNewBookmark(bookmark){
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
        try {    
            const result = await session.writeTransaction(tx =>
            tx.run(`merge (n:Bookmark {id:$id,parent:$parent,url:$url,title:$title,rl:$rl})`,bookmark)
            .then(res => {console.log('added BM node: ',bookmark.title)})
            .catch(err =>{console.log(err.message)})
            )
            await session.writeTransaction(tx =>
                tx.run(`match (n:Bookmark),(f:Folder) where n.id = $id and n.parent=f.id merge (n)-[r:CHILDOF]->(f)`,bookmark)
                .then(res => {console.log('added rel to parent: ',bookmark.title)})
                .catch(err =>{console.log(err.message)})
            )    
        }     
        finally { await session.close() }  
        await driver.close()
    }
    ////GET FOLDERS
    async DisplayFolder(){
        var output = [];
        var neo4j = require('neo4j-driver');
            var driver = neo4j.driver(
                'bolt://localhost:7687',
                neo4j.auth.basic('neo4j', 'bookmarks')  
            )
            var session = driver.session()
            try {    
                const result = await session.writeTransaction(tx =>
                  tx.run('MATCH(f:Folder) RETURN f')
                  .then(res => {
                      res.records.forEach(record=>{
                          output.push(record.get(0).properties)})
                      })
                  .catch(err =>{console.log(err.message)})
                )      
            }     
            finally { await session.close() }  
            await driver.close()
            return output
    }
    
    async DisplayBookmarksUnderFolder(id){
        var output = [];
        var neo4j = require('neo4j-driver');
        var driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'bookmarks')  
        )
        var session = driver.session()
            try {    
                const result = await session.writeTransaction(tx =>
                    tx.run(`match (n) where n.parent = $id return n`,{id:id})
                    .then(r=>{
                        //console.log(r.reco)
                        r.records.forEach(record=>{output.push(record.get(0).properties)
                        console.log(record.get(0).properties)})})
                    .catch(e=>{}))
                    console.log("length: ",output.length)
                    /*tx.run('MATCH(b:Bookmark) WHERE b.parent=$id RETURN b',{id:id})
                    .then(res => {
                        res.records.forEach(record=>
                            {output.push(record.get(0).properties)})
                    })
                    .catch(err =>{console.log(err.message)})
                ) 
                console.log('sent no. of children 1:',output.length)
                await session.writeTransaction(tx =>
                    tx.run('MATCH(b:Folder) WHERE b.parent=$id RETURN b',{id:id})
                    .then(res => {
                        res.records.forEach(record=>{
                            output.push(record.get(0).properties)})
                        })
                    .catch(err =>{console.log(err.message)})
                  )*/
            }     
            finally { await session.close() }  
            await driver.close()
            console.log('sent no. of children:',output.length)
            return output
    }
}

exports.neo4jQueries = neo4jQueries


/** EXP 
async function main(){
    var p = new neo4jQueries()
    var o = await p.RecentBookmarks()
    console.log(o)
}

main()*/
