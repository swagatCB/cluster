const js2xmlparser = require("js2xmlparser");
const AWS = require("aws-sdk");
const csvjson = require("csvjson");
const moment = require("moment");
const config = require('./config.json')

AWS.config.setPromisesDependency();
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretKeyId,
  region: "us-east-2"
});
const s3 = new AWS.S3();

// exports.handler =   async function(){
    async function t(){
  let key = await getKeyS3();
  if (key) {
    let obj = s3.getObject(
      {
        Bucket: "inteljs",
        Key: key
      },
      function(err, res) {
        if (err) {
          console.log("Error occured while fetching object : ", err);
        } else {
          let options = {
            delimiter: ",", // optional
            quote: '"' // optional
          };
          let prepData = csvjson.toObject(res.Body.toString(), options);
          prepData.map(item => {
            item.loc = "https://www.careerbuilder.com/job/" + item.loc;
            item.lastmod = moment.unix(item.lastmod).format();
          });
          let arr = [];
          const count = prepData.length;
          // const t = 0;
          for (i = 0; i < count; i += 50000) {
            let temp = prepData.slice(i, i + 50000);
            arr.push(temp);
          }
          let sitemapContent =
            "<sitemapindex xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>";
          arr.map(function(feed, index) {
            let path = "tmp/" + index + ".xml";
            sitemapContent +=
              "<sitemap><loc>https://www.careerbuilder.com/job-sitemap/" +
              index +
              ".xml</loc></sitemap>";
            t = js2xmlparser.parse("url", feed);
            t = prepareXML(t);
            console.log("here");

            uploadXml(path, t);
          });
          sitemapContent += "</sitemapindex>";
          uploadXml("tmp/job-sitemap.xml", sitemapContent);
        }
      }
    );
  }
}

async function getKeyS3() {
  let response = await s3
    .listObjectsV2({
      Bucket: "inteljs",
      Prefix: "spark_test"
    })
    .promise();
  return response.Contents.length > 0 ? response.Contents[0].Key : null;
}

function uploadXml(path, data) {
  s3.putObject(
    {
      Bucket: "inteljs",
      Key: path,
      Body: data
    },
    function(err, res) {
      if (err) {
        console.log("ERRR");
        return false;
      } else {
        console.log(path);
        console.log("DONE " + res);
        return true;
      }
    }
  );
}

function prepareXML(data) {
  data = js2xmlparser.parse("url", data);
  reg = new RegExp(/&lt;/g);
  data = data.replace(reg, "<");
  data = data.replace("<?xml version='1.0'?>", "");
  data = data.replace("</url></url>", "</urlset>");
  data = data.replace(
    new RegExp(/<url><\?xml\sversion\=\'1\.0\'\?>\n<url>/g),
    "<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'>"
  );
  return data;
}

t()