

using System;
using System.Collections.Generic;
using System.Configuration;
using System.Dynamic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json;

namespace AngularKendo.UI.Controllers
{
    /// <summary>
    /// default controller
    /// </summary>
    public class HomeController : Controller
    {
        /// <summary>
        /// default view for the controller
        /// </summary>
        /// <returns></returns>
        public ActionResult Index()
        {
            //Response.Write(Url.Content("~/"));

            //get the user id from NASA/Landing page....
            string loginUsrId = HttpUtility.UrlDecode(GetLoggedInUserName());

            //if no login user found, then return empty result.
            if (loginUsrId == null) return new ContentResult()
            {
                Content = "<h1>Authorization failed - User Id is missing.<h1>"
            };

            //log user info
            LogUserInfo(loginUsrId);

            //get logged in user role ***
            IEnumerable<string> userRoles = GetLoggedInUserRoles(loginUsrId);
            
            var allowedBrowserDefinitions = JsonConvert.DeserializeObject<BrowserDefinition[]>(ConfigurationManager.AppSettings[UiConstants.SUPPORTED_BROWSERS_KEY]);


            //Environment settings
            var appParams = new
            {
                name = ConfigurationManager.AppSettings[UiConstants.APP_NAME_KEY],
                servUri = ConfigurationManager.AppSettings[UiConstants.SVCBASEURL_KEY],
                uibaseUri = Url.Content("~/"),
                isBrwsrSupprtd = HasBrowserSupport(allowedBrowserDefinitions),
                supprtdBrwsrs = allowedBrowserDefinitions,
                storLdUsrGrdPref =
                    bool.Parse(ConfigurationManager.AppSettings[UiConstants.STORELOAD_USERGRIDPREF_KEY]),
                loginUsrId,
                loginRole = userRoles.First(),
                scndryRole =userRoles.First(),
                gridPageSize = int.Parse(ConfigurationManager.AppSettings[UiConstants.GRID_PAGESIZE_KEY]),
            };

            //setting cookie for app params ***
            Response.SetCookie(new HttpCookie("params", JsonConvert.SerializeObject(appParams)));

            return View(appParams);
        }

        /// <summary>
        /// user dashboard view
        /// </summary>
        /// <param name="userName"></param>
        /// <param name="roleName"></param>
        /// <returns></returns>
        [System.Web.Mvc.Route("Home/{userName}/{roleName}", Name = "Dashboard")]
        public ActionResult Home(string userName, string roleName)
        {
            //based on role, we will load different views
            
            return PartialView();
        }
        
        /// <summary>
        /// error view
        /// </summary>
        /// <param name="httpCode"></param>
        /// <param name="isAppErr"></param>
        /// <returns></returns>
        [System.Web.Mvc.Route("Error/{httpCode}/{isAppErr?}", Name = "Error")]
        public ActionResult Error(int httpCode, string isAppErr)
        {
            bool isAppServerError;
            bool.TryParse(isAppErr, out isAppServerError); //if the error thrown by global.asax.Application_Error()

            dynamic model = new ExpandoObject();
            model.Exception = new HttpException(httpCode, Request.Headers["bizErrorMessage"]);
            model.Controller = Request.RequestContext.RouteData.Values["controller"];
            model.Action = Request.RequestContext.RouteData.Values["action"];
            model.IsAppError = isAppServerError;

            return PartialView(model);
        }

        /// <summary>
        /// return logged in user name, from config file
        /// </summary>
        /// <returns></returns>
        private string GetLoggedInUserName()
        {
            return bool.Parse(ConfigurationManager.AppSettings[UiConstants.ROLE_FROM_CONFIG_KEY])
                ? ConfigurationManager.AppSettings[UiConstants.LOGGED_IN_USERNAME_KEY]
                : User.Identity.Name.Split('\\').Last();
        }

        /// <summary>
        /// get logged in user roles (Primary, Secondary(admin)), either from landing page(if landing page pass it), or from Config or from SRM
        /// </summary>
        /// <param name="loginUsrId"></param>
        /// <returns></returns>
        private IEnumerable<string> GetLoggedInUserRoles(string loginUsrId)
        {
            var userRoles = new List<string>();
            userRoles.AddRange(
                ConfigurationManager.AppSettings[UiConstants.LOGGED_IN_USER_ROLE_KEY].Split('+')
                    .Select(rl => rl.Trim())
                    .ToArray());

            return userRoles;
        }

        /// <summary>
        /// proxy uri for grid export
        /// </summary>
        /// <param name="contentType"></param>
        /// <param name="base64"></param>
        /// <param name="fileName"></param>
        /// <returns></returns>
        [System.Web.Http.HttpPost]
        public ActionResult GridExport(string contentType, string base64, string fileName)
        {
            var fileContents = Convert.FromBase64String(base64);
            return File(fileContents, contentType, fileName);
        }

        /// <summary>
        /// Determines if the user browser is supported
        /// </summary>
        /// <returns></returns>
        private bool HasBrowserSupport(IEnumerable<BrowserDefinition> allowedBrowserDefinitions)
        {
            bool isUsrBrowserSupported = !allowedBrowserDefinitions.Any() || allowedBrowserDefinitions.Any(
                b =>new Regex(b.Ua, RegexOptions.IgnoreCase).IsMatch(Request.Browser.Browser) &&
                    b.Ver <= float.Parse(Request.Browser.Version));

            return isUsrBrowserSupported;
        }

        /// <summary>
        /// utility class holds allowed browser definition
        /// </summary>
        private class BrowserDefinition
        {
            /// <summary>
            /// browser agent name
            /// </summary>
            public string Ua { get; set; }
            /// <summary>
            /// browser version
            /// </summary>
            public int Ver { get; set; }
        }

        /// <summary>
        /// log user browser details
        /// </summary>
        /// <param name="loginUsrId"></param>
        private void LogUserInfo(string loginUsrId)
        {}
    }
}