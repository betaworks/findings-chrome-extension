var installedDiv = document.createElement("div");
installedDiv.setAttribute("id", "findingsExtensionInstalled");
document.body.appendChild(installedDiv);

chrome.extension.sendMessage({"msg": "installed"});
