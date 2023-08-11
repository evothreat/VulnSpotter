const path = require('path');

module.exports = function override(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Add the new path aliases
    config.resolve.alias['@components'] = path.resolve(__dirname, 'src/components/');
    config.resolve.alias['@layout'] = path.resolve(__dirname, 'src/layout/');
    config.resolve.alias['@pages'] = path.resolve(__dirname, 'src/pages/');
    config.resolve.alias['@services'] = path.resolve(__dirname, 'src/services/');
    config.resolve.alias['@styles'] = path.resolve(__dirname, 'src/styles/');
    config.resolve.alias['@utils'] = path.resolve(__dirname, 'src/utils/');
    config.resolve.alias['@root'] = path.resolve(__dirname, 'src/');

    return config;
};
