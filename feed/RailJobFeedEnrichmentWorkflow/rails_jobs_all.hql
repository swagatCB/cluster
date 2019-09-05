DROP TABLE IF EXISTS temp.rail_job_feed_all;
CREATE TEMPORARY FUNCTION html_to_plain_text AS 'com.cb.hiveudf.UDFRHTMLToPlainText';
CREATE TABLE temp.rail_job_feed_all AS
SELECT * FROM 
(SELECT
did, J.modified as mod_date
--J.customapplytype, J.contactcompany, J.screenerdid, J.upgradelist, J.classlist    --  Used to validate that criteria was correct
FROM sitedata.hhjob J
WHERE hostsite='US'
  AND status = 0
  AND J.upgradelist NOT IN ('JCINT0','JCPRV0')
  AND J.classlist NOT LIKE '%DMYES%' --Avoid jobs tied to demo accounts
  ) t1
