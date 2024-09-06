const http = require('http')
const url = require('url')
const MongoClient = require('mongodb').MongoClient
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

let newbies;

const handlers = {}
const database = {}

database.create = async (newbie,callback) =>{
    await newbies.insertMany(newbie).then((result) =>{
        insertedIds =  () => {
            const tempIds = []
            for(let i = 0; i < result.length; i++) {
            tempIds.push(result[i]["_id"])
            }
            return tempIds
            }
            callback({"row inserted":result.length, "insertedIds":insertedIds()})
    })

}
database.read = async (id,callback) => { 
    let result = await newbies.findOne({_id:new ObjectId(id)},{_id:0,__v:0})
    callback(result)
}

database.update = async (id,newbie,callback) => {
    await newbies.updateOne({_id:new ObjectId(id)},{$set:newbie}).then(result => {
    if(result) callback({"updatedId": id}) 
    })
}

database.delete = async (id,callback) => {
    await newbies.deleteOne({_id:new ObjectId(id)}).then(result => {
    if(result) callback({"deletedId":id}) 
    }) 
}

handlers.newbies = (parsedRequest,res) => {
    const acceptedMehods = ['get','post','put','delete','patch']
    if(acceptedMehods.includes(parsedRequest.method)){
        handlers._methods[parsedRequest.method](parsedRequest, res)
    }else{
        res.writeHead(404)
        res.end('Not An Accepted Method')
    }
}

handlers.notfound = (parsedRequest,res) => {
    res.writeHead(404)
    res.end('Route not found')
}

const Routes = {
    'newbies': handlers.newbies
}

handlers._methods = {}

handlers._methods.get = (parsedRequest,res) => {
    const _id = `${JSON.stringify(parsedRequest.queryStringObject["id"])}`.replace(/"|'/g,'') 
    database.read(_id,result => {
        res.end(JSON.stringify(result))
    })
}

handlers._methods.post = (parsedRequest,res) => {
    const newbie = JSON.parse(parsedRequest.body)
    database.create(newbie,(result) => {
            res.end(JSON.stringify(result))
    })
}

handlers._methods.put = (parsedRequest,res) => {
    res.end('PUT')
}

handlers._methods.patch = (parsedRequest,res) => {
    const _id = `${JSON.stringify(parsedRequest.queryStringObject["id"])}`.replace(/"|'/g,'') 
    const newbie = JSON.parse(parsedRequest.body)
    database.update(_id,newbie,result => {
        res.end(JSON.stringify(result))
    })
}

handlers._methods.delete = (parsedRequest,res) => {
    const _id = `${JSON.stringify(parsedRequest.queryStringObject["id"])}`.replace(/"|'/g,'') 
    database.delete(_id,result => {
        res.end(JSON.stringify(result))
    })
}

const server = http.createServer((req, res) => {

    parsedRequest = {}
    parsedRequest.parsedUrl = url.parse(req.url, true)
    parsedRequest.path = parsedRequest.parsedUrl.pathname
    parsedRequest.tremmiedPath = parsedRequest.path.replace(/^\/+|\/*$/g, '')
    parsedRequest.method = req.method.toLowerCase()
    parsedRequest.headers = req.headers
    parsedRequest.queryStringObject = parsedRequest.parsedUrl.query


    let body = []
    req.on('data', (chuck) => {
        body.push(chuck)
    })

    req.on('end', () => {
        body = Buffer.concat(body).toString()
        parsedRequest.body = body

        const routedHandler = typeof(Routes[parsedRequest.tremmiedPath]) !== 'undefined' ? Routes[parsedRequest.tremmiedPath] : handlers.notfound

        routedHandler(parsedRequest,res)
    })

})

module.exports = {
    handlers,
    database
}

mongoose.connect('mongodb://0.0.0.0:27017/CRUD_DB', { useNewUrlParser: true })
mongoose.connection.useDb('CRUD_DB')
const newbiesSchema = mongoose.Schema({
    "name": {type: "string", required: true},
    "career": {type: "string", required: true},
    "salary": {type: "number", required: true}
})
newbies = mongoose.model('newbies',newbiesSchema)

console.log(handlers)
console.log(database)

server.listen(3900, () => console.log('server listenning on http://localhost:3900'))
