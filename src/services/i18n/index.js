const i18n = require('i18n');
const _ = require('lodash');
const path = require('path');

i18n.configure({
    directory: path.join(__dirname, '../../services/I18n/locales'),
    defaultLocale: 'en',
});

function getLocaleValue(key, language, opts) {
    language = language || 'en'; // It picks 'en' by default
    i18n.setLocale(language);

    const localeString = i18n.__(key);
    const compiled = _.template(localeString, {
        escape: /<%-([\s\S]+?)%>/g,
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
    });

    const res = compiled(opts);
    return res;
}

module.exports = {
    getLocaleValue,
};
