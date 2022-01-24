const fs = require('fs');
const path = require('path');
const logger = require('./lib/logger');
const common = require('./modules/common.router');
const MODULES_PATH = path.join(__dirname, '/modules');
/**
 * load routes
 * all routes are loaded from services folder.
 * Each service folder contains NAME.router.js file.
 *
 *  __dirname/modules/FOO/FOOrouter.js
 *
 * This is a convention and MUST be followed
 *
 * All loaded routes have a service directory name as a prefix
 *
 * http://<host>:<port>/service_dir_name/route_name
 */
exports.load = app => {
    return new Promise(resolve => {

        app.use('/api/', common);

        const modules = fs.readdirSync(MODULES_PATH);
        if (modules.length === 0) return resolve();
        modules.forEach((dir, index, list) => {
            if (fs.lstatSync(path.join(MODULES_PATH, dir)).isDirectory()) {
                const routerPath = path.join(MODULES_PATH, dir, dir.toLowerCase() + '.' + 'router.js');
                if (fs.existsSync(routerPath)) {
                    const routes = require(routerPath);
                    app.use('/api/' + dir.toLowerCase(), routes);
                    logger.system('info', 'Module ' + dir.toLowerCase() + ' attached');
                }
            }
            if (list.length === 0 || index === list.length - 1) {
                resolve();
            }
        });
    });
};
