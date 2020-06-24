class KeywordExtractor{
    constructor(url){
        this.url = url  
        this.keys = null      
    }

    async genKeys(cb){
        try{

            var read = require('node-readability')
            await read(this.url, async function(err, article, title, meta){
                var keyword = require('gramophone')
                if (article===undefined){
                    return 0
                }
                try{
                    var extraction_result = await keyword.extract(article.textBody, {
                        limit: 10,
                        stem: true,
                        ngrams: [1,2,3],
                        score: true
                    });
                }
                catch(err){console.log('ERROR:',err.message)}
                finally{cb(extraction_result)}                
                
            })
            return true

        }
        catch(err){
            console.log("ERROR:",err.message)
            return false
        }
        finally{
            //blank
        }
        
    }
}
exports.KeywordExtractor = KeywordExtractor