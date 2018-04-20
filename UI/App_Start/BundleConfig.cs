
using System.Configuration;
using System.IO;
using System.Web.Hosting;
using System.Web.Optimization;

namespace AngularKendo.UI
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                "~/Scripts/jquery-{version}.js").WithLastModifiedToken());

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                "~/Scripts/jquery.validate*").WithLastModifiedToken());

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                "~/Scripts/modernizr-*").WithLastModifiedToken());

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap.js",
                "~/Scripts/respond.js").WithLastModifiedToken());
            
            bundles.Add(new ScriptBundle("~/bundles/angular").Include(
                "~/Scripts/angular.js",
                "~/Scripts/angular-route.js",
                "~/Scripts/angular-sanitize.min.js",
                "~/Scripts/angular-file-saver.bundle.min.js",
                "~/Scripts/angular-animate.js",
                "~/Scripts/spin.js",
                "~/Scripts/chart.js",
                "~/Scripts/angular-chart.js"
                ).WithLastModifiedToken());
            
            bundles.Add(new ScriptBundle("~/bundles/kendo").Include(
                "~/Scripts/kendo/2015.3.1111/kendo.all_original.js",
                "~/Scripts/kendo/2015.3.1111/jszip.min.js",
                "~/Scripts/angular-kendo.js",
                "~/Scripts/kendo/2015.3.1111/kendo.culture.en-US.js",
                "~/Scripts/app/control/kendo.grid.ext.js",
                "~/Scripts/app/control/kendo.upload.ext.js",
                "~/Scripts/app/control/kendo.common.js",
                "~/Scripts/app/jszip.js",
                "~/Scripts/app/xlsx.full.min.js"

            ).WithLastModifiedToken());

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                 "~/Scripts/angular-ui-router.js",
                 "~/Scripts/app/app.js",
                 "~/Scripts/app/controllers/HomeController.js",
                 "~/Scripts/app/controllers/xlsUploadController.js"

                 ).WithLastModifiedToken());

            bundles.Add(new ScriptBundle("~/bundles/appframework").Include(
                "~/Scripts/app/xml2json.js",
                "~/Scripts/app/xmlxlstTransformer.js",
                "~/Scripts/app/jquery.cookie.js",
                "~/Scripts/app/angular-local-storage.js",
                "~/Scripts/app/moment.min.js",
                "~/Scripts/app/appModule.js",
                "~/Scripts/app/services/AppStartupService.js",
                "~/Scripts/app/services/MessageService.js",
                "~/Scripts/app/services/roleLandingMapService.js",
                "~/Scripts/app/services/uiDefenceService.js", //load it after AppStartupService, as it depends on AppStartupService
                "~/Scripts/app/control/spgridDirectives.js",
                "~/Scripts/app/control/xlsUploadDirectives.js"
               ).WithLastModifiedToken());
            
            //Styles
            bundles.Add(new StyleBundle("~/Content/bootstrap").Include(
                      "~/Content/bootstrap.css").WithLastModifiedToken());

            bundles.Add(new StyleBundle("~/Content/kendo").Include(
                "~/Content/kendo/2015.3.1111/kendo.common.min.css",
                "~/Content/kendo/2015.3.1111/kendo.bootstrap.min.css"
            ).WithLastModifiedToken());

            bundles.Add(new StyleBundle("~/Content/app").Include(
                "~/Content/kendo.custom.css",
                "~/Content/site.css",
                "~/Content/ladda.min.css",
                "~/Content/font-awesome/css/font-awesome.css"
            ).WithLastModifiedToken());
            
            // Set EnableOptimizations to false for debugging. For more information, visit http://go.microsoft.com/fwlink/?LinkId=301862
            BundleTable.EnableOptimizations = false;
        }
    }

    /// <summary>
    /// bundle extension to add query param after every file
    /// http://stackoverflow.com/questions/15005481/mvc4-stylebundle-can-you-add-a-cache-busting-query-string-in-debug-mode
    /// </summary>
    internal static class BundleExtensions
    {
        /// <summary>
        /// extension function
        /// </summary>
        /// <param name="sb"></param>
        /// <returns></returns>
        public static Bundle WithLastModifiedToken(this Bundle sb)
        {
            sb.Transforms.Add(new LastModifiedBundleTransform());
            return sb;
        }
        /// <summary>
        /// custom IBundleTransform implementation
        /// </summary>
        private class LastModifiedBundleTransform : IBundleTransform
        {
            /// <summary>
            /// implementation of IBundleTransform.Process
            /// </summary>
            /// <param name="context"></param>
            /// <param name="response"></param>
            public void Process(BundleContext context, BundleResponse response)
            {
                foreach (var file in response.Files)
                {
                    var lastWrite = File.GetLastWriteTime(HostingEnvironment.MapPath(file.IncludedVirtualPath)).Ticks.ToString();
                    file.IncludedVirtualPath = string.Concat(file.IncludedVirtualPath, "?v=", ConfigurationManager.AppSettings[UiConstants.APP_PHASE_KEY] + lastWrite);
                }
            }
        }
    }
}
