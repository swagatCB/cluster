spark2-submit --files feed.xslt /opt/hadoop/jar/sparkexport/Spark2Export.jar -d SiteData --s3 --file_schema xml --xslt feed.xslt -B inteljs -P spark_test/ -q 'SELECT did,mod_date FROM temp.rail_job_feed_all limit 3000'  -bps 5242880 -C aws_s3_anand
