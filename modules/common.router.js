const router = require('express').Router();

router.get('/status', (req, res) => { res.json({ version: '1.0.0' }) });

module.exports = router;
