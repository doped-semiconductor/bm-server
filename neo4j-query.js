neo4j = require('neo4j-driver')
class neo4jQueries{
    constructor(){
        this.driver = null
        this.session = null
        this.result = null        
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
}

exports.neo4jQueries = neo4jQueries


/** EXP 
async function main(){
    var p = new neo4jQueries()
    var o = await p.RecentBookmarks()
    console.log(o)
}

main()*/
