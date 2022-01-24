// All environment variables declared in .env.example are required
// to be present in process.env (or in .env). Other environment variables
// are optional.
require('dotenv-safe').config();
const env = {}
// Copy process.env environment variables into 'env'.
for (const key in process.env) {
    if (!process.env.hasOwnProperty(key)) { continue; }
    const value = process.env[key];
    if (value != null) {
        env[key] = value;
    }
}

module.exports = env;
