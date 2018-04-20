<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl"
>
  <xsl:template match="/">
    <xsl:for-each select="Messages/item">
      <div class="AppMessage">
        <a href="#" onclick="javascript:goToGridModel('{current()/RecordId}', '{current()/FieldName}' )" style=".k-link">
          <xsl:value-of select="RecordId" /> 
        </a>
        - <xsl:value-of select="Message" />
        <!--<xsl:value-of select="@* | node()" />-->
      </div>
    </xsl:for-each>
  </xsl:template>

</xsl:stylesheet>
