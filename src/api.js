var isEqual = require('lodash.isequal');
var normalize = require('geojson-normalize');
var hat = require('hat');
var featuresAt = require('./lib/features_at');
var stringSetsAreEqual = require('./lib/string_sets_are_equal');
var geojsonhint = require('geojsonhint');
var Constants = require('./constants');
var StringSet = require('./lib/string_set');

var featureTypes = {
  Polygon: require('./feature_types/polygon'),
  LineString: require('./feature_types/line_string'),
  Point: require('./feature_types/point'),
  MultiPolygon: require('./feature_types/multi_feature'),
  MultiLineString: require('./feature_types/multi_feature'),
  MultiPoint: require('./feature_types/multi_feature')
};

module.exports = function(ctx) {
  const api = {
    modes: Constants.modes
  };

  api.getFeatureIdsAt = function(point) {
    var features = featuresAt({point:point}, null, ctx);
    return features.map(function(feature){return feature.properties.id});
  };

  api.getSelectedIds = function () {
    return ctx.store.getSelectedIds();
  };

  api.set = function(featureCollection) {
    if (featureCollection.type === undefined || featureCollection.type !== Constants.geojsonTypes.FEATURE_COLLECTION || !Array.isArray(featureCollection.features)) {
      throw new Error('Invalid FeatureCollection');
    }
    var renderBatch = ctx.store.createRenderBatch();
    var toDelete = ctx.store.getAllIds().slice();
    var newIds = api.add(featureCollection);
    var newIdsLookup = new StringSet(newIds);

    toDelete = toDelete.filter(function(id){return !newIdsLookup.has(id)});
    if (toDelete.length) {
      api.delete(toDelete);
    }

    renderBatch();
    return newIds;
  };

  api.add = function (geojson) {
    var errors = geojsonhint.hint(geojson).filter(function(e){return e.level !== 'message'});
    if (errors.length) {
      throw new Error(errors[0].message);
    }
    var featureCollection = normalize(geojson);
    featureCollection = JSON.parse(JSON.stringify(featureCollection));

    var ids = featureCollection.features.map(function(feature){
      feature.id = feature.id || hat();

      if (feature.geometry === null) {
        throw new Error('Invalid geometry: null');
      }

      if (ctx.store.get(feature.id) === undefined || ctx.store.get(feature.id).type !== feature.geometry.type) {
        // If the feature has not yet been created ...
        var model = featureTypes[feature.geometry.type];
        if (model === undefined) {
          throw new Error("Invalid geometry type: "+feature.geometry.type+".");
        }
        var internalFeature = new model(ctx, feature);
        ctx.store.add(internalFeature);
      } else {
        // If a feature of that id has already been created, and we are swapping it out ...
        var internalFeature = ctx.store.get(feature.id);
        internalFeature.properties = feature.properties;
        if (!isEqual(internalFeature.getCoordinates(), feature.geometry.coordinates)) {
          internalFeature.incomingCoords(feature.geometry.coordinates);
        }
      }
      return feature.id;
    });

    ctx.store.render();
    return ids;
  };


  api.get = function (id) {
    var feature = ctx.store.get(id);
    if (feature) {
      return feature.toGeoJSON();
    }
  };

  api.getAll = function() {
    return {
      type: Constants.geojsonTypes.FEATURE_COLLECTION,
      features: ctx.store.getAll().map(function(feature){return feature.toGeoJSON()})
    };
  };

  api.delete = function(featureIds) {
    ctx.store.delete(featureIds, { silent: true });
    // If we were in direct select mode and our selected feature no longer exists
    // (because it was deleted), we need to get out of that mode.
    if (api.getMode() === Constants.modes.DIRECT_SELECT && !ctx.store.getSelectedIds().length) {
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, undefined, { silent: true });
    } else {
      ctx.store.render();
    }

    return api;
  };

  api.deleteAll = function() {
    ctx.store.delete(ctx.store.getAllIds(), { silent: true });
    // If we were in direct select mode, now our selected feature no longer exists,
    // so escape that mode.
    if (api.getMode() === Constants.modes.DIRECT_SELECT) {
      ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, undefined, { silent: true });
    } else {
      ctx.store.render();
    }

    return api;
  };

  api.changeMode = function(mode, modeOptions) {
    if(modeOptions===undefined){modeOptions={};}
    // Avoid changing modes just to re-select what's already selected
    if (mode === Constants.modes.SIMPLE_SELECT && api.getMode() === Constants.modes.SIMPLE_SELECT) {
      if (stringSetsAreEqual((modeOptions.featureIds || []), ctx.store.getSelectedIds())) return api;
      // And if we are changing the selection within simple_select mode, just change the selection,
      // instead of stopping and re-starting the mode
      ctx.store.setSelected(modeOptions.featureIds, { silent: true });
      ctx.store.render();
      return api;
    }

    if (mode === Constants.modes.DIRECT_SELECT && api.getMode() === Constants.modes.DIRECT_SELECT
      && modeOptions.featureId === ctx.store.getSelectedIds()[0]) {
      return api;
    }

    ctx.events.changeMode(mode, modeOptions, { silent: true });
    return api;
  };

  api.getMode = function() {
    return ctx.events.getMode();
  };

  api.trash = function() {
    ctx.events.trash({ silent: true });
    return api;
  };

  //wanyanyan 2016/11/09 设置属性
  api.setFeatureProperty = function(featureId,name,property){
    ctx.store.setFeatureProperty(featureId,name,property);
    return api;
  }
  return api;
};
