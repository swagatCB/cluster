# spark2-submit --files feed.xslt /opt/hadoop/jar/sparkexport/Spark2Export.jar -d SiteData --s3 --file_schema xml --xslt feed.xslt -B inteljs -P spark_test/ -q 'SELECT did,mod_date FROM temp.rail_job_feed_all limit 3000'  -bps 5242880 -C aws_s3_anand
spark2-submit /opt/hadoop/jar/sparkexport/Spark2Export.jar -d SiteData --s3 -p 1 -B inteljs -P spark_test/ -q "SELECT did as loc,UNIX_TIMESTAMP(modified,'yyyy-MM-dd HH:mm:ss') as lastmod FROM sitedata.hhjob WHERE hostsite='US' AND status = 0 AND upgradelist NOT IN ('JCINT0','JCPRV0') AND classlist NOT LIKE '%DMYES%'" -C aws_s3_anand --truncate --bps 1000000


# spark2-submit /opt/hadoop/jar/sparkexport/Spark2Export.jar -d SiteData --hdfs -P spark_test/ -q 'SELECT did,mod_date FROM temp.rail_job_feed_all limit 3000' -C aws_s3_anand --bps 1000000


spark2-submit /opt/hadoop/jar/sparkexport/Spark2Export.jar -d SiteData --s3 -p 1 -B inteljs -P spark_test/ -q "SELECT did as loc FROM sitedata.hhjob WHERE hostsite='US' AND status = 0 AND upgradelist NOT IN ('JCINT0','JCPRV0') AND classlist NOT LIKE '%DMYES%' limit 3" -C aws_s3_anand --truncate --bps 1000000
