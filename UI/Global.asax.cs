
using System;
using System.Net;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace AngularKendo.UI
{
    public class MvcApplication : System.Web.HttpApplication
    {
        /// <summary>
        /// app startup event handler
        /// </summary>
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }
        /// <summary>
        /// app error event handler
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Application_Error(object sender, EventArgs e)
        {
            try
            {
                System.Exception lastError = Server.GetLastError();
                int httpStatusCode = lastError is HttpException
                    ? ((HttpException)lastError).GetHttpCode()
                    : (int)HttpStatusCode.InternalServerError;

                //if error, didnt pass through (ClientExceptionFilterAttribute), then it a system error 
                var isAppServerError = Response.Headers.Get("IsMvcGeneratedError") == null; 

                Server.ClearError();
                
                Response.Clear();
                Response.StatusCode = 0;
                Response.TrySkipIisCustomErrors = true;

                Request.Headers.Add("bizErrorMessage", lastError.Message);

                HttpContext.Current.Server.TransferRequest("~/Error/" + httpStatusCode + "/" + isAppServerError, true);
            }
            catch (System.Exception ex){
                Response.Write(ex.Message + ex.StackTrace);
            }
        }
    }
}
