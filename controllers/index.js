/* eslint-disable no-multi-str */
const pgp = require('pg-promise')();
const { ParameterizedQuery } = require('pg-promise');
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SCHEMA,
  DB_GEOM_SCHEMA
} = require('../config');

const db = pgp(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);

function liveSearch(req, res) {
  db.any(`SELECT o.objectid, 
            o.name, 
            o.typename, 
            o.level 
          FROM ${DB_SCHEMA}.addr_obj o 
          WHERE LOWER(o.name) LIKE LOWER('%${req.query.string}%') 
            AND o.isactual = 1 AND o.isactive = 1 AND o.level IN (${req.query.mode === 'adm_div' ? 
            `'1','2','5','6','7','8','9','10','11','12','13','14','15','16','17'` : 
            `'1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17'`}) 
          LIMIT 10;`)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
}

function search(req, res) {
  db.any(`SELECT o.objectid,
            o.name,
            o.typename,
            o.level,
            ${DB_SCHEMA}.${req.query.mode === 'adm_div' ? 'parents_adm' : 'parents_mun'}(o.objectid) AS parents,
            ${DB_SCHEMA}.${req.query.mode === 'adm_div' ? 'row_estimator_adm' : 'row_estimator_mun'}(o.objectid) AS children
          FROM ${DB_SCHEMA}.addr_obj o
          WHERE LOWER(o.name) LIKE LOWER('%${req.query.string}%')
            AND o.isactual = 1 AND o.isactive = 1 AND o.level IN (${req.query.mode === 'adm_div' ? 
            `'1','2','5','6','7','8','9','10','11','12','13','14','15','16','17'` : 
            `'1','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17'`});`)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
}

function getMainMenu(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT * FROM gp.menu m;`,
    },
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
}

function getCapitalRepair(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT crh.id,
              crh.address,
              crh.code,
              crh.expl_start,
              crh.service_year,
              array[ST_X(ST_Centroid(crh.geom)), ST_Y(ST_Centroid(crh.geom))] AS centroid,
              array_agg(crs.name)
            FROM gp_data.houses_services hs
              JOIN gp_data.capital_repair_houses crh ON hs.house_id = crh.id
              JOIN gp_data.capital_repair_services crs ON hs.service_id = crs.id
            GROUP BY crh.id, crh.address, crh.code, crh.expl_start, crh.service_year, crh.geom`
    },
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
}

function getOpenDataLayersList(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT c.id,
              c.name,
              c.categoryname AS codename,
              array_agg(jsonb_build_object('id', l.id, 'name', l.name, 'codename', l.layername, 'desc', l.desc)) AS layers
            FROM gp."odLayers_odCategories" lc
              JOIN gp.open_data_layers l ON lc.layer_id = l.id
              JOIN gp.open_data_categories c ON lc.category_id = c.id
            GROUP BY c.id,c.name,c.categoryname;`
    }
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
};

function getAllTracks(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT rl.id,
              rl.number,
              rl.name,
              bt.id AS type_id,
              bt.name AS type_name,
              array_agg(rg.id) AS geometry
            FROM routes.routes_list rl
            JOIN routes.bus_types bt ON rl.type_id = bt.id
            JOIN routes.routes_geometry rg ON rl.id = rg.route_id
            GROUP BY rl.id, rl.number, rl.name, bt.id, bt.name
            ORDER BY id ASC;`
    }
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
};

function getAllBusStops(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT id, name, ST_AsGeoJSON(geom)
            FROM routes.bus_stops
            ORDER BY id ASC;`
    }
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
};

function getTrackByRegNumber(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT t.id
      FROM transport.tracks t
      WHERE t.tariff = 'нерегулируемый' AND t.reg_number = ${req.query.regnum};`
    }
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
};

function getStopsByRoute(req, res) {
  const query = new ParameterizedQuery(
    {
      text: `SELECT r.route AS id, r.direction, array_agg(stop) AS stops
            FROM (
              SELECT rs.route_id AS route, g.direction, json_build_object('id', rs.stop_id, 'name', s.name) AS stop
              FROM routes.route_stop rs
                JOIN routes.bus_stops s ON rs.stop_id = s.id
                JOIN routes.routes_geometry g ON rs.route_id = g.id
              WHERE g.route_id = ${req.query.route_id}
              ORDER BY rs.route_id, rs.enum) r
            GROUP BY r.route, r.direction
            ORDER BY r.direction;`
    }
  );

  db.any(query)
    .then((data) => {
      res.send({ data });
    })
    .catch((error) => {
      res.send({ error });
    });
};

module.exports = {
  liveSearch,
  search,
  getMainMenu,
  getCapitalRepair,
  getOpenDataLayersList,
  getAllTracks,
  getAllBusStops,
  getTrackByRegNumber,
  getStopsByRoute
};
