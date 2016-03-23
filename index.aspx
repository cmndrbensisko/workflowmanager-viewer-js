﻿<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!-- IE to use latest doc mode -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <title>ArcGIS Workflow Manager</title>
    <link rel="stylesheet" href="//js.arcgis.com/3.13/esri/css/esri.css">
    <link rel="stylesheet" type="text/css" href="css/main.css">
    <link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">
    <link rel="stylesheet" type="text/css" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">

</head>
  
<body class="bootstrap">

    <div id="processing-outer">
        <div id="processing-outer-overlay"></div>
        <div id="processing-inner">
            <h2>Processing...</h2>
            <div class="progress progress-striped active">
                <div class="bar" style="width: 100%;"></div>
            </div>
        </div>
    </div>

    <!-- loading message -->
    <div id="loading-outer">
        <div id="loading-outer-overlay"></div>
        <div id="loading-inner">
            <div id="loadingAppLogo"><span><img src="js/app/WorkflowManager/images/EsriGlobeWhite.png" height="70" alt="Logo" /></span></div>
            <h1 id="loadingAppTitle">ArcGIS Workflow Manager</h1>
            <h2 id="loadingAppSubTitle">Web Edition</h2>
            <h3 id="loadingMessage">loading...</h3>
            <ul id="loadingImage">
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
            </ul>                    
            <div id="loginContainer"></div>
            <!--
            <div class="progress progress-striped active">
                <div class="bar bar-success" style="width: 100%;"></div>
            </div>
            -->
        </div>
    </div>
</body>

<script type="text/javascript">
    var path = location.pathname.replace(/[^\/]+$/, '');
    var djConfig = {
        async: true,
        parseOnLoad: false,
        tlmSiblingOfDojo: 0,
        //locale: "es",
        //locale: "it",
        //locale: "ru",
        //locale: "tr",
        //locale: "zh-CN",
        //isDebug: true,
        packages: [ 
            {
                name: "widget",
                location: path + "js/widget"
            },
            {
                name: "app",
                location: path + "js/app"
            },
            {
                name: "utils",
                location: path + "js/utils"
            },
            {
                name: "workflowmanager",
                location: path + "js/app/WorkflowManager/libs/workflowmanager"
            }
        ]
    };
</script>
<script type="text/javascript" src="//js.arcgis.com/3.13/"></script>
<script type="text/javascript">
    if (window.attachEvent && !window.addEventListener) {
        // unsupported browsers (IE8 or older)
        var loadingMsgElem = document.getElementById("loadingMessage");
        loadingMsgElem.innerHTML = "Unsupported Browser" + "<br>" + 
            "The browser you are using is not supported by ArcGIS Workflow Manager. Please download the latest version of Internet Explorer.";
        loadingMsgElem.className = "loading-error";
    }
</script>
<script type="text/javascript">
    require([
        "app/WorkflowManager",
        "dojo/parser"
    ], 
    function(Controller, parser) {
        parser.parse();
		var user = "<%= User.Identity.Name.Replace("CITY\","") %>";  // user without domain authentication
        Controller.startup( {user: user} );
    });
</script>

</html>