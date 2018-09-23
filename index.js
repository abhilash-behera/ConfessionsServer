var express=require('express');
var app=express();
var mongoose=require('mongoose');
mongoose.Promise=require('bluebird');
var bodyParser=require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(function(req,res,next){
    var request={
        host:req.host,
        hostname:req.hostname,
        userAgent:req.get('User-Agent')
    };
    console.log("request from :",request);
});

app.get('/',function(req,res){
    res.send('<h1>Confessions server working as expected...</h1>');
});

app.post('/login',function(req,res){
    if(req.body.username&&req.body.password){
        res.json({success:true,data:'User logged in'});
    }else{
        res.json({success:false,data:'Bad Request'});
    }
});

app.listen(80,function(err){
    if(err){
        console.log('Error in starting server:',err);
    }else{
        console.log('Server started successfully on port 80...');
    }
})