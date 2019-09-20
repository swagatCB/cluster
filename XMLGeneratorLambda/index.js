const js2xmlparser = require("js2xmlparser");
const AWS = require("aws-sdk");
const csvjson = require("csvjson");
const moment = require("moment-timezone");

AWS.config.setPromisesDependency();
AWS.config.update({
  accessKeyId: "AKIA3DJYAK54CYYBDG2T",
  secretAccessKey: "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",
  region: "us-east-2"
});
const s3 = new AWS.S3();

async function controller() {
  let key = await getKeyS3();
console.log("Key --> "+key);

  try{
  if (key) {
    let res = await getCSV(key);
    await prepareXML(res);
  }
}
catch(err){
console.log('Error occured while preparing XML',err);
}

}

async function getKeyS3() {
  let response = await s3
    .listObjectsV2({
      Bucket: "rails-job-feed",
      Prefix: "csv"
    })
    .promise();
  return response.Contents.length > 0 ? response.Contents[0].Key: null;
}

async function getCSV(key) {
  return new Promise(resolve => {
    s3.getObject(
      {
        Bucket: "rails-job-feed",
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

function uploadXml(path, data) {
  return new Promise((resolve, reject) => {
    s3.putObject(
      {
        Bucket: "rails-job-feed",
        Key: path,
        Body: data
      },
      function(err, res) {
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
  data = data.replace(new RegExp(/<\/url>\n<\/url>/g) , "</url></urlset>");
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
    item.lastmod = moment.tz(item.lastmod,'America/New_York').format()
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
  await uploadXml("xml/job-sitemap.xml", sitemapContent);
}
controller()
exports.handler = async function() {
  await controller();
};
