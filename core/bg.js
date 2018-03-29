var defaultConfig = {
    toggle: true,
    whitelist: [{
        domain: 'cnhv.co',
        expiration: 0,
    }],
};

var localConfig = JSON.parse(localStorage.getItem('config'));
var config = {
        ...defaultConfig,
    ...localConfig,
};

var domains = [];
var detected = [];

var saveConfig = () => {
    localStorage.setItem('config', JSON.stringify(config));
};

var changeToggleIcon = (isEnabled) => {
    chrome.browserAction.setIcon({
        path: `img/${isEnabled ? '128on' : '128off'}.png`,
    });
};

var getDomain = (url) => {
    var match = url.match(/:\/\/(.[^/]+)/);

    return match ? match[1] : '';
};

var getTimestamp = () => {
    return Math.floor(Date.now() / 1000);
};

var isDomainWhitelisted = (domain) => {
    if (!domain) return false;

    var domainInfo = config.whitelist.find(w => w.domain === domain);

    if (domainInfo) {
        if (domainInfo.expiration !== 0 && domainInfo.expiration <= getTimestamp()) {
            removeDomainFromWhitelist(domain);

            return false;
        }

        return true;
    }

    return false;
};

var addDomainToWhitelist = (domain, time) => {
    if (!domain) return;

    if (!isDomainWhitelisted(domain)) {
        config.whitelist = [
            ...config.whitelist,
            {
                domain: domain,
                expiration: time === 0 ? 0 : getTimestamp() + (time * 60),
            },
    ];
        saveConfig();
    }
};

var removeDomainFromWhitelist = (domain) => {
    if (!domain) return;

    config.whitelist = config.whitelist.filter(w => w.domain !== domain);
    saveConfig();
};

var runBlocker = (blacklist) => {
    var blacklistedUrls = blacklist.split('\n');

    chrome.webRequest.onBeforeRequest.addListener(details => {
        chrome.browserAction.setBadgeBackgroundColor({
        color: [255, 0, 0, 100],
        tabId: details.tabId,
    });

    chrome.browserAction.setBadgeText({
        text: '!',
        tabId: details.tabId,
    });

    detected[details.tabId] = true;

    if (!config.toggle) {
        return {
            cancel: false
        };
    }

    if (isDomainWhitelisted(domains[details.tabId])) {
        chrome.browserAction.setIcon({
            path: 'img/128on_whitelist.png',
            tabId: details.tabId,
        });

        return {
            cancel: false
        };
    }

    chrome.browserAction.setIcon({
        path: 'img/128on-stop.png',
        tabId: details.tabId,
    });

    return {
        cancel: true
    };
}, {
        urls: blacklistedUrls
    }, ['blocking']);
};

var runFallbackBlocker = () => {
    fetch(chrome.runtime.getURL('blacklist.txt'))
        .then(resp => {
        resp.text().then(text => runBlocker(text));
});
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    domains[tabId] = getDomain(tab.url);

if (changeInfo === 'loading') {
    if (config.toggle) {
        chrome.browserAction.setIcon({
            path: 'img/128on.png',
            tabId,
        });
    }

    detected[details.tabId] = false;

    chrome.browserAction.setBadgeText({
        text: '',
        tabId,
    });
}
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete domains[tabId];
});

if (!config.toggle) {
    changeToggleIcon(false);
}

var blacklist = '/blacklist.txt';
fetch(blacklist)
    .then(resp => {

resp.text().then((text) => {
    if (text === '') {
    throw 'Empty response';
}

runBlocker(text);
});
})
.catch(err => {
    runFallbackBlocker();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
case 'GET_STATE':
    sendResponse({
        version: chrome.runtime.getManifest().version,
        whitelisted: isDomainWhitelisted(domains[message.tabId]),
        domain: domains[message.tabId],
        detected: detected[message.tabId] || false,
        toggle: config.toggle,
    });
    break;
case 'TOGGLE':
    config.toggle = !config.toggle;
    saveConfig();

    changeToggleIcon(config.toggle);
    sendResponse(config.toggle);
    break;
case 'WHITELIST':
    {
        if (message.whitelisted) {
            removeDomainFromWhitelist(domains[message.tabId], message.time);
        } else {
            addDomainToWhitelist(domains[message.tabId], message.time);
        }

        sendResponse(!message.whitelisted);
        break;
    }
}
});