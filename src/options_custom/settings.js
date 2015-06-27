window.addEvent("domready", function () {
    // Option 1: Use the manifest:
    new FancySettings.initWithManifest(function (settings) {
        settings.manifest.permrequest.addEvent("action", function () {
            //Cheap hack to acquire Media permissions as a chrome extension
            navigator.getUserMedia_ = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
            navigator.getUserMedia_({ audio: { optional: [{ echoCancellation: false }] } }, function(stream) {
              console.log('Acquired permission!');
              chrome.runtime.sendMessage({permissionAcquired: true}, function(response) {
                console.log("received response");
              });
            }, function() {
              console.log('Error!')
            });
        });
        settings.manifest.killswitch.addEvent("action", function () {
            chrome.runtime.sendMessage({killswitch: true});
        });
    });
    // Option 2: Do everything manually:
    /*
    var settings = new FancySettings("My Extension", "icon.png");

    var username = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "username",
        "type": "text",
        "label": i18n.get("username"),
        "text": i18n.get("x-characters")
    });

    var password = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "password",
        "type": "text",
        "label": i18n.get("password"),
        "text": i18n.get("x-characters-pw"),
        "masked": true
    });

    var myDescription = settings.create({
        "tab": i18n.get("information"),
        "group": i18n.get("login"),
        "name": "myDescription",
        "type": "description",
        "text": i18n.get("description")
    });

    var myButton = settings.create({
        "tab": "Information",
        "group": "Logout",
        "name": "myButton",
        "type": "button",
        "label": "Disconnect:",
        "text": "Logout"
    });

    // ...

    myButton.addEvent("action", function () {
        alert("You clicked me!");
    });

    settings.align([
        username,
        password
    ]);
    */
});
