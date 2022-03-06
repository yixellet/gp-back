const router = require('express').Router();
const {
    liveSearch,
    search,
    getLevels,
    getObject,
    getChildren,
    getParams,
    getGeometry,
    getParents
} = require('../controllers');

router.get('/livesearch', liveSearch);
router.get('/search', search);
router.get('/levels', getLevels);
router.get('/object', getObject);
router.get('/children', getChildren);
router.get('/params', getParams);
router.get('/geometry', getGeometry);
router.get('/parents', getParents);

module.exports = router;
