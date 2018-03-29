var currentTabId = 0;
var whitelisted = false;
var domain = '';

var setToggleButton = (isEnabled) => {
    var element = document.querySelector('.toggle');

    if ((element.classList.contains('disabled') && isEnabled) || (!element.classList.contains('disabled') && !isEnabled)) {
        element.classList.toggle('disabled');
    }

    toggleClassVisible('whitelisting', isEnabled);

    element.innerText = `${isEnabled ? 'Выключить' : 'Включить' } Стоп майнеры Bitcoin`;
};

var toggleClassVisible = (className, isVisible) => {
    var elements = document['getElementsByClassName'](className);
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = isVisible ? 'block' : 'none';
    }
};

var setWhitelistDisplay = (isWhitelisted) => {
    whitelisted = isWhitelisted;

    document['querySelector']('.whitelisted').innerHTML = `<b>${domain}</b> сейчас в белом списке.`

    toggleClassVisible('dropdown', !isWhitelisted);
    toggleClassVisible('whitelist', !isWhitelisted);
    toggleClassVisible('unwhitelist', isWhitelisted);
    toggleClassVisible('whitelisted', isWhitelisted);
};

var setDetectedVisible = (isDetected) => {
    document['querySelector']('.detected').style.display = isDetected ? 'block' : 'none';
};

var setVersion = (version) => {
    document['querySelector']('.version').innerText = version;
};

var sendWhitelistUpdate = (time) => {
    chrome.runtime.sendMessage({
        type: 'WHITELIST',
        time: time,
        tabId: currentTabId,
        whitelisted,
    }, (response) => {
        setWhitelistDisplay(response);
    chrome['tabs'].reload(currentTabId);
});
}

document.querySelector('.toggle').addEventListener('click', () => {
    chrome.runtime.sendMessage({
    type: 'TOGGLE'
}, (response) => {
    setToggleButton(response);
chrome['tabs'].reload(currentTabId);
});
});

document.querySelector('.whitelist').addEventListener('click', () => {
    var time = document.querySelector('.dropdown').value;
sendWhitelistUpdate(time);
});

document.querySelector('.unwhitelist').addEventListener('click', () => {
    sendWhitelistUpdate();
});

chrome['tabs'].query({
    currentWindow: true,
    active: true
}, tabs => {
    if (tabs && tabs[0]) {
    currentTabId = tabs[0].id;

    chrome.runtime.sendMessage({
        type: 'GET_STATE',
        tabId: currentTabId
    }, (response) => {
        domain = response.domain;
    setVersion(response.version);
    setToggleButton(response.toggle);
    setWhitelistDisplay(response.whitelisted);
    setDetectedVisible(response.detected);
});
}
});