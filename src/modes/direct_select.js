var common_selectors = require('../lib/common_selectors');
var noTarget = common_selectors.noTarget;
var isOfMetaType = common_selectors.isOfMetaType;
var isInactiveFeature = common_selectors.isInactiveFeature;
var isShiftDown = common_selectors.isShiftDown;
var createSupplementaryPoints = require('../lib/create_supplementary_points');
const constrainFeatureMovement = require('../lib/constrain_feature_movement');
const doubleClickZoom = require('../lib/double_click_zoom');
const Constants = require('../constants');
const CommonSelectors = require('../lib/common_selectors');

const isVertex = isOfMetaType(Constants.meta.VERTEX);
const isMidpoint = isOfMetaType(Constants.meta.MIDPOINT);

module.exports = function(ctx, opts) {
  var featureId = opts.featureId;
  var feature = ctx.store.get(featureId);

  if (!feature) {
    throw new Error('You must provide a featureId to enter direct_select mode');
  }

  if (feature.type === Constants.geojsonTypes.POINT) {
    throw new TypeError('direct_select mode doesn\'t handle point features');
  }

  var dragMoveLocation = opts.startPos || null;
  var dragMoving = false;
  var canDragMove = false;

  var selectedCoordPaths = opts.coordPath ? [opts.coordPath] : [];

  var fireUpdate = function() {
    ctx.map.fire(Constants.events.UPDATE, {
      action: Constants.updateActions.CHANGE_COORDINATES,
      features: ctx.store.getSelected().map(function(f){return f.toGeoJSON()})
    });
  };

  var startDragging = function(e) {
    ctx.map.dragPan.disable();
    canDragMove = true;
    dragMoveLocation = e.lngLat;
  };

  var stopDragging = function() {
    ctx.map.dragPan.enable();
    dragMoving = false;
    canDragMove = false;
    dragMoveLocation = null;
  };

  var onVertex = function(e) {
    startDragging(e);
    var about = e.featureTarget.properties;
    var selectedIndex = selectedCoordPaths.indexOf(about.coord_path);
    if (!isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths = [about.coord_path];
    }
    else if (isShiftDown(e) && selectedIndex === -1) {
      selectedCoordPaths.push(about.coord_path);
    }
    feature.changed();
  };

  var onMidpoint = function(e) {
    startDragging(e);
    var about = e.featureTarget.properties;
    feature.addCoordinate(about.coord_path, about.lng, about.lat);
    fireUpdate();
    selectedCoordPaths = [about.coord_path];
  };

  return {
    start: function() {
      ctx.store.setSelected(featureId);
      doubleClickZoom.disable(ctx);

      // On mousemove that is not a drag, stop vertex movement.
      this.on('mousemove', CommonSelectors.true, stopDragging);

      // As soon as you mouse leaves the canvas, update the feature
      this.on('mouseout', function(){return dragMoving;}, fireUpdate);

      this.on('mousedown', isVertex, onVertex);
      this.on('mousedown', isMidpoint, onMidpoint);
      this.on('drag', function(){return canDragMove;}, function(e) {
        dragMoving = true;
        e.originalEvent.stopPropagation();

        var selectedCoords = selectedCoordPaths.map(function(coord_path){return feature.getCoordinate(coord_path)});
        var selectedCoordPoints = selectedCoords.map(function(coords){return {
          type: Constants.geojsonTypes.FEATURE,
          properties: {},
          geometry: {
            type: Constants.geojsonTypes.POINT,
            coordinates: coords
          }
        }});
        var delta = {
          lng: e.lngLat.lng - dragMoveLocation.lng,
          lat: e.lngLat.lat - dragMoveLocation.lat
        };
        var constrainedDelta = constrainFeatureMovement(selectedCoordPoints, delta);

        for (var i = 0; i < selectedCoords.length; i++) {
          var coord = selectedCoords[i];
          feature.updateCoordinate(selectedCoordPaths[i],
            coord[0] + constrainedDelta.lng,
            coord[1] + constrainedDelta.lat);
        }

        dragMoveLocation = e.lngLat;
      });
      this.on('click', CommonSelectors.true, stopDragging);
      this.on('mouseup', CommonSelectors.true, function() {
        if (dragMoving) {
          fireUpdate();
        }
        stopDragging();
      });
      this.on('click', noTarget, function() {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
      this.on('click', isInactiveFeature, function() {
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT);
      });
    },
    stop: function() {
      doubleClickZoom.enable(ctx);
    },
    render: function(geojson, push) {
      if (featureId === geojson.properties.id) {
        geojson.properties.active = Constants.activeStates.ACTIVE;
        push(geojson);
        createSupplementaryPoints(geojson, {
          map: ctx.map,
          midpoints: true,
          selectedPaths: selectedCoordPaths
        }).forEach(push);
      }
      else {
        geojson.properties.active = Constants.activeStates.INACTIVE;
        push(geojson);
      }
    },
    trash: function() {
      if (selectedCoordPaths.length === 0) {
        return ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, { features: [feature] });
      }

      selectedCoordPaths.sort().reverse().forEach(function(id){feature.removeCoordinate(id)});
      ctx.map.fire(Constants.events.UPDATE, {
        action: Constants.updateActions.CHANGE_COORDINATES,
        features: ctx.store.getSelected().map(function(f){return f.toGeoJSON()})
      });
      selectedCoordPaths = [];
      if (feature.isValid() === false) {
        ctx.store.delete([featureId]);
        ctx.events.changeMode(Constants.modes.SIMPLE_SELECT, null);
      }
    }
  };
};
