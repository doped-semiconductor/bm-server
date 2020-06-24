class KeywordExtractor{
    constructor(url){
        this.url = url
    }
    Read(){
        var read = require('node-readability');
        var m = 1
        read(this.url,function(err, article, response) {
            //...
            console.log('this',this)
            //(article.textBody)            
        });
    }
}

x = new KeywordExtractor("http://127.0.0.1:5500/index.html")
x.Read()
//console.log(x.Read())
