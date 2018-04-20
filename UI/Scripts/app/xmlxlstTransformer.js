function xmlxlsTransformer() 
{
    function getActiveXTransform(xml, xsl) {
        var processor,
            template = new ActiveXObject("MSXML2.XSLTemplate.6.0");

        template.stylesheet = xsl;
        processor = template.createProcessor();
        processor.input = xml;
        
        processor.transform();
        return processor.output;
    }

    function getTransformFragment(xml, xsl) {
        var xslt = new XSLTProcessor();
        xslt.importStylesheet(xsl);

        var xmlFragment=xslt.transformToFragment(xml, document);

        // convert dom into string
        var sResult = new XMLSerializer().serializeToString(xmlFragment);
        //extract contents of transform iix node if it is present
        //if (sResult.indexOf("<transformiix:result") > -1) {
        //    sResult = sResult.substring(sResult.indexOf(">") + 1, sResult.lastIndexOf("<"));
        //}
        return sResult;
    }
    
    function getXmlStringParser() {
        var parse = function() {
            console.error('[Magic XML] No XML string parser available.');
        };
              
        if (window.DOMParser) {
            parse = function(xmlString) {
                var parser = new window.DOMParser();
                return parser.parseFromString(xmlString, "text/xml");
            };
        }
        else if (window.ActiveXObject || "ActiveXObject" in window) {
            parse = function(xmlString) {
                var dom = new ActiveXObject("Microsoft.XMLDOM");
                dom.async = false;
                dom.loadXML(xmlString);
                return dom;
            };
        }
        else {
            console.warn("[Magic XML] No XML string parser available. String " + 
                "parsing will fail if used.");
        }

        return {
            parse: parse
        };
    };

    function loadXml(source) {
        var xhr = (window.ActiveXObject || "ActiveXObject" in window) ?
                new ActiveXObject("Msxml2.XMLHTTP.3.0") :
                new XMLHttpRequest();

        xhr.open("GET", source, false);
        xhr.send();
        return xhr.responseXML;
    }
    function loadXsl(source) {
        if (window.ActiveXObject || "ActiveXObject" in window) {
            var xsl = new ActiveXObject("MSXML2.FreeThreadedDOMDocument.6.0");
            xsl.async = false;
            xsl.load(source);
            return xsl;
        }

        // If we don't need to use ActiveX just get normally.
        return loadXml(source);
    }

    /// <summary>
    /// Transforms an XML document using a specified XSLT, passing in any
    /// XSLT parameters that are supplied and taking care of cross browser
    /// compatability issues automatically.
    /// </summary>
    this.transform = function(xmlDoc, xslFile) {

        if (window.ActiveXObject || "ActiveXObject" in window) {
            return getActiveXTransform(xmlDoc, loadXsl(xslFile));
        } else {
            return getTransformFragment(xmlDoc, loadXsl(xslFile));
        }
    };
    /// <summary>
    /// creates a document from the xml string passed
    /// </summary>
    this.getXmlDocFromXml = function(xmlString) {
        return getXmlStringParser().parse(xmlString);
    };
};