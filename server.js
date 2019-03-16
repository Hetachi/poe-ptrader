const express = require('express')
const request = require('request');
const bodyParser = require('body-parser')
const _ = require('lodash')
const app = express()
app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Credentials", "true")
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const port = 1337
const poeUrl = 'http://www.pathofexile.com/api/trade/search/Synthesis';
const poeFetchUrl = 'https://www.pathofexile.com/api/trade/fetch/';

app.post('/api/getItem', function(req, res) {
    const itemName = req.body.itemName;
    const itemType = req.body.itemType;
    new Promise( (resolve, reject)=>{
      getItemFromPoe(itemName, itemType).then( itemData =>{
        resolve(itemData)
      })
    }).then( data => {
      res.send(data);
    })
});

app.listen(port, () => console.log(`POE Data Storage on port: ${port}!`))

function getItemFromPoe(itemName, itemType, filters) {
  return new Promise( (resolve, reject) => {
    const query = {
        "query": {
            "status": {
                "option": "online"
            },
            "name": itemName || "",
            "type": itemType || "",
            "stats": [{
                "type": "and",
                "filters": filters || []
            }]
        },
        "sort": {
            "price": "asc"
        }
    }
    request.post({
      url:  poeUrl,
      json: true,
      body: query
    },function(error, response, body){
        let itemList = ''
        return new Promise( (resolve, reject) => {
          let i = 0
          let urlArray = []
          if(!body.result) {console.log(body)}
          body.result.map( (item, index) => {
            if(i < 10) {
              if(i === 0) {
                itemList += item
              } else {
                itemList += ","+item
              }
              i++
            } else {
              i = 0
              itemList += "/?id="+body.id
              urlArray.push(itemList)
            }
            return true
          })

          new Promise( (resolve, reject) => {
            let queryData = []
            let finished = _.after(2, mergeData)

            function fetchItemData(pageAmmount) {
              return new Promise ( (resolve, reject) => {
                request.get(poeFetchUrl+urlArray[pageAmmount], (error, response, body)=>{
                  resolve(JSON.parse(body))
                })
              }).then( data => {
                return data
              })
            }

            fetchItemData(0).then( data => {
              queryData.push(data)
              finished()
            })
            fetchItemData(1).then( data => {
              queryData.push(data)
              finished()
            })

            function mergeData() {
              let itemList = queryData[0].result.concat(queryData[1].result)
              const itemData = {
                result: itemList
              }
              resolve(itemData)
            }
          }).then ( data => {resolve(data)})

        }).then( data => {resolve(data)})
      })
    })
}
