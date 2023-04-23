var express = require("express");
var app = express();
var server = app.listen(3000, () => {
 console.log('server is running on port', server.address().port);
});

app.use(express.static(__dirname));

var mongoose = require("mongoose");

var databaseUrl = 'mongodb://localhost:27017/chat'

mongoose.connect(databaseUrl, {	
    useNewUrlParser: true,
	useUnifiedTopology: true
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

var Message = mongoose.model('Message',{ name : String, message : String})

var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})
app.post('/messages', (req, res) => {
  var message = new Message(req.body);
  message.save((err) =>{
    if(err)
      sendStatus(500);
    res.sendStatus(200);
  })
})

var http = require('http').Server(app);
var io = require('socket.io')(http);
io.on('connection', () =>{
 console.log('a user is connected')
})

app.post('/messages', async (req, res) => {
  try{
    var message = new Message(req.body);
    await message.save()
    var censored = await Message.findOne({message:'badword'});
      if(censored)
        await Message.remove({_id: censored.id})
      else
        io.emit('message', req.body);
      res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message send')
  }
})