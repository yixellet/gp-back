const router = require('express').Router();
const {
    liveSearch,
    search,
    getMainMenu,
    getCapitalRepair,
    getOpenDataLayersList,
    getAllTracks,
    getTrackByRegNumber,
    getAllBusStops,
    getStopsByRoute
} = require('../controllers');

router.get('/livesearch', liveSearch);
router.get('/search', search);
router.get('/menu', getMainMenu);
router.get('/capitalrepair', getCapitalRepair);
router.get('/open_data_layers', getOpenDataLayersList);
router.get('/tracks', getAllTracks);
router.get('/bus_stops', getAllBusStops);
router.get('/stops_by_route', getStopsByRoute);
router.get('/track', getTrackByRegNumber);

module.exports = router;
