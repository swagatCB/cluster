const js2xmlparser = require("js2xmlparser");
const AWS = require("aws-sdk");
const csvjson = require("csvjson");
const config = require('./config.json');
const moment = require("moment-timezone");
const http = require('http');


AWS.config.setPromisesDependency();
AWS.config.update({
  // accessKeyId: config.accessKeyId,
  // secretAccessKey: config.secretKeyId,
  // region: "us-east-2"
});

const s3 = new AWS.S3();

async function controller() {
  let key = await getKeyS3();//1
  console.log("Key --> " + key);

  try {
    if (key) {
      let res = await getCSV(key);//2
      // await prepareXML(res);
      await CSVParser(res).then((val)=>{
        forLoopingOverCSV(val);
      })


    }
  }
  catch (err) {
    console.log('Error occured while preparing XML', err);
  }

}

async function getKeyS3() {
  let response = await s3
    .listObjectsV2({
      Bucket: "consumer-cloudops",
      Prefix: "csv"
    })
    .promise();
  return response.Contents.length > 0 ? response.Contents[0].Key : null;
}

async function getCSV(key) {
  return new Promise(resolve => {
    s3.getObject(
      {
        Bucket: "consumer-cloudops",
        Key: key
      },
      (err, response) => {
        if (err) {

        }
        resolve(response);
      }
    );
  });
}

function CSVParser(csv) {
  //loop over csv and return an array
  return new Promise((res, rej)=>{

  })
}

/**promise.all can be used but with .then the promise will return undefined 
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
 * 
 */
function forLoopingOverCSV(emailArray) {
  return new Promise((resolve, reject)=>{
    let request;
    for (let i = 0; i < emailArray.length; i++) {
      new Promise((res, rej)=>{
        let options = {
          url: endpoint, //https://api.careerbuilder.com/core/bounce/hard
          headers: { Authorization: "Bearer" + token, "request- id": _requestId },
          json: true,
          body: { Email: emailArray[i] }, //JSON.stringify might be used,
          method: 'POST'
        };
  
        res(options);
  
      }).then((val)=>{
        request = http.request(val, (res)=> {//request variable has higher scope in this method
          console.log('STATUS: ' + res.statusCode);
          console.log('HEADERS: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
          });
        });
        
      }).then(()=>{
        request.on('error', (e)=>{
          console.log('problem with request: ' + e.message);
        });
      }).catch((error)=>{
        reject({message:`failed for email ${emailArray[i]}`, Error : error})
      })
    
      
    }
    resolve({"done with email" : emailArray[i]});
  })
}

let unsubscribePromise = new Promise((resolve, reject)=>{
  let request;
  for (let i = 0; i < emailArray.length; i++) {
    new Promise((res, rej)=>{
      let options = {
        url: endpoint, //https://api.careerbuilder.com/core/bounce/hard
        headers: { Authorization: "Bearer" + token, "request- id": _requestId },
        json: true,
        body: { Email: emailArray[i] }, //JSON.stringify might be used,
        method: 'POST'
      };

      res(options);

    }).then((val)=>{
      request = http.request(val, (res)=> {//request variable has higher scope in this method
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
        });
      });
      
    }).then(()=>{
      request.on('error', (e)=>{
        console.log('problem with request: ' + e.message);
      });
    }).catch((error)=>{
      reject({message:`failed for email ${emailArray[i]}`, Error : error})
    })
  
    resolve({"done with email" : emailArray[i]});
  }
})

function uploadXml(path, data) {
  return new Promise((resolve, reject) => {
    s3.putObject(
      {
        Bucket: "rails-job-feed",
        Key: path,
        Body: data
      },
      function (err, res) {
        if (err) {
          console.log("ERRR");
          reject(false);
        } else {
          console.log(path);
          console.log("DONE " + res);
          resolve(true);
        }
      }
    );
  });
}

function updateXML(data) {
  data = js2xmlparser.parse("url", data);
  reg = new RegExp(/&lt;/g);
  data = data.replace(reg, "<");
  data = data.replace("<?xml version='1.0'?>", "");
  data = data.replace("</url></url>", "</urlset>");
  data = data.replace(
    new RegExp(/<url><\?xml\sversion\=\'1\.0\'\?>\n<url>/g),
    "<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>"
  );
  data = data.replace(new RegExp(/<\/url>\n<\/url>/g), "</url></urlset>");
  data = data.replace(new RegExp(/<url>\n.{1,}<url>/g), "<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'><url>");

  return data;
}

async function prepareXML(res) {
  let options = {
    delimiter: ",", // optional
    quote: '"' // optional
  };
  let prepData = csvjson.toObject(res.Body.toString(), options);
  prepData.map(item => {
    item.loc = "https://www.careerbuilder.com/job/" + item.loc;
    item.lastmod = moment.tz(item.lastmod, 'America/New_York').format()
    // .format();

  });
  let arr = [];
  const count = prepData.length;
  for (i = 0; i < count; i += 50000) {
    let temp = prepData.slice(i, i + 50000);
    arr.push(temp);
  }
  let sitemapContent =
    "<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>";
  for (index = 0; index < arr.length; index++) {
    console.log(index);

    let feed = arr[index];
    let path = "xml/" + index + ".xml";
    sitemapContent +=
      "<sitemap><loc>https://www.careerbuilder.com/job-sitemap/" +
      index +
      ".xml</loc></sitemap>";
    t = updateXML(feed);
    await uploadXml(path, t);
  }
  sitemapContent += "</sitemapindex>";
  console.log('check');

  await uploadXml("xml/job-sitemap.xml", sitemapContent);
}
exports.handler = async function (context) {
  await controller();
  return context.logStreamName;
};
