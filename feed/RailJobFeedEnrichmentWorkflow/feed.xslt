<xsl:stylesheet  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 version="2.0">
   <xsl:output method="xml" indent="yes" omit-xml-declaration="no" />
   <xsl:output method="xml" cdata-section-elements="title id"/>
   <xsl:template match="/">
           <xsl:for-each select="data/record">
               <url>
                   <loc>
                       <xsl:value-of select="concat('https://www.careerbuilder.com/job/',did)" />
                   </loc>
                   <lastmod>
                       <xsl:value-of select="mod_date" />
                   </lastmod>
               </url>
           </xsl:for-each>
   </xsl:template>
</xsl:stylesheet>
